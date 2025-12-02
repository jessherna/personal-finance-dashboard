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

// POST /api/savings-goals - Create a new savings goal
export async function POST(request: Request) {
  try {
    const userId = parseInt(request.headers.get("x-user-id") || "0", 10)
    const userRole = request.headers.get("x-user-role") as "user" | "dev" | "admin" | null

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { name, icon, target, dueDate, color, monthlyContribution, current } = body

    if (!name || target === undefined || !dueDate) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const connection = await getDBConnection(userRole || undefined)
    const SavingsGoalModel = createSavingsGoalModel(connection)

    // Get the highest ID to generate a new one
    const existingGoals = await SavingsGoalModel.find({ userId }).sort({ id: -1 }).limit(1).lean().exec()
    const nextId = existingGoals.length > 0 ? (existingGoals[0] as any).id + 1 : 1

    const newGoal = new SavingsGoalModel({
      id: nextId,
      userId,
      name: name.trim(),
      icon: icon || "PiggyBank", // Store as string (component name or emoji)
      current: Math.round((current || 0) * 100), // Convert to cents if provided as dollars
      target: Math.round(target * 100), // Convert to cents if provided as dollars
      dueDate: dueDate,
      color: color || "#4E79A7",
      monthlyContribution: monthlyContribution ? Math.round(monthlyContribution * 100) : 0, // Convert to cents if provided as dollars
    })

    await newGoal.save()

    const formattedGoal = {
      id: newGoal.id,
      name: newGoal.name,
      icon: newGoal.icon,
      current: newGoal.current,
      target: newGoal.target,
      dueDate: newGoal.dueDate,
      color: newGoal.color,
      monthlyContribution: newGoal.monthlyContribution,
    }

    return NextResponse.json(formattedGoal, { status: 201 })
  } catch (error) {
    console.error("Create savings goal error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

