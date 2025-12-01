import { Card, CardContent } from "@/components/ui/card"
import { TrendingDown, TrendingUp, AlertCircle } from "lucide-react"
import { mockBudgetOverview } from "@/lib/data/budget"

export function BudgetOverview() {
  const overview = mockBudgetOverview
  const isOverBudget = overview.remaining < 0

  return (
    <div className="grid gap-6 md:grid-cols-3">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Total Budget</p>
              <p className="text-2xl font-bold text-foreground">C${overview.totalBudget.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">For this month</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <TrendingUp className="h-6 w-6 text-primary" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Total Spent</p>
              <p className="text-2xl font-bold text-foreground">C${overview.totalSpent.toLocaleString()}</p>
              <p className="text-sm text-destructive font-medium">{overview.percentageUsed}% of budget</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-destructive/10">
              <TrendingDown className="h-6 w-6 text-destructive" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className={isOverBudget ? "border-destructive" : ""}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Remaining</p>
              <p className={`text-2xl font-bold ${isOverBudget ? "text-destructive" : "text-success"}`}>
                {isOverBudget ? "-" : "+"}C${Math.abs(overview.remaining).toLocaleString()}
              </p>
              <p className="text-sm text-muted-foreground">{isOverBudget ? "Over budget" : "Under budget"}</p>
            </div>
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-lg ${isOverBudget ? "bg-destructive/10" : "bg-success/10"}`}
            >
              <AlertCircle className={`h-6 w-6 ${isOverBudget ? "text-destructive" : "text-success"}`} />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
