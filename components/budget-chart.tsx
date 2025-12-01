"use client"

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
import { mockBudgetVsExpenseWeekly, mockBudgetVsExpenseMonthly, mockBudgetVsExpenseYearly } from "@/lib/data/budget"
import { useChartPeriod } from "@/hooks/use-chart-period"
import { useMemo } from "react"

export function BudgetChart() {
  const { period, setPeriod } = useChartPeriod()
  
  // Get data based on selected period
  const data = useMemo(() => {
    switch (period) {
      case "weekly":
        return mockBudgetVsExpenseWeekly
      case "monthly":
        return mockBudgetVsExpenseMonthly
      case "yearly":
        return mockBudgetVsExpenseYearly
      default:
        return mockBudgetVsExpenseMonthly
    }
  }, [period])

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
            <ChartTooltip content={<ChartTooltipContent />} />
            <ChartLegend content={<ChartLegendContent />} />
            <Bar dataKey="budget" fill={budgetColor} radius={[4, 4, 0, 0]} />
            <Bar dataKey="expense" fill={expenseColor} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
