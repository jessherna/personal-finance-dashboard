export interface BudgetCategory {
  id: number
  name: string
  budget: number
  spent: number
  icon: string
  color: string
}

export interface BudgetOverviewData {
  totalBudget: number
  totalSpent: number
  remaining: number
  percentageUsed: number
}

export interface MonthlySpendingData {
  month: string
  amount: number
}
