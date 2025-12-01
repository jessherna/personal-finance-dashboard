"use client"

import { useState, useMemo } from "react"
import type { Transaction, TransactionType, TransactionCategory } from "@/lib/types"
import { filterByType, filterByCategory, filterBySearch, sortByDate } from "@/lib/utils"

interface UseTransactionsProps {
  initialTransactions: Transaction[]
}

export function useTransactions({ initialTransactions }: UseTransactionsProps) {
  const [transactions] = useState<Transaction[]>(initialTransactions)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedType, setSelectedType] = useState<TransactionType | "all">("all")
  const [selectedCategory, setSelectedCategory] = useState<TransactionCategory | "all">("all")

  const filteredTransactions = useMemo(() => {
    let filtered = transactions

    // Apply filters
    filtered = filterByType(filtered, selectedType)
    filtered = filterByCategory(filtered, selectedCategory)
    filtered = filterBySearch(filtered, searchQuery)

    // Sort by date
    return sortByDate(filtered)
  }, [transactions, selectedType, selectedCategory, searchQuery])

  return {
    transactions: filteredTransactions,
    searchQuery,
    setSearchQuery,
    selectedType,
    setSelectedType,
    selectedCategory,
    setSelectedCategory,
  }
}
