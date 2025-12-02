import { NextResponse } from "next/server"
import { getDBConnection } from "@/lib/db/mongodb"
import { createAccountModel } from "@/lib/models/Account"
import { createTransactionModel } from "@/lib/models/Transaction"
import { verifyUserFromRequest } from "@/lib/utils/auth-helper"

// GET /api/accounts - Get all accounts for a user
export async function GET(request: Request) {
  try {
    // Verify user exists in database
    const verified = await verifyUserFromRequest(request)
    if (!verified) {
      return NextResponse.json({ error: "Unauthorized - User not found or inactive" }, { status: 401 })
    }

    const { userId, userRole } = verified

    const connection = await getDBConnection(userRole || undefined)
    const AccountModel = createAccountModel(connection)
    const TransactionModel = createTransactionModel(connection)

    const accounts = await AccountModel.find({ userId }).lean().exec()
    
    // Fetch all transactions for this user to recalculate balances
    const transactions = await TransactionModel.find({ userId }).lean().exec()

    // Recalculate account balances from all transactions
    const accountsWithRecalculatedBalances = accounts.map((acc: any) => {
      // Get all transactions for this account
      const accountTransactions = transactions.filter((t: any) => t.accountId === acc.id)
      
      // Start with the account's stored balance (which includes initial balance)
      // Then recalculate by applying all transactions
      // For credit cards, we calculate debt from transactions (starts at 0, expenses increase debt, payments decrease)
      // For regular accounts, we start from stored balance and apply transaction effects
      let calculatedBalance = acc.balance || 0
      
      // If we have transactions, recalculate from scratch to ensure accuracy
      // Start from 0 and apply all transactions
      if (accountTransactions.length > 0) {
        calculatedBalance = 0
        
        accountTransactions.forEach((t: any) => {
          // Only count completed transactions
          if (t.status === "completed" || !t.status) {
            if (acc.type === "credit_card") {
              // For credit cards: expenses increase debt (negative balance), income decreases debt
              if (t.type === "expense") {
                calculatedBalance -= t.amount
              } else {
                // Income to credit card is a payment, decreases debt
                calculatedBalance += t.amount
              }
            } else {
              // For regular accounts: income increases balance, expenses decrease balance
              if (t.type === "income") {
                calculatedBalance += t.amount
              } else {
                calculatedBalance -= t.amount
              }
            }
          }
        })
      }
      
      // If there are no transactions, keep the stored balance (which includes initial balance)
      // Otherwise, use the calculated balance from transactions
      const finalBalance = accountTransactions.length > 0 ? calculatedBalance : (acc.balance || 0)
      
      // Update the account balance in the database if it's different
      // (This ensures the stored balance stays in sync with transactions)
      if (Math.abs(finalBalance - (acc.balance || 0)) > 0) {
        // Update asynchronously without blocking the response
        AccountModel.findOneAndUpdate(
          { id: acc.id, userId },
          { balance: finalBalance },
          { new: true }
        ).catch((err) => {
          console.error(`Error updating account ${acc.id} balance:`, err)
        })
      }
      
      return {
        id: acc.id || acc._id,
        name: acc.name,
        type: acc.type,
        balance: finalBalance, // Use recalculated balance
        limit: acc.limit,
        currency: acc.currency,
        bankName: acc.bankName,
        accountNumber: acc.accountNumber,
        color: acc.color,
        icon: acc.icon,
        isActive: acc.isActive,
        notes: acc.notes,
      }
    })

    return NextResponse.json(accountsWithRecalculatedBalances)
  } catch (error) {
    console.error("Get accounts error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/accounts - Create a new account
export async function POST(request: Request) {
  try {
    // Verify user exists in database
    const verified = await verifyUserFromRequest(request)
    if (!verified) {
      return NextResponse.json({ error: "Unauthorized - User not found or inactive" }, { status: 401 })
    }

    const { userId, userRole } = verified

    const body = await request.json()
    const { name, type, balance, limit, currency, bankName, accountNumber, icon, color, isActive, notes } = body

    if (!name || type === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // For credit cards, require limit instead of balance
    if (type === "credit_card") {
      if (limit === undefined) {
        return NextResponse.json({ error: "Credit limit is required for credit cards" }, { status: 400 })
      }
    } else {
      if (balance === undefined) {
        return NextResponse.json({ error: "Balance is required for non-credit card accounts" }, { status: 400 })
      }
    }

    const connection = await getDBConnection(userRole || undefined)
    const AccountModel = createAccountModel(connection)

    // Get the highest ID to generate a new one
    const existingAccounts = await AccountModel.find({ userId }).sort({ id: -1 }).limit(1).lean().exec()
    const nextId = existingAccounts.length > 0 ? (existingAccounts[0] as any).id + 1 : 1

    const newAccount = new AccountModel({
      id: nextId,
      userId,
      name: name.trim(),
      type,
      balance: type === "credit_card" ? 0 : Math.round(balance || 0), // Credit cards start with 0 balance
      limit: type === "credit_card" ? Math.round(limit) : undefined, // Only set limit for credit cards
      currency: currency || "C$",
      bankName: bankName || undefined,
      accountNumber: accountNumber || undefined,
      icon: icon || "💳",
      color: color || undefined,
      isActive: isActive !== undefined ? isActive : true,
      notes: notes || undefined,
    })

    await newAccount.save()

    const formattedAccount = {
      id: newAccount.id,
      name: newAccount.name,
      type: newAccount.type,
      balance: newAccount.balance,
      limit: newAccount.limit,
      currency: newAccount.currency,
      bankName: newAccount.bankName,
      accountNumber: newAccount.accountNumber,
      color: newAccount.color,
      icon: newAccount.icon,
      isActive: newAccount.isActive,
      notes: newAccount.notes,
    }

    return NextResponse.json(formattedAccount, { status: 201 })
  } catch (error) {
    console.error("Create account error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

