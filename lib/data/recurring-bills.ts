import type { RecurringBill } from "@/lib/types"

export const mockRecurringBills: RecurringBill[] = [
  {
    id: 1,
    name: "Netflix Subscription",
    amount: 5500, // C$55.00 in cents
    frequency: "monthly",
    nextDueDate: "2025-12-28",
    category: "Subscription",
    icon: "📺",
    color: "#E50914",
    isActive: true,
    budgetCategoryId: 3, // Subscriptions
  },
  {
    id: 2,
    name: "Rent",
    amount: 95000, // C$950.00 in cents
    frequency: "monthly",
    nextDueDate: "2025-12-01",
    category: "Rent",
    icon: "🏠",
    color: "#59A14F",
    isActive: true,
    budgetCategoryId: 4, // Rent & Utilities
  },
  {
    id: 3,
    name: "Electricity Bill",
    amount: 12000, // C$120.00 in cents
    frequency: "monthly",
    nextDueDate: "2025-12-15",
    category: "Utilities",
    icon: "⚡",
    color: "#F28E2C",
    isActive: true,
    budgetCategoryId: 4, // Rent & Utilities
  },
  {
    id: 4,
    name: "Gym Membership",
    amount: 4500, // C$45.00 in cents
    frequency: "monthly",
    nextDueDate: "2025-12-10",
    category: "Subscription",
    icon: "💪",
    color: "#4E79A7",
    isActive: true,
    budgetCategoryId: 3, // Subscriptions
  },
  {
    id: 5,
    name: "Car Insurance",
    amount: 15000, // C$150.00 in cents
    frequency: "monthly",
    nextDueDate: "2025-12-05",
    category: "Transportation",
    icon: "🚗",
    color: "#E15759",
    isActive: true,
    budgetCategoryId: 1, // Transportation
  },
]

