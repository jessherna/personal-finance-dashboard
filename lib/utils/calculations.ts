/**
 * Calculates the percentage of a value relative to a total
 */
export function calculatePercentage(value: number, total: number): number {
  if (total === 0) return 0
  return Math.round((value / total) * 100)
}

/**
 * Calculates the sum of an array of numbers
 */
export function sum(numbers: number[]): number {
  return numbers.reduce((acc, curr) => acc + curr, 0)
}

/**
 * Calculates the average of an array of numbers
 */
export function average(numbers: number[]): number {
  if (numbers.length === 0) return 0
  return sum(numbers) / numbers.length
}

/**
 * Determines if a budget is exceeded
 */
export function isBudgetExceeded(spent: number, budget: number): boolean {
  return spent > budget
}

/**
 * Calculates remaining budget
 */
export function calculateRemaining(budget: number, spent: number): number {
  return budget - spent
}

/**
 * Calculates progress towards a savings goal
 */
export function calculateSavingsProgress(
  current: number,
  target: number,
): {
  percentage: number
  remaining: number
  isComplete: boolean
} {
  const percentage = calculatePercentage(current, target)
  const remaining = target - current
  const isComplete = current >= target

  return { percentage, remaining, isComplete }
}
