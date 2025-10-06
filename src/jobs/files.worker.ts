import sharp from 'sharp';
import { join, dirname, extname, basename } from 'path';
import { existsSync } from 'fs';
import { promises as fs } from 'fs';

export async function optimizeProfileImage(data: { path: string; userId?: string }) {
  const publicRoot = join(process.cwd(), 'public');
  const absolute = join(publicRoot, data.path.replace(/^\/+/, ''));

  if (!existsSync(absolute)) {
    console.warn('[files.worker] Imagen no existe:', absolute);
    return;
  }

  const dir = dirname(absolute);
  const name = basename(absolute, extname(absolute));
  const webpOut = join(dir, `${name}.webp`);

  // Si ya existe .webp, no reprocesar
  if (existsSync(webpOut)) return;

  const image = sharp(absolute).rotate();
  const meta = await image.metadata();

  // Estrategia: no redimensionar por defecto para evitar pérdida de detalle.
  // Si la imagen es extremadamente grande (> 3000px de ancho), bajar a 2000px manteniendo relación de aspecto.
  const needsDownscale = (meta.width || 0) > 3000;
  const pipeline = needsDownscale
    ? image.resize({ width: 2000, withoutEnlargement: true, fit: 'inside' })
    : image;

  // Para imágenes pequeñas (< 700px ancho), priorizar nearLossless para minimizar artefactos.
  const isSmall = (meta.width || 0) > 0 && (meta.width || 0) < 700;

  await pipeline
    .webp({
      quality: isSmall ? 95 : 90,
      nearLossless: isSmall ? true : false,
      smartSubsample: true,
      effort: 5,
    })
    .toFile(webpOut);
}

export async function validateCV(data: { path: string; userId?: string }) {
  const publicRoot = join(process.cwd(), 'public');
  const absolute = join(publicRoot, data.path.replace(/^\/+/, ''));
  if (!existsSync(absolute)) {
    console.warn('[files.worker] CV no existe:', absolute);
    return;
  }
  // Validaciones básicas: tamaño máximo 10MB
  const stat = await fs.stat(absolute);
  const tenMB = 10 * 1024 * 1024;
  if (stat.size > tenMB) {
    console.warn('[files.worker] CV demasiado grande (>10MB):', absolute);
  }
}


