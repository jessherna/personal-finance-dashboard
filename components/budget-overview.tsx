"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { TrendingDown, TrendingUp, AlertCircle } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { getCurrentDateInToronto } from "@/lib/utils/date"
import { formatCurrencyFromCents } from "@/lib/utils/format"
import type { Transaction, BudgetCategory } from "@/lib/types"

export function BudgetOverview() {
  const { user, isViewingAsUser } = useAuth()
  const [overview, setOverview] = useState({
    totalBudget: 0,
    totalSpent: 0,
    remaining: 0,
    percentageUsed: 0,
  })
  const [isLoading, setIsLoading] = useState(true)
  const isOverBudget = overview.remaining < 0

  useEffect(() => {
    const fetchOverview = async () => {
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

        if (transactionsRes.ok && budgetCategoriesRes.ok) {
          const transactions: Transaction[] = await transactionsRes.json()
          const budgetCategories: BudgetCategory[] = await budgetCategoriesRes.json()

          // Use Toronto timezone for current date calculations
          const now = getCurrentDateInToronto()
          const currentMonth = now.getMonth()
          const currentYear = now.getFullYear()

          // Calculate total budget
          const totalBudget = budgetCategories.reduce((sum, cat) => sum + cat.budget, 0)

          // Calculate total spent this month from transactions
          const monthlyTransactions = transactions.filter((t) => {
            // Handle different date formats
            let txnDate: Date
            try {
              // Try parsing as ISO string first (YYYY-MM-DD)
              if (t.date.match(/^\d{4}-\d{2}-\d{2}$/)) {
                txnDate = new Date(t.date + "T00:00:00") // Add time to avoid timezone issues
              } else {
                // Try parsing as regular date string
                txnDate = new Date(t.date)
              }
              
              // Check if date is valid
              if (isNaN(txnDate.getTime())) {
                console.warn(`Invalid transaction date: ${t.date} for transaction ${t.id}`)
                return false
              }
              
              return (
                txnDate.getMonth() === currentMonth &&
                txnDate.getFullYear() === currentYear &&
                t.type === "expense" &&
                (t.status === "completed" || !t.status)
              )
            } catch (error) {
              console.warn(`Error parsing transaction date: ${t.date} for transaction ${t.id}`, error)
              return false
            }
          })

          // Calculate spent per budget category
          const spentByCategory = new Map<number, number>()
          monthlyTransactions.forEach((t) => {
            if (t.budgetCategoryId) {
              const current = spentByCategory.get(t.budgetCategoryId) || 0
              spentByCategory.set(t.budgetCategoryId, current + t.amount)
            }
          })

          // Update budget categories with actual spent amounts
          const updatedCategories = budgetCategories.map((cat) => {
            const spent = spentByCategory.get(cat.id) || 0
            return { ...cat, spent }
          })

          // Calculate total spent
          const totalSpent = updatedCategories.reduce((sum, cat) => sum + cat.spent, 0)
          const remaining = totalBudget - totalSpent
          const percentageUsed = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0

          setOverview({
            totalBudget,
            totalSpent,
            remaining,
            percentageUsed: Math.round(percentageUsed * 100) / 100,
          })
        }
      } catch (error) {
        console.error("Error fetching budget overview:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchOverview()
  }, [user, isViewingAsUser])

  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="text-center py-4 text-muted-foreground">Loading...</div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid gap-6 md:grid-cols-3">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Total Budget</p>
              <p className="text-2xl font-bold text-foreground">{formatCurrencyFromCents(overview.totalBudget)}</p>
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
              <p className="text-2xl font-bold text-foreground">{formatCurrencyFromCents(overview.totalSpent)}</p>
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
                {isOverBudget ? "-" : "+"}{formatCurrencyFromCents(Math.abs(overview.remaining))}
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
