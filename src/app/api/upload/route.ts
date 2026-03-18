import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { enqueueOptimizeProfileImage, enqueueValidateCV } from '@/jobs/files.producer';
import { detectFileType, validateUploadBuffer } from '@/lib/uploadValidator';
import { isR2Configured, uploadToR2 } from '@/lib/r2';
import { authOptions } from '@/app/api/auth/options';
import { rateLimit, rateLimitHeaders } from '@/lib/rate-limit-memory';
import { clientIp } from '@/lib/request-helpers';
import { verifyUploadGrant } from '@/lib/upload-grant';

const LIMIT = 30;
const WINDOW_MS = 10 * 60 * 1000;

export async function POST(request: NextRequest) {
  const rl = rateLimit(`upload:${clientIp(request)}`, LIMIT, WINDOW_MS);
  if (!rl.allowed) {
    return NextResponse.json(
      {
        success: false,
        error: 'rate_limited',
        message: 'Demasiadas solicitudes. Intenta nuevamente mas tarde.',
      },
      { status: 429, headers: rateLimitHeaders(rl) }
    );
  }

  try {
    const data = await request.formData();
    const file = data.get('file') as File | null;
    const typeHint = data.get('type') as string | null;

    if (!file) {
      console.error('[upload] Error: No se recibio ningun archivo');
      return NextResponse.json(
        { success: false, error: 'No se recibio ningun archivo' },
        { status: 400, headers: rateLimitHeaders(rl) }
      );
    }

    const detectedType = (typeHint as 'image' | 'cv' | null) || detectFileType(file);
    if (!detectedType) {
      console.error('No se pudo detectar el tipo de archivo:', {
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        typeHint,
      });
      return NextResponse.json(
        {
          success: false,
          error:
            'No se pudo determinar el tipo de archivo. Asegurate de subir una imagen (png, jpg, jpeg, webp) o CV (pdf, doc, docx)',
        },
        { status: 400, headers: rateLimitHeaders(rl) }
      );
    }

    const uploadGrant = request.headers.get('x-upload-token');
    const validGrant = uploadGrant
      ? verifyUploadGrant(uploadGrant, { context: 'register', type: detectedType })
      : null;

    if (!validGrant) {
      const session = await getServerSession(authOptions);
      if (!session?.user?.id) {
        return NextResponse.json(
          {
            success: false,
            error: 'unauthorized',
            message: 'Se requiere autenticacion o un token de upload valido.',
          },
          { status: 401, headers: rateLimitHeaders(rl) }
        );
      }
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const validation = validateUploadBuffer(
      { name: file.name, type: file.type, size: file.size },
      buffer,
      detectedType
    );

    if (!validation.valid) {
      console.error('[upload] Validacion fallida:', {
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        detectedType,
        validationError: validation.error,
      });
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400, headers: rateLimitHeaders(rl) }
      );
    }

    const originalName = file.name;
    const extension = originalName.split('.').pop() || '';
    const timestamp = Date.now();
    const safeExtension = extension.toLowerCase();
    const key = `profiles/${timestamp}.${safeExtension || 'bin'}`;

    let finalUrl: string;
    let storage: 'r2' | 'local' = 'local';
    let storedFilename = key;

    if (isR2Configured()) {
      try {
        const contentType = file.type || 'application/octet-stream';
        const result = await uploadToR2({
          key,
          contentType,
          body: buffer,
        });

        finalUrl = result.url;
        storage = 'r2';
        storedFilename = key;
      } catch (r2Error) {
        console.error('Error uploading to R2, falling back to local storage:', r2Error);
        const uploadsDir = join(process.cwd(), 'public', 'uploads', 'profiles');
        if (!existsSync(uploadsDir)) {
          mkdirSync(uploadsDir, { recursive: true });
        }

        const localFilename = `${timestamp}.${safeExtension || 'bin'}`;
        const pathOnDisk = join(uploadsDir, localFilename);

        await writeFile(pathOnDisk, buffer);

        storedFilename = localFilename;
        finalUrl = `/uploads/profiles/${localFilename}`;
        storage = 'local';

        const lower = safeExtension;
        if (['jpg', 'jpeg', 'png', 'webp'].includes(lower)) {
          enqueueOptimizeProfileImage({ path: `/uploads/profiles/${localFilename}` }).catch(() => {});
        } else if (lower === 'pdf') {
          enqueueValidateCV({ path: `/uploads/profiles/${localFilename}` }).catch(() => {});
        }
      }
    } else {
      const uploadsDir = join(process.cwd(), 'public', 'uploads', 'profiles');
      if (!existsSync(uploadsDir)) {
        mkdirSync(uploadsDir, { recursive: true });
      }

      const localFilename = `${timestamp}.${safeExtension || 'bin'}`;
      const pathOnDisk = join(uploadsDir, localFilename);

      await writeFile(pathOnDisk, buffer);

      storedFilename = localFilename;
      finalUrl = `/uploads/profiles/${localFilename}`;

      const lower = safeExtension;
      if (['jpg', 'jpeg', 'png', 'webp'].includes(lower)) {
        enqueueOptimizeProfileImage({ path: `/uploads/profiles/${localFilename}` }).catch(() => {});
      } else if (lower === 'pdf') {
        enqueueValidateCV({ path: `/uploads/profiles/${localFilename}` }).catch(() => {});
      }
    }

    const returnValue = storage === 'r2' ? finalUrl : storedFilename;

    return NextResponse.json(
      {
        success: true,
        filename: storedFilename,
        originalName,
        path: finalUrl,
        url: finalUrl,
        value: returnValue,
        storage,
      },
      { headers: rateLimitHeaders(rl) }
    );
  } catch (error) {
    console.error('Error uploading file:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;

    if (process.env.NODE_ENV === 'production') {
      console.error('Upload error details:', {
        message: errorMessage,
        stack: errorStack,
        timestamp: new Date().toISOString(),
      });
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to upload file',
        ...(process.env.NODE_ENV !== 'production' && { details: errorMessage }),
      },
      { status: 500, headers: rateLimitHeaders(rl) }
    );
  }
}
