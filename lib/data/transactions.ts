import type { Transaction, TransactionStatData } from "@/lib/types"
import { ArrowUpRight, ArrowDownRight, TrendingUp } from "lucide-react"

export const mockRecentTransactions: Transaction[] = [
  {
    id: 1,
    name: "Uber Ride",
    category: "Transportation",
    date: "Today",
    amount: 5400,
    type: "expense",
  },
  {
    id: 2,
    name: "Food Market",
    category: "Food",
    date: "Today",
    amount: 70000,
    type: "expense",
  },
  {
    id: 3,
    name: "Netflix",
    category: "Subscription",
    date: "Monday",
    amount: 5500,
    type: "expense",
  },
  {
    id: 4,
    name: "TechCorp",
    category: "Salary",
    date: "Monday",
    amount: 400000,
    type: "income",
  },
]

export const mockAllTransactions: Transaction[] = [
  {
    id: 1,
    name: "Monthly Salary",
    category: "Salary",
    date: "Dec 01, 2025",
    time: "09:00 AM",
    amount: 850000,
    type: "income",
    status: "completed",
    accountId: 1, // Primary Checking
  },
  {
    id: 2,
    name: "Rent Payment",
    category: "Rent",
    date: "Nov 30, 2025",
    time: "10:30 AM",
    amount: 95000,
    type: "expense",
    status: "completed",
    accountId: 1, // Primary Checking
  },
  {
    id: 3,
    name: "Grocery Shopping",
    category: "Food",
    date: "Nov 29, 2025",
    time: "02:15 PM",
    amount: 45000,
    type: "expense",
    status: "completed",
    accountId: 1, // Primary Checking
  },
  {
    id: 4,
    name: "Uber Ride",
    category: "Transportation",
    date: "Nov 29, 2025",
    time: "08:45 AM",
    amount: 5400,
    type: "expense",
    status: "completed",
    accountId: 3, // Credit Card
  },
  {
    id: 5,
    name: "Netflix Subscription",
    category: "Subscription",
    date: "Nov 28, 2025",
    time: "12:00 PM",
    amount: 5500,
    type: "expense",
    status: "completed",
    accountId: 3, // Credit Card
  },
  {
    id: 6,
    name: "Restaurant Dinner",
    category: "Food",
    date: "Nov 27, 2025",
    time: "07:30 PM",
    amount: 25000,
    type: "expense",
    status: "completed",
    accountId: 1, // Primary Checking
  },
  {
    id: 7,
    name: "Fuel",
    category: "Transportation",
    date: "Nov 26, 2025",
    time: "05:15 PM",
    amount: 15000,
    type: "expense",
    status: "completed",
    accountId: 2, // Savings Account
  },
  {
    id: 8,
    name: "Spotify Premium",
    category: "Subscription",
    date: "Nov 25, 2025",
    time: "11:00 AM",
    amount: 2000,
    type: "expense",
    status: "pending",
    accountId: 3, // Credit Card
  },
]

export const mockTransactionStats: TransactionStatData[] = [
  {
    label: "Total Income",
    value: "C$850,000",
    change: "+12.5%",
    icon: ArrowDownRight,
    iconColor: "text-success",
    bgColor: "bg-success/10",
  },
  {
    label: "Total Expenses",
    value: "C$350,000",
    change: "+8.2%",
    icon: ArrowUpRight,
    iconColor: "text-destructive",
    bgColor: "bg-destructive/10",
  },
  {
    label: "Net Savings",
    value: "C$500,000",
    change: "+15.3%",
    icon: TrendingUp,
    iconColor: "text-success",
    bgColor: "bg-success/10",
  },
]
