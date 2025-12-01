"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Area, AreaChart, XAxis, YAxis } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { mockSavingsGrowth, mockSavingsActivity } from "@/lib/data/savings"

export function SavingsHistory() {
  const data = mockSavingsGrowth
  const recentActivity = mockSavingsActivity

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Savings Growth</CardTitle>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {recentActivity.map((activity) => (
            <div key={activity.id} className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="text-sm font-medium text-foreground">{activity.action}</div>
                <div className="text-xs text-muted-foreground">{activity.date}</div>
              </div>
              {activity.amount > 0 && (
                <div className="text-sm font-semibold text-success">+C${activity.amount.toLocaleString()}</div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
