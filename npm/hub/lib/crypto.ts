import { createHash, randomBytes } from 'crypto'

/**
 * Generates a random 64-character SHA512 hex string.
 * Users receive this during sign-up and must save it to reset their password.
 */
export function generateRecoveryChecksum(): string {
  return createHash('sha512').update(randomBytes(32)).digest('hex')
}

/**
 * Hashes a recovery checksum for verification during password reset.
 */
export function hashRecoveryChecksum(checksum: string): string {
  return createHash('sha512').update(checksum).digest('hex')
}
