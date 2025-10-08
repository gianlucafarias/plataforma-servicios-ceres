/**
 * Validador de archivos subidos
 * 
 * Límites:
 * - Imágenes (png, jpg, jpeg, webp): máx 10 MB
 * - CV (pdf, doc, docx, jpg, jpeg, png): máx 15 MB
 */

const IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
const CV_TYPES = [
  'application/pdf',
  'application/msword', // .doc
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'image/jpeg',
  'image/jpg',
  'image/png',
];

const IMAGE_EXTENSIONS = ['png', 'jpg', 'jpeg', 'webp'];
const CV_EXTENSIONS = ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png'];

const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10 MB
const MAX_CV_SIZE = 15 * 1024 * 1024; // 15 MB

export interface ValidationResult {
  valid: boolean;
  error?: string;
  fileType?: 'image' | 'cv';
}

/**
 * Valida un archivo según tipo esperado
 * 
 * @param file - Archivo a validar
 * @param expectedType - 'image' o 'cv'
 * @returns Resultado de validación
 */
export function validateUpload(file: File, expectedType: 'image' | 'cv'): ValidationResult {
  if (!file) {
    return { valid: false, error: 'No se recibió ningún archivo' };
  }

  const extension = file.name.split('.').pop()?.toLowerCase() || '';
  const mimeType = file.type.toLowerCase();

  if (expectedType === 'image') {
    // Validar tipo
    const validExtension = IMAGE_EXTENSIONS.includes(extension);
    const validMime = IMAGE_TYPES.includes(mimeType);

    if (!validExtension && !validMime) {
      return {
        valid: false,
        error: `Tipo de imagen no soportado. Formatos permitidos: ${IMAGE_EXTENSIONS.join(', ')}`,
      };
    }

    // Validar tamaño
    if (file.size > MAX_IMAGE_SIZE) {
      return {
        valid: false,
        error: `La imagen supera el tamaño máximo de ${MAX_IMAGE_SIZE / (1024 * 1024)} MB`,
      };
    }

    return { valid: true, fileType: 'image' };
  }

  if (expectedType === 'cv') {
    // Validar tipo
    const validExtension = CV_EXTENSIONS.includes(extension);
    const validMime = CV_TYPES.includes(mimeType);

    if (!validExtension && !validMime) {
      return {
        valid: false,
        error: `Tipo de CV no soportado. Formatos permitidos: ${CV_EXTENSIONS.join(', ')}`,
      };
    }

    // Validar tamaño
    if (file.size > MAX_CV_SIZE) {
      return {
        valid: false,
        error: `El CV supera el tamaño máximo de ${MAX_CV_SIZE / (1024 * 1024)} MB`,
      };
    }

    return { valid: true, fileType: 'cv' };
  }

  return { valid: false, error: 'Tipo de archivo no especificado' };
}

/**
 * Determina automáticamente si un archivo es imagen o CV
 * 
 * @param file - Archivo a clasificar
 * @returns 'image', 'cv' o null si no es reconocible
 */
export function detectFileType(file: File): 'image' | 'cv' | null {
  const extension = file.name.split('.').pop()?.toLowerCase() || '';
  const mimeType = file.type.toLowerCase();

  // Prioridad: si es pdf/doc/docx → CV
  if (['pdf', 'doc', 'docx'].includes(extension) || 
      ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(mimeType)) {
    return 'cv';
  }

  // Si es imagen → image
  if (IMAGE_EXTENSIONS.includes(extension) || IMAGE_TYPES.includes(mimeType)) {
    return 'image';
  }

  return null;
}

/**
 * Validación para backend (Node.js File-like object)
 */
export function validateUploadServer(file: { name: string; type: string; size: number }, expectedType: 'image' | 'cv'): ValidationResult {
  if (!file) {
    return { valid: false, error: 'No se recibió ningún archivo' };
  }

  const extension = file.name.split('.').pop()?.toLowerCase() || '';
  const mimeType = file.type.toLowerCase();

  if (expectedType === 'image') {
    const validExtension = IMAGE_EXTENSIONS.includes(extension);
    const validMime = IMAGE_TYPES.includes(mimeType);

    if (!validExtension && !validMime) {
      return {
        valid: false,
        error: `Tipo de imagen no soportado. Formatos permitidos: ${IMAGE_EXTENSIONS.join(', ')}`,
      };
    }

    if (file.size > MAX_IMAGE_SIZE) {
      return {
        valid: false,
        error: `La imagen supera el tamaño máximo de 10 MB`,
      };
    }

    return { valid: true, fileType: 'image' };
  }

  if (expectedType === 'cv') {
    const validExtension = CV_EXTENSIONS.includes(extension);
    const validMime = CV_TYPES.includes(mimeType);

    if (!validExtension && !validMime) {
      return {
        valid: false,
        error: `Tipo de CV no soportado. Formatos permitidos: ${CV_EXTENSIONS.join(', ')}`,
      };
    }

    if (file.size > MAX_CV_SIZE) {
      return {
        valid: false,
        error: `El CV supera el tamaño máximo de 15 MB`,
      };
    }

    return { valid: true, fileType: 'cv' };
  }

  return { valid: false, error: 'Tipo de archivo no especificado' };
}

