/**
 * Validates if a value is a positive number
 */
export function isPositiveNumber(value: number): boolean {
  return !Number.isNaN(value) && value > 0
}

/**
 * Validates if an email is in correct format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Validates if a budget amount is reasonable
 */
export function isValidBudget(amount: number): boolean {
  return isPositiveNumber(amount) && amount <= 100000000 // 100M max
}

/**
 * Validates if a transaction amount is reasonable
 */
export function isValidTransactionAmount(amount: number): boolean {
  return isPositiveNumber(amount) && amount <= 10000000 // 10M max
}
