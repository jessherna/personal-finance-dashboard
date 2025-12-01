import { CATEGORY_COLORS } from "@/lib/constants/categories"

/**
 * Gets the color for a category
 */
export function getCategoryColor(category: string): string {
  return CATEGORY_COLORS[category] || "hsl(var(--muted))"
}

/**
 * Creates a semi-transparent background color from a color string
 */
export function getBackgroundColorWithOpacity(color: string, opacity = "20"): string {
  return `${color}${opacity}`
}

/**
 * Gets icon color classes based on transaction type
 */
export function getTransactionIconColor(type: "income" | "expense"): string {
  return type === "income" ? "text-success" : "text-destructive"
}

/**
 * Gets background color classes based on transaction type
 */
export function getTransactionBgColor(type: "income" | "expense"): string {
  return type === "income" ? "bg-success/10" : "bg-muted"
}
