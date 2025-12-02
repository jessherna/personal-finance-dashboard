import { NextResponse } from "next/server"
import { getDBConnection } from "@/lib/db/mongodb"
import { createBudgetCategoryModel } from "@/lib/models/Budget"

// PATCH /api/budget-categories/[id] - Update a budget category
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const categoryId = parseInt(id, 10)
    const userId = parseInt(request.headers.get("x-user-id") || "0", 10)
    const userRole = request.headers.get("x-user-role") as "user" | "dev" | "admin" | null

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (isNaN(categoryId)) {
      return NextResponse.json({ error: "Invalid category ID" }, { status: 400 })
    }

    const body = await request.json()
    const { name, budget, spent, icon, color } = body

    const connection = await getDBConnection(userRole || undefined)
    const BudgetCategoryModel = createBudgetCategoryModel(connection)

    const category = await BudgetCategoryModel.findOne({ id: categoryId, userId })

    if (!category) {
      return NextResponse.json({ error: "Budget category not found" }, { status: 404 })
    }

    // Update fields
    if (name !== undefined) category.name = name.trim()
    if (budget !== undefined) category.budget = Math.round(budget) // Already in cents
    if (spent !== undefined) category.spent = Math.round(spent) // Already in cents
    if (icon !== undefined) category.icon = icon
    if (color !== undefined) category.color = color

    await category.save()

    const formattedCategory = {
      id: category.id,
      name: category.name,
      budget: category.budget,
      spent: category.spent,
      icon: category.icon,
      color: category.color,
    }

    return NextResponse.json(formattedCategory)
  } catch (error) {
    console.error("Update budget category error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE /api/budget-categories/[id] - Delete a budget category
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const categoryId = parseInt(id, 10)
    const userId = parseInt(request.headers.get("x-user-id") || "0", 10)
    const userRole = request.headers.get("x-user-role") as "user" | "dev" | "admin" | null

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (isNaN(categoryId)) {
      return NextResponse.json({ error: "Invalid category ID" }, { status: 400 })
    }

    const connection = await getDBConnection(userRole || undefined)
    const BudgetCategoryModel = createBudgetCategoryModel(connection)

    const category = await BudgetCategoryModel.findOne({ id: categoryId, userId })

    if (!category) {
      return NextResponse.json({ error: "Budget category not found" }, { status: 404 })
    }

    await BudgetCategoryModel.deleteOne({ id: categoryId, userId })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete budget category error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

