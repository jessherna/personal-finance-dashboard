import { NextResponse } from "next/server"
import { getDBConnection } from "@/lib/db/mongodb"
import { createAccountModel } from "@/lib/models/Account"

// GET /api/accounts - Get all accounts for a user
export async function GET(request: Request) {
  try {
    const userId = parseInt(request.headers.get("x-user-id") || "0", 10)
    const userRole = request.headers.get("x-user-role") as "user" | "dev" | "admin" | null

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const connection = await getDBConnection(userRole || undefined)
    const AccountModel = createAccountModel(connection)

    const accounts = await AccountModel.find({ userId }).lean().exec()

    const formattedAccounts = accounts.map((acc: any) => ({
      id: acc.id || acc._id,
      name: acc.name,
      type: acc.type,
      balance: acc.balance,
      currency: acc.currency,
      bankName: acc.bankName,
      accountNumber: acc.accountNumber,
      color: acc.color,
      icon: acc.icon,
      isActive: acc.isActive,
      notes: acc.notes,
    }))

    return NextResponse.json(formattedAccounts)
  } catch (error) {
    console.error("Get accounts error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

