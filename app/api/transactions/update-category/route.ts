import { NextResponse } from "next/server"
import { getDBConnection } from "@/lib/db/mongodb"
import { createTransactionModel } from "@/lib/models/Transaction"
import { verifyUserFromRequest } from "@/lib/utils/auth-helper"

// POST /api/transactions/update-category - Update category for all transactions with a specific name
export async function POST(request: Request) {
  try {
    // Verify user exists in database
    const verified = await verifyUserFromRequest(request)
    if (!verified) {
      return NextResponse.json({ error: "Unauthorized - User not found or inactive" }, { status: 401 })
    }

    const { userId, userRole } = verified

    const body = await request.json()
    const { transactionName, category } = body

    if (!transactionName || !category) {
      return NextResponse.json({ error: "Missing required fields: transactionName and category" }, { status: 400 })
    }

    const connection = await getDBConnection(userRole || undefined)
    const TransactionModel = createTransactionModel(connection)

    // Update all transactions with this exact name (case-sensitive match)
    const result = await TransactionModel.updateMany(
      { userId, name: transactionName.trim() },
      { $set: { category: category } }
    ).exec()

    return NextResponse.json({
      success: true,
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount,
      message: `Updated ${result.modifiedCount} transaction(s) with name "${transactionName}" to category "${category}"`,
    })
  } catch (error) {
    console.error("Update transaction category error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}



