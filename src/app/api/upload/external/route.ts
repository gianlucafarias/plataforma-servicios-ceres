import { NextRequest, NextResponse } from 'next/server';
import { downloadAndSaveImage, isExternalOAuthImage } from '@/lib/download-image';

/**
 * Endpoint para descargar y guardar imágenes externas (OAuth) en R2
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { imageUrl } = body;

    if (!imageUrl || typeof imageUrl !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Se requiere una URL de imagen válida' },
        { status: 400 }
      );
    }

    // Verificar que sea una URL externa válida
    if (!isExternalOAuthImage(imageUrl)) {
      return NextResponse.json(
        { success: false, error: 'La URL proporcionada no es una imagen externa válida' },
        { status: 400 }
      );
    }

    // Descargar y guardar la imagen
    const savedUrl = await downloadAndSaveImage(imageUrl);

    return NextResponse.json({
      success: true,
      url: savedUrl,
      value: savedUrl, // Para compatibilidad con el formato de /api/upload
    });
  } catch (error) {
    console.error('Error al descargar imagen externa:', error);
    const message = error instanceof Error ? error.message : 'Error al descargar la imagen';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
