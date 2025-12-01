import { Card, CardContent } from "@/components/ui/card"
import { ArrowUpRight, ArrowDownRight } from "lucide-react"
import { cn } from "@/lib/utils"
import type { MetricCardData } from "@/lib/types"

export function MetricCard({ title, value, change, changeType, subtitle }: MetricCardData) {
  const isPositive = changeType === "positive"
  const changeLabel = isPositive ? "increase" : "decrease"
  
  return (
    <Card className="transition-shadow hover:shadow-md focus-within:ring-2 focus-within:ring-ring">
      <CardContent className="p-4 sm:p-6">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-2xl font-bold text-card-foreground sm:text-3xl">{value}</h3>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span
              className={cn(
                "inline-flex items-center gap-1 font-medium",
                isPositive ? "text-success" : "text-destructive",
              )}
              aria-label={`${change} ${changeLabel} ${subtitle}`}
            >
              {isPositive ? (
                <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
              ) : (
                <ArrowDownRight className="h-4 w-4" aria-hidden="true" />
              )}
              {change}
            </span>
            <span className="text-muted-foreground">{subtitle}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
