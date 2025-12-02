export type AccountType = "checking" | "savings" | "credit_card" | "investment" | "loan" | "other"

export interface Account {
  id: number
  name: string
  type: AccountType
  balance: number // in cents (for non-credit cards)
  limit?: number // in cents (for credit cards only - credit limit)
  currency: string
  bankName?: string
  accountNumber?: string // Last 4 digits for display
  color?: string
  icon?: string
  isActive: boolean
  notes?: string
}

