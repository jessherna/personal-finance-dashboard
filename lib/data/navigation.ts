import type { NavigationItem } from "@/lib/types"
import { LayoutDashboard, Receipt, PiggyBank, BarChart3, Settings, Repeat, Wallet, Upload, Tag } from "lucide-react"

export const navigationItems: NavigationItem[] = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Transactions", href: "/transactions", icon: Receipt },
  { name: "Categorize", href: "/categorize", icon: Tag },
  { name: "Budget", href: "/budget", icon: PiggyBank },
  { name: "Bills", href: "/bills", icon: Repeat },
  { name: "Accounts", href: "/accounts", icon: Wallet },
  { name: "Import", href: "/import", icon: Upload },
  { name: "Report", href: "/report", icon: BarChart3 },
  { name: "Settings", href: "/settings", icon: Settings },
]
