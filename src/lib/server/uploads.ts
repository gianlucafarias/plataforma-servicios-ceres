import { existsSync, mkdirSync } from 'fs';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { enqueueOptimizeProfileImage, enqueueValidateCV } from '@/jobs/files.producer';
import { downloadAndSaveImage, isExternalOAuthImage } from '@/lib/download-image';
import { isR2Configured, uploadToR2 } from '@/lib/r2';
import { createUploadGrant, verifyUploadGrant, type UploadGrantType } from '@/lib/upload-grant';
import { detectFileType, validateUploadBuffer } from '@/lib/uploadValidator';

export const UPLOAD_RATE_LIMIT = {
  limit: 30,
  windowMs: 10 * 60 * 1000,
} as const;

export const UPLOAD_EXTERNAL_RATE_LIMIT = {
  limit: 20,
  windowMs: 10 * 60 * 1000,
} as const;

export const UPLOAD_GRANT_RATE_LIMIT = {
  limit: 20,
  windowMs: 10 * 60 * 1000,
} as const;

export type UploadStorage = 'r2' | 'local';

export type StoredUpload = {
  filename: string;
  originalName: string;
  path: string;
  url: string;
  value: string;
  storage: UploadStorage;
  fileType: UploadGrantType;
};

export class UploadFlowError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(code: string, message: string, status: number) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

function ensureUploadGrantType(value: unknown): UploadGrantType | null {
  if (value === 'image' || value === 'cv') {
    return value;
  }

  return null;
}

function uploadsDirectory() {
  return join(process.cwd(), 'public', 'uploads', 'profiles');
}

function ensureUploadsDirectory() {
  const directory = uploadsDirectory();
  if (!existsSync(directory)) {
    mkdirSync(directory, { recursive: true });
  }

  return directory;
}

async function persistLocally(
  buffer: Buffer,
  extension: string
): Promise<{ filename: string; url: string; storage: UploadStorage }> {
  const directory = ensureUploadsDirectory();
  const filename = `${Date.now()}.${extension || 'bin'}`;
  const diskPath = join(directory, filename);

  await writeFile(diskPath, buffer);

  return {
    filename,
    url: `/uploads/profiles/${filename}`,
    storage: 'local',
  };
}

async function persistUpload(
  buffer: Buffer,
  file: File,
  extension: string
): Promise<{ filename: string; url: string; storage: UploadStorage }> {
  const key = `profiles/${Date.now()}.${extension || 'bin'}`;

  if (isR2Configured()) {
    try {
      const contentType = file.type || 'application/octet-stream';
      const result = await uploadToR2({
        key,
        contentType,
        body: buffer,
      });

      return {
        filename: key,
        url: result.url,
        storage: 'r2',
      };
    } catch (error) {
      console.error('Error uploading to R2, falling back to local storage:', error);
    }
  }

  return persistLocally(buffer, extension);
}

function enqueuePostUploadTasks(filename: string, extension: string) {
  const path = `/uploads/profiles/${filename}`;
  const lower = extension.toLowerCase();

  if (['jpg', 'jpeg', 'png', 'webp'].includes(lower)) {
    enqueueOptimizeProfileImage({ path }).catch(() => {});
    return;
  }

  if (lower === 'pdf') {
    enqueueValidateCV({ path }).catch(() => {});
  }
}

export function createRegisterUploadGrantFromPayload(payload: unknown) {
  const body = (payload ?? {}) as { context?: unknown; type?: unknown };
  const type = ensureUploadGrantType(body.type);

  if (body.context !== 'register' || !type) {
    throw new UploadFlowError(
      'invalid_payload',
      'Se requiere context=register y type=image|cv.',
      400
    );
  }

  return createUploadGrant({
    context: 'register',
    type,
  });
}

export async function processProfileUpload(input: {
  file: File | null;
  typeHint?: unknown;
  sessionUserId?: string | null;
  uploadGrantToken?: string | null;
}): Promise<StoredUpload> {
  const file = input.file;
  if (!file) {
    throw new UploadFlowError('missing_file', 'No se recibio ningun archivo', 400);
  }

  const hintedType = ensureUploadGrantType(input.typeHint);
  const detectedType = hintedType || detectFileType(file);

  if (!detectedType) {
    throw new UploadFlowError(
      'unsupported_type',
      'No se pudo determinar el tipo de archivo. Asegurate de subir una imagen o CV valido.',
      400
    );
  }

  const validGrant = input.uploadGrantToken
    ? verifyUploadGrant(input.uploadGrantToken, { context: 'register', type: detectedType })
    : null;

  if (!validGrant && !input.sessionUserId) {
    throw new UploadFlowError(
      'unauthorized',
      'Se requiere autenticacion o un token de upload valido.',
      401
    );
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const validation = validateUploadBuffer(
    { name: file.name, type: file.type, size: file.size },
    buffer,
    detectedType
  );

  if (!validation.valid) {
    throw new UploadFlowError('validation_error', validation.error || 'Archivo invalido', 400);
  }

  const originalName = file.name;
  const extension = originalName.split('.').pop()?.toLowerCase() || '';
  const persisted = await persistUpload(buffer, file, extension);

  if (persisted.storage === 'local') {
    enqueuePostUploadTasks(persisted.filename, extension);
  }

  return {
    filename: persisted.filename,
    originalName,
    path: persisted.url,
    url: persisted.url,
    value: persisted.storage === 'r2' ? persisted.url : persisted.filename,
    storage: persisted.storage,
    fileType: detectedType,
  };
}

export async function processExternalOAuthUpload(input: {
  imageUrl?: unknown;
  sessionUserId?: string | null;
}): Promise<{ url: string; value: string }> {
  if (!input.sessionUserId) {
    throw new UploadFlowError('unauthorized', 'No autorizado', 401);
  }

  if (typeof input.imageUrl !== 'string' || input.imageUrl.trim().length === 0) {
    throw new UploadFlowError('invalid_url', 'Se requiere una URL de imagen valida', 400);
  }

  if (!isExternalOAuthImage(input.imageUrl)) {
    throw new UploadFlowError(
      'invalid_url',
      'La URL proporcionada no es una imagen externa valida',
      400
    );
  }

  const savedUrl = await downloadAndSaveImage(input.imageUrl);
  return {
    url: savedUrl,
    value: savedUrl,
  };
}
