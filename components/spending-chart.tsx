"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table"
import { Cell, Pie, PieChart } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useChartPeriod } from "@/hooks/use-chart-period"
import { useAuth } from "@/contexts/auth-context"
import { sum } from "@/lib/utils"
import { getCurrentDateInToronto } from "@/lib/utils/date"
import { formatCurrencyFromCents } from "@/lib/utils/format"
import type { Transaction } from "@/lib/types"

export function SpendingChart() {
  const { user, isViewingAsUser } = useAuth()
  const { period, setPeriod } = useChartPeriod("all")
  const [transactions, setTransactions] = useState<Transaction[]>([])
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
        
        const [transactionsRes, accountsRes] = await Promise.all([
          fetch("/api/transactions", { headers }),
          fetch("/api/accounts", { headers }),
        ])

        if (transactionsRes.ok) {
          const data = await transactionsRes.json()
          setTransactions(data)
        } else {
          setTransactions([])
        }
        
        if (accountsRes.ok) {
          const accountsData = await accountsRes.json()
          setAccounts(accountsData)
        } else {
          setAccounts([])
        }
      } catch (error) {
        console.error("Error fetching data:", error)
        setTransactions([])
        setAccounts([])
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
  
  // Calculate spending data from transactions based on period
  const spendingData = useMemo(() => {
    if (transactions.length === 0) return []
    
    // Filter by expense type (including credit card payments)
    let expenseTransactions = transactions.filter((t) => isEffectiveExpense(t))
    
    // If no expense transactions, return empty
    if (expenseTransactions.length === 0) return []
    
    // Use Toronto timezone for current date calculations
    const now = getCurrentDateInToronto()
    let startDate: Date | null = null
    
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
        // For "all" or unknown period, don't filter by date
        startDate = null
    }
    
    const filteredTransactions = expenseTransactions.filter((t) => {
      // If no date filter, include all expense transactions
      if (startDate === null) return true
      
      // Parse date - handle various formats
      let txnDate: Date
      try {
        txnDate = new Date(t.date)
        // If date is invalid, exclude the transaction
        if (isNaN(txnDate.getTime())) {
          return false
        }
      } catch {
        return false
      }
      return txnDate >= startDate
    })
    
    // Group by category
    const categoryMap = new Map<string, number>()
    filteredTransactions.forEach((t) => {
      const current = categoryMap.get(t.category) || 0
      categoryMap.set(t.category, current + t.amount)
    })
    
    return Array.from(categoryMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
  }, [transactions, period, accounts])
  
  const totalExpense = spendingData.length > 0 ? sum(spendingData.map((item) => item.value)) : 0

  // Tableau-inspired vibrant colors for the pie chart
  const chartColors = [
    "#4E79A7", // Blue - Transportation
    "#F28E2C", // Orange - Food
    "#AF58BA", // Purple - Subscription
    "#59A14F", // Green - Rent
    "#E15759", // Red - Miscellaneous
  ]

  // Map data with actual colors and calculate percentages
  const dataWithColors = useMemo(() => {
    return spendingData.map((item, index) => ({
      ...item,
      color: chartColors[index],
      percentage: ((item.value / totalExpense) * 100).toFixed(0),
    }))
  }, [spendingData, totalExpense])

  return (
    <Card>
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle>Spending Breakdown</CardTitle>
        <Select value={period} onValueChange={(value: any) => setPeriod(value)}>
          <SelectTrigger className="w-full sm:w-32" aria-label="Select time period">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Time</SelectItem>
            <SelectItem value="weekly">Weekly</SelectItem>
            <SelectItem value="monthly">Monthly</SelectItem>
            <SelectItem value="yearly">Yearly</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="overflow-hidden">
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Loading spending data...</div>
        ) : spendingData.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">No spending data available</div>
        ) : (
          <div className="flex flex-col items-center gap-6">
            {/* Pie Chart - On top */}
            <div className="relative h-64 w-64 sm:h-72 sm:w-72 lg:h-80 lg:w-80 flex-shrink-0">
              <ChartContainer
                config={{
                  transportation: { label: "Transportation", color: chartColors[0] },
                  food: { label: "Food", color: chartColors[1] },
                  subscription: { label: "Subscription", color: chartColors[2] },
                  rent: { label: "Rent", color: chartColors[3] },
                  miscellaneous: { label: "Miscellaneous", color: chartColors[4] },
                }}
                className="w-full h-full"
              >
                <PieChart>
                  <Pie
                    data={dataWithColors}
                    cx="50%"
                    cy="50%"
                    innerRadius="45%"
                    outerRadius="70%"
                    paddingAngle={2}
                    dataKey="value"
                    stroke="hsl(var(--background))"
                    strokeWidth={2}
                  >
                    {dataWithColors.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <ChartTooltip
                    content={({ active, payload }) => {
                      if (!active || !payload || !payload.length) return null
                      
                      const data = payload[0]?.payload
                      if (!data) return null

                      return (
                        <div className="border-border/50 bg-background rounded-lg border px-3 py-2 shadow-xl z-50">
                          <div className="flex items-center gap-2 mb-2">
                            <div
                              className="h-3 w-3 rounded-full"
                              style={{ backgroundColor: data.color }}
                            />
                            <span className="font-medium text-sm">{data.name}</span>
                          </div>
                          <div className="space-y-1 text-xs">
                            <div className="flex justify-between gap-4">
                              <span className="text-muted-foreground">Amount:</span>
                              <span className="font-mono font-medium tabular-nums">
                                {formatCurrencyFromCents(data.value)}
                              </span>
                            </div>
                            <div className="flex justify-between gap-4">
                              <span className="text-muted-foreground">Percentage:</span>
                              <span className="font-mono font-medium tabular-nums">
                                {data.percentage}%
                              </span>
                            </div>
                          </div>
                        </div>
                      )
                    }}
                    wrapperStyle={{ zIndex: 50 }}
                  />
                </PieChart>
              </ChartContainer>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center pointer-events-none" style={{ width: '45%', maxWidth: '45%' }}>
                <div className="text-[10px] sm:text-xs text-muted-foreground text-center leading-tight whitespace-nowrap">Total Expense</div>
                <div className="text-xs sm:text-sm lg:text-base font-bold text-center leading-tight mt-0.5 break-words px-1">
                  {formatCurrencyFromCents(totalExpense)}
                </div>
              </div>
            </div>

            {/* Legend Table - Below the pie chart */}
            <div className="w-full max-w-md">
              <Table>
                <TableBody>
                  {dataWithColors.map((item, index) => (
                    <TableRow 
                      key={`${period}-${item.name}-${index}`}
                      className="border-0 hover:bg-muted/30"
                    >
                      <TableCell className="py-2 px-4 border-0">
                        <div className="flex items-center gap-3">
                          <div
                            className="h-4 w-4 rounded-full flex-shrink-0"
                            style={{ backgroundColor: item.color }}
                            aria-hidden="true"
                          />
                          <span className="text-sm font-medium text-foreground">{item.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-2 px-4 border-0 text-right">
                        <span className="text-sm font-medium text-foreground">{item.percentage}%</span>
                      </TableCell>
                      <TableCell className="py-2 px-4 border-0 text-right">
                        <span className="text-sm text-muted-foreground">
                          {formatCurrencyFromCents(item.value)}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
