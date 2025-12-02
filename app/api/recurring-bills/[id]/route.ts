import { NextResponse } from "next/server"
import { getDBConnection } from "@/lib/db/mongodb"
import { createRecurringBillModel } from "@/lib/models/RecurringBill"

// PATCH /api/recurring-bills/[id] - Update a recurring bill
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const billId = parseInt(id, 10)
    const userId = parseInt(request.headers.get("x-user-id") || "0", 10)
    const userRole = request.headers.get("x-user-role") as "user" | "dev" | "admin" | null

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (isNaN(billId)) {
      return NextResponse.json({ error: "Invalid bill ID" }, { status: 400 })
    }

    const body = await request.json()
    const { name, amount, frequency, nextDueDate, category, icon, color, isActive, notes, budgetCategoryId, lastPaidDate } = body

    const connection = await getDBConnection(userRole || undefined)
    const RecurringBillModel = createRecurringBillModel(connection)

    const bill = await RecurringBillModel.findOne({ id: billId, userId })

    if (!bill) {
      return NextResponse.json({ error: "Recurring bill not found" }, { status: 404 })
    }

    // Update fields
    if (name !== undefined) bill.name = name.trim()
    if (amount !== undefined) bill.amount = Math.round(amount) // Already in cents
    if (frequency !== undefined) bill.frequency = frequency
    if (nextDueDate !== undefined) bill.nextDueDate = nextDueDate
    if (category !== undefined) bill.category = category
    if (icon !== undefined) bill.icon = icon
    if (color !== undefined) bill.color = color
    if (isActive !== undefined) bill.isActive = isActive
    if (notes !== undefined) bill.notes = notes || undefined
    if (budgetCategoryId !== undefined) bill.budgetCategoryId = budgetCategoryId || null
    if (lastPaidDate !== undefined) bill.lastPaidDate = lastPaidDate || undefined

    await bill.save()

    const formattedBill = {
      id: bill.id,
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
    }

    return NextResponse.json(formattedBill)
  } catch (error) {
    console.error("Update recurring bill error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE /api/recurring-bills/[id] - Delete a recurring bill
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const billId = parseInt(id, 10)
    const userId = parseInt(request.headers.get("x-user-id") || "0", 10)
    const userRole = request.headers.get("x-user-role") as "user" | "dev" | "admin" | null

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (isNaN(billId)) {
      return NextResponse.json({ error: "Invalid bill ID" }, { status: 400 })
    }

    const connection = await getDBConnection(userRole || undefined)
    const RecurringBillModel = createRecurringBillModel(connection)

    const bill = await RecurringBillModel.findOne({ id: billId, userId })

    if (!bill) {
      return NextResponse.json({ error: "Recurring bill not found" }, { status: 404 })
    }

    await RecurringBillModel.deleteOne({ id: billId, userId })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete recurring bill error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

