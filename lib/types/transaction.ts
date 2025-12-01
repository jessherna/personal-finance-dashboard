export type TransactionType = "income" | "expense"

export type TransactionStatus = "completed" | "pending" | "failed"

export type TransactionCategory =
  | "Salary"
  | "Transportation"
  | "Food"
  | "Subscription"
  | "Rent"
  | "Miscellaneous"
  | "Entertainment"
  | string // Allow custom categories

export interface Transaction {
  id: number
  name: string
  category: TransactionCategory
  date: string
  time?: string
  amount: number
  type: TransactionType
  status?: TransactionStatus
  accountId?: number | null // ID of the account this transaction belongs to, null means no account
  savingsGoalId?: number // ID of the savings goal this transaction allocates money to
  savingsAmount?: number // Amount allocated to savings goal (in cents)
  budgetCategoryId?: number | null // ID of the budget category, null means no budget
  recurringBillId?: number | null // ID of the recurring bill this transaction pays, null means not a bill payment
}
