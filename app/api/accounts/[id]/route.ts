import { NextResponse } from "next/server"
import { getDBConnection } from "@/lib/db/mongodb"
import { createAccountModel } from "@/lib/models/Account"

// PATCH /api/accounts/[id] - Update an account
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const accountId = parseInt(id, 10)
    const userId = parseInt(request.headers.get("x-user-id") || "0", 10)
    const userRole = request.headers.get("x-user-role") as "user" | "dev" | "admin" | null

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (isNaN(accountId)) {
      return NextResponse.json({ error: "Invalid account ID" }, { status: 400 })
    }

    const body = await request.json()
    const { name, type, balance, limit, currency, bankName, accountNumber, icon, color, isActive, notes } = body

    const connection = await getDBConnection(userRole || undefined)
    const AccountModel = createAccountModel(connection)

    const account = await AccountModel.findOne({ id: accountId, userId })

    if (!account) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 })
    }

    // Update fields
    if (name !== undefined) account.name = name.trim()
    if (type !== undefined) {
      account.type = type
      // If changing to credit card, set balance to 0 and require limit
      if (type === "credit_card" && balance === undefined) {
        account.balance = 0
      }
      // If changing from credit card, clear limit
      if (type !== "credit_card" && account.type === "credit_card") {
        account.limit = undefined
      }
    }
    if (balance !== undefined && account.type !== "credit_card") {
      account.balance = Math.round(balance) // Already in cents
    }
    if (limit !== undefined && account.type === "credit_card") {
      account.limit = Math.round(limit) // Already in cents
    }
    if (currency !== undefined) account.currency = currency
    if (bankName !== undefined) account.bankName = bankName || undefined
    if (accountNumber !== undefined) account.accountNumber = accountNumber || undefined
    if (icon !== undefined) account.icon = icon
    if (color !== undefined) account.color = color || undefined
    if (isActive !== undefined) account.isActive = isActive
    if (notes !== undefined) account.notes = notes || undefined

    await account.save()

    const formattedAccount = {
      id: account.id,
      name: account.name,
      type: account.type,
      balance: account.balance,
      limit: account.limit,
      currency: account.currency,
      bankName: account.bankName,
      accountNumber: account.accountNumber,
      color: account.color,
      icon: account.icon,
      isActive: account.isActive,
      notes: account.notes,
    }

    return NextResponse.json(formattedAccount)
  } catch (error) {
    console.error("Update account error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE /api/accounts/[id] - Delete an account
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const accountId = parseInt(id, 10)
    const userId = parseInt(request.headers.get("x-user-id") || "0", 10)
    const userRole = request.headers.get("x-user-role") as "user" | "dev" | "admin" | null

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (isNaN(accountId)) {
      return NextResponse.json({ error: "Invalid account ID" }, { status: 400 })
    }

    const connection = await getDBConnection(userRole || undefined)
    const AccountModel = createAccountModel(connection)

    const account = await AccountModel.findOne({ id: accountId, userId })

    if (!account) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 })
    }

    await AccountModel.deleteOne({ id: accountId, userId })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete account error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

