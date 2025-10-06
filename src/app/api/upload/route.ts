import { NextRequest, NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { enqueueOptimizeProfileImage, enqueueValidateCV } from '@/jobs/files.producer';
import { validateUploadServer, detectFileType } from '@/lib/uploadValidator';

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

    // Crear directorio si no existe
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'profiles');
    if (!existsSync(uploadsDir)) {
      mkdirSync(uploadsDir, { recursive: true });
    }

    // Generar nombre único para el archivo
    const timestamp = Date.now();
    const originalName = file.name;
    const extension = originalName.split('.').pop();
    const filename = `${timestamp}.${extension}`;
    
    const path = join(uploadsDir, filename);
    
    await writeFile(path, buffer);

    // Encolar post-proceso según tipo
    const lower = (extension || '').toLowerCase();
    if (['jpg','jpeg','png','webp'].includes(lower)) {
      // Optimización a WebP en background (idempotente por filename)
      enqueueOptimizeProfileImage({ path: `/uploads/profiles/${filename}` }).catch(()=>{});
    } else if (lower === 'pdf') {
      enqueueValidateCV({ path: `/uploads/profiles/${filename}` }).catch(()=>{});
    }

    return NextResponse.json({ 
      success: true, 
      filename,
      originalName,
      path: `/uploads/profiles/${filename}`
    });

  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}



