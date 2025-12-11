import crypto from "crypto"

/**
 * Generate a cryptographically random reset token.
 */
export function generateResetToken(): string {
  return crypto.randomBytes(32).toString("hex")
}

/**
 * Basic password policy for resets.
 */
export function isValidPassword(password: string): boolean {
  return typeof password === "string" && password.trim().length >= 6
}

