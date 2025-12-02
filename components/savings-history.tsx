"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Area, AreaChart, XAxis, YAxis } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { useAuth } from "@/contexts/auth-context"
import { getCurrentDateInToronto } from "@/lib/utils/date"
import { formatCurrencyFromCents } from "@/lib/utils/format"
import type { Transaction, SavingsGoal } from "@/lib/types"

export function SavingsHistory() {
  const { user, isViewingAsUser } = useAuth()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
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

        const [transactionsRes, savingsGoalsRes] = await Promise.all([
          fetch("/api/transactions", { headers }),
          fetch("/api/savings-goals", { headers }),
        ])

        if (transactionsRes.ok) {
          const data = await transactionsRes.json()
          setTransactions(data)
        }
        if (savingsGoalsRes.ok) {
          const data = await savingsGoalsRes.json()
          setSavingsGoals(data)
        }
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [user, isViewingAsUser])

  // Calculate savings growth from transactions and goals
  const data = useMemo(() => {
    if (transactions.length === 0 && savingsGoals.length === 0) return []

    // Use Toronto timezone for current date calculations
    const now = getCurrentDateInToronto()
    const months: string[] = []
    const monthData: Record<string, number> = {}

    // Get last 6 months
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthKey = date.toLocaleDateString("en-US", { month: "short", year: "numeric" })
      months.push(monthKey)
      monthData[monthKey] = 0
    }

    // Process savings transactions
    transactions
      .filter((t) => t.type === "income" && t.savingsGoalId && t.savingsAmount)
      .forEach((t) => {
        const txnDate = new Date(t.date)
        const monthKey = txnDate.toLocaleDateString("en-US", { month: "short", year: "numeric" })
        if (months.includes(monthKey)) {
          monthData[monthKey] = (monthData[monthKey] || 0) + (t.savingsAmount || 0)
        }
      })

    // Calculate cumulative savings
    let cumulative = 0
    return months.map((month) => {
      cumulative += monthData[month] || 0
      return {
        month,
        amount: cumulative,
      }
    })
  }, [transactions, savingsGoals])

  // Calculate recent activity from transactions
  const recentActivity = useMemo(() => {
    const savingsTransactions = transactions
      .filter((t) => t.type === "income" && t.savingsGoalId && t.savingsAmount)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5)

    return savingsTransactions.map((t, index) => {
      const goal = savingsGoals.find((g) => g.id === t.savingsGoalId)
      return {
        id: `activity-${index}`,
        action: goal ? `Added to ${goal.name}` : "Savings deposit",
        date: new Date(t.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
        amount: (t.savingsAmount || 0) / 100,
      }
    })
  }, [transactions, savingsGoals])

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Savings Growth</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">Loading savings history...</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Savings Growth</CardTitle>
        </CardHeader>
        <CardContent>
          {data.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No savings data available</div>
          ) : (
            <ChartContainer
            config={{
              amount: {
                label: "Total Savings",
                color: "oklch(var(--chart-1))",
              },
            }}
            className="h-64 w-full"
          >
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="oklch(var(--chart-1))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="oklch(var(--chart-1))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="month"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `C$${value / 1000}k`}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Area
                type="monotone"
                dataKey="amount"
                stroke="oklch(var(--chart-1))"
                fillOpacity={1}
                fill="url(#colorAmount)"
                strokeWidth={2}
              />
            </AreaChart>
          </ChartContainer>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {recentActivity.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No recent savings activity</div>
          ) : (
            recentActivity.map((activity) => (
            <div key={activity.id} className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="text-sm font-medium text-foreground">{activity.action}</div>
                <div className="text-xs text-muted-foreground">{activity.date}</div>
              </div>
              {activity.amount > 0 && (
                <div className="text-sm font-semibold text-success">+{formatCurrencyFromCents(activity.amount)}</div>
              )}
            </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
