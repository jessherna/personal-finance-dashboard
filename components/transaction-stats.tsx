"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { useAuth } from "@/contexts/auth-context"
import { TrendingUp, TrendingDown, DollarSign } from "lucide-react"
import type { Transaction } from "@/lib/types"

export function TransactionStats() {
  const { user, isViewingAsUser } = useAuth()
  const [stats, setStats] = useState([
    { label: "Total Income", value: "C$0.00", change: "+0%", icon: TrendingUp, iconColor: "text-success", bgColor: "bg-success/10" },
    { label: "Total Expenses", value: "C$0.00", change: "+0%", icon: TrendingDown, iconColor: "text-destructive", bgColor: "bg-destructive/10" },
    { label: "Net Savings", value: "C$0.00", change: "+0%", icon: DollarSign, iconColor: "text-success", bgColor: "bg-success/10" },
  ])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      if (!user) {
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        const effectiveUserId = isViewingAsUser ? 2 : user.id
        const response = await fetch("/api/transactions", {
          headers: {
            "x-user-id": String(effectiveUserId),
            "x-user-role": user.role || "user",
          },
        })

        if (response.ok) {
          const transactions: Transaction[] = await response.json()
          
          const now = new Date()
          const currentMonth = now.getMonth()
          const currentYear = now.getFullYear()
          
          const monthlyTransactions = transactions.filter((t: Transaction) => {
            const txnDate = new Date(t.date)
            return txnDate.getMonth() === currentMonth && txnDate.getFullYear() === currentYear
          })
          
          const income = monthlyTransactions
            .filter((t) => t.type === "income")
            .reduce((sum, t) => sum + (t.amount || 0), 0)
          
          const expenses = monthlyTransactions
            .filter((t) => t.type === "expense")
            .reduce((sum, t) => sum + (t.amount || 0), 0)
          
          const netSavings = income - expenses
          
          setStats([
            { label: "Total Income", value: `C$${(income / 100).toFixed(2)}`, change: "+0%", icon: TrendingUp, iconColor: "text-success", bgColor: "bg-success/10" },
            { label: "Total Expenses", value: `C$${(expenses / 100).toFixed(2)}`, change: "+0%", icon: TrendingDown, iconColor: "text-destructive", bgColor: "bg-destructive/10" },
            { label: "Net Savings", value: `C$${(netSavings / 100).toFixed(2)}`, change: "+0%", icon: DollarSign, iconColor: "text-success", bgColor: "bg-success/10" },
          ])
        }
      } catch (error) {
        console.error("Error fetching stats:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchStats()
  }, [user, isViewingAsUser])

  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="text-center py-4 text-muted-foreground">Loading...</div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid gap-6 md:grid-cols-3">
      {stats.map((stat, index) => {
        const IconComponent = stat.icon
        return (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  <p className={`text-sm font-medium ${stat.iconColor}`}>{stat.change} from last month</p>
                </div>
                <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${stat.bgColor}`}>
                  <IconComponent className={`h-6 w-6 ${stat.iconColor}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
