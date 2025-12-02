/**
 * Formats a date string to a relative time (e.g., "2 days ago")
 * Uses Toronto timezone for current time reference
 */
export function getRelativeTime(date: string): string {
  const now = getCurrentDateInToronto()
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
 * Uses Toronto timezone for current time reference
 */
export function formatDistanceToNow(date: Date | string, options?: { addSuffix?: boolean }): string {
  const now = getCurrentDateInToronto()
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
 * Gets the current month name in Toronto timezone
 */
export function getCurrentMonth(): string {
  return getCurrentDateInToronto().toLocaleDateString("en-US", { month: "long" })
}

/**
 * Gets the current year in Toronto timezone
 */
export function getCurrentYear(): number {
  return getCurrentDateInToronto().getFullYear()
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

/**
 * Gets the current date/time in Toronto, Canada timezone (America/Toronto)
 * Use this for any calculations that need the current time
 */
export function getCurrentDateInToronto(): Date {
  const now = new Date()
  // Convert to Toronto timezone (America/Toronto)
  const torontoTimeString = now.toLocaleString("en-US", { timeZone: "America/Toronto" })
  return new Date(torontoTimeString)
}

/**
 * Formats a date and time to a human-readable format
 * Example: "Jan 15, 2024 at 2:30 PM"
 * Month is limited to 3 characters
 */
export function formatDateTime(date: string | Date, time?: string): string {
  try {
    const dateObj = typeof date === "string" ? new Date(date) : date
    
    if (isNaN(dateObj.getTime())) {
      return typeof date === "string" ? date : date.toString() // Return original if invalid
    }
    
    // Format date: "Jan 15, 2024" (month limited to 3 chars)
    const formattedDate = dateObj.toLocaleDateString("en-US", {
      month: "short", // 3-character month (Jan, Feb, Mar, etc.)
      day: "numeric",
      year: "numeric",
    })
    
    // Format time if provided
    if (time && time.trim()) {
      try {
        let timeStr = time.trim()
        
        // Handle 24-hour format (HH:MM or HH:MM:SS)
        if (timeStr.match(/^\d{1,2}:\d{2}(:\d{2})?$/)) {
          const timeParts = timeStr.split(":")
          const hour24 = parseInt(timeParts[0], 10)
          const minutes = timeParts[1]
          const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24
          const ampm = hour24 >= 12 ? "PM" : "AM"
          timeStr = `${hour12}:${minutes} ${ampm}`
        } else if (!timeStr.includes("AM") && !timeStr.includes("PM")) {
          // If no AM/PM and not in HH:MM format, try to parse it
          // This handles cases like "9:00" that need AM/PM
          const timeMatch = timeStr.match(/^(\d{1,2}):(\d{2})/)
          if (timeMatch) {
            const hour24 = parseInt(timeMatch[1], 10)
            const minutes = timeMatch[2]
            const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24
            const ampm = hour24 >= 12 ? "PM" : "AM"
            timeStr = `${hour12}:${minutes} ${ampm}`
          }
        }
        
        return `${formattedDate} at ${timeStr}`
      } catch {
        // If time parsing fails, just append it as-is
        return `${formattedDate} at ${time}`
      }
    }
    
    return formattedDate
  } catch {
    return typeof date === "string" ? date : date.toString()
  }
}
