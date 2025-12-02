import { NextResponse } from "next/server"
import { getDBConnection } from "@/lib/db/mongodb"
import { createSavingsGoalModel } from "@/lib/models/Savings"

// PATCH /api/savings-goals/[id] - Update a savings goal
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const goalId = parseInt(id, 10)
    const userId = parseInt(request.headers.get("x-user-id") || "0", 10)
    const userRole = request.headers.get("x-user-role") as "user" | "dev" | "admin" | null

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (isNaN(goalId)) {
      return NextResponse.json({ error: "Invalid goal ID" }, { status: 400 })
    }

    const body = await request.json()
    const { name, icon, target, dueDate, color, monthlyContribution, current } = body

    const connection = await getDBConnection(userRole || undefined)
    const SavingsGoalModel = createSavingsGoalModel(connection)

    const goal = await SavingsGoalModel.findOne({ id: goalId, userId })

    if (!goal) {
      return NextResponse.json({ error: "Savings goal not found" }, { status: 404 })
    }

    // Update fields
    if (name !== undefined) goal.name = name.trim()
    if (icon !== undefined) goal.icon = icon
    if (target !== undefined) goal.target = Math.round(target * 100) // Convert to cents if provided as dollars
    if (dueDate !== undefined) goal.dueDate = dueDate
    if (color !== undefined) goal.color = color
    if (monthlyContribution !== undefined) goal.monthlyContribution = Math.round(monthlyContribution * 100) // Convert to cents if provided as dollars
    if (current !== undefined) goal.current = Math.round(current * 100) // Convert to cents if provided as dollars

    await goal.save()

    const formattedGoal = {
      id: goal.id,
      name: goal.name,
      icon: goal.icon,
      current: goal.current,
      target: goal.target,
      dueDate: goal.dueDate,
      color: goal.color,
      monthlyContribution: goal.monthlyContribution,
    }

    return NextResponse.json(formattedGoal)
  } catch (error) {
    console.error("Update savings goal error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE /api/savings-goals/[id] - Delete a savings goal
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const goalId = parseInt(id, 10)
    const userId = parseInt(request.headers.get("x-user-id") || "0", 10)
    const userRole = request.headers.get("x-user-role") as "user" | "dev" | "admin" | null

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (isNaN(goalId)) {
      return NextResponse.json({ error: "Invalid goal ID" }, { status: 400 })
    }

    const connection = await getDBConnection(userRole || undefined)
    const SavingsGoalModel = createSavingsGoalModel(connection)

    const goal = await SavingsGoalModel.findOne({ id: goalId, userId })

    if (!goal) {
      return NextResponse.json({ error: "Savings goal not found" }, { status: 404 })
    }

    await SavingsGoalModel.deleteOne({ id: goalId, userId })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete savings goal error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

