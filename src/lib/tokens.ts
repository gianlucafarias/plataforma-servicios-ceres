import { randomBytes } from "crypto"

/**
 * Genera un token aleatorio criptográficamente seguro.
 * Solo usar en el servidor (API routes, server components, etc.)
 */
export function generateRandomToken(length: number = 48): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  const charsLen = chars.length // 62
  // Máximo valor que evita sesgo de módulo: floor(256 / 62) * 62 = 248
  const maxValid = Math.floor(256 / charsLen) * charsLen
  
  let token = ''
  while (token.length < length) {
    const bytes = randomBytes(length - token.length)
    for (const byte of bytes) {
      if (byte < maxValid && token.length < length) {
        token += chars[byte % charsLen]
      }
    }
  }
  return token
}

