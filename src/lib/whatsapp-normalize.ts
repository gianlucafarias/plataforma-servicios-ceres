/**
 * Normaliza numeros de WhatsApp para Argentina
 *
 * Formato esperado: +549XXXXXXXXX
 * - Codigo de pais: +54 (Argentina)
 * - Codigo movil: 9
 * - Numero: sin 0 inicial, sin 15
 */

function stripCountryCode(digits: string) {
  if (digits.startsWith("54")) {
    return digits.substring(2);
  }

  return digits;
}

export function normalizeWhatsAppNumber(input: string | null | undefined): string | null {
  if (!input) return null;

  let cleaned = input.trim().replace(/[\s\-\(\)]/g, "");
  if (!cleaned) return null;

  if (cleaned.startsWith("+")) {
    cleaned = cleaned.substring(1);
  }

  const digits = cleaned.replace(/\D/g, "");
  if (!digits || digits.length < 8) {
    return null;
  }

  let number = stripCountryCode(digits);

  if (number.startsWith("0")) {
    number = number.substring(1);
  }

  if (number.startsWith("15") && number.length > 10) {
    number = number.substring(2);
  }

  if (number.length < 8 || number.length > 12) {
    return null;
  }

  if (number.startsWith("9")) {
    return `+54${number}`;
  }

  return `+549${number}`;
}

export function isValidWhatsAppNumber(input: string | null | undefined): boolean {
  if (!input) return false;

  let digits = input.trim().replace(/\D/g, "");
  digits = stripCountryCode(digits);

  if (!digits || digits.length < 8) {
    return false;
  }

  if (digits.startsWith("15")) {
    return false;
  }

  if (digits.startsWith("0")) {
    return false;
  }

  return digits.length >= 8 && digits.length <= 12;
}

export function validateWhatsAppNumber(input: string | null | undefined): string | null {
  if (!input || !input.trim()) {
    return null;
  }

  let digits = input.trim().replace(/\D/g, "");
  if (!digits) {
    return "El numero de WhatsApp debe contener digitos";
  }

  digits = stripCountryCode(digits);

  if (digits.startsWith("15")) {
    return "No debes incluir el 15 al inicio. Ingresa el numero sin 0 y sin 15 (ej: 349112345678)";
  }

  if (digits.startsWith("0")) {
    return "No debes incluir el 0 al inicio. Ingresa el numero sin 0 y sin 15 (ej: 349112345678)";
  }

  if (digits.length < 8) {
    return "El numero es muy corto. Debe tener al menos 8 digitos";
  }

  if (digits.length > 12) {
    return "El numero es muy largo. Verifica que no haya digitos extra.";
  }

  return null;
}

export function formatWhatsAppForDisplay(number: string | null | undefined): string {
  if (!number) return "";

  const normalized = normalizeWhatsAppNumber(number);
  if (!normalized) return number;

  const match = normalized.match(/^\+549(\d{2,4})(\d{6,8})$/);
  if (match) {
    const [, areaCode, rest] = match;
    return `+54 9 ${areaCode} ${rest}`;
  }

  return normalized;
}
