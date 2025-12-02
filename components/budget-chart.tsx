"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useChartPeriod } from "@/hooks/use-chart-period"
import { useAuth } from "@/contexts/auth-context"
import { getCurrentDateInToronto } from "@/lib/utils/date"
import { formatCurrencyFromCents } from "@/lib/utils/format"
import type { Transaction, BudgetCategory } from "@/lib/types"

export function BudgetChart() {
  const { user, isViewingAsUser } = useAuth()
  const { period, setPeriod } = useChartPeriod()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [budgetCategories, setBudgetCategories] = useState<BudgetCategory[]>([])
  const [accounts, setAccounts] = useState<any[]>([])
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

        const [transactionsRes, budgetRes, accountsRes] = await Promise.all([
          fetch("/api/transactions", { headers }),
          fetch("/api/budget-categories", { headers }),
          fetch("/api/accounts", { headers }),
        ])

        if (transactionsRes.ok) {
          const data = await transactionsRes.json()
          setTransactions(data)
        }
        if (budgetRes.ok) {
          const data = await budgetRes.json()
          setBudgetCategories(data)
        }
        if (accountsRes.ok) {
          const data = await accountsRes.json()
          setAccounts(data)
        }
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [user, isViewingAsUser])
  
  // Helper function to check if transaction is effectively an expense
  // Credit card payments (income to credit cards) should be treated as expenses
  const isEffectiveExpense = (t: Transaction): boolean => {
    if (t.type === "expense") return true
    // Income transactions to credit cards are actually payments (expenses)
    if (t.type === "income" && t.accountId) {
      const account = accounts.find((acc: any) => acc.id === t.accountId)
      return account?.type === "credit_card"
    }
    return false
  }
  
  // Calculate budget vs expense data from transactions and budget categories
  const data = useMemo(() => {
    if (transactions.length === 0 || budgetCategories.length === 0) return []
    
    // Use Toronto timezone for current date calculations
    const now = getCurrentDateInToronto()
    let startDate: Date
    
    switch (period) {
      case "weekly":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case "monthly":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        break
      case "yearly":
        startDate = new Date(now.getFullYear(), 0, 1)
        break
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
    }
    
    const filteredTransactions = transactions.filter((t) => {
      const txnDate = new Date(t.date)
      return txnDate >= startDate && isEffectiveExpense(t) && t.budgetCategoryId
    })
    
    return budgetCategories.map((category) => {
      const expenses = filteredTransactions
        .filter((t) => t.budgetCategoryId === category.id)
        .reduce((sum, t) => sum + t.amount, 0)
      
      return {
        category: category.name,
        budget: category.budget,
        expense: expenses,
      }
    })
  }, [transactions, budgetCategories, period, accounts])

  // Tableau-inspired colors for Budget vs Expense
  const budgetColor = "#4E79A7" // Blue - represents planned/budget
  const expenseColor = "#F28E2C" // Orange - represents actual spending

  return (
    <Card>
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle>Budget vs Expense</CardTitle>
        <Select value={period} onValueChange={(value: any) => setPeriod(value)}>
          <SelectTrigger className="w-full sm:w-32" aria-label="Select time period">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="weekly">Weekly</SelectItem>
            <SelectItem value="monthly">Monthly</SelectItem>
            <SelectItem value="yearly">Yearly</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Loading budget data...</div>
        ) : data.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">No budget data available</div>
        ) : (
          <ChartContainer
          config={{
            budget: {
              label: "Budget",
              color: budgetColor,
            },
            expense: {
              label: "Expense",
              color: expenseColor,
            },
          }}
          className="h-64 sm:h-80 w-full"
          aria-label="Budget vs Expense comparison chart"
        >
          <BarChart data={data} margin={{ top: 20, right: 20, left: 20, bottom: 20 }}>
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
              tickFormatter={(value) => `C$${value / 1000}k`}
            />
            <ChartTooltip
              content={({ active, payload }) => {
                if (!active || !payload || !payload.length) return null
                
                const data = payload[0]?.payload
                if (!data) return null

                return (
                  <div className="border-border/50 bg-background rounded-lg border px-3 py-2 shadow-lg">
                    <div className="font-medium text-sm mb-2">{data.category}</div>
                    <div className="space-y-1">
                      {payload.map((entry: any, index: number) => {
                        const value = entry.value as number
                        const label = entry.name === "budget" ? "Budget" : "Expense"
                        const color = entry.color
                        
                        return (
                          <div key={index} className="flex items-center justify-between gap-4 text-xs">
                            <div className="flex items-center gap-2">
                              <div
                                className="h-2 w-2 rounded-full"
                                style={{ backgroundColor: color }}
                              />
                              <span className="text-muted-foreground">{label}</span>
                            </div>
                            <span className="font-medium">
                              {formatCurrencyFromCents(value)}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              }}
            />
            <ChartLegend content={<ChartLegendContent payload={[]} />} />
            <Bar dataKey="budget" fill={budgetColor} radius={[4, 4, 0, 0]} />
            <Bar dataKey="expense" fill={expenseColor} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}
