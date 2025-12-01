import type { Transaction, TransactionType, TransactionCategory } from "@/lib/types"

/**
 * Filters transactions by type (income/expense)
 */
export function filterByType(transactions: Transaction[], type: TransactionType | "all"): Transaction[] {
  if (type === "all") return transactions
  return transactions.filter((t) => t.type === type)
}

/**
 * Filters transactions by category
 */
export function filterByCategory(transactions: Transaction[], category: TransactionCategory | "all"): Transaction[] {
  if (category === "all") return transactions
  return transactions.filter((t) => t.category === category)
}

/**
 * Filters transactions by search query
 */
export function filterBySearch(transactions: Transaction[], query: string): Transaction[] {
  if (!query.trim()) return transactions
  const lowerQuery = query.toLowerCase()
  return transactions.filter(
    (t) => t.name.toLowerCase().includes(lowerQuery) || t.category.toLowerCase().includes(lowerQuery),
  )
}

/**
 * Sorts transactions by date (newest first)
 */
export function sortByDate(transactions: Transaction[]): Transaction[] {
  return [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

/**
 * Sorts transactions by amount (highest first)
 */
export function sortByAmount(transactions: Transaction[]): Transaction[] {
  return [...transactions].sort((a, b) => b.amount - a.amount)
}
