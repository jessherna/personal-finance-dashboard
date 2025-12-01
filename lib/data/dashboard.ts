import type { MetricCardData, SpendingData } from "@/lib/types"

export const mockDashboardMetrics: MetricCardData[] = [
  {
    title: "Total Balance",
    value: "C$500,350.00",
    change: "+C$7,000",
    changeType: "positive",
    subtitle: "Across all accounts",
  },
  {
    title: "Monthly Spending",
    value: "C$350,000.00",
    change: "-C$60,000",
    changeType: "negative",
    subtitle: "Compared to last month",
  },
  {
    title: "Savings Progress",
    value: "C$100,000.00",
    change: "+C$8,000",
    changeType: "positive",
    subtitle: "84% of goal",
  },
  {
    title: "Credit Card Debt",
    value: "C$50,000.00",
    change: "+C$5,000",
    changeType: "positive",
    subtitle: "Compared to last month",
  },
]

export const mockSpendingData: SpendingData[] = [
  { name: "Transportation", value: 70000, color: "hsl(var(--chart-1))" },
  { name: "Food", value: 85000, color: "hsl(var(--chart-2))" },
  { name: "Subscription", value: 45000, color: "hsl(var(--chart-5))" },
  { name: "Rent", value: 95000, color: "hsl(var(--chart-3))" },
  { name: "Miscellaneous", value: 55000, color: "hsl(var(--chart-4))" },
]

// Period-specific spending data
export const mockSpendingDataWeekly: SpendingData[] = [
  { name: "Transportation", value: 17500, color: "hsl(var(--chart-1))" },
  { name: "Food", value: 21250, color: "hsl(var(--chart-2))" },
  { name: "Subscription", value: 11250, color: "hsl(var(--chart-5))" },
  { name: "Rent", value: 23750, color: "hsl(var(--chart-3))" },
  { name: "Miscellaneous", value: 13750, color: "hsl(var(--chart-4))" },
]

export const mockSpendingDataMonthly: SpendingData[] = mockSpendingData

export const mockSpendingDataYearly: SpendingData[] = [
  { name: "Transportation", value: 840000, color: "hsl(var(--chart-1))" },
  { name: "Food", value: 1020000, color: "hsl(var(--chart-2))" },
  { name: "Subscription", value: 540000, color: "hsl(var(--chart-5))" },
  { name: "Rent", value: 1140000, color: "hsl(var(--chart-3))" },
  { name: "Miscellaneous", value: 660000, color: "hsl(var(--chart-4))" },
]
