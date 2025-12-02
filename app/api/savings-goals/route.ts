import { NextResponse } from "next/server"
import { getDBConnection } from "@/lib/db/mongodb"
import { createSavingsGoalModel } from "@/lib/models/Savings"

// GET /api/savings-goals - Get all savings goals for a user
export async function GET(request: Request) {
  try {
    const userId = parseInt(request.headers.get("x-user-id") || "0", 10)
    const userRole = request.headers.get("x-user-role") as "user" | "dev" | "admin" | null

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const connection = await getDBConnection(userRole || undefined)
    const SavingsGoalModel = createSavingsGoalModel(connection)

    const savingsGoals = await SavingsGoalModel.find({ userId }).lean().exec()

    // Map icon string to component (for now, return as string - components can handle it)
    const formattedGoals = savingsGoals.map((goal: any) => ({
      id: goal.id || goal._id,
      name: goal.name,
      icon: goal.icon, // String representation (emoji or component name)
      current: goal.current,
      target: goal.target,
      dueDate: goal.dueDate,
      color: goal.color,
      monthlyContribution: goal.monthlyContribution,
    }))

    return NextResponse.json(formattedGoals)
  } catch (error) {
    console.error("Get savings goals error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

