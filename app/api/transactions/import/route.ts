import { NextResponse } from "next/server"
import type { Transaction } from "@/lib/types/transaction"
import { getDBConnection } from "@/lib/db/mongodb"
import { createTransactionModel } from "@/lib/models/Transaction"

// POST /api/transactions/import - Import transactions from PDF
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { transactions } = body

    // Get userId from headers (in a real app, from auth token)
    const userId = parseInt(request.headers.get("x-user-id") || "0", 10)
    const userRole = request.headers.get("x-user-role") as "user" | "dev" | "admin" | null

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!transactions || !Array.isArray(transactions)) {
      return NextResponse.json({ error: "Invalid transactions data" }, { status: 400 })
    }

    // Validate transactions
    for (const txn of transactions) {
      if (!txn.name || !txn.date || !txn.amount || !txn.type) {
        return NextResponse.json(
          { error: "Invalid transaction data. Missing required fields." },
          { status: 400 }
        )
      }
    }

    // Get database connection based on user role
    // Users use actual DB, admin/dev use mock DB
    const connection = await getDBConnection(userRole || undefined)
    const TransactionModel = createTransactionModel(connection)

    // Get the highest ID to generate new ones
    const existingTransactions = await TransactionModel.find({ userId }).sort({ id: -1 }).limit(1).lean().exec()
    const maxId = existingTransactions.length > 0 && existingTransactions[0].id 
      ? existingTransactions[0].id 
      : 0

    // Prepare transactions for MongoDB
    const newTransactions = transactions.map((txn, index) => ({
      id: maxId + index + 1,
      userId,
      name: txn.name,
      category: txn.category || "Miscellaneous",
      date: txn.date,
      time: txn.time || "00:00",
      amount: txn.amount,
      type: txn.type,
      status: txn.status || "completed",
      accountId: txn.accountId ?? null,
      budgetCategoryId: txn.budgetCategoryId ?? null,
      savingsGoalId: txn.savingsGoalId ?? null,
      savingsAmount: txn.savingsAmount,
      recurringBillId: txn.recurringBillId ?? null,
    }))

    // Save to MongoDB
    await TransactionModel.insertMany(newTransactions)

    // Format response
    const formattedTransactions: Transaction[] = newTransactions.map((txn) => ({
      id: txn.id,
      name: txn.name,
      category: txn.category,
      date: txn.date,
      time: txn.time,
      amount: txn.amount,
      type: txn.type,
      status: txn.status,
      accountId: txn.accountId,
      savingsGoalId: txn.savingsGoalId ?? undefined,
      savingsAmount: txn.savingsAmount,
      budgetCategoryId: txn.budgetCategoryId,
      recurringBillId: txn.recurringBillId,
    }))

    return NextResponse.json({
      success: true,
      count: formattedTransactions.length,
      transactions: formattedTransactions,
    })
  } catch (error) {
    console.error("Import transactions error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

