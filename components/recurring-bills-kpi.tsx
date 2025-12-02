"use client"

import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Cell } from "recharts"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { AlertCircle, Calendar, DollarSign, Repeat } from "lucide-react"
import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import type { RecurringBill } from "@/lib/types"

interface RecurringBillsKPIProps {
  bills?: RecurringBill[]
}

export function RecurringBillsKPI({ bills: propsBills }: RecurringBillsKPIProps) {
  const { user, isViewingAsUser } = useAuth()
  const [bills, setBills] = useState<RecurringBill[]>(propsBills || [])
  const [isLoading, setIsLoading] = useState(!propsBills)

  useEffect(() => {
    const fetchBills = async () => {
      if (propsBills || !user) {
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        const effectiveUserId = isViewingAsUser ? 2 : user.id
        const response = await fetch("/api/recurring-bills", {
          headers: {
            "x-user-id": String(effectiveUserId),
            "x-user-role": user.role || "user",
          },
        })

        if (response.ok) {
          const data = await response.json()
          setBills(data)
        } else {
          setBills([])
        }
      } catch (error) {
        console.error("Error fetching bills:", error)
        setBills([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchBills()
  }, [user, isViewingAsUser, propsBills])

  // Calculate KPIs
  const kpis = useMemo(() => {
    const activeBills = bills.filter((bill) => bill.isActive)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Calculate total monthly amount (convert all frequencies to monthly equivalent)
    const monthlyTotal = activeBills.reduce((total, bill) => {
      let monthlyAmount = 0
      switch (bill.frequency) {
        case "daily":
          monthlyAmount = bill.amount * 30
          break
        case "weekly":
          monthlyAmount = bill.amount * 4.33
          break
        case "biweekly":
          monthlyAmount = bill.amount * 2.17
          break
        case "monthly":
          monthlyAmount = bill.amount
          break
        case "quarterly":
          monthlyAmount = bill.amount / 3
          break
        case "yearly":
          monthlyAmount = bill.amount / 12
          break
      }
      return total + monthlyAmount
    }, 0)

    // Count upcoming bills (due in next 30 days)
    const upcomingBills = activeBills.filter((bill) => {
      const dueDate = new Date(bill.nextDueDate)
      dueDate.setHours(0, 0, 0, 0)
      const diffTime = dueDate.getTime() - today.getTime()
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      return diffDays >= 0 && diffDays <= 30
    })

    // Count overdue bills
    const overdueBills = activeBills.filter((bill) => {
      const dueDate = new Date(bill.nextDueDate)
      dueDate.setHours(0, 0, 0, 0)
      return dueDate.getTime() < today.getTime()
    })

    // Count due soon (next 7 days)
    const dueSoonBills = activeBills.filter((bill) => {
      const dueDate = new Date(bill.nextDueDate)
      dueDate.setHours(0, 0, 0, 0)
      const diffTime = dueDate.getTime() - today.getTime()
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      return diffDays >= 0 && diffDays <= 7
    })

    return {
      totalMonthly: monthlyTotal,
      activeCount: activeBills.length,
      upcomingCount: upcomingBills.length,
      overdueCount: overdueBills.length,
      dueSoonCount: dueSoonBills.length,
    }
  }, [bills])

  // Prepare chart data by category
  const chartData = useMemo(() => {
    const categoryMap = new Map<string, number>()
    
    bills
      .filter((bill) => bill.isActive)
      .forEach((bill) => {
        let monthlyAmount = 0
        switch (bill.frequency) {
          case "daily":
            monthlyAmount = bill.amount * 30
            break
          case "weekly":
            monthlyAmount = bill.amount * 4.33
            break
          case "biweekly":
            monthlyAmount = bill.amount * 2.17
            break
          case "monthly":
            monthlyAmount = bill.amount
            break
          case "quarterly":
            monthlyAmount = bill.amount / 3
            break
          case "yearly":
            monthlyAmount = bill.amount / 12
            break
        }
        const current = categoryMap.get(bill.category) || 0
        categoryMap.set(bill.category, current + monthlyAmount)
      })

    return Array.from(categoryMap.entries())
      .map(([category, amount]) => ({
        category,
        amount: Math.round(amount),
      }))
      .sort((a, b) => b.amount - a.amount)
  }, [bills])

  const chartColors = [
    "#4E79A7", // Blue
    "#F28E2C", // Orange
    "#59A14F", // Green
    "#E15759", // Red
    "#AF58BA", // Purple
    "#76B7B2", // Teal
    "#EDC949", // Yellow
    "#FF9D9A", // Pink
  ]

  const chartConfig = useMemo(() => {
    const config: Record<string, { label: string; color: string }> = {}
    chartData.forEach((item, index) => {
      config[item.category] = {
        label: item.category,
        color: chartColors[index % chartColors.length],
      }
    })
    return config
  }, [chartData])

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recurring Bills Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">Loading bills...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recurring Bills Overview</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* KPI Metrics */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <DollarSign className="h-4 w-4" />
              <span>Monthly Total</span>
            </div>
            <div className="text-2xl font-bold text-foreground">
              C${(kpis.totalMonthly / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Repeat className="h-4 w-4" />
              <span>Active Bills</span>
            </div>
            <div className="text-2xl font-bold text-foreground">{kpis.activeCount}</div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>Upcoming (30 days)</span>
            </div>
            <div className="text-2xl font-bold text-foreground">{kpis.upcomingCount}</div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <AlertCircle className="h-4 w-4" />
              <span>Overdue</span>
            </div>
            <div className="text-2xl font-bold text-destructive">{kpis.overdueCount}</div>
          </div>
        </div>

        {/* Alerts */}
        {kpis.overdueCount > 0 && (
          <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3">
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4" />
              <span className="font-medium">{kpis.overdueCount} bill{kpis.overdueCount !== 1 ? "s" : ""} overdue</span>
            </div>
          </div>
        )}

        {kpis.dueSoonCount > 0 && kpis.overdueCount === 0 && (
          <div className="rounded-lg bg-orange-500/10 border border-orange-500/20 p-3">
            <div className="flex items-center gap-2 text-sm text-orange-500">
              <Calendar className="h-4 w-4" />
              <span className="font-medium">{kpis.dueSoonCount} bill{kpis.dueSoonCount !== 1 ? "s" : ""} due in next 7 days</span>
            </div>
          </div>
        )}

        {/* Chart */}
        {chartData.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-foreground mb-3">Monthly Amount by Category</h4>
            <ChartContainer
              config={chartConfig}
              className="h-32 w-full"
            >
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis
                  dataKey="category"
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
                  tickFormatter={(value) => `C$${Math.round(value / 100)}`}
                />
                <ChartTooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0]?.payload
                      return (
                        <div className="border-border/50 bg-background rounded-lg border px-3 py-2 shadow-lg">
                          <div className="font-medium text-sm mb-1">{data.category}</div>
                          <div className="text-xs text-muted-foreground">
                            Monthly: C${((data.amount as number) / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </div>
                        </div>
                      )
                    }
                    return null
                  }}
                />
                <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

