export const DEFAULT_CURRENCY = "C$"

export const CURRENCY_OPTIONS = [
  { value: "cad", label: "Canadian Dollar (C$)", symbol: "C$" },
  { value: "usd", label: "US Dollar ($)", symbol: "$" },
  { value: "eur", label: "Euro (€)", symbol: "€" },
  { value: "gbp", label: "British Pound (£)", symbol: "£" },
  { value: "ngn", label: "Nigerian Naira (₦)", symbol: "₦" },
] as const

export const TIME_PERIODS = [
  { value: "7", label: "Last 7 days" },
  { value: "30", label: "Last 30 days" },
  { value: "90", label: "Last 90 days" },
  { value: "365", label: "Last year" },
] as const

export const CHART_PERIODS = [
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
] as const
