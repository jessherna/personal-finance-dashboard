import { NextResponse } from "next/server"
import { getDBConnection } from "@/lib/db/mongodb"
import { createTransactionModel } from "@/lib/models/Transaction"
import { verifyUserFromRequest } from "@/lib/utils/auth-helper"

// GET /api/transactions/unique - Get unique transactions grouped by name
export async function GET(request: Request) {
  try {
    // Verify user exists in database
    const verified = await verifyUserFromRequest(request)
    if (!verified) {
      return NextResponse.json({ error: "Unauthorized - User not found or inactive" }, { status: 401 })
    }

    const { userId, userRole } = verified

    const connection = await getDBConnection(userRole || undefined)
    const TransactionModel = createTransactionModel(connection)

    // Get all transactions for the user
    const transactions = await TransactionModel.find({ userId }).lean().exec()

    // Group transactions by name (case-insensitive, but preserve original case)
    const groupedTransactions: Record<string, {
      name: string
      count: number
      categories: Record<string, number> // category -> count
      sampleTransactions: Array<{
        id: number
        category: string
        date: string
        amount: number
        type: string
      }>
    }> = {}

    transactions.forEach((txn: any) => {
      const name = txn.name.trim()
      const nameKey = name.toLowerCase() // Use lowercase as key for grouping

      if (!groupedTransactions[nameKey]) {
        groupedTransactions[nameKey] = {
          name: name, // Store original case of first occurrence
          count: 0,
          categories: {},
          sampleTransactions: [],
        }
      }

      const group = groupedTransactions[nameKey]
      group.count++
      
      // Track category distribution
      const category = txn.category || "Miscellaneous"
      group.categories[category] = (group.categories[category] || 0) + 1

      // Store up to 3 sample transactions (prioritize different categories)
      if (group.sampleTransactions.length < 3) {
        // Check if we already have a transaction with this category
        const hasCategory = group.sampleTransactions.some((sample) => sample.category === category)
        if (!hasCategory || group.sampleTransactions.length === 0) {
          group.sampleTransactions.push({
            id: txn.id,
            category: category,
            date: txn.date,
            amount: txn.amount,
            type: txn.type,
          })
        }
      }
    })

    // Convert to array and calculate dominant category
    const uniqueTransactions = Object.values(groupedTransactions).map((group) => {
      // Find the most common category
      let dominantCategory = "Miscellaneous"
      let maxCount = 0
      let isMixed = false

      const categoryEntries = Object.entries(group.categories)
      if (categoryEntries.length > 0) {
        categoryEntries.forEach(([category, count]) => {
          if (count > maxCount) {
            maxCount = count
            dominantCategory = category
          }
        })
        // Check if categories are mixed (not all the same)
        isMixed = categoryEntries.length > 1
      }

      return {
        name: group.name,
        count: group.count,
        dominantCategory,
        isMixed,
        categoryDistribution: group.categories,
        sampleTransactions: group.sampleTransactions,
      }
    })

    // Sort by count (most frequent first), then by name
    uniqueTransactions.sort((a, b) => {
      if (b.count !== a.count) {
        return b.count - a.count
      }
      return a.name.localeCompare(b.name)
    })

    return NextResponse.json(uniqueTransactions)
  } catch (error) {
    console.error("Get unique transactions error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

