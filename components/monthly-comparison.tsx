"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Area, AreaChart, XAxis, YAxis } from "recharts"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart"
import { useAuth } from "@/contexts/auth-context"
import { average, sum } from "@/lib/utils"
import { getCurrentDateInToronto } from "@/lib/utils/date"
import { AlertCircle } from "lucide-react"
import type { Transaction, BudgetCategory } from "@/lib/types"

export function MonthlyComparison() {
  const { user, isViewingAsUser } = useAuth()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [budgetCategories, setBudgetCategories] = useState<BudgetCategory[]>([])
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

        const [transactionsRes, budgetCategoriesRes] = await Promise.all([
          fetch("/api/transactions", { headers }),
          fetch("/api/budget-categories", { headers }),
        ])

        if (transactionsRes.ok) {
          const data = await transactionsRes.json()
          setTransactions(data)
        }
        if (budgetCategoriesRes.ok) {
          const data = await budgetCategoriesRes.json()
          setBudgetCategories(data)
        }
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [user, isViewingAsUser])

  // Calculate monthly spending data from transactions
  const { data, categoryData, totalBudget } = useMemo(() => {
    if (transactions.length === 0 || budgetCategories.length === 0) {
      return { data: [], categoryData: [], totalBudget: 0 }
    }

    // Use Toronto timezone for current date calculations
    const now = getCurrentDateInToronto()
    const months: string[] = []
    const monthData: Record<string, number> = {}
    const categoryMonthData: Record<string, Record<string, number>> = {}

    // Get last 6 months
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthKey = date.toLocaleDateString("en-US", { month: "short", year: "numeric" })
      months.push(monthKey)
      monthData[monthKey] = 0
      categoryMonthData[monthKey] = {}
    }

    // Process transactions
    transactions
      .filter((t) => {
        // Only count completed expenses (or expenses with no status, which default to completed)
        return t.type === "expense" && (t.status === "completed" || !t.status)
      })
      .forEach((t) => {
        // Handle different date formats (similar to budget-overview)
        let txnDate: Date
        try {
          // Try parsing as ISO string first (YYYY-MM-DD)
          if (t.date && typeof t.date === "string" && t.date.match(/^\d{4}-\d{2}-\d{2}$/)) {
            txnDate = new Date(t.date + "T00:00:00") // Add time to avoid timezone issues
          } else {
            txnDate = new Date(t.date)
          }
          
          // Check if date is valid
          if (isNaN(txnDate.getTime())) {
            console.warn(`Invalid transaction date: ${t.date} for transaction ${t.id}`)
            return
          }
        } catch (error) {
          console.warn(`Error parsing transaction date: ${t.date} for transaction ${t.id}`, error)
          return
        }
        
        const monthKey = txnDate.toLocaleDateString("en-US", { month: "short", year: "numeric" })
        
        if (months.includes(monthKey)) {
          monthData[monthKey] = (monthData[monthKey] || 0) + t.amount
          
          if (t.budgetCategoryId) {
            const category = budgetCategories.find((c) => c.id === t.budgetCategoryId)
            if (category) {
              if (!categoryMonthData[monthKey][category.name]) {
                categoryMonthData[monthKey][category.name] = 0
              }
              categoryMonthData[monthKey][category.name] += t.amount
            }
          }
        }
      })

    const data = months.map((month) => ({
      month,
      amount: monthData[month] || 0,
    }))

    const categoryData = months.map((month) => ({
      month,
      ...categoryMonthData[month],
    }))

    const totalBudget = budgetCategories.reduce((sum, cat) => sum + cat.budget, 0)

    return { data, categoryData, totalBudget }
  }, [transactions, budgetCategories])

  // Tableau-inspired colors for categories (assign colors to actual categories)
  const colorPalette = [
    "#4E79A7", // Blue
    "#F28E2C", // Orange
    "#AF58BA", // Purple
    "#59A14F", // Green
    "#E15759", // Red
    "#76B7B2", // Teal
    "#EDC949", // Yellow
    "#FF9D9A", // Pink
  ]

  const categoryColors: Record<string, string> = useMemo(() => {
    const colors: Record<string, string> = {}
    budgetCategories.forEach((cat, index) => {
      colors[cat.name] = cat.color || colorPalette[index % colorPalette.length]
    })
    return colors
  }, [budgetCategories])

  // Get budget for each category
  const categoryBudgets: Record<string, number> = useMemo(() => {
    const budgets: Record<string, number> = {}
    budgetCategories.forEach((cat) => {
      budgets[cat.name] = cat.budget
    })
    return budgets
  }, [budgetCategories])

  // Calculate total spending per month from category data (only budget category expenses)
  const monthlyTotals = useMemo(() => {
    return categoryData.map((month) => {
      const total = Object.keys(categoryColors).reduce((sum, category) => {
        const value = month[category as keyof typeof month]
        // Skip if value is the month string or undefined, otherwise treat as number
        if (value === month.month || value === undefined) return sum
        return sum + (typeof value === "number" ? value : 0)
      }, 0)
      return {
        month: month.month,
        total,
      }
    })
  }, [categoryData, categoryColors])

  // Use monthlyTotals (budget category spending only) for summary stats to match the graph
  const avgSpending = monthlyTotals.length > 0 
    ? Math.round(average(monthlyTotals.map((d) => d.total))) 
    : 0
  const highestMonth = monthlyTotals.length > 0 
    ? monthlyTotals.reduce((max, curr) => (curr.total > max.total ? curr : max)) 
    : { month: "", total: 0 }
  const lowestMonth = monthlyTotals.length > 0 
    ? monthlyTotals.reduce((min, curr) => (curr.total < min.total ? curr : min)) 
    : { month: "", total: 0 }

  // Helper function to generate gradient ID
  const getGradientId = (category: string) => {
    return `color${category.replace(/\s+/g, "").replace(/&/g, "")}`
  }

  // Convert spending data to percentages vs budget
  const percentageData = useMemo(() => {
    if (categoryData.length === 0) return []
    return categoryData.map((month) => {
      const result: Record<string, number | string> = { month: month.month }
      Object.keys(categoryColors).forEach((category) => {
        const value = month[category as keyof typeof month]
        // Ensure we're working with a number, not the month string
        const spending = typeof value === "number" ? value : 0
        const budget = categoryBudgets[category] || 0
        const percentage = budget > 0 ? (spending / budget) * 100 : 0
        result[category] = Math.round(percentage * 100) / 100 // Round to 2 decimal places
      })
      return result
    })
  }, [categoryData, categoryBudgets, categoryColors])

  // Get months that exceeded budget
  const exceededBudgetMonths = useMemo(() => {
    return monthlyTotals.filter((item) => item.total > totalBudget)
  }, [monthlyTotals, totalBudget])

  // Create config for chart with category colors
  const chartConfig = useMemo(() => {
    const config: Record<string, { label: string; color: string }> = {}
    // Add each category to config
    Object.keys(categoryColors).forEach((category) => {
      config[category] = {
        label: category,
        color: categoryColors[category],
      }
    })
    return config
  }, [categoryColors])

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Monthly Spending</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">Loading monthly data...</div>
        </CardContent>
      </Card>
    )
  }

  if (data.length === 0 || budgetCategories.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Monthly Spending</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">No data available. Add transactions and budget categories to see monthly comparisons.</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Monthly Spending</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={chartConfig}
          className="h-80 w-full"
        >
          <AreaChart data={percentageData} margin={{ top: 20, right: 20, left: 20, bottom: 20 }}>
            <defs>
              {Object.keys(categoryColors).map((category) => (
                <linearGradient key={category} id={getGradientId(category)} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={categoryColors[category]} stopOpacity={0.8} />
                  <stop offset="95%" stopColor={categoryColors[category]} stopOpacity={0.1} />
                </linearGradient>
              ))}
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
              tickFormatter={(value) => `${value}%`}
            />
            <ChartTooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="border-border/50 bg-background rounded-lg border px-3 py-2 shadow-lg">
                      <div className="font-medium text-sm mb-2">{payload[0]?.payload.month}</div>
                      <div className="space-y-1">
                        {payload.map((entry: any, index: number) => {
                          const category = entry.dataKey as string
                          const percentage = entry.value as number
                          const exceedsBudget = percentage > 100
                          return (
                            <div key={index} className="flex items-center justify-between gap-4 text-xs">
                              <div className="flex items-center gap-2">
                                <div
                                  className="h-2 w-2 rounded-full"
                                  style={{ backgroundColor: entry.color }}
                                />
                                <span className={exceedsBudget ? "text-destructive font-medium" : "text-muted-foreground"}>
                                  {category}
                                </span>
                              </div>
                              <span className={exceedsBudget ? "font-medium text-destructive" : "font-medium"}>
                                {percentage.toFixed(1)}%
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                }
                return null
              }}
            />
            <ChartLegend
              content={(props: any) => <ChartLegendContent {...props} verticalAlign="top" align="right" />}
              verticalAlign="top"
              align="right"
              wrapperStyle={{ paddingTop: "10px" }}
            />
            {Object.keys(categoryColors).map((category) => (
              <Area
                key={category}
                type="monotone"
                dataKey={category}
                stackId="1"
                stroke={categoryColors[category]}
                fill={`url(#${getGradientId(category)})`}
              />
            ))}
          </AreaChart>
        </ChartContainer>

        <div className="mt-6 space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Average vs Budget</span>
            <span className="font-medium text-foreground">
              {((avgSpending / totalBudget) * 100).toFixed(1)}%
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Highest month</span>
            <span className="font-medium text-foreground">
              {highestMonth.month} - {((highestMonth.total / totalBudget) * 100).toFixed(1)}%
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Lowest month</span>
            <span className="font-medium text-foreground">
              {lowestMonth.month} - {((lowestMonth.total / totalBudget) * 100).toFixed(1)}%
            </span>
          </div>
          {exceededBudgetMonths.length > 0 && (
            <div className="mt-4 pt-3 border-t border-border">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="h-4 w-4 text-destructive" />
                <span className="text-sm font-medium text-foreground">Budget Exceeded</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {exceededBudgetMonths.map((month) => (
                  <Badge
                    key={month.month}
                    variant="destructive"
                    className="text-xs"
                  >
                    {month.month}: {((month.total / totalBudget) * 100).toFixed(1)}%
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
