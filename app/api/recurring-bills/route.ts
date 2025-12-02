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

// POST /api/recurring-bills - Create a new recurring bill
export async function POST(request: Request) {
  try {
    const userId = parseInt(request.headers.get("x-user-id") || "0", 10)
    const userRole = request.headers.get("x-user-role") as "user" | "dev" | "admin" | null

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { name, amount, frequency, nextDueDate, category, icon, color, isActive, notes, budgetCategoryId } = body

    if (!name || amount === undefined || !frequency || !nextDueDate || !category) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const connection = await getDBConnection(userRole || undefined)
    const RecurringBillModel = createRecurringBillModel(connection)

    // Get the highest ID to generate a new one
    const existingBills = await RecurringBillModel.find({ userId }).sort({ id: -1 }).limit(1).lean().exec()
    const nextId = existingBills.length > 0 ? (existingBills[0] as any).id + 1 : 1

    const newBill = new RecurringBillModel({
      id: nextId,
      userId,
      name: name.trim(),
      amount: Math.round(amount), // Already in cents
      frequency,
      nextDueDate,
      category,
      icon: icon || "📦",
      color: color || undefined,
      isActive: isActive !== undefined ? isActive : true,
      notes: notes || undefined,
      budgetCategoryId: budgetCategoryId || null,
    })

    await newBill.save()

    const formattedBill = {
      id: newBill.id,
      name: newBill.name,
      amount: newBill.amount,
      frequency: newBill.frequency,
      nextDueDate: newBill.nextDueDate,
      category: newBill.category,
      icon: newBill.icon,
      color: newBill.color,
      isActive: newBill.isActive,
      notes: newBill.notes,
      budgetCategoryId: newBill.budgetCategoryId ?? null,
      lastPaidDate: newBill.lastPaidDate,
    }

    return NextResponse.json(formattedBill, { status: 201 })
  } catch (error) {
    console.error("Create recurring bill error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

