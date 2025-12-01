export type RecurringFrequency = "daily" | "weekly" | "biweekly" | "monthly" | "quarterly" | "yearly"

export interface RecurringBill {
  id: number
  name: string
  amount: number // in cents
  frequency: RecurringFrequency
  nextDueDate: string // ISO date string
  category: string
  icon?: string
  color?: string
  isActive: boolean
  notes?: string
  budgetCategoryId?: number | null
  lastPaidDate?: string // ISO date string - when this bill was last paid
}

