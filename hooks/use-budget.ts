"use client"

import { useMemo } from "react"
import type { BudgetCategory } from "@/lib/types"
import { calculatePercentage, isBudgetExceeded } from "@/lib/utils"

interface UseBudgetProps {
  categories: BudgetCategory[]
}

export function useBudget({ categories }: UseBudgetProps) {
  const budgetAnalysis = useMemo(() => {
    const totalBudget = categories.reduce((sum, cat) => sum + cat.budget, 0)
    const totalSpent = categories.reduce((sum, cat) => sum + cat.spent, 0)
    const remaining = totalBudget - totalSpent
    const percentageUsed = calculatePercentage(totalSpent, totalBudget)

    const categoriesWithAnalysis = categories.map((category) => ({
      ...category,
      percentage: calculatePercentage(category.spent, category.budget),
      isOverBudget: isBudgetExceeded(category.spent, category.budget),
      exceeded: Math.max(0, category.spent - category.budget),
    }))

    const overBudgetCategories = categoriesWithAnalysis.filter((cat) => cat.isOverBudget)

    return {
      totalBudget,
      totalSpent,
      remaining,
      percentageUsed,
      categories: categoriesWithAnalysis,
      overBudgetCategories,
      isOverBudget: remaining < 0,
    }
  }, [categories])

  return budgetAnalysis
}
