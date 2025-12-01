import type { BudgetCategory, BudgetOverviewData, MonthlySpendingData } from "@/lib/types"

export const mockBudgetOverview: BudgetOverviewData = {
  totalBudget: 240000,
  totalSpent: 280000,
  remaining: -40000,
  percentageUsed: 117,
}

export const mockBudgetCategories: BudgetCategory[] = [
  {
    id: 1,
    name: "Transportation",
    budget: 45000,
    spent: 50000,
    icon: "🚗",
    color: "hsl(var(--chart-1))",
  },
  {
    id: 2,
    name: "Food & Dining",
    budget: 75000,
    spent: 85000,
    icon: "🍔",
    color: "hsl(var(--chart-2))",
  },
  {
    id: 3,
    name: "Subscriptions",
    budget: 30000,
    spent: 45000,
    icon: "📱",
    color: "hsl(var(--chart-5))",
  },
  {
    id: 4,
    name: "Rent & Utilities",
    budget: 60000,
    spent: 55000,
    icon: "🏠",
    color: "hsl(var(--chart-3))",
  },
  {
    id: 5,
    name: "Entertainment",
    budget: 30000,
    spent: 45000,
    icon: "🎮",
    color: "hsl(var(--chart-4))",
  },
]

export const mockMonthlySpending: MonthlySpendingData[] = [
  { month: "Jul", amount: 220000 },
  { month: "Aug", amount: 195000 },
  { month: "Sep", amount: 235000 },
  { month: "Oct", amount: 210000 },
  { month: "Nov", amount: 280000 },
  { month: "Dec", amount: 240000 },
]

// Monthly spending by category
export const mockMonthlySpendingByCategory = [
  {
    month: "Jul",
    Transportation: 42000,
    "Food & Dining": 68000,
    Subscriptions: 38000,
    "Rent & Utilities": 52000,
    Entertainment: 20000,
  },
  {
    month: "Aug",
    Transportation: 38000,
    "Food & Dining": 62000,
    Subscriptions: 35000,
    "Rent & Utilities": 50000,
    Entertainment: 10000,
  },
  {
    month: "Sep",
    Transportation: 45000,
    "Food & Dining": 75000,
    Subscriptions: 40000,
    "Rent & Utilities": 55000,
    Entertainment: 20000,
  },
  {
    month: "Oct",
    Transportation: 40000,
    "Food & Dining": 70000,
    Subscriptions: 38000,
    "Rent & Utilities": 52000,
    Entertainment: 10000,
  },
  {
    month: "Nov",
    Transportation: 50000,
    "Food & Dining": 85000,
    Subscriptions: 45000,
    "Rent & Utilities": 60000,
    Entertainment: 40000,
  },
  {
    month: "Dec",
    Transportation: 45000,
    "Food & Dining": 80000,
    Subscriptions: 42000,
    "Rent & Utilities": 58000,
    Entertainment: 15000,
  },
]

export const mockBudgetVsExpense = [
  { category: "Transport", budget: 45000, expense: 50000 },
  { category: "Food", budget: 75000, expense: 85000 },
  { category: "Subscription", budget: 30000, expense: 45000 },
  { category: "Rent", budget: 60000, expense: 55000 },
  { category: "Miscellaneous", budget: 30000, expense: 45000 },
]

// Period-specific budget vs expense data
export const mockBudgetVsExpenseWeekly = [
  { category: "Transport", budget: 11250, expense: 12500 },
  { category: "Food", budget: 18750, expense: 21250 },
  { category: "Subscription", budget: 7500, expense: 11250 },
  { category: "Rent", budget: 15000, expense: 13750 },
  { category: "Miscellaneous", budget: 7500, expense: 11250 },
]

export const mockBudgetVsExpenseMonthly = mockBudgetVsExpense

export const mockBudgetVsExpenseYearly = [
  { category: "Transport", budget: 540000, expense: 600000 },
  { category: "Food", budget: 900000, expense: 1020000 },
  { category: "Subscription", budget: 360000, expense: 540000 },
  { category: "Rent", budget: 720000, expense: 660000 },
  { category: "Miscellaneous", budget: 360000, expense: 540000 },
]
