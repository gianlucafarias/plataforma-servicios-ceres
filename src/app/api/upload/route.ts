import { NextRequest, NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { enqueueOptimizeProfileImage, enqueueValidateCV } from '@/jobs/files.producer';
import { validateUploadServer, detectFileType } from '@/lib/uploadValidator';
import { isR2Configured, uploadToR2, getR2PublicUrl } from '@/lib/r2';

export async function POST(request: NextRequest) {
  try {
    const data = await request.formData();
    const file: File | null = data.get('file') as unknown as File;
    const typeHint = data.get('type') as string | null; // 'image' | 'cv' opcional

    if (!file) {
      return NextResponse.json({ success: false, error: 'No se recibió ningún archivo' }, { status: 400 });
    }

    // Detectar tipo si no viene en el hint
    const detectedType = typeHint as 'image' | 'cv' | null || detectFileType(file as unknown as File);
    if (!detectedType) {
      return NextResponse.json({ 
        success: false, 
        error: 'No se pudo determinar el tipo de archivo. Asegurate de subir una imagen (png, jpg, jpeg, webp) o CV (pdf, doc, docx)' 
      }, { status: 400 });
    }

    // Validar
    const validation = validateUploadServer(
      { name: file.name, type: file.type, size: file.size },
      detectedType
    );

    if (!validation.valid) {
      return NextResponse.json({ success: false, error: validation.error }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const originalName = file.name;
    const extension = originalName.split('.').pop() || '';
    const timestamp = Date.now();

    // Key estándar para almacenamiento remoto/local
    const safeExtension = extension.toLowerCase();
    const key = `profiles/${timestamp}.${safeExtension || 'bin'}`;

    let finalUrl: string;
    let storage: 'r2' | 'local' = 'local';
    let storedFilename: string = key;

    if (isR2Configured()) {
      // Subida a R2
      const contentType = file.type || 'application/octet-stream';
      const result = await uploadToR2({
        key,
        contentType,
        body: buffer,
      });

      finalUrl = result.url;
      storage = 'r2';
    } else {
      // Fallback local: mismo path de siempre para compatibilidad
      const uploadsDir = join(process.cwd(), 'public', 'uploads', 'profiles');
      if (!existsSync(uploadsDir)) {
        mkdirSync(uploadsDir, { recursive: true });
      }

      const localFilename = `${timestamp}.${safeExtension || 'bin'}`;
      const pathOnDisk = join(uploadsDir, localFilename);

      await writeFile(pathOnDisk, buffer);

      storedFilename = localFilename;
      finalUrl = `/uploads/profiles/${localFilename}`;

      // Encolar post-proceso según tipo SOLO para almacenamiento local
      const lower = safeExtension;
      if (['jpg','jpeg','png','webp'].includes(lower)) {
        enqueueOptimizeProfileImage({ path: `/uploads/profiles/${localFilename}` }).catch(()=>{});
      } else if (lower === 'pdf') {
        enqueueValidateCV({ path: `/uploads/profiles/${localFilename}` }).catch(()=>{});
      }
    }

    return NextResponse.json({ 
      success: true, 
      filename: storedFilename, // mantenemos por compatibilidad
      originalName,
      path: finalUrl,
      url: finalUrl,
      storage,
    });

  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}



