/**
 * Generador de contraseñas criptográficamente seguro
 * Usa crypto.getRandomValues() en lugar de Math.random()
 */

export function generateTempPassword(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*-_=+';
  const length = 20;
  const bytes = new Uint8Array(length);

  crypto.getRandomValues(bytes);

  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars[bytes[i] % chars.length];
  }

  return result;
}
