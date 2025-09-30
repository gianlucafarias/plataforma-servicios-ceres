import { NextRequest, NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';

export async function POST(request: NextRequest) {
  try {
    const data = await request.formData();
    const file: File | null = data.get('file') as unknown as File;

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file uploaded' }, { status: 400 });
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



