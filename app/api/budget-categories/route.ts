import { NextResponse } from "next/server"
import { getDBConnection } from "@/lib/db/mongodb"
import { createBudgetCategoryModel } from "@/lib/models/Budget"

// GET /api/budget-categories - Get all budget categories for a user
export async function GET(request: Request) {
  try {
    const userId = parseInt(request.headers.get("x-user-id") || "0", 10)
    const userRole = request.headers.get("x-user-role") as "user" | "dev" | "admin" | null

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const connection = await getDBConnection(userRole || undefined)
    const BudgetCategoryModel = createBudgetCategoryModel(connection)

    const categories = await BudgetCategoryModel.find({ userId }).lean().exec()

    const formattedCategories = categories.map((cat: any) => ({
      id: cat.id || cat._id,
      name: cat.name,
      budget: cat.budget,
      spent: cat.spent,
      icon: cat.icon,
      color: cat.color,
    }))

    return NextResponse.json(formattedCategories)
  } catch (error) {
    console.error("Get budget categories error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

