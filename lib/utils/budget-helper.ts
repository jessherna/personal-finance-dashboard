import mongoose from "mongoose"
import { createTransactionModel } from "@/lib/models/Transaction"
import { createBudgetCategoryModel } from "@/lib/models/Budget"

/**
 * Recalculates and updates the spent amount for a budget category based on transactions
 * Only counts completed expense transactions in the same month as the reference date
 */
export async function recalculateBudgetCategorySpent(
  connection: mongoose.Connection,
  userId: number,
  budgetCategoryId: number,
  referenceDate: string
): Promise<void> {
  try {
    const BudgetCategoryModel = createBudgetCategoryModel(connection)
    const TransactionModel = createTransactionModel(connection)
    
    const budgetCategory = await BudgetCategoryModel.findOne({ id: budgetCategoryId, userId })
    
    if (!budgetCategory) {
      console.warn(`Budget category ${budgetCategoryId} not found for user ${userId}`)
      return
    }
    
    // Get the month and year from the reference date
    const refDate = new Date(referenceDate)
    const refMonth = refDate.getMonth()
    const refYear = refDate.getFullYear()
    
    // Get all completed expense transactions for this budget category
    const transactions = await TransactionModel.find({
      userId,
      budgetCategoryId: budgetCategoryId,
      type: "expense",
      status: { $in: ["completed", null] }
    }).lean().exec()
    
    // Filter to the same month/year and sum amounts
    const spentThisMonth = transactions
      .filter((t: any) => {
        const txnDate = new Date(t.date)
        return txnDate.getMonth() === refMonth && txnDate.getFullYear() === refYear
      })
      .reduce((sum: number, t: any) => sum + (t.amount || 0), 0)
    
    budgetCategory.spent = spentThisMonth
    await budgetCategory.save()
    
    console.log(`Recalculated budget category ${budgetCategoryId} (${budgetCategory.name}) spent: ${spentThisMonth} for ${refMonth + 1}/${refYear}`)
  } catch (error) {
    console.error(`Error recalculating budget category ${budgetCategoryId} spent:`, error)
    throw error
  }
}

