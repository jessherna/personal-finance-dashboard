"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { useAuth } from "@/contexts/auth-context"
import { PiggyBank, TrendingUp, Target, DollarSign } from "lucide-react"
import type { SavingsGoal, Transaction } from "@/lib/types"

export function SavingsOverview() {
  const { user, isViewingAsUser } = useAuth()
  const [stats, setStats] = useState([
    { label: "Total Savings", value: "C$0.00", change: "+0%", icon: PiggyBank, iconColor: "text-primary", bgColor: "bg-primary/10" },
    { label: "Total Goals", value: "0", change: "+0%", icon: Target, iconColor: "text-primary", bgColor: "bg-primary/10" },
    { label: "Total Target", value: "C$0.00", change: "+0%", icon: DollarSign, iconColor: "text-success", bgColor: "bg-success/10" },
    { label: "Progress", value: "0%", change: "+0%", icon: TrendingUp, iconColor: "text-success", bgColor: "bg-success/10" },
  ])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchOverview = async () => {
      if (!user) {
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        const effectiveUserId = isViewingAsUser ? 2 : user.id
        const headers = {
          "x-user-id": String(effectiveUserId),
          "x-user-role": user.role || "user",
        }

        const [savingsGoalsRes, transactionsRes] = await Promise.all([
          fetch("/api/savings-goals", { headers }),
          fetch("/api/transactions", { headers }),
        ])

        if (savingsGoalsRes.ok && transactionsRes.ok) {
          const savingsGoals: SavingsGoal[] = await savingsGoalsRes.json()
          const transactions: Transaction[] = await transactionsRes.json()

          // Calculate total savings from transactions with savingsGoalId
          const savingsTransactions = transactions.filter(
            (t) => t.type === "income" && t.savingsGoalId && t.savingsAmount
          )
          const totalSavings = savingsTransactions.reduce((sum, t) => sum + (t.savingsAmount || 0), 0)

          // Also sum current amounts from savings goals
          const totalFromGoals = savingsGoals.reduce((sum, goal) => sum + (goal.current || 0), 0)
          const combinedSavings = totalSavings + totalFromGoals

          // Calculate total target
          const totalTarget = savingsGoals.reduce((sum, goal) => sum + (goal.target || 0), 0)

          // Calculate overall progress
          const overallProgress = totalTarget > 0 ? (combinedSavings / totalTarget) * 100 : 0

          setStats([
            {
              label: "Total Savings",
              value: `C$${(combinedSavings / 100).toFixed(2)}`,
              change: "+0%",
              icon: PiggyBank,
              iconColor: "text-primary",
              bgColor: "bg-primary/10",
            },
            {
              label: "Total Goals",
              value: String(savingsGoals.length),
              change: "+0%",
              icon: Target,
              iconColor: "text-primary",
              bgColor: "bg-primary/10",
            },
            {
              label: "Total Target",
              value: `C$${(totalTarget / 100).toFixed(2)}`,
              change: "+0%",
              icon: DollarSign,
              iconColor: "text-success",
              bgColor: "bg-success/10",
            },
            {
              label: "Progress",
              value: `${overallProgress.toFixed(1)}%`,
              change: "+0%",
              icon: TrendingUp,
              iconColor: "text-success",
              bgColor: "bg-success/10",
            },
          ])
        }
      } catch (error) {
        console.error("Error fetching savings overview:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchOverview()
  }, [user, isViewingAsUser])

  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
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
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, index) => {
        const IconComponent = stat.icon
        return (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  <p className={`text-sm font-medium ${stat.iconColor}`}>{stat.change}</p>
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
