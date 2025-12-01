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
 * Formats a date to relative time with suffix (e.g., "2 hours ago", "3 minutes ago")
 * Similar to date-fns formatDistanceToNow
 */
export function formatDistanceToNow(date: Date | string, options?: { addSuffix?: boolean }): string {
  const now = new Date()
  const targetDate = typeof date === "string" ? new Date(date) : date
  const diffInMs = now.getTime() - targetDate.getTime()
  const diffInSeconds = Math.floor(diffInMs / 1000)
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60))
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60))
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))
  const diffInWeeks = Math.floor(diffInDays / 7)
  const diffInMonths = Math.floor(diffInDays / 30)
  const diffInYears = Math.floor(diffInDays / 365)

  const suffix = options?.addSuffix !== false ? " ago" : ""

  if (diffInSeconds < 60) {
    return diffInSeconds <= 1 ? `just now` : `${diffInSeconds} second${diffInSeconds !== 1 ? "s" : ""}${suffix}`
  }
  if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes !== 1 ? "s" : ""}${suffix}`
  }
  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours !== 1 ? "s" : ""}${suffix}`
  }
  if (diffInDays < 7) {
    return `${diffInDays} day${diffInDays !== 1 ? "s" : ""}${suffix}`
  }
  if (diffInWeeks < 4) {
    return `${diffInWeeks} week${diffInWeeks !== 1 ? "s" : ""}${suffix}`
  }
  if (diffInMonths < 12) {
    return `${diffInMonths} month${diffInMonths !== 1 ? "s" : ""}${suffix}`
  }
  return `${diffInYears} year${diffInYears !== 1 ? "s" : ""}${suffix}`
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
