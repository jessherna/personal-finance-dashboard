import { DEFAULT_CURRENCY } from "@/lib/constants/currency"

/**
 * Formats a number as currency with locale-specific formatting
 */
export function formatCurrency(amount: number, currency: string = DEFAULT_CURRENCY): string {
  return `${currency}${amount.toLocaleString()}`
}

/**
 * Formats a large number as a shortened string (e.g., 1000 -> 1k)
 */
export function formatCompactNumber(value: number): string {
  if (value >= 1000000) {
    return `${DEFAULT_CURRENCY}${(value / 1000000).toFixed(1)}M`
  }
  if (value >= 1000) {
    return `${DEFAULT_CURRENCY}${(value / 1000).toFixed(0)}k`
  }
  return formatCurrency(value)
}

/**
 * Formats a percentage value
 */
export function formatPercentage(value: number, decimals = 0): string {
  return `${value.toFixed(decimals)}%`
}

/**
 * Parses a currency string to a number
 */
export function parseCurrency(value: string): number {
  return Number.parseFloat(value.replace(/[^0-9.-]+/g, ""))
}
