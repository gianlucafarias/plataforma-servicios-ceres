/**
 * Normaliza números de WhatsApp para Argentina
 * 
 * Formato esperado: +549XXXXXXXXX
 * - Código de país: +54 (Argentina)
 * - Código móvil: 9 (para números móviles argentinos)
 * - Número: sin 0 inicial, sin 15, solo dígitos
 * 
 * Ejemplos:
 * - "0349112345678" -> "+54934112345678"
 * - "15 3491 123456" -> "+54934112345678"
 * - "349112345678" -> "+54934112345678"
 * - "+54 9 3411 123456" -> "+54934112345678"
 */

export function normalizeWhatsAppNumber(input: string | null | undefined): string | null {
  if (!input) return null;
  
  // Eliminar espacios, guiones, paréntesis y otros caracteres no numéricos excepto +
  let cleaned = input.trim().replace(/[\s\-\(\)]/g, '');
  
  // Si está vacío después de limpiar, retornar null
  if (!cleaned) return null;
  
  // Si ya tiene +, mantenerlo; si no, agregarlo después
  const hasPlus = cleaned.startsWith('+');
  if (hasPlus) {
    cleaned = cleaned.substring(1); // Remover el + temporalmente
  }
  
  // Extraer solo dígitos
  const digits = cleaned.replace(/\D/g, '');
  
  if (!digits || digits.length < 8) {
    // Número muy corto, retornar null o el original según prefieras
    return null;
  }
  
  // Si empieza con 54, removerlo (ya lo agregaremos)
  let number = digits;
  if (number.startsWith('54')) {
    number = number.substring(2);
  }
  
  // Remover 0 inicial si existe (ej: 0349112345678 -> 349112345678)
  if (number.startsWith('0')) {
    number = number.substring(1);
  }
  
  // Remover 15 si existe al inicio (ej: 15349112345678 -> 349112345678)
  if (number.startsWith('15') && number.length > 10) {
    number = number.substring(2);
  }
  
  // Validar que tenga al menos 8 dígitos (código de área + número)
  if (number.length < 8 || number.length > 12) {
    return null;
  }
  
  // Construir el número final: +54 + 9 (para móviles) + número
  // Si el número ya empieza con 9, no duplicarlo
  if (number.startsWith('9')) {
    return `+54${number}`;
  }
  
  // Agregar 9 para móviles argentinos si no existe
  // Nota: En Argentina, los números móviles tienen 9 después del código de país
  return `+549${number}`;
}

/**
 * Valida si un número de WhatsApp está en formato correcto
 * NO normaliza, solo valida el formato
 */
export function isValidWhatsAppNumber(input: string | null | undefined): boolean {
  if (!input) return false;
  
  // Extraer solo dígitos para validar
  const digits = input.trim().replace(/\D/g, '');
  
  if (!digits || digits.length < 8) {
    return false;
  }
  
  // NO debe empezar con 15 (formato incorrecto)
  if (digits.startsWith('15')) {
    return false;
  }
  
  // NO debe empezar con 0
  if (digits.startsWith('0')) {
    return false;
  }
  
  // Validar que tenga entre 8 y 12 dígitos (sin contar código de país)
  if (digits.length < 8 || digits.length > 12) {
    return false;
  }
  
  return true;
}

/**
 * Valida y retorna mensaje de error si el número tiene problemas
 */
export function validateWhatsAppNumber(input: string | null | undefined): string | null {
  if (!input || !input.trim()) {
    return null; // Campo opcional, no error si está vacío
  }
  
  const trimmed = input.trim();
  const digits = trimmed.replace(/\D/g, '');
  
  if (!digits) {
    return 'El número de WhatsApp debe contener dígitos';
  }
  
  // Error crítico: NO debe empezar con 15
  if (digits.startsWith('15')) {
    return 'No debes incluir el 15 al inicio. Ingresa el número sin 0 y sin 15 (ej: 349112345678)';
  }
  
  // Error: NO debe empezar con 0
  if (digits.startsWith('0')) {
    return 'No debes incluir el 0 al inicio. Ingresa el número sin 0 y sin 15 (ej: 349112345678)';
  }
  
  // Validar longitud
  if (digits.length < 8) {
    return 'El número es muy corto. Debe tener al menos 8 dígitos';
  }
  
  if (digits.length > 12) {
    return 'El número es muy largo. Verifica que no hayas incluido el código de país (+54)';
  }
  
  return null; // Válido
}

/**
 * Formatea un número de WhatsApp para mostrar en la UI
 * Ejemplo: +54934112345678 -> +54 9 3411 12345678
 */
export function formatWhatsAppForDisplay(number: string | null | undefined): string {
  if (!number) return '';
  
  const normalized = normalizeWhatsAppNumber(number);
  if (!normalized) return number; // Si no se puede normalizar, mostrar original
  
  // Formatear: +54 9 XXXX XXXX
  const match = normalized.match(/^\+549(\d{2,4})(\d{6,8})$/);
  if (match) {
    const [, areaCode, rest] = match;
    return `+54 9 ${areaCode} ${rest}`;
  }
  
  return normalized;
}
