/**
 * Formats a date string to a relative time (e.g., "2 days ago")
 */
export function getRelativeTime(date: string): string {
  const now = new Date()
  const targetDate = new Date(date)
  const diffInMs = now.getTime() - targetDate.getTime()
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))

  if (diffInDays === 0) return "Today"
  if (diffInDays === 1) return "Yesterday"
  if (diffInDays < 7) return `${diffInDays} days ago`
  if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`
  return targetDate.toLocaleDateString()
}

/**
 * Gets the current month name
 */
export function getCurrentMonth(): string {
  return new Date().toLocaleDateString("en-US", { month: "long" })
}

/**
 * Gets the current year
 */
export function getCurrentYear(): number {
  return new Date().getFullYear()
}

/**
 * Formats a date to a readable string
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}
