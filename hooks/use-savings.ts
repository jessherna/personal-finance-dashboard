"use client"

import { useMemo } from "react"
import type { SavingsGoal } from "@/lib/types"
import { calculateSavingsProgress } from "@/lib/utils"

interface UseSavingsProps {
  goals: SavingsGoal[]
}

export function useSavings({ goals }: UseSavingsProps) {
  const savingsAnalysis = useMemo(() => {
    const totalSaved = goals.reduce((sum, goal) => sum + goal.current, 0)
    const totalTarget = goals.reduce((sum, goal) => sum + goal.target, 0)

    const goalsWithProgress = goals.map((goal) => ({
      ...goal,
      progress: calculateSavingsProgress(goal.current, goal.target),
    }))

    const completedGoals = goalsWithProgress.filter((goal) => goal.progress.isComplete)
    const activeGoals = goalsWithProgress.filter((goal) => !goal.progress.isComplete)

    const overallPercentage = calculateSavingsProgress(totalSaved, totalTarget).percentage

    return {
      totalSaved,
      totalTarget,
      overallPercentage,
      goals: goalsWithProgress,
      completedGoals,
      activeGoals,
      activeGoalsCount: activeGoals.length,
      completedGoalsCount: completedGoals.length,
    }
  }, [goals])

  return savingsAnalysis
}
