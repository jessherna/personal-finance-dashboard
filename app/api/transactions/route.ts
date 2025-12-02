import { NextResponse } from "next/server"
import { getDBConnection } from "@/lib/db/mongodb"
import { createTransactionModel } from "@/lib/models/Transaction"
import { createAccountModel } from "@/lib/models/Account"
import { verifyUserFromRequest } from "@/lib/utils/auth-helper"
import { recalculateBudgetCategorySpent } from "@/lib/utils/budget-helper"

// GET /api/transactions - Get all transactions for a user
export async function GET(request: Request) {
  try {
    // Verify user exists in database
    const verified = await verifyUserFromRequest(request)
    if (!verified) {
      return NextResponse.json({ error: "Unauthorized - User not found or inactive" }, { status: 401 })
    }

    const { userId, userRole } = verified

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

// POST /api/transactions - Create a new transaction
export async function POST(request: Request) {
  try {
    // Verify user exists in database
    const verified = await verifyUserFromRequest(request)
    if (!verified) {
      return NextResponse.json({ error: "Unauthorized - User not found or inactive" }, { status: 401 })
    }

    const { userId, userRole } = verified

    const body = await request.json()
    const { name, category, date, time, amount, type, status, accountId, savingsGoalId, savingsAmount, budgetCategoryId, recurringBillId } = body

    if (!name || !category || !date || amount === undefined || !type) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const connection = await getDBConnection(userRole || undefined)
    const TransactionModel = createTransactionModel(connection)

    // Get the highest ID to generate a new one
    const existingTransactions = await TransactionModel.find({ userId }).sort({ id: -1 }).limit(1).lean().exec()
    const nextId = existingTransactions.length > 0 ? (existingTransactions[0] as any).id + 1 : 1

    const newTransaction = new TransactionModel({
      id: nextId,
      userId,
      name: name.trim(),
      category,
      date,
      time: time || "00:00",
      amount: Math.round(amount), // Already in cents
      type,
      status: status || "completed",
      accountId: accountId ?? null,
      savingsGoalId: savingsGoalId ?? null,
      savingsAmount: savingsAmount ? Math.round(savingsAmount) : undefined,
      budgetCategoryId: budgetCategoryId ?? null,
      recurringBillId: recurringBillId ?? null,
    })

    await newTransaction.save()

    // Update budget category spent amount if transaction is linked to a budget category
    if (newTransaction.budgetCategoryId && newTransaction.type === "expense" && (newTransaction.status === "completed" || !newTransaction.status)) {
      try {
        const budgetCategoryIdNum = typeof newTransaction.budgetCategoryId === "string" 
          ? parseInt(newTransaction.budgetCategoryId, 10) 
          : Number(newTransaction.budgetCategoryId)
        
        if (!isNaN(budgetCategoryIdNum)) {
          await recalculateBudgetCategorySpent(connection, userId, budgetCategoryIdNum, newTransaction.date)
        }
      } catch (budgetError) {
        console.error("Error updating budget category spent:", budgetError)
        // Don't fail the transaction creation if budget update fails
      }
    }

    // Update account balance if transaction is linked to an account and status is completed
    if (newTransaction.accountId && (newTransaction.status === "completed" || !newTransaction.status)) {
      try {
        const AccountModel = createAccountModel(connection)
        // Ensure accountId is a number for the lookup
        const accountIdNum = typeof newTransaction.accountId === "string" 
          ? parseInt(newTransaction.accountId, 10) 
          : Number(newTransaction.accountId)
        
        if (isNaN(accountIdNum)) {
          console.error("Invalid accountId:", newTransaction.accountId, "Type:", typeof newTransaction.accountId)
        } else {
          const account = await AccountModel.findOne({ id: accountIdNum, userId })
          
          if (!account) {
            console.error(`Account not found: id=${accountIdNum}, userId=${userId}`)
            // Don't fail transaction creation, but log the error
          } else {
            // For credit cards: income is a payment (decreases debt), expenses increase debt
            // For other accounts: income increases balance, expenses decrease balance
            // Ensure balance is a number (handle null/undefined)
            const oldBalance = typeof account.balance === "number" ? account.balance : 0
            
            let newBalance: number
            if (account.type === "credit_card") {
              // Credit cards: expenses increase debt (negative balance), income decreases debt
              if (newTransaction.type === "expense") {
                newBalance = oldBalance - newTransaction.amount
              } else {
                // Income to credit card is a payment, decreases debt
                newBalance = oldBalance + newTransaction.amount
              }
            } else {
              // Regular accounts: income increases balance, expenses decrease balance
              if (newTransaction.type === "income") {
                newBalance = oldBalance + newTransaction.amount
              } else {
                newBalance = oldBalance - newTransaction.amount
              }
            }
            
            account.balance = newBalance
            const savedAccount = await account.save()
            console.log(`Updated account ${accountIdNum} (${account.name}) balance: ${oldBalance} -> ${savedAccount.balance} (${newTransaction.type}: ${newTransaction.amount})`)
          }
        }
      } catch (accountError) {
        console.error("Error updating account balance:", accountError)
        // Don't fail the transaction creation if account update fails
      }
    }

    const formattedTransaction = {
      id: newTransaction.id,
      name: newTransaction.name,
      category: newTransaction.category,
      date: newTransaction.date,
      time: newTransaction.time,
      amount: newTransaction.amount,
      type: newTransaction.type,
      status: newTransaction.status,
      accountId: newTransaction.accountId,
      savingsGoalId: newTransaction.savingsGoalId ?? undefined,
      savingsAmount: newTransaction.savingsAmount,
      budgetCategoryId: newTransaction.budgetCategoryId,
      recurringBillId: newTransaction.recurringBillId,
    }

    return NextResponse.json(formattedTransaction, { status: 201 })
  } catch (error) {
    console.error("Create transaction error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

