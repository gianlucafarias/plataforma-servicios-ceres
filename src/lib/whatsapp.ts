// Utilidad para construir URLs de WhatsApp "click to chat" válidas.
// Documentación oficial: https://wa.me/<number>?text=<encoded>
//
// - <number> debe estar en formato internacional SIN '+', espacios ni símbolos.
// - text debe ir URL-encoded.

export function buildWhatsAppLink(
  rawNumber: string | null | undefined,
  message: string
): string | null {
  if (!rawNumber) return null;

  // Eliminar todo lo que no sea dígito (espacios, +, guiones, paréntesis, etc.)
  const digits = rawNumber.replace(/\D/g, '');
  if (!digits) return null;

  const encodedText = encodeURIComponent(message);
  return `https://wa.me/${digits}?text=${encodedText}`;
}

