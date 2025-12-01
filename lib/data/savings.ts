import type { SavingsGoal, SavingsOverviewStat, SavingsActivity } from "@/lib/types"
import { Laptop, ShieldAlert, Plane, Home, PiggyBank, Target, TrendingUp, Calendar } from "lucide-react"

export const mockSavingsGoals: SavingsGoal[] = [
  {
    id: 1,
    name: "New Laptop",
    icon: Laptop,
    current: 60000,
    target: 400000,
    dueDate: "Nov 2025",
    color: "hsl(var(--chart-1))",
    monthlyContribution: 50000,
  },
  {
    id: 2,
    name: "Emergency Fund",
    icon: ShieldAlert,
    current: 410000,
    target: 600000,
    dueDate: "Dec 2025",
    color: "hsl(var(--chart-4))",
    monthlyContribution: 95000,
  },
  {
    id: 3,
    name: "Vacation Trip",
    icon: Plane,
    current: 150000,
    target: 500000,
    dueDate: "Jun 2026",
    color: "hsl(var(--chart-2))",
    monthlyContribution: 50000,
  },
  {
    id: 4,
    name: "House Down Payment",
    icon: Home,
    current: 850000,
    target: 5000000,
    dueDate: "Dec 2027",
    color: "hsl(var(--chart-3))",
    monthlyContribution: 150000,
  },
]

export const mockSavingsOverview: SavingsOverviewStat[] = [
  {
    label: "Total Saved",
    value: "C$470,000",
    change: "+15.2%",
    icon: PiggyBank,
    iconColor: "text-success",
    bgColor: "bg-success/10",
  },
  {
    label: "Active Goals",
    value: "4",
    change: "2 completed",
    icon: Target,
    iconColor: "text-primary",
    bgColor: "bg-primary/10",
  },
  {
    label: "Monthly Growth",
    value: "C$85,000",
    change: "+22.5%",
    icon: TrendingUp,
    iconColor: "text-chart-2",
    bgColor: "bg-chart-2/10",
  },
  {
    label: "Next Milestone",
    value: "C$600k",
    change: "In 2 months",
    icon: Calendar,
    iconColor: "text-chart-3",
    bgColor: "bg-chart-3/10",
  },
]

export const mockSavingsGrowth = [
  { month: "Jan", amount: 100000 },
  { month: "Feb", amount: 150000 },
  { month: "Mar", amount: 220000 },
  { month: "Apr", amount: 280000 },
  { month: "May", amount: 350000 },
  { month: "Jun", amount: 410000 },
  { month: "Jul", amount: 470000 },
]

export const mockSavingsActivity: SavingsActivity[] = [
  {
    id: 1,
    action: "Added to Emergency Fund",
    amount: 95000,
    date: "2 days ago",
  },
  {
    id: 2,
    action: "Added to New Laptop",
    amount: 50000,
    date: "5 days ago",
  },
  {
    id: 3,
    action: "Created Vacation Trip",
    amount: 0,
    date: "1 week ago",
  },
  {
    id: 4,
    action: "Added to House Down Payment",
    amount: 150000,
    date: "2 weeks ago",
  },
]
