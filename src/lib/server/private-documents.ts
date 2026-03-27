import { createReadStream, existsSync, mkdirSync } from "fs";
import { writeFile } from "fs/promises";
import { dirname, join } from "path";
import { Readable } from "stream";
import { randomUUID } from "crypto";
import { createUploadGrant, verifyUploadGrant } from "@/lib/upload-grant";
import { getR2Object, isR2StorageConfigured, uploadPrivateToR2 } from "@/lib/r2";
import {
  detectFileType,
  normalizeUploadFileName,
  validateUploadBuffer,
} from "@/lib/uploadValidator";

export const PRIVATE_DOCUMENT_UPLOAD_RATE_LIMIT = {
  limit: 20,
  windowMs: 10 * 60 * 1000,
} as const;

export const PRIVATE_DOCUMENT_GRANT_RATE_LIMIT = {
  limit: 20,
  windowMs: 10 * 60 * 1000,
} as const;

type PrivateDocumentStorage = "r2" | "local";

export type PrivateStoredDocument = {
  objectKey: string;
  fileName: string;
  originalName: string;
  storage: PrivateDocumentStorage;
};

export class PrivateDocumentError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(code: string, message: string, status: number) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

function privateDocumentsRoot() {
  return join(process.cwd(), "storage", "private-documents");
}

function ensurePrivateDocumentsRoot() {
  const directory = privateDocumentsRoot();
  if (!existsSync(directory)) {
    mkdirSync(directory, { recursive: true });
  }
  return directory;
}

function normalizeExtension(fileName: string) {
  const extension = fileName.split(".").pop()?.toLowerCase() || "";
  return extension.replace(/[^a-z0-9]/g, "");
}

function buildObjectKey(extension: string) {
  const suffix = extension ? `.${extension}` : "";
  return `private/professional-documents/${Date.now()}-${randomUUID()}${suffix}`;
}

function localFilePathForObjectKey(objectKey: string) {
  return join(process.cwd(), "storage", ...objectKey.split("/"));
}

async function persistPrivateDocumentLocally(buffer: Buffer, objectKey: string) {
  ensurePrivateDocumentsRoot();
  const diskPath = localFilePathForObjectKey(objectKey);
  const directory = dirname(diskPath);
  if (!existsSync(directory)) {
    mkdirSync(directory, { recursive: true });
  }
  await writeFile(diskPath, buffer);
  return { objectKey, storage: "local" as const };
}

async function persistPrivateDocument(
  buffer: Buffer,
  objectKey: string,
  contentType: string
) {
  if (isR2StorageConfigured()) {
    try {
      await uploadPrivateToR2({
        key: objectKey,
        body: buffer,
        contentType,
      });

      return { objectKey, storage: "r2" as const };
    } catch (error) {
      console.error("Error uploading private document to R2, falling back to local storage:", error);
    }
  }

  return persistPrivateDocumentLocally(buffer, objectKey);
}

export function createPrivateDocumentUploadGrantFromPayload(payload: unknown) {
  const body = (payload ?? {}) as { context?: unknown; type?: unknown };

  if (body.context !== "documentation" || body.type !== "document") {
    throw new PrivateDocumentError(
      "invalid_payload",
      "Se requiere context=documentation y type=document.",
      400
    );
  }

  return createUploadGrant({
    context: "documentation",
    type: "document",
  });
}

export async function processPrivateDocumentUpload(input: {
  file: File | null;
  sessionUserId?: string | null;
  uploadGrantToken?: string | null;
}): Promise<PrivateStoredDocument> {
  const file = input.file;
  if (!file) {
    throw new PrivateDocumentError("missing_file", "No se recibio ningun archivo.", 400);
  }

  const validGrant = input.uploadGrantToken
    ? verifyUploadGrant(input.uploadGrantToken, {
        context: "documentation",
        type: "document",
      })
    : null;

  if (!validGrant && !input.sessionUserId) {
    throw new PrivateDocumentError(
      "unauthorized",
      "Se requiere autenticacion o un token de upload valido.",
      401
    );
  }

  const detectedType = detectFileType(file);
  if (detectedType !== "cv") {
    throw new PrivateDocumentError(
      "unsupported_type",
      "Solo se permiten PDF, DOC, DOCX o imagenes para esta documentacion.",
      400
    );
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const validation = validateUploadBuffer(
    { name: file.name, type: file.type, size: file.size },
    buffer,
    "cv"
  );

  if (!validation.valid) {
    throw new PrivateDocumentError(
      "validation_error",
      validation.error || "Archivo invalido.",
      400
    );
  }

  const extension = normalizeExtension(file.name);
  const objectKey = buildObjectKey(extension);
  const persisted = await persistPrivateDocument(
    buffer,
    objectKey,
    file.type || "application/octet-stream"
  );

  return {
    objectKey: persisted.objectKey,
    fileName: normalizeUploadFileName(file.name),
    originalName: normalizeUploadFileName(file.name),
    storage: persisted.storage,
  };
}

function inferContentTypeFromFileName(fileName: string) {
  const extension = normalizeExtension(fileName);

  switch (extension) {
    case "pdf":
      return "application/pdf";
    case "doc":
      return "application/msword";
    case "docx":
      return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    case "png":
      return "image/png";
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    default:
      return "application/octet-stream";
  }
}

export async function createPrivateDocumentDownloadResponse(input: {
  objectKey: string;
  fileName: string;
}) {
  if (isR2StorageConfigured()) {
    try {
      const object = await getR2Object(input.objectKey);
      const body = object.Body?.transformToWebStream?.();

      if (!body) {
        throw new PrivateDocumentError("not_found", "Documento no encontrado.", 404);
      }

      return new Response(body, {
        headers: {
          "Content-Type": object.ContentType || inferContentTypeFromFileName(input.fileName),
          "Content-Disposition": `attachment; filename=\"${encodeURIComponent(input.fileName)}\"`,
          "Cache-Control": "private, no-store",
        },
      });
    } catch (error) {
      if (error instanceof PrivateDocumentError) {
        throw error;
      }
    }
  }

  const diskPath = localFilePathForObjectKey(input.objectKey);
  if (!existsSync(diskPath)) {
    throw new PrivateDocumentError("not_found", "Documento no encontrado.", 404);
  }

  const stream = Readable.toWeb(createReadStream(diskPath)) as ReadableStream;

  return new Response(stream, {
    headers: {
      "Content-Type": inferContentTypeFromFileName(input.fileName),
      "Content-Disposition": `attachment; filename=\"${encodeURIComponent(input.fileName)}\"`,
      "Cache-Control": "private, no-store",
    },
  });
}
