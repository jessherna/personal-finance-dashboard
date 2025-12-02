import { NextResponse } from "next/server"
import { getDBConnection } from "@/lib/db/mongodb"
import { createTransactionModel } from "@/lib/models/Transaction"

// GET /api/transactions - Get all transactions for a user
export async function GET(request: Request) {
  try {
    // Get userId from headers (in a real app, from auth token)
    const userId = parseInt(request.headers.get("x-user-id") || "0", 10)
    const userRole = request.headers.get("x-user-role") as "user" | "dev" | "admin" | null

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get database connection based on user role
    // Users use actual DB, admin/dev use mock DB
    const connection = await getDBConnection(userRole || undefined)
    const TransactionModel = createTransactionModel(connection)

    // Fetch transactions for the user
    const transactions = await TransactionModel.find({ userId }).lean().exec()

    // Convert MongoDB documents to Transaction format
    const formattedTransactions = transactions.map((txn: any) => ({
      id: txn.id || txn._id,
      name: txn.name,
      category: txn.category,
      date: txn.date,
      time: txn.time,
      amount: txn.amount,
      type: txn.type,
      status: txn.status || "completed",
      accountId: txn.accountId ?? null,
      savingsGoalId: txn.savingsGoalId ?? null,
      savingsAmount: txn.savingsAmount,
      budgetCategoryId: txn.budgetCategoryId ?? null,
      recurringBillId: txn.recurringBillId ?? null,
    }))

    return NextResponse.json(formattedTransactions)
  } catch (error) {
    console.error("Get transactions error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

