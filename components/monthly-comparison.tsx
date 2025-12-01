"use client"

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
import { mockMonthlySpending, mockMonthlySpendingByCategory, mockBudgetOverview, mockBudgetCategories } from "@/lib/data/budget"
import { average, sum } from "@/lib/utils"
import { useMemo } from "react"
import { AlertCircle } from "lucide-react"

export function MonthlyComparison() {
  const data = mockMonthlySpending
  const categoryData = mockMonthlySpendingByCategory
  const avgSpending = Math.round(average(data.map((d) => d.amount)))
  const totalBudget = mockBudgetOverview.totalBudget
  const highestMonth = data.reduce((max, curr) => (curr.amount > max.amount ? curr : max))
  const lowestMonth = data.reduce((min, curr) => (curr.amount < min.amount ? curr : min))

  // Tableau-inspired colors for categories
  const categoryColors: Record<string, string> = {
    Transportation: "#4E79A7", // Blue
    "Food & Dining": "#F28E2C", // Orange
    Subscriptions: "#AF58BA", // Purple
    "Rent & Utilities": "#59A14F", // Green
    Entertainment: "#E15759", // Red
  }

  // Get budget for each category
  const categoryBudgets: Record<string, number> = {
    Transportation: mockBudgetCategories.find((c) => c.name === "Transportation")?.budget || 45000,
    "Food & Dining": mockBudgetCategories.find((c) => c.name === "Food & Dining")?.budget || 75000,
    Subscriptions: mockBudgetCategories.find((c) => c.name === "Subscriptions")?.budget || 30000,
    "Rent & Utilities": mockBudgetCategories.find((c) => c.name === "Rent & Utilities")?.budget || 60000,
    Entertainment: mockBudgetCategories.find((c) => c.name === "Entertainment")?.budget || 30000,
  }

  // Helper function to generate gradient ID
  const getGradientId = (category: string) => {
    return `color${category.replace(/\s+/g, "").replace(/&/g, "")}`
  }

  // Convert spending data to percentages vs budget
  const percentageData = useMemo(() => {
    return categoryData.map((month) => {
      const result: Record<string, number | string> = { month: month.month }
      Object.keys(categoryColors).forEach((category) => {
        const spending = month[category as keyof typeof month] as number
        const budget = categoryBudgets[category]
        const percentage = budget > 0 ? (spending / budget) * 100 : 0
        result[category] = Math.round(percentage * 100) / 100 // Round to 2 decimal places
      })
      return result
    })
  }, [categoryData, categoryBudgets])

  // Calculate total spending per month from category data
  const monthlyTotals = useMemo(() => {
    return categoryData.map((month) => ({
      month: month.month,
      total: sum([
        month.Transportation,
        month["Food & Dining"],
        month.Subscriptions,
        month["Rent & Utilities"],
        month.Entertainment,
      ]),
    }))
  }, [categoryData])

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
  }, [])

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
            <Area
              type="monotone"
              dataKey="Transportation"
              stackId="1"
              stroke={categoryColors.Transportation}
              fill={`url(#${getGradientId("Transportation")})`}
            />
            <Area
              type="monotone"
              dataKey="Food & Dining"
              stackId="1"
              stroke={categoryColors["Food & Dining"]}
              fill={`url(#${getGradientId("Food & Dining")})`}
            />
            <Area
              type="monotone"
              dataKey="Subscriptions"
              stackId="1"
              stroke={categoryColors.Subscriptions}
              fill={`url(#${getGradientId("Subscriptions")})`}
            />
            <Area
              type="monotone"
              dataKey="Rent & Utilities"
              stackId="1"
              stroke={categoryColors["Rent & Utilities"]}
              fill={`url(#${getGradientId("Rent & Utilities")})`}
            />
            <Area
              type="monotone"
              dataKey="Entertainment"
              stackId="1"
              stroke={categoryColors.Entertainment}
              fill={`url(#${getGradientId("Entertainment")})`}
            />
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
              {highestMonth.month} - {((highestMonth.amount / totalBudget) * 100).toFixed(1)}%
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Lowest month</span>
            <span className="font-medium text-foreground">
              {lowestMonth.month} - {((lowestMonth.amount / totalBudget) * 100).toFixed(1)}%
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
