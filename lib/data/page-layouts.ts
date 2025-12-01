import type { PageLayout } from "@/lib/types/page-customization"

// Default page layouts - these represent the original state
export const defaultPageLayouts: Record<string, PageLayout> = {
  "/": {
    id: "dashboard-default",
    pagePath: "/",
    elements: [
      {
        id: "metrics",
        type: "metric",
        component: "MetricCard",
        position: 0,
        isVisible: true,
      },
      {
        id: "recent-transactions",
        type: "list",
        component: "RecentTransactions",
        position: 1,
        isVisible: true,
      },
      {
        id: "spending-chart",
        type: "chart",
        component: "SpendingChart",
        position: 2,
        isVisible: true,
      },
      {
        id: "budget-chart",
        type: "chart",
        component: "BudgetChart",
        position: 3,
        isVisible: true,
      },
      {
        id: "savings-goals",
        type: "card",
        component: "SavingsGoals",
        position: 4,
        isVisible: true,
      },
      {
        id: "recurring-bills-kpi",
        type: "card",
        component: "RecurringBillsKPI",
        position: 5,
        isVisible: true,
      },
    ],
    version: 1,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
    createdBy: 0, // System
    updatedBy: 0,
  },
  "/transactions": {
    id: "transactions-default",
    pagePath: "/transactions",
    elements: [
      {
        id: "transaction-stats",
        type: "metric",
        component: "TransactionStats",
        position: 0,
        isVisible: true,
      },
      {
        id: "transaction-filters",
        type: "card",
        component: "TransactionFilters",
        position: 1,
        isVisible: true,
      },
      {
        id: "transaction-list",
        type: "list",
        component: "TransactionList",
        position: 2,
        isVisible: true,
      },
    ],
    version: 1,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
    createdBy: 0,
    updatedBy: 0,
  },
}

// Current page layouts (can be modified by devs)
export const currentPageLayouts: Record<string, PageLayout> = JSON.parse(
  JSON.stringify(defaultPageLayouts)
)

