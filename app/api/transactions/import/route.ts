import { NextResponse } from "next/server"
import type { Transaction } from "@/lib/types/transaction"
import { mockAllTransactions } from "@/lib/data/transactions"

// POST /api/transactions/import - Import transactions from PDF
export async function POST(request: Request) {
  try {
    // In a real app, verify authentication here
    const body = await request.json()
    const { transactions } = body

    // Get userId from headers (in a real app, from auth token)
    const userId = parseInt(request.headers.get("x-user-id") || "0", 10)

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

    // Generate IDs for new transactions
    const maxId = Math.max(...mockAllTransactions.map((t) => t.id), 0)
    const newTransactions: Transaction[] = transactions.map((txn, index) => ({
      id: maxId + index + 1,
      name: txn.name,
      category: txn.category || "Miscellaneous",
      date: txn.date,
      time: txn.time,
      amount: txn.amount,
      type: txn.type,
      status: txn.status || "completed",
      accountId: txn.accountId ?? null,
      budgetCategoryId: txn.budgetCategoryId ?? null,
      savingsGoalId: txn.savingsGoalId ?? null,
      savingsAmount: txn.savingsAmount,
      recurringBillId: txn.recurringBillId ?? null,
    }))

    // Add to mock data (in a real app, save to database)
    mockAllTransactions.push(...newTransactions)

    return NextResponse.json({
      success: true,
      count: newTransactions.length,
      transactions: newTransactions,
    })
  } catch (error) {
    console.error("Import transactions error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

