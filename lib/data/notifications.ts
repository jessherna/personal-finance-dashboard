import type { Notification } from "@/lib/types/notification"

// Mock notifications - in a real app, this would come from a database
export const mockNotifications: Notification[] = [
  {
    id: "1",
    userId: 2, // John Doe
    type: "budget",
    title: "Budget Alert",
    message: "You've exceeded your Food budget by $50.00",
    isRead: false,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    link: "/budget",
  },
  {
    id: "2",
    userId: 2,
    type: "savings",
    title: "Savings Milestone",
    message: "Congratulations! You've reached 50% of your vacation savings goal",
    isRead: false,
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5 hours ago
    link: "/",
  },
  {
    id: "3",
    userId: 2,
    type: "transaction",
    title: "New Transaction",
    message: "A new transaction of $125.00 has been added to your account",
    isRead: true,
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    link: "/transactions",
  },
  {
    id: "4",
    userId: 3, // Jane Smith
    type: "warning",
    title: "Low Balance",
    message: "Your checking account balance is below $100",
    isRead: false,
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), // 3 hours ago
    link: "/accounts",
  },
  {
    id: "5",
    userId: 2,
    type: "info",
    title: "Bill Reminder",
    message: "Your electricity bill is due in 3 days",
    isRead: false,
    createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), // 1 hour ago
    link: "/bills",
  },
]

