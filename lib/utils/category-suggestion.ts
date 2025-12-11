import type { Transaction, TransactionCategory } from "@/lib/types"

/**
 * Suggests a category for a transaction based on past transactions with similar names
 * @param transactionName - The name of the transaction to categorize
 * @param pastTransactions - Array of past transactions to learn from
 * @param minConfidence - Minimum confidence threshold (0-1) for suggestions
 * @returns The suggested category or null if no confident match is found
 */
export function suggestCategoryFromPastTransactions(
  transactionName: string,
  pastTransactions: Transaction[],
  minConfidence: number = 0.6
): TransactionCategory | null {
  if (!transactionName.trim() || pastTransactions.length === 0) {
    return null
  }

  const nameLower = transactionName.toLowerCase().trim()
  const words = nameLower.split(/\s+/).filter((w) => w.length > 2) // Filter out short words

  // Find transactions with similar names
  const similarTransactions = pastTransactions.filter((txn) => {
    const txnNameLower = txn.name.toLowerCase().trim()
    
    // Exact match
    if (txnNameLower === nameLower) {
      return true
    }
    
    // Check if any significant word matches
    const txnWords = txnNameLower.split(/\s+/).filter((w) => w.length > 2)
    const hasCommonWord = words.some((word) => 
      txnWords.some((txnWord) => 
        txnWord.includes(word) || word.includes(txnWord)
      )
    )
    
    // Check if transaction name contains the input or vice versa
    const containsMatch = txnNameLower.includes(nameLower) || nameLower.includes(txnNameLower)
    
    return hasCommonWord || containsMatch
  })

  if (similarTransactions.length === 0) {
    return null
  }

  // Count category occurrences
  const categoryCounts: Record<string, number> = {}
  similarTransactions.forEach((txn) => {
    const category = txn.category
    categoryCounts[category] = (categoryCounts[category] || 0) + 1
  })

  // Find the most common category
  let maxCount = 0
  let suggestedCategory: TransactionCategory | null = null

  for (const [category, count] of Object.entries(categoryCounts)) {
    if (count > maxCount) {
      maxCount = count
      suggestedCategory = category as TransactionCategory
    }
  }

  // Calculate confidence (percentage of similar transactions using this category)
  const confidence = maxCount / similarTransactions.length

  // Only return suggestion if confidence meets threshold
  if (confidence >= minConfidence && suggestedCategory) {
    return suggestedCategory
  }

  return null
}

/**
 * Gets category suggestions with confidence scores
 * @param transactionName - The name of the transaction to categorize
 * @param pastTransactions - Array of past transactions to learn from
 * @returns Array of suggested categories with confidence scores, sorted by confidence
 */
export function getCategorySuggestions(
  transactionName: string,
  pastTransactions: Transaction[]
): Array<{ category: TransactionCategory; confidence: number; count: number }> {
  if (!transactionName.trim() || pastTransactions.length === 0) {
    return []
  }

  const nameLower = transactionName.toLowerCase().trim()
  const words = nameLower.split(/\s+/).filter((w) => w.length > 2)

  // Find transactions with similar names
  const similarTransactions = pastTransactions.filter((txn) => {
    const txnNameLower = txn.name.toLowerCase().trim()
    
    if (txnNameLower === nameLower) {
      return true
    }
    
    const txnWords = txnNameLower.split(/\s+/).filter((w) => w.length > 2)
    const hasCommonWord = words.some((word) => 
      txnWords.some((txnWord) => 
        txnWord.includes(word) || word.includes(txnWord)
      )
    )
    
    const containsMatch = txnNameLower.includes(nameLower) || nameLower.includes(txnNameLower)
    
    return hasCommonWord || containsMatch
  })

  if (similarTransactions.length === 0) {
    return []
  }

  // Count category occurrences
  const categoryCounts: Record<string, number> = {}
  similarTransactions.forEach((txn) => {
    const category = txn.category
    categoryCounts[category] = (categoryCounts[category] || 0) + 1
  })

  // Convert to array with confidence scores
  const suggestions = Object.entries(categoryCounts)
    .map(([category, count]) => ({
      category: category as TransactionCategory,
      confidence: count / similarTransactions.length,
      count,
    }))
    .sort((a, b) => b.confidence - a.confidence)

  return suggestions
}



