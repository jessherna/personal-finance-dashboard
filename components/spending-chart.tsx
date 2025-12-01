"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Cell, Pie, PieChart } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { mockSpendingDataWeekly, mockSpendingDataMonthly, mockSpendingDataYearly } from "@/lib/data/dashboard"
import { useChartPeriod } from "@/hooks/use-chart-period"
import { sum } from "@/lib/utils"
import { useMemo } from "react"

export function SpendingChart() {
  const { period, setPeriod } = useChartPeriod()
  
  // Get data based on selected period
  const spendingData = useMemo(() => {
    switch (period) {
      case "weekly":
        return mockSpendingDataWeekly
      case "monthly":
        return mockSpendingDataMonthly
      case "yearly":
        return mockSpendingDataYearly
      default:
        return mockSpendingDataMonthly
    }
  }, [period])
  
  const totalExpense = sum(spendingData.map((item) => item.value))

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
            <SelectItem value="weekly">Weekly</SelectItem>
            <SelectItem value="monthly">Monthly</SelectItem>
            <SelectItem value="yearly">Yearly</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start lg:gap-8">
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
                <ChartTooltip content={<ChartTooltipContent />} />
              </PieChart>
            </ChartContainer>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center pointer-events-none" style={{ width: '45%', maxWidth: '45%' }}>
              <div className="text-[10px] sm:text-xs text-muted-foreground text-center leading-tight whitespace-nowrap">Total Expense</div>
              <div className="text-xs sm:text-sm lg:text-base font-bold text-center leading-tight mt-0.5 break-words px-1">
                C${totalExpense.toLocaleString()}
              </div>
            </div>
          </div>

          <div className="flex-1 w-full sm:w-auto space-y-3">
            {dataWithColors.map((item, index) => (
              <div key={`${period}-${item.name}-${index}`} className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <div
                    className="h-3 w-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: item.color }}
                    aria-hidden="true"
                  />
                  <span className="text-sm text-foreground truncate">{item.name}</span>
                </div>
                <div className="text-sm font-medium text-foreground flex-shrink-0" aria-label={`${item.name}: ${item.percentage}%`}>
                  {item.percentage}%
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
