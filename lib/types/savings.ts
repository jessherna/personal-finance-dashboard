import type { LucideIcon } from "lucide-react"

export interface SavingsGoal {
  id: number
  name: string
  icon: LucideIcon
  current: number
  target: number
  dueDate: string
  color: string
  monthlyContribution?: number
}

export interface SavingsOverviewStat {
  label: string
  value: string
  change: string
  icon: LucideIcon
  iconColor: string
  bgColor: string
}

export interface SavingsActivity {
  id: number
  action: string
  amount: number
  date: string
}
