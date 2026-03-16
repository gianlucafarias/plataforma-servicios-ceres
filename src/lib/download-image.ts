import { isR2Configured, uploadToR2 } from './r2';

const ALLOWED_OAUTH_IMAGE_HOSTS = new Set([
  'graph.facebook.com',
  'lookaside.facebook.com',
  'platform-lookaside.fbsbx.com',
]);

const ALLOWED_OAUTH_IMAGE_SUFFIXES = ['.googleusercontent.com', '.fbcdn.net'];

function parseExternalImageUrl(value: string): URL | null {
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:') {
      return null;
    }

    return url;
  } catch {
    return null;
  }
}

/**
 * Descarga una imagen desde una URL externa y la guarda en R2.
 * IMPORTANTE: NO escribe nada en el filesystem local. Si R2 no esta
 * configurado, lanza un error.
 * @param imageUrl URL de la imagen externa (ej: de Google OAuth)
 * @returns URL final de la imagen guardada en R2
 */
export async function downloadAndSaveImage(imageUrl: string): Promise<string> {
  try {
    if (!isR2Configured()) {
      throw new Error('R2 no esta configurado, no se puede descargar imagen externa');
    }

    const parsedUrl = parseExternalImageUrl(imageUrl);
    if (!parsedUrl || !isExternalOAuthImage(imageUrl)) {
      throw new Error('La URL no pertenece a un proveedor OAuth permitido');
    }

    const response = await fetch(parsedUrl, {
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) {
      throw new Error(`Error al descargar la imagen: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const contentType = response.headers.get('content-type') || 'image/jpeg';
    const extension = contentType.split('/')[1]?.split(';')[0] || 'jpg';

    if (!contentType.startsWith('image/')) {
      throw new Error('La URL no apunta a una imagen valida');
    }

    const maxSize = 10 * 1024 * 1024;
    if (buffer.length > maxSize) {
      throw new Error('La imagen es demasiado grande (max 10MB)');
    }

    const timestamp = Date.now();
    const safeExtension = extension.toLowerCase();
    const key = `profiles/${timestamp}.${safeExtension}`;

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
 * Verifica si una URL pertenece a un proveedor OAuth permitido.
 */
export function isExternalOAuthImage(url: string): boolean {
  if (!url) return false;

  const parsedUrl = parseExternalImageUrl(url);
  if (!parsedUrl) {
    return false;
  }

  const hostname = parsedUrl.hostname.toLowerCase();

  return (
    ALLOWED_OAUTH_IMAGE_HOSTS.has(hostname) ||
    ALLOWED_OAUTH_IMAGE_SUFFIXES.some((suffix) => hostname.endsWith(suffix))
  );
}
