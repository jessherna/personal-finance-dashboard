import { NextResponse } from "next/server"
import { getDBConnection } from "@/lib/db/mongodb"
import { createTransactionModel } from "@/lib/models/Transaction"
import { createAccountModel } from "@/lib/models/Account"
import { recalculateBudgetCategorySpent } from "@/lib/utils/budget-helper"

// PATCH /api/transactions/[id] - Update a transaction
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const transactionId = parseInt(id, 10)
    const userId = parseInt(request.headers.get("x-user-id") || "0", 10)
    const userRole = request.headers.get("x-user-role") as "user" | "dev" | "admin" | null

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (isNaN(transactionId)) {
      return NextResponse.json({ error: "Invalid transaction ID" }, { status: 400 })
    }

    const body = await request.json()
    const { name, category, date, time, amount, type, status, accountId, savingsGoalId, savingsAmount, budgetCategoryId, recurringBillId } = body

    const connection = await getDBConnection(userRole || undefined)
    const TransactionModel = createTransactionModel(connection)

    const transaction = await TransactionModel.findOne({ id: transactionId, userId })

    if (!transaction) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 })
    }

    // Store original values for account balance reversal and budget category updates
    const originalAccountId = transaction.accountId
    const originalAmount = transaction.amount
    const originalType = transaction.type
    const originalStatus = transaction.status
    const originalBudgetCategoryId = transaction.budgetCategoryId
    const originalDate = transaction.date

    // Update fields
    if (name !== undefined) transaction.name = name.trim()
    if (category !== undefined) transaction.category = category
    if (date !== undefined) transaction.date = date
    if (time !== undefined) transaction.time = time
    if (amount !== undefined) transaction.amount = Math.round(amount) // Already in cents
    if (type !== undefined) transaction.type = type
    if (status !== undefined) transaction.status = status
    if (accountId !== undefined) transaction.accountId = accountId ?? null
    if (savingsGoalId !== undefined) transaction.savingsGoalId = savingsGoalId ?? null
    if (savingsAmount !== undefined) transaction.savingsAmount = savingsAmount ? Math.round(savingsAmount) : undefined
    if (budgetCategoryId !== undefined) transaction.budgetCategoryId = budgetCategoryId ?? null
    if (recurringBillId !== undefined) transaction.recurringBillId = recurringBillId ?? null

    await transaction.save()

    // Update account balances if transaction affects accounts
    const AccountModel = createAccountModel(connection)
    const needsBalanceUpdate = 
      (originalAccountId !== transaction.accountId) ||
      (originalAmount !== transaction.amount) ||
      (originalType !== transaction.type) ||
      (originalStatus !== transaction.status && (originalStatus === "completed" || transaction.status === "completed"))

    if (needsBalanceUpdate) {
      try {
        // Reverse the original transaction's effect on the old account
        if (originalAccountId && (originalStatus === "completed" || !originalStatus)) {
          const oldAccount = await AccountModel.findOne({ id: originalAccountId, userId })
          if (oldAccount) {
            if (oldAccount.type === "credit_card") {
              if (originalType === "expense") {
                oldAccount.balance = (oldAccount.balance || 0) + originalAmount
              } else {
                oldAccount.balance = (oldAccount.balance || 0) - originalAmount
              }
            } else {
              if (originalType === "income") {
                oldAccount.balance = (oldAccount.balance || 0) - originalAmount
              } else {
                oldAccount.balance = (oldAccount.balance || 0) + originalAmount
              }
            }
            await oldAccount.save()
          }
        }

        // Apply the new transaction's effect on the new account
        if (transaction.accountId && (transaction.status === "completed" || !transaction.status)) {
          const newAccount = await AccountModel.findOne({ id: transaction.accountId, userId })
          if (newAccount) {
            if (newAccount.type === "credit_card") {
              if (transaction.type === "expense") {
                newAccount.balance = (newAccount.balance || 0) - transaction.amount
              } else {
                newAccount.balance = (newAccount.balance || 0) + transaction.amount
              }
            } else {
              if (transaction.type === "income") {
                newAccount.balance = (newAccount.balance || 0) + transaction.amount
              } else {
                newAccount.balance = (newAccount.balance || 0) - transaction.amount
              }
            }
            await newAccount.save()
          }
        }
      } catch (accountError) {
        console.error("Error updating account balance:", accountError)
        // Don't fail the transaction update if account update fails
      }
    }

    // Update budget category spent amounts if transaction affects budget categories
    try {
      const needsBudgetUpdate = 
        (originalBudgetCategoryId !== transaction.budgetCategoryId) ||
        (originalAmount !== transaction.amount) ||
        (originalType !== transaction.type) ||
        (originalDate !== transaction.date) ||
        (originalStatus !== transaction.status && (originalStatus === "completed" || transaction.status === "completed"))

      if (needsBudgetUpdate) {
        // Recalculate old budget category if it existed and was an expense
        // Use original date for old category
        if (originalBudgetCategoryId && originalType === "expense" && (originalStatus === "completed" || !originalStatus)) {
          const oldBudgetCategoryIdNum = typeof originalBudgetCategoryId === "string" 
            ? parseInt(originalBudgetCategoryId, 10) 
            : Number(originalBudgetCategoryId)
          
          if (!isNaN(oldBudgetCategoryIdNum)) {
            await recalculateBudgetCategorySpent(connection, userId, oldBudgetCategoryIdNum, originalDate)
          }
        }

        // Recalculate new budget category if it exists and transaction is an expense
        // Use new date for new category
        if (transaction.budgetCategoryId && transaction.type === "expense" && (transaction.status === "completed" || !transaction.status)) {
          const newBudgetCategoryIdNum = typeof transaction.budgetCategoryId === "string" 
            ? parseInt(transaction.budgetCategoryId, 10) 
            : Number(transaction.budgetCategoryId)
          
          if (!isNaN(newBudgetCategoryIdNum)) {
            // Recalculate if it's different from old category, or if same category (to handle amount/status changes)
            if (originalBudgetCategoryId !== transaction.budgetCategoryId || originalDate !== transaction.date || originalAmount !== transaction.amount || originalStatus !== transaction.status) {
              await recalculateBudgetCategorySpent(connection, userId, newBudgetCategoryIdNum, transaction.date)
            }
          }
        }
      }
    } catch (budgetError) {
      console.error("Error updating budget category spent:", budgetError)
      // Don't fail the transaction update if budget update fails
    }

    const formattedTransaction = {
      id: transaction.id,
      name: transaction.name,
      category: transaction.category,
      date: transaction.date,
      time: transaction.time,
      amount: transaction.amount,
      type: transaction.type,
      status: transaction.status,
      accountId: transaction.accountId,
      savingsGoalId: transaction.savingsGoalId ?? undefined,
      savingsAmount: transaction.savingsAmount,
      budgetCategoryId: transaction.budgetCategoryId,
      recurringBillId: transaction.recurringBillId,
    }

    return NextResponse.json(formattedTransaction)
  } catch (error) {
    console.error("Update transaction error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE /api/transactions/[id] - Delete a transaction
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const transactionId = parseInt(id, 10)
    const userId = parseInt(request.headers.get("x-user-id") || "0", 10)
    const userRole = request.headers.get("x-user-role") as "user" | "dev" | "admin" | null

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (isNaN(transactionId)) {
      return NextResponse.json({ error: "Invalid transaction ID" }, { status: 400 })
    }

    const connection = await getDBConnection(userRole || undefined)
    const TransactionModel = createTransactionModel(connection)

    const transaction = await TransactionModel.findOne({ id: transactionId, userId })

    if (!transaction) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 })
    }

    // Store values for budget category update
    const transactionDate = transaction.date
    const transactionBudgetCategoryId = transaction.budgetCategoryId
    const transactionType = transaction.type
    const transactionStatus = transaction.status

    // Reverse the transaction's effect on the account balance before deleting
    if (transaction.accountId && (transaction.status === "completed" || !transaction.status)) {
      try {
        const AccountModel = createAccountModel(connection)
        const account = await AccountModel.findOne({ id: transaction.accountId, userId })
        
        if (account) {
          // Reverse the transaction: if it was income, subtract; if expense, add back
          if (account.type === "credit_card") {
            if (transaction.type === "expense") {
              account.balance = (account.balance || 0) + transaction.amount
            } else {
              account.balance = (account.balance || 0) - transaction.amount
            }
          } else {
            if (transaction.type === "income") {
              account.balance = (account.balance || 0) - transaction.amount
            } else {
              account.balance = (account.balance || 0) + transaction.amount
            }
          }
          await account.save()
        }
      } catch (accountError) {
        console.error("Error updating account balance:", accountError)
        // Don't fail the transaction deletion if account update fails
      }
    }

    // Update budget category spent amount if transaction was linked to a budget category
    if (transactionBudgetCategoryId && transactionType === "expense" && (transactionStatus === "completed" || !transactionStatus)) {
      try {
        const budgetCategoryIdNum = typeof transactionBudgetCategoryId === "string" 
          ? parseInt(transactionBudgetCategoryId, 10) 
          : Number(transactionBudgetCategoryId)
        
        if (!isNaN(budgetCategoryIdNum)) {
          await recalculateBudgetCategorySpent(connection, userId, budgetCategoryIdNum, transactionDate)
        }
      } catch (budgetError) {
        console.error("Error updating budget category spent:", budgetError)
        // Don't fail the transaction deletion if budget update fails
      }
    }

    await TransactionModel.deleteOne({ id: transactionId, userId })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete transaction error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

