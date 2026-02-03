import { isR2Configured, uploadToR2 } from './r2';

/**
 * Descarga una imagen desde una URL externa y la guarda en R2.
 * IMPORTANTE: NO escribe nada en el filesystem local. Si R2 no está
 * configurado, lanza un error.
 * @param imageUrl URL de la imagen externa (ej: de Google OAuth)
 * @returns URL final de la imagen guardada en R2
 */
export async function downloadAndSaveImage(imageUrl: string): Promise<string> {
  try {
    if (!isR2Configured()) {
      throw new Error('R2 no está configurado, no se puede descargar imagen externa');
    }

    // Descargar la imagen
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Error al descargar la imagen: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Detectar el tipo de contenido
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    const extension = contentType.split('/')[1]?.split(';')[0] || 'jpg';
    
    // Validar que sea una imagen
    if (!contentType.startsWith('image/')) {
      throw new Error('La URL no apunta a una imagen válida');
    }

    // Validar tamaño (máx 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (buffer.length > maxSize) {
      throw new Error('La imagen es demasiado grande (máx 10MB)');
    }

    const timestamp = Date.now();
    const safeExtension = extension.toLowerCase();
    const key = `profiles/${timestamp}.${safeExtension}`;

    // Subir SIEMPRE a R2 (si llega acá ya sabemos que está configurado)
    const result = await uploadToR2({
      key,
      contentType,
      body: buffer,
    });

    return result.url;
  } catch (error) {
    console.error('Error al descargar y guardar imagen:', error);
    throw error;
  }
}

/**
 * Verifica si una URL es de un proveedor OAuth externo
 */
export function isExternalOAuthImage(url: string): boolean {
  if (!url) return false;
  return (
    url.startsWith('http://') ||
    url.startsWith('https://') ||
    url.includes('googleusercontent.com') ||
    url.includes('facebook.com') ||
    url.includes('graph.facebook.com')
  );
}
