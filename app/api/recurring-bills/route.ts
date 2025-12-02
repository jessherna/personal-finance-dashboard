import { NextResponse } from "next/server"
import { getDBConnection } from "@/lib/db/mongodb"
import { createRecurringBillModel } from "@/lib/models/RecurringBill"

// GET /api/recurring-bills - Get all recurring bills for a user
export async function GET(request: Request) {
  try {
    const userId = parseInt(request.headers.get("x-user-id") || "0", 10)
    const userRole = request.headers.get("x-user-role") as "user" | "dev" | "admin" | null

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const connection = await getDBConnection(userRole || undefined)
    const RecurringBillModel = createRecurringBillModel(connection)

    const bills = await RecurringBillModel.find({ userId }).lean().exec()

    const formattedBills = bills.map((bill: any) => ({
      id: bill.id || bill._id,
      name: bill.name,
      amount: bill.amount,
      frequency: bill.frequency,
      nextDueDate: bill.nextDueDate,
      category: bill.category,
      icon: bill.icon,
      color: bill.color,
      isActive: bill.isActive,
      notes: bill.notes,
      budgetCategoryId: bill.budgetCategoryId ?? null,
      lastPaidDate: bill.lastPaidDate,
    }))

    return NextResponse.json(formattedBills)
  } catch (error) {
    console.error("Get recurring bills error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

