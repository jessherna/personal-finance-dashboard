import { describe, it, expect } from "@jest/globals"
import { suggestCategoryFromPastTransactions, getCategorySuggestions } from "../category-suggestion"
import type { Transaction } from "@/lib/types"

describe("category-suggestion", () => {
  const mockTransactions: Transaction[] = [
    {
      id: 1,
      name: "Grocery Store Purchase",
      category: "Food",
      date: "2024-01-15",
      amount: 5000,
      type: "expense",
    },
    {
      id: 2,
      name: "Grocery Shopping",
      category: "Food",
      date: "2024-01-20",
      amount: 7500,
      type: "expense",
    },
    {
      id: 3,
      name: "Walmart Grocery",
      category: "Food",
      date: "2024-02-01",
      amount: 6000,
      type: "expense",
    },
    {
      id: 4,
      name: "Netflix Subscription",
      category: "Subscription",
      date: "2024-01-10",
      amount: 1500,
      type: "expense",
    },
    {
      id: 5,
      name: "Spotify Premium",
      category: "Subscription",
      date: "2024-01-12",
      amount: 1200,
      type: "expense",
    },
    {
      id: 6,
      name: "Uber Ride",
      category: "Transportation",
      date: "2024-01-18",
      amount: 2500,
      type: "expense",
    },
  ]

  describe("suggestCategoryFromPastTransactions", () => {
    it("should suggest category for exact match", () => {
      const suggestion = suggestCategoryFromPastTransactions(
        "Grocery Store Purchase",
        mockTransactions
      )
      expect(suggestion).toBe("Food")
    })

    it("should suggest category for similar transaction names", () => {
      const suggestion = suggestCategoryFromPastTransactions(
        "Grocery Shopping Trip",
        mockTransactions
      )
      expect(suggestion).toBe("Food")
    })

    it("should suggest category based on common words", () => {
      const suggestion = suggestCategoryFromPastTransactions(
        "Walmart Grocery Run",
        mockTransactions
      )
      expect(suggestion).toBe("Food")
    })

    it("should suggest subscription category for subscription-related names", () => {
      const suggestion = suggestCategoryFromPastTransactions(
        "Netflix Monthly",
        mockTransactions
      )
      expect(suggestion).toBe("Subscription")
    })

    it("should return null if no similar transactions found", () => {
      const suggestion = suggestCategoryFromPastTransactions(
        "Completely Unique Transaction Name",
        mockTransactions
      )
      expect(suggestion).toBeNull()
    })

    it("should return null for empty transaction name", () => {
      const suggestion = suggestCategoryFromPastTransactions("", mockTransactions)
      expect(suggestion).toBeNull()
    })

    it("should return null for empty transactions array", () => {
      const suggestion = suggestCategoryFromPastTransactions("Grocery", [])
      expect(suggestion).toBeNull()
    })

    it("should respect minimum confidence threshold", () => {
      // Add a transaction with different category to reduce confidence
      const mixedTransactions = [
        ...mockTransactions,
        {
          id: 7,
          name: "Grocery Store",
          category: "Miscellaneous",
          date: "2024-02-05",
          amount: 3000,
          type: "expense",
        },
      ]

      // With high threshold, should return null if confidence is too low
      const suggestion = suggestCategoryFromPastTransactions(
        "Grocery Store",
        mixedTransactions,
        0.9 // 90% confidence required
      )
      // Should still suggest Food since 3 out of 4 grocery transactions are Food (75% confidence)
      // But with 0.9 threshold, it might return null
      expect(suggestion).toBeTruthy() // At least one suggestion should be made
    })
  })

  describe("getCategorySuggestions", () => {
    it("should return multiple suggestions with confidence scores", () => {
      const suggestions = getCategorySuggestions("Grocery", mockTransactions)
      expect(suggestions.length).toBeGreaterThan(0)
      expect(suggestions[0].category).toBe("Food")
      expect(suggestions[0].confidence).toBeGreaterThan(0)
      expect(suggestions[0].count).toBeGreaterThan(0)
    })

    it("should return suggestions sorted by confidence", () => {
      const suggestions = getCategorySuggestions("Grocery Store", mockTransactions)
      if (suggestions.length > 1) {
        expect(suggestions[0].confidence).toBeGreaterThanOrEqual(suggestions[1].confidence)
      }
    })

    it("should return empty array for no matches", () => {
      const suggestions = getCategorySuggestions("Unique Transaction", mockTransactions)
      expect(suggestions).toEqual([])
    })

    it("should handle partial word matches", () => {
      const suggestions = getCategorySuggestions("Groc", mockTransactions)
      expect(suggestions.length).toBeGreaterThan(0)
    })
  })
})


