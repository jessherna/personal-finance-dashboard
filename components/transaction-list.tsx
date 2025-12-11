"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowUpRight, ArrowDownRight, MoreVertical, Edit, Trash2, Copy, ArrowUpDown, ArrowUp, ArrowDown, Plus, X, Columns3 } from "lucide-react"
import { cn } from "@/lib/utils"
import { CATEGORY_COLORS } from "@/lib/constants/categories"
import { usePagination } from "@/hooks/use-pagination"
import { filterBySearch, filterByType, filterByCategory } from "@/lib/utils/filters"
import { getCurrentDateInToronto, formatDateTime, formatDate } from "@/lib/utils/date"
import { formatCurrencyFromCents } from "@/lib/utils/format"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "sonner"
import type { Transaction, TransactionCategory, TransactionType, TransactionStatus } from "@/lib/types"
import type { Account } from "@/lib/types"
import type { RecurringBill } from "@/lib/types"
import type { BudgetCategory } from "@/lib/types"
import type { SavingsGoal } from "@/lib/types"
import { useMemo, useEffect } from "react"

// Tableau-inspired colors for categories
const CATEGORY_COLOR_MAP: Record<string, string> = {
  Salary: "#59A14F", // Green
  Transportation: "#4E79A7", // Blue
  Food: "#F28E2C", // Orange
  Subscription: "#AF58BA", // Purple
  Rent: "#E15759", // Red
  Miscellaneous: "#76B7B2", // Teal
  Entertainment: "#EDC949", // Yellow
}

const DEFAULT_CATEGORIES: TransactionCategory[] = [
  "Salary",
  "Transportation",
  "Food",
  "Subscription",
  "Rent",
  "Miscellaneous",
  "Entertainment",
]

type CustomCategory = {
  name: string
  color: string
}

type SortField = "name" | "category" | "date" | "amount" | "status" | null
type SortDirection = "asc" | "desc" | null

interface TransactionListProps {
  transactions: Transaction[]
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>
  customCategories: Record<string, string>
  setCustomCategories: React.Dispatch<React.SetStateAction<Record<string, string>>>
  searchQuery: string
  selectedCategory: string
  selectedType: string
  selectedPeriod: string
  minAmount?: string
  maxAmount?: string
  selectedStatus?: string
  dateFrom?: string
  dateTo?: string
  selectedAccountId?: number | null
  accounts?: Account[]
  setAccounts?: React.Dispatch<React.SetStateAction<Account[]>>
  recurringBills?: RecurringBill[]
  setBills?: React.Dispatch<React.SetStateAction<RecurringBill[]>>
  savingsGoals?: SavingsGoal[]
}

export function TransactionList({
  transactions,
  setTransactions,
  customCategories,
  setCustomCategories,
  searchQuery,
  selectedCategory,
  selectedType,
  selectedPeriod,
  minAmount = "",
  maxAmount = "",
  selectedStatus = "all",
  dateFrom = "",
  dateTo = "",
  selectedAccountId,
  accounts = [],
  setAccounts,
  recurringBills = [],
  setBills,
  savingsGoals = [],
}: TransactionListProps) {
  const { user, isViewingAsUser } = useAuth()
  const [sortField, setSortField] = useState<SortField>("date")
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc")
  
  // Helper function to refresh accounts after transaction updates
  const refreshAccounts = async () => {
    if (!user || !setAccounts) return
    
    try {
      const effectiveUserId = isViewingAsUser ? 2 : user.id
      const headers = {
        "x-user-id": String(effectiveUserId),
        "x-user-role": user.role || "user",
      }
      
      const response = await fetch("/api/accounts", { headers })
      if (response.ok) {
        const data = await response.json()
        setAccounts(data)
      }
    } catch (error) {
      console.error("Error refreshing accounts:", error)
    }
  }

  // Helper function to format time for display
  const formatTime = (time?: string): string => {
    if (!time || !time.trim()) return ""
    
    try {
      let timeStr = time.trim()
      
      // Handle 24-hour format (HH:MM or HH:MM:SS)
      if (timeStr.match(/^\d{1,2}:\d{2}(:\d{2})?$/)) {
        const timeParts = timeStr.split(":")
        const hour24 = parseInt(timeParts[0], 10)
        const minutes = timeParts[1]
        const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24
        const ampm = hour24 >= 12 ? "PM" : "AM"
        return `${hour12}:${minutes} ${ampm}`
      } else if (!timeStr.includes("AM") && !timeStr.includes("PM")) {
        // If no AM/PM and not in HH:MM format, try to parse it
        const timeMatch = timeStr.match(/^(\d{1,2}):(\d{2})/)
        if (timeMatch) {
          const hour24 = parseInt(timeMatch[1], 10)
          const minutes = timeMatch[2]
          const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24
          const ampm = hour24 >= 12 ? "PM" : "AM"
          return `${hour12}:${minutes} ${ampm}`
        }
      }
      
      return timeStr
    } catch {
      return time
    }
  }
  
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isBatchDeleteDialogOpen, setIsBatchDeleteDialogOpen] = useState(false)
  const [isDeleteCategoryDialogOpen, setIsDeleteCategoryDialogOpen] = useState(false)
  const [transactionToDelete, setTransactionToDelete] = useState<number | null>(null)
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null)
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)
  const [selectedTransactionIds, setSelectedTransactionIds] = useState<Set<number>>(new Set())
  const [itemsPerPage, setItemsPerPage] = useState(8)
  const [newCategoryName, setNewCategoryName] = useState("")
  const [newCategoryColor, setNewCategoryColor] = useState("#4E79A7")
  const [budgetCategories, setBudgetCategories] = useState<BudgetCategory[]>([])
  
  // Column visibility state - define all available columns
  type ColumnKey = "category" | "date" | "amount" | "status" | "account" | "budgetCategory" | "savingsGoal" | "recurringBill"
  const allColumns: { key: ColumnKey; label: string }[] = [
    { key: "category", label: "Category" },
    { key: "date", label: "Date & Time" },
    { key: "amount", label: "Amount" },
    { key: "status", label: "Status" },
    { key: "account", label: "Account" },
    { key: "budgetCategory", label: "Budget Category" },
    { key: "savingsGoal", label: "Savings Goal" },
    { key: "recurringBill", label: "Recurring Bill" },
  ]
  
  // Default visible columns (first 4)
  const [visibleColumns, setVisibleColumns] = useState<Set<ColumnKey>>(
    new Set(["category", "date", "amount", "status"])
  )

  // Fetch budget categories
  useEffect(() => {
    const fetchBudgetCategories = async () => {
      if (!user) return

      try {
        const effectiveUserId = isViewingAsUser ? 2 : user.id
        const response = await fetch("/api/budget-categories", {
          headers: {
            "x-user-id": String(effectiveUserId),
            "x-user-role": user.role || "user",
          },
        })

        if (response.ok) {
          const data = await response.json()
          setBudgetCategories(data)
        }
      } catch (error) {
        console.error("Error fetching budget categories:", error)
      }
    }

    fetchBudgetCategories()
  }, [user, isViewingAsUser])
  const [editFormData, setEditFormData] = useState({
    name: "",
    category: "Miscellaneous" as TransactionCategory,
    date: "",
    time: "",
    amount: "",
    type: "expense" as "income" | "expense",
    status: "completed" as "completed" | "pending" | "failed",
    accountId: null as number | null | string,
    budgetCategoryId: null as number | null | string,
    savingsGoalId: "" as string | number,
    savingsAmount: "",
    recurringBillId: null as number | null | string,
  })

  // Merge default and custom categories
  const allCategories = [...DEFAULT_CATEGORIES, ...Object.keys(customCategories)] as TransactionCategory[]
  const categoryColorMap = { ...CATEGORY_COLOR_MAP, ...customCategories }
  
  // Helper to get category color with fallback
  const getCategoryColor = (category: string): string => {
    return categoryColorMap[category] || customCategories[category] || "#76B7B2" // Default to teal if not found
  }

  // Helper function to calculate next due date based on frequency
  const calculateNextDueDate = (currentDate: string, frequency: string): string => {
    const date = new Date(currentDate)
    switch (frequency) {
      case "daily":
        date.setDate(date.getDate() + 1)
        break
      case "weekly":
        date.setDate(date.getDate() + 7)
        break
      case "biweekly":
        date.setDate(date.getDate() + 14)
        break
      case "monthly":
        date.setMonth(date.getMonth() + 1)
        break
      case "quarterly":
        date.setMonth(date.getMonth() + 3)
        break
      case "yearly":
        date.setFullYear(date.getFullYear() + 1)
        break
    }
    return date.toISOString().split("T")[0]
  }

  const handleAddCustomCategory = async () => {
    const trimmedName = newCategoryName.trim()
    if (!trimmedName) {
      toast.error("Category name cannot be empty")
      return
    }
    
    if (allCategories.includes(trimmedName as TransactionCategory)) {
      toast.error("Category already exists")
      return
    }

    if (!user) {
      toast.error("You must be logged in to add custom categories")
      return
    }

    // Ensure color is valid, default to blue if not
    const colorToUse = newCategoryColor && newCategoryColor.startsWith("#") 
      ? newCategoryColor 
      : "#4E79A7"

    try {
      const effectiveUserId = isViewingAsUser ? 2 : user.id
      const headers = {
        "Content-Type": "application/json",
        "x-user-id": String(effectiveUserId),
        "x-user-role": user.role || "user",
      }

      const response = await fetch("/api/custom-categories", {
        method: "POST",
        headers,
        body: JSON.stringify({
          name: trimmedName,
          color: colorToUse,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        toast.error(errorData.error || "Failed to save custom category")
        return
      }

      // Update local state after successful API call
      setCustomCategories((prev) => ({
        ...prev,
        [trimmedName]: colorToUse,
      }))
      
      toast.success(`Category "${trimmedName}" added successfully`)
      setNewCategoryName("")
      setNewCategoryColor("#4E79A7")
      setIsDialogOpen(false)
    } catch (error) {
      console.error("Error adding custom category:", error)
      toast.error("Network error. Please try again.")
    }
  }

  const handleDeleteCustomCategory = (categoryName: string) => {
    setCategoryToDelete(categoryName)
    setIsDeleteCategoryDialogOpen(true)
  }

  const confirmDeleteCategory = async () => {
    if (!categoryToDelete || !user) {
      setIsDeleteCategoryDialogOpen(false)
      setCategoryToDelete(null)
      return
    }

    try {
      const effectiveUserId = isViewingAsUser ? 2 : user.id
      const headers = {
        "x-user-id": String(effectiveUserId),
        "x-user-role": user.role || "user",
      }

      // URL encode the category name
      const encodedName = encodeURIComponent(categoryToDelete)
      const response = await fetch(`/api/custom-categories/${encodedName}`, {
        method: "DELETE",
        headers,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        toast.error(errorData.error || "Failed to delete custom category")
        return
      }

      // Update local state after successful API call
      setCustomCategories((prev) => {
        const updated = { ...prev }
        delete updated[categoryToDelete]
        return updated
      })
      
      // Update transactions that use this category to "Miscellaneous"
      setTransactions((prev) =>
        prev.map((transaction) =>
          transaction.category === categoryToDelete ? { ...transaction, category: "Miscellaneous" } : transaction,
        ),
      )
      
      toast.success(`Category "${categoryToDelete}" deleted successfully`)
      setIsDeleteCategoryDialogOpen(false)
      setCategoryToDelete(null)
    } catch (error) {
      console.error("Error deleting custom category:", error)
      toast.error("Network error. Please try again.")
    }
  }

  // Filter transactions based on search, category, type, period, and account
  const filteredTransactions = useMemo(() => {
    let filtered = [...transactions]

    // Apply account filter
    // When selectedAccountId is null/undefined, show ALL transactions (including those with accountId: null)
    // When selectedAccountId is set, only show transactions with that accountId
    if (selectedAccountId !== null && selectedAccountId !== undefined) {
      filtered = filtered.filter((t) => t.accountId === selectedAccountId)
    }
    // When selectedAccountId is null, we show all transactions (no filter applied)

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filterBySearch(filtered, searchQuery)
    }

    // Apply type filter
    if (selectedType !== "all") {
      filtered = filterByType(filtered, selectedType as "income" | "expense")
    }

    // Apply category filter
    if (selectedCategory !== "all") {
      filtered = filterByCategory(filtered, selectedCategory as TransactionCategory)
    }

    // Apply period filter (filter by date)
    if (selectedPeriod !== "all") {
      const days = parseInt(selectedPeriod)
      // Use Toronto timezone for current date calculations
      const cutoffDate = getCurrentDateInToronto()
      cutoffDate.setDate(cutoffDate.getDate() - days)
      cutoffDate.setHours(0, 0, 0, 0) // Set to start of day
      filtered = filtered.filter((transaction) => {
        // Parse date string - handle various formats
        let transactionDate: Date
        if (transaction.date === "Today") {
          transactionDate = getCurrentDateInToronto()
        } else {
          // Try parsing the date - handle formats like "Dec 01, 2024", "2024-12-01", ISO strings, etc.
          transactionDate = new Date(transaction.date)
          // If parsing fails, try alternative parsing methods
          if (isNaN(transactionDate.getTime())) {
            // Try parsing as a different format or include it to avoid filtering out valid transactions
            return true
          }
        }
        transactionDate.setHours(0, 0, 0, 0)
        return transactionDate >= cutoffDate
      })
    }

    // Apply advanced filters (using absolute values for amount comparison)
    if (minAmount) {
      const min = parseFloat(minAmount) * 100 // Convert to cents
      if (!isNaN(min)) {
        filtered = filtered.filter((t) => Math.abs(t.amount) >= min)
      }
    }

    if (maxAmount) {
      const max = parseFloat(maxAmount) * 100 // Convert to cents
      if (!isNaN(max)) {
        filtered = filtered.filter((t) => Math.abs(t.amount) <= max)
      }
    }

    if (selectedStatus !== "all") {
      filtered = filtered.filter((t) => t.status === selectedStatus)
    }

    if (dateFrom) {
      const fromDate = new Date(dateFrom)
      fromDate.setHours(0, 0, 0, 0)
      filtered = filtered.filter((transaction) => {
        let transactionDate: Date
        if (transaction.date === "Today") {
          transactionDate = getCurrentDateInToronto()
        } else {
          transactionDate = new Date(transaction.date)
        }
        if (isNaN(transactionDate.getTime())) {
          return true
        }
        transactionDate.setHours(0, 0, 0, 0)
        return transactionDate >= fromDate
      })
    }

    if (dateTo) {
      const toDate = new Date(dateTo)
      toDate.setHours(23, 59, 59, 999)
      filtered = filtered.filter((transaction) => {
        let transactionDate: Date
        if (transaction.date === "Today") {
          transactionDate = getCurrentDateInToronto()
        } else {
          transactionDate = new Date(transaction.date)
        }
        if (isNaN(transactionDate.getTime())) {
          return true
        }
        transactionDate.setHours(0, 0, 0, 0)
        return transactionDate <= toDate
      })
    }

    return filtered
  }, [transactions, searchQuery, selectedCategory, selectedType, selectedPeriod, minAmount, maxAmount, selectedStatus, dateFrom, dateTo, selectedAccountId])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Toggle direction if clicking the same field
      setSortDirection(sortDirection === "asc" ? "desc" : sortDirection === "desc" ? null : "asc")
      if (sortDirection === "desc") {
        setSortField(null)
      }
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  const handleToggleSelect = (transactionId: number) => {
    setSelectedTransactionIds((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(transactionId)) {
        newSet.delete(transactionId)
      } else {
        newSet.add(transactionId)
      }
      return newSet
    })
  }

  const handleToggleSelectAll = () => {
    if (paginatedTransactions.length === 0) return
    
    const allSelected = paginatedTransactions.every((t) => selectedTransactionIds.has(t.id))
    
    if (allSelected) {
      // Deselect all on current page
      setSelectedTransactionIds((prev) => {
        const newSet = new Set(prev)
        paginatedTransactions.forEach((t) => newSet.delete(t.id))
        return newSet
      })
    } else {
      // Select all on current page
      setSelectedTransactionIds((prev) => {
        const newSet = new Set(prev)
        paginatedTransactions.forEach((t) => newSet.add(t.id))
        return newSet
      })
    }
  }

  const handleSelectAllEntries = () => {
    const allSelected = sortedTransactions.every((t) => selectedTransactionIds.has(t.id))
    
    if (allSelected) {
      // Deselect all entries
      setSelectedTransactionIds(new Set())
    } else {
      // Select all entries across all pages
      const allIds = new Set(sortedTransactions.map((t) => t.id))
      setSelectedTransactionIds(allIds)
    }
  }

  const sortedTransactions = [...filteredTransactions].sort((a, b) => {
    if (!sortField || !sortDirection) return 0

    let aValue: string | number
    let bValue: string | number

    switch (sortField) {
      case "name":
        aValue = a.name.toLowerCase()
        bValue = b.name.toLowerCase()
        break
      case "category":
        aValue = a.category.toLowerCase()
        bValue = b.category.toLowerCase()
        break
      case "date":
        // Sort by date and time combined (machine format for accurate sorting)
        // Use original date/time values, not the formatted display string
        const aDate = new Date(a.date)
        const bDate = new Date(b.date)
        
        // If time is available, add it to the date for more accurate sorting
        // Time is typically stored in HH:MM format (24-hour) or HH:MM:SS
        if (a.time && b.time) {
          try {
            // Extract time parts (handle both HH:MM and HH:MM:SS formats)
            const aTimeStr = a.time.split(" ")[0] // Remove AM/PM if present
            const bTimeStr = b.time.split(" ")[0]
            const aTimeParts = aTimeStr.split(":")
            const bTimeParts = bTimeStr.split(":")
            
            if (aTimeParts.length >= 2 && bTimeParts.length >= 2) {
              let aHours = parseInt(aTimeParts[0], 10) || 0
              let aMinutes = parseInt(aTimeParts[1], 10) || 0
              let bHours = parseInt(bTimeParts[0], 10) || 0
              let bMinutes = parseInt(bTimeParts[1], 10) || 0
              
              // Handle 12-hour format (check if AM/PM is present in original time)
              if (a.time.toUpperCase().includes("PM") && aHours < 12) aHours = aHours + 12
              if (a.time.toUpperCase().includes("AM") && aHours === 12) aHours = 0
              if (b.time.toUpperCase().includes("PM") && bHours < 12) bHours = bHours + 12
              if (b.time.toUpperCase().includes("AM") && bHours === 12) bHours = 0
              
              aDate.setHours(aHours, aMinutes, 0, 0)
              bDate.setHours(bHours, bMinutes, 0, 0)
            }
          } catch {
            // If time parsing fails, just use date (fallback to date-only sorting)
          }
        } else if (a.time) {
          // Only a has time, try to parse it
          try {
            const aTimeStr = a.time.split(" ")[0]
            const aTimeParts = aTimeStr.split(":")
            if (aTimeParts.length >= 2) {
              let aHours = parseInt(aTimeParts[0], 10) || 0
              let aMinutes = parseInt(aTimeParts[1], 10) || 0
              if (a.time.toUpperCase().includes("PM") && aHours < 12) aHours = aHours + 12
              if (a.time.toUpperCase().includes("AM") && aHours === 12) aHours = 0
              aDate.setHours(aHours, aMinutes, 0, 0)
            }
          } catch {
            // Ignore
          }
        } else if (b.time) {
          // Only b has time, try to parse it
          try {
            const bTimeStr = b.time.split(" ")[0]
            const bTimeParts = bTimeStr.split(":")
            if (bTimeParts.length >= 2) {
              let bHours = parseInt(bTimeParts[0], 10) || 0
              let bMinutes = parseInt(bTimeParts[1], 10) || 0
              if (b.time.toUpperCase().includes("PM") && bHours < 12) bHours = bHours + 12
              if (b.time.toUpperCase().includes("AM") && bHours === 12) bHours = 0
              bDate.setHours(bHours, bMinutes, 0, 0)
            }
          } catch {
            // Ignore
          }
        }
        
        // Use machine format (timestamp) for sorting
        aValue = aDate.getTime()
        bValue = bDate.getTime()
        break
      case "amount":
        aValue = a.amount
        bValue = b.amount
        break
      case "status":
        aValue = a.status || ""
        bValue = b.status || ""
        break
      default:
        return 0
    }

    if (aValue < bValue) return sortDirection === "asc" ? -1 : 1
    if (aValue > bValue) return sortDirection === "asc" ? 1 : -1
    return 0
  })

  const {
    paginatedItems: paginatedTransactions,
    currentPage,
    totalPages,
    goToNextPage,
    goToPreviousPage,
    hasNextPage,
    hasPreviousPage,
    startIndex,
    endIndex,
    totalItems,
  } = usePagination({
    items: sortedTransactions,
    itemsPerPage: itemsPerPage,
  })

  const handleCategoryChange = async (transactionId: number, newCategory: string) => {
    if (!user) {
      toast.error("You must be logged in to update transactions")
      return
    }

    // Find the original transaction to store the old category for potential rollback
    const originalTransaction = transactions.find((t) => t.id === transactionId)
    if (!originalTransaction) {
      toast.error("Transaction not found")
      return
    }

    const originalCategory = originalTransaction.category

    // Optimistically update the UI
    setTransactions((prev) =>
      prev.map((transaction) =>
        transaction.id === transactionId ? { ...transaction, category: newCategory as TransactionCategory } : transaction,
      ),
    )

    try {
      if (!user) {
        toast.error("You must be logged in to update transactions")
        return
      }

      // Get effective user ID (use mock data when viewing as user)
      const effectiveUserId = isViewingAsUser ? 2 : user.id
      const headers = {
        "Content-Type": "application/json",
        "x-user-id": String(effectiveUserId),
        "x-user-role": user.role || "user",
      }

      // Persist the change to the backend
      const response = await fetch(`/api/transactions/${transactionId}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ category: newCategory }),
      })

      if (!response.ok) {
        // Revert the optimistic update on error
        setTransactions((prev) =>
          prev.map((transaction) =>
            transaction.id === transactionId ? { ...transaction, category: originalCategory } : transaction,
          ),
        )
        const errorData = await response.json().catch(() => ({}))
        toast.error(errorData.error || "Failed to update transaction category")
        return
      }

      // Update with the response from the server to ensure consistency
      const updatedTransaction = await response.json()
      setTransactions((prev) =>
        prev.map((transaction) =>
          transaction.id === transactionId ? { ...transaction, category: updatedTransaction.category } : transaction,
        ),
      )
      
      // Refresh accounts in case balance changed (though category change shouldn't affect balance)
      await refreshAccounts()
    } catch (error) {
      // Revert the optimistic update on error
      setTransactions((prev) =>
        prev.map((transaction) =>
          transaction.id === transactionId ? { ...transaction, category: originalCategory } : transaction,
        ),
      )
      console.error("Error updating transaction category:", error)
      toast.error("Network error. Please try again.")
    }
  }

  // Handler for updating account
  const handleAccountChange = async (transactionId: number, newAccountId: number | null) => {
    if (!user) {
      toast.error("You must be logged in to update transactions")
      return
    }

    const originalTransaction = transactions.find((t) => t.id === transactionId)
    if (!originalTransaction) {
      toast.error("Transaction not found")
      return
    }

    const originalAccountId = originalTransaction.accountId

    setTransactions((prev) =>
      prev.map((transaction) =>
        transaction.id === transactionId ? { ...transaction, accountId: newAccountId } : transaction,
      ),
    )

    try {
      const effectiveUserId = isViewingAsUser ? 2 : user.id
      const headers = {
        "Content-Type": "application/json",
        "x-user-id": String(effectiveUserId),
        "x-user-role": user.role || "user",
      }

      const response = await fetch(`/api/transactions/${transactionId}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ accountId: newAccountId }),
      })

      if (!response.ok) {
        setTransactions((prev) =>
          prev.map((transaction) =>
            transaction.id === transactionId ? { ...transaction, accountId: originalAccountId } : transaction,
          ),
        )
        const errorData = await response.json().catch(() => ({}))
        toast.error(errorData.error || "Failed to update transaction account")
        return
      }

      const updatedTransaction = await response.json()
      setTransactions((prev) =>
        prev.map((transaction) =>
          transaction.id === transactionId ? { ...transaction, accountId: updatedTransaction.accountId } : transaction,
        ),
      )
      
      // Refresh accounts since account change affects balances
      await refreshAccounts()
    } catch (error) {
      setTransactions((prev) =>
        prev.map((transaction) =>
          transaction.id === transactionId ? { ...transaction, accountId: originalAccountId } : transaction,
        ),
      )
      console.error("Error updating transaction account:", error)
      toast.error("Network error. Please try again.")
    }
  }

  // Handler for updating budget category
  const handleBudgetCategoryChange = async (transactionId: number, newBudgetCategoryId: number | null) => {
    if (!user) {
      toast.error("You must be logged in to update transactions")
      return
    }

    const originalTransaction = transactions.find((t) => t.id === transactionId)
    if (!originalTransaction) {
      toast.error("Transaction not found")
      return
    }

    const originalBudgetCategoryId = originalTransaction.budgetCategoryId

    setTransactions((prev) =>
      prev.map((transaction) =>
        transaction.id === transactionId ? { ...transaction, budgetCategoryId: newBudgetCategoryId } : transaction,
      ),
    )

    try {
      const effectiveUserId = isViewingAsUser ? 2 : user.id
      const headers = {
        "Content-Type": "application/json",
        "x-user-id": String(effectiveUserId),
        "x-user-role": user.role || "user",
      }

      const response = await fetch(`/api/transactions/${transactionId}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ budgetCategoryId: newBudgetCategoryId }),
      })

      if (!response.ok) {
        setTransactions((prev) =>
          prev.map((transaction) =>
            transaction.id === transactionId ? { ...transaction, budgetCategoryId: originalBudgetCategoryId } : transaction,
          ),
        )
        const errorData = await response.json().catch(() => ({}))
        toast.error(errorData.error || "Failed to update transaction budget category")
        return
      }

      const updatedTransaction = await response.json()
      setTransactions((prev) =>
        prev.map((transaction) =>
          transaction.id === transactionId ? { ...transaction, budgetCategoryId: updatedTransaction.budgetCategoryId } : transaction,
        ),
      )
    } catch (error) {
      setTransactions((prev) =>
        prev.map((transaction) =>
          transaction.id === transactionId ? { ...transaction, budgetCategoryId: originalBudgetCategoryId } : transaction,
        ),
      )
      console.error("Error updating transaction budget category:", error)
      toast.error("Network error. Please try again.")
    }
  }

  // Handler for updating savings goal
  const handleSavingsGoalChange = async (transactionId: number, newSavingsGoalId: number | null) => {
    if (!user) {
      toast.error("You must be logged in to update transactions")
      return
    }

    const originalTransaction = transactions.find((t) => t.id === transactionId)
    if (!originalTransaction) {
      toast.error("Transaction not found")
      return
    }

    const originalSavingsGoalId = originalTransaction.savingsGoalId

    setTransactions((prev) =>
      prev.map((transaction) =>
        transaction.id === transactionId 
          ? { ...transaction, savingsGoalId: newSavingsGoalId === null ? undefined : newSavingsGoalId } 
          : transaction,
      ),
    )

    try {
      const effectiveUserId = isViewingAsUser ? 2 : user.id
      const headers = {
        "Content-Type": "application/json",
        "x-user-id": String(effectiveUserId),
        "x-user-role": user.role || "user",
      }

      const response = await fetch(`/api/transactions/${transactionId}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ savingsGoalId: newSavingsGoalId }),
      })

      if (!response.ok) {
        setTransactions((prev) =>
          prev.map((transaction) =>
            transaction.id === transactionId ? { ...transaction, savingsGoalId: originalSavingsGoalId } : transaction,
          ),
        )
        const errorData = await response.json().catch(() => ({}))
        toast.error(errorData.error || "Failed to update transaction savings goal")
        return
      }

      const updatedTransaction = await response.json()
      setTransactions((prev) =>
        prev.map((transaction) =>
          transaction.id === transactionId ? { ...transaction, savingsGoalId: updatedTransaction.savingsGoalId } : transaction,
        ),
      )
    } catch (error) {
      setTransactions((prev) =>
        prev.map((transaction) =>
          transaction.id === transactionId ? { ...transaction, savingsGoalId: originalSavingsGoalId } : transaction,
        ),
      )
      console.error("Error updating transaction savings goal:", error)
      toast.error("Network error. Please try again.")
    }
  }

  // Handler for updating recurring bill
  const handleRecurringBillChange = async (transactionId: number, newRecurringBillId: number | null) => {
    if (!user) {
      toast.error("You must be logged in to update transactions")
      return
    }

    const originalTransaction = transactions.find((t) => t.id === transactionId)
    if (!originalTransaction) {
      toast.error("Transaction not found")
      return
    }

    const originalRecurringBillId = originalTransaction.recurringBillId

    setTransactions((prev) =>
      prev.map((transaction) =>
        transaction.id === transactionId ? { ...transaction, recurringBillId: newRecurringBillId } : transaction,
      ),
    )

    try {
      const effectiveUserId = isViewingAsUser ? 2 : user.id
      const headers = {
        "Content-Type": "application/json",
        "x-user-id": String(effectiveUserId),
        "x-user-role": user.role || "user",
      }

      const response = await fetch(`/api/transactions/${transactionId}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ recurringBillId: newRecurringBillId }),
      })

      if (!response.ok) {
        setTransactions((prev) =>
          prev.map((transaction) =>
            transaction.id === transactionId ? { ...transaction, recurringBillId: originalRecurringBillId } : transaction,
          ),
        )
        const errorData = await response.json().catch(() => ({}))
        toast.error(errorData.error || "Failed to update transaction recurring bill")
        return
      }

      const updatedTransaction = await response.json()
      setTransactions((prev) =>
        prev.map((transaction) =>
          transaction.id === transactionId ? { ...transaction, recurringBillId: updatedTransaction.recurringBillId } : transaction,
        ),
      )
    } catch (error) {
      setTransactions((prev) =>
        prev.map((transaction) =>
          transaction.id === transactionId ? { ...transaction, recurringBillId: originalRecurringBillId } : transaction,
        ),
      )
      console.error("Error updating transaction recurring bill:", error)
      toast.error("Network error. Please try again.")
    }
  }

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction)
    // Parse date from "Dec 01, 2025" format to "YYYY-MM-DD"
    let dateStr = ""
    try {
      const date = new Date(transaction.date)
      if (!isNaN(date.getTime())) {
        dateStr = date.toISOString().split("T")[0]
      } else {
        // If date is "Today", use today's date in Toronto timezone
        dateStr = getCurrentDateInToronto().toISOString().split("T")[0]
      }
    } catch {
      dateStr = getCurrentDateInToronto().toISOString().split("T")[0]
    }

    // Parse time from "09:00 AM" format to "HH:MM"
    let timeStr = ""
    if (transaction.time) {
      try {
        const time = new Date(`2000-01-01 ${transaction.time}`)
        if (!isNaN(time.getTime())) {
          timeStr = time.toTimeString().slice(0, 5)
        } else {
          // Use Toronto timezone for current time
          timeStr = getCurrentDateInToronto().toTimeString().slice(0, 5)
        }
      } catch {
        // Use Toronto timezone for current time
        timeStr = getCurrentDateInToronto().toTimeString().slice(0, 5)
      }
    } else {
      // Use Toronto timezone for current time
      timeStr = getCurrentDateInToronto().toTimeString().slice(0, 5)
    }

    setEditFormData({
      name: transaction.name,
      category: transaction.category,
      date: dateStr,
      time: timeStr,
      amount: (transaction.amount / 100).toFixed(2),
      type: transaction.type,
      status: transaction.status || "completed",
      accountId: transaction.accountId === null || transaction.accountId === undefined ? "none" : transaction.accountId,
      budgetCategoryId: transaction.budgetCategoryId === null || transaction.budgetCategoryId === undefined ? "none" : transaction.budgetCategoryId,
      savingsGoalId: transaction.savingsGoalId === null || transaction.savingsGoalId === undefined ? "" : transaction.savingsGoalId,
      savingsAmount: transaction.savingsAmount ? (transaction.savingsAmount / 100).toFixed(2) : "",
      recurringBillId: transaction.recurringBillId === null || transaction.recurringBillId === undefined ? "none" : transaction.recurringBillId,
    })
    setIsEditDialogOpen(true)
  }

  const handleSaveEdit = async () => {
    if (!editingTransaction || !editFormData.name.trim() || !editFormData.amount || !user) {
      return
    }

    const amount = parseFloat(editFormData.amount)
    if (isNaN(amount) || amount <= 0) {
      return
    }

    // Format date as ISO string for API (YYYY-MM-DD)
    const dateStr = new Date(editFormData.date).toISOString().split("T")[0]
    const timeStr = editFormData.time || "00:00"

    // Parse recurring bill ID
    const recurringBillId = editFormData.recurringBillId === "none" || editFormData.recurringBillId === "" || editFormData.recurringBillId === null
      ? null
      : typeof editFormData.recurringBillId === "string"
        ? parseInt(editFormData.recurringBillId)
        : editFormData.recurringBillId

    // Parse budget category ID
    const budgetCategoryId = editFormData.budgetCategoryId === "none" || editFormData.budgetCategoryId === "" || editFormData.budgetCategoryId === null
      ? null
      : typeof editFormData.budgetCategoryId === "string"
        ? parseInt(editFormData.budgetCategoryId)
        : editFormData.budgetCategoryId

    // Parse savings goal ID
    const savingsGoalId = editFormData.savingsGoalId === "" || editFormData.savingsGoalId === null || editFormData.savingsGoalId === "none"
      ? null
      : typeof editFormData.savingsGoalId === "string"
        ? parseInt(editFormData.savingsGoalId)
        : editFormData.savingsGoalId

    // Parse savings amount
    const savingsAmount = editFormData.savingsAmount && editFormData.savingsAmount !== ""
      ? Math.round(parseFloat(editFormData.savingsAmount) * 100)
      : undefined

    // Parse account ID
    const accountId = editFormData.accountId === "none" || editFormData.accountId === "" || editFormData.accountId === null
      ? null
      : typeof editFormData.accountId === "string"
        ? parseInt(editFormData.accountId)
        : editFormData.accountId

    // Store original values for rollback
    const originalTransaction = { ...editingTransaction }

    // Optimistically update the UI
    const formattedDateStr = new Date(editFormData.date).toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    })
    const formattedTimeStr = new Date(`2000-01-01T${editFormData.time}`).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    })

    setTransactions((prev) =>
      prev.map((transaction) =>
        transaction.id === editingTransaction.id
          ? {
              ...transaction,
              name: editFormData.name.trim(),
              category: editFormData.category,
              date: formattedDateStr,
              time: formattedTimeStr,
              amount: Math.round(amount * 100),
              type: editFormData.type,
              status: editFormData.status,
              accountId: accountId,
              budgetCategoryId: budgetCategoryId,
              savingsGoalId: savingsGoalId || undefined,
              savingsAmount: savingsAmount,
              recurringBillId: recurringBillId,
            }
          : transaction,
      ),
    )

    try {
      const effectiveUserId = isViewingAsUser ? 2 : user.id
      const headers = {
        "Content-Type": "application/json",
        "x-user-id": String(effectiveUserId),
        "x-user-role": user.role || "user",
      }

      const response = await fetch(`/api/transactions/${editingTransaction.id}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({
          name: editFormData.name.trim(),
          category: editFormData.category,
          date: dateStr,
          time: timeStr,
          amount: Math.round(amount * 100),
          type: editFormData.type,
          status: editFormData.status,
          accountId: accountId,
          budgetCategoryId: budgetCategoryId,
          savingsGoalId: savingsGoalId || undefined,
          savingsAmount: savingsAmount,
          recurringBillId: recurringBillId,
        }),
      })

      if (!response.ok) {
        // Revert optimistic update on error
        setTransactions((prev) =>
          prev.map((transaction) =>
            transaction.id === editingTransaction.id ? originalTransaction : transaction,
          ),
        )
        const errorData = await response.json().catch(() => ({}))
        toast.error(errorData.error || "Failed to update transaction")
        return
      }

      // Update with the response from the server to ensure consistency
      const updatedTransaction = await response.json()
      setTransactions((prev) =>
        prev.map((transaction) =>
          transaction.id === editingTransaction.id
            ? {
                ...transaction,
                name: updatedTransaction.name,
                category: updatedTransaction.category,
                date: formattedDateStr,
                time: formattedTimeStr,
                amount: updatedTransaction.amount,
                type: updatedTransaction.type,
                status: updatedTransaction.status,
                accountId: updatedTransaction.accountId,
                budgetCategoryId: updatedTransaction.budgetCategoryId,
                savingsGoalId: updatedTransaction.savingsGoalId,
                savingsAmount: updatedTransaction.savingsAmount,
                recurringBillId: updatedTransaction.recurringBillId,
              }
            : transaction,
        ),
      )

      // Update recurring bill if this transaction pays a bill
      if (setBills && recurringBillId !== null) {
        const bill = recurringBills.find((b) => b.id === recurringBillId)
        if (bill) {
          const paymentDate = dateStr // ISO date string
          // Calculate next due date based on payment date, not current nextDueDate
          const nextDueDate = calculateNextDueDate(paymentDate, bill.frequency)
          setBills((prev) =>
            prev.map((b) =>
              b.id === recurringBillId
                ? {
                    ...b,
                    nextDueDate: nextDueDate,
                    lastPaidDate: paymentDate,
                  }
                : b
            )
          )
        }
      }

      toast.success("Transaction updated successfully")
      setIsEditDialogOpen(false)
      setEditingTransaction(null)
      
      // Refresh accounts in case balance changed
      await refreshAccounts()
    } catch (error) {
      // Revert optimistic update on error
      setTransactions((prev) =>
        prev.map((transaction) =>
          transaction.id === editingTransaction.id ? originalTransaction : transaction,
        ),
      )
      console.error("Error updating transaction:", error)
      toast.error("Network error. Please try again.")
    }
  }

  const handleDuplicate = (transaction: Transaction) => {
    const newId = Math.max(...transactions.map((t) => t.id), 0) + 1
    const duplicatedTransaction: Transaction = {
      ...transaction,
      id: newId,
      name: `${transaction.name} (Copy)`,
    }
    setTransactions((prev) => [duplicatedTransaction, ...prev])
  }

  const handleDelete = (transactionId: number) => {
    setTransactionToDelete(transactionId)
    setIsDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (transactionToDelete === null || !user) return

    try {
      const effectiveUserId = isViewingAsUser ? 2 : user.id
      const headers = {
        "x-user-id": String(effectiveUserId),
        "x-user-role": user.role || "user",
      }

      const response = await fetch(`/api/transactions/${transactionToDelete}`, {
        method: "DELETE",
        headers,
      })

      if (response.ok) {
        setTransactions((prev) => prev.filter((transaction) => transaction.id !== transactionToDelete))
        setIsDeleteDialogOpen(false)
        setTransactionToDelete(null)
        toast.success("Transaction deleted successfully")
        
        // Refresh accounts since deletion affects account balances
        await refreshAccounts()
      } else {
        const error = await response.json()
        toast.error(error.error || "Failed to delete transaction")
      }
    } catch (error) {
      console.error("Error deleting transaction:", error)
      toast.error("Failed to delete transaction")
    }
  }

  const handleBatchDelete = () => {
    if (selectedTransactionIds.size === 0) return
    setIsBatchDeleteDialogOpen(true)
  }

  const confirmBatchDelete = async () => {
    if (selectedTransactionIds.size === 0 || !user) return

    const idsToDelete = Array.from(selectedTransactionIds)
    const effectiveUserId = isViewingAsUser ? 2 : user.id
    const headers = {
      "x-user-id": String(effectiveUserId),
      "x-user-role": user.role || "user",
    }

    try {
      // Delete all selected transactions in parallel
      const deletePromises = idsToDelete.map((id) =>
        fetch(`/api/transactions/${id}`, {
          method: "DELETE",
          headers,
        })
      )

      const results = await Promise.allSettled(deletePromises)
      
      // Check which deletions succeeded
      const successfulDeletes: number[] = []
      const failedDeletes: number[] = []

      results.forEach((result, index) => {
        if (result.status === "fulfilled" && result.value.ok) {
          successfulDeletes.push(idsToDelete[index])
        } else {
          failedDeletes.push(idsToDelete[index])
        }
      })

      // Update transactions state - remove successfully deleted transactions
      if (successfulDeletes.length > 0) {
        setTransactions((prev) => prev.filter((transaction) => !successfulDeletes.includes(transaction.id)))
        setSelectedTransactionIds(new Set())
        toast.success(`Successfully deleted ${successfulDeletes.length} transaction${successfulDeletes.length > 1 ? "s" : ""}`)
        
        // Refresh accounts since deletion affects account balances
        await refreshAccounts()
      }

      if (failedDeletes.length > 0) {
        toast.error(`Failed to delete ${failedDeletes.length} transaction${failedDeletes.length > 1 ? "s" : ""}`)
      }

      setIsBatchDeleteDialogOpen(false)
    } catch (error) {
      console.error("Error deleting transactions:", error)
      toast.error("Failed to delete transactions")
      setIsBatchDeleteDialogOpen(false)
    }
  }

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <ArrowUpDown className="ml-1 h-3 w-3 opacity-50" />
    }
    if (sortDirection === "asc") {
      return <ArrowUp className="ml-1 h-3 w-3" />
    }
    if (sortDirection === "desc") {
      return <ArrowDown className="ml-1 h-3 w-3" />
    }
    return <ArrowUpDown className="ml-1 h-3 w-3 opacity-50" />
  }

  // Handle column visibility toggle
  const handleToggleColumn = (columnKey: ColumnKey) => {
    setVisibleColumns((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(columnKey)) {
        // If trying to remove and we have more than 2, allow removal
        // But ensure at least 2 columns remain visible
        if (newSet.size > 2) {
          newSet.delete(columnKey)
        }
      } else {
        // If trying to add and we have less than 4, allow addition
        if (newSet.size < 4) {
          newSet.add(columnKey)
        } else {
          toast.error("Maximum 4 columns can be visible at once")
        }
      }
      return newSet
    })
  }

  return (
    <Card>
      <CardContent className="p-0">
        {/* Column selector and batch actions */}
        <div className="flex items-center justify-between border-b border-border px-6 py-3">
          <div className="flex items-center gap-2">
            <Columns3 className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Visible Columns ({visibleColumns.size}/4)</span>
          </div>
          <div className="flex items-center gap-2">
            {selectedTransactionIds.size > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleBatchDelete}
                className="gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Delete Selected ({selectedTransactionIds.size})
              </Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Columns3 className="h-4 w-4 mr-2" />
                  Columns
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {allColumns.map((column) => {
                  const isVisible = visibleColumns.has(column.key)
                  const isDisabled = !isVisible && visibleColumns.size >= 4
                  return (
                    <DropdownMenuItem
                      key={column.key}
                      onClick={() => handleToggleColumn(column.key)}
                      disabled={isDisabled}
                      className="flex items-center justify-between cursor-pointer"
                    >
                      <span>{column.label}</span>
                      <Checkbox
                        checked={isVisible}
                        onCheckedChange={() => handleToggleColumn(column.key)}
                        disabled={isDisabled}
                        className="pointer-events-none"
                      />
                    </DropdownMenuItem>
                  )
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <div className="border rounded-lg">
          <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-3 py-4 text-left w-12">
                    <Checkbox
                      checked={paginatedTransactions.length > 0 && paginatedTransactions.every((t) => selectedTransactionIds.has(t.id))}
                      onCheckedChange={handleToggleSelectAll}
                    />
                  </th>
                  <th className="px-3 py-4 text-left">
                    <button
                      onClick={() => handleSort("name")}
                      className="flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Transaction
                      <SortIcon field="name" />
                    </button>
                  </th>
                  {visibleColumns.has("category") && (
                    <th className="px-3 py-4 text-left">
                      <button
                        onClick={() => handleSort("category")}
                        className="flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                      >
                        Category
                        <SortIcon field="category" />
                      </button>
                    </th>
                  )}
                {visibleColumns.has("date") && (
                  <th className="px-3 py-4 text-left">
                    <button
                      onClick={() => handleSort("date")}
                      className="flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Date & Time
                      <SortIcon field="date" />
                    </button>
                  </th>
                )}
                {visibleColumns.has("amount") && (
                  <th className="px-3 py-4 text-right">
                    <button
                      onClick={() => handleSort("amount")}
                      className="flex items-center justify-end ml-auto text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Amount
                      <SortIcon field="amount" />
                    </button>
                  </th>
                )}
                {visibleColumns.has("status") && (
                  <th className="px-3 py-4 text-left">
                    <button
                      onClick={() => handleSort("status")}
                      className="flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Status
                      <SortIcon field="status" />
                    </button>
                  </th>
                )}
                {visibleColumns.has("account") && (
                  <th className="px-3 py-4 text-left text-sm font-medium text-muted-foreground">Account</th>
                )}
                {visibleColumns.has("budgetCategory") && (
                  <th className="px-3 py-4 text-left text-sm font-medium text-muted-foreground">Budget Category</th>
                )}
                {visibleColumns.has("savingsGoal") && (
                  <th className="px-3 py-4 text-left text-sm font-medium text-muted-foreground">Savings Goal</th>
                )}
                {visibleColumns.has("recurringBill") && (
                  <th className="px-3 py-4 text-left text-sm font-medium text-muted-foreground">Recurring Bill</th>
                )}
                <th className="px-3 py-4 text-right text-sm font-medium text-muted-foreground w-20">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {paginatedTransactions.map((transaction) => (
                <tr key={transaction.id} className="hover:bg-muted/50 transition-colors group">
                  <td className="px-3 py-4">
                    <Checkbox
                      checked={selectedTransactionIds.has(transaction.id)}
                      onCheckedChange={() => handleToggleSelect(transaction.id)}
                    />
                  </td>
                  <td className="px-3 py-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "flex h-10 w-10 items-center justify-center rounded-lg",
                          transaction.type === "income" ? "bg-success/10" : "bg-muted",
                        )}
                      >
                        {transaction.type === "income" ? (
                          <ArrowDownRight className="h-5 w-5 text-success" />
                        ) : (
                          <ArrowUpRight className="h-5 w-5 text-destructive" />
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-foreground">{transaction.name}</div>
                        <div className="text-sm text-muted-foreground capitalize">{transaction.type}</div>
                      </div>
                    </div>
                  </td>
                  {visibleColumns.has("category") && (
                    <td className="px-3 py-4">
                      <Select
                        value={transaction.category}
                        onValueChange={(value: TransactionCategory) => handleCategoryChange(transaction.id, value)}
                      >
                        <SelectTrigger
                          className="h-8 min-w-fit w-auto border-0 px-3 py-1.5 focus:ring-2 focus:ring-offset-0 transition-all hover:opacity-80"
                          style={{
                            backgroundColor: getCategoryColor(transaction.category) + "20",
                            color: getCategoryColor(transaction.category),
                            borderColor: getCategoryColor(transaction.category) + "40",
                          }}
                        >
                          <SelectValue>
                            <div className="flex items-center gap-2 whitespace-nowrap">
                              <div
                                className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                                style={{ backgroundColor: getCategoryColor(transaction.category) }}
                              />
                              <span className="font-medium text-sm">{transaction.category}</span>
                            </div>
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent onCloseAutoFocus={(e) => e.preventDefault()}>
                          {allCategories.map((category) => (
                            <SelectItem key={category} value={category}>
                              <div className="flex items-center justify-between gap-2 w-full">
                                <div className="flex items-center gap-2">
                                  <div
                                    className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                                    style={{ backgroundColor: getCategoryColor(category) }}
                                  />
                                  <span>{category}</span>
                                </div>
                                {customCategories[category] && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      e.preventDefault()
                                      handleDeleteCustomCategory(category)
                                    }}
                                    className="ml-auto p-1 hover:bg-destructive/10 rounded transition-colors"
                                    aria-label={`Delete ${category} category`}
                                  >
                                    <X className="h-3 w-3 text-destructive" />
                                  </button>
                                )}
                              </div>
                            </SelectItem>
                          ))}
                          <div className="border-t border-border mt-1 pt-1 px-2">
                            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                              <DialogTrigger asChild>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setIsDialogOpen(true)
                                  }}
                                  className="w-full px-2 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-sm flex items-center gap-2 transition-colors"
                                >
                                  <Plus className="h-4 w-4" />
                                  Add Custom Category
                                </button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Add Custom Category</DialogTitle>
                                  <DialogDescription>Create a new category with your chosen color.</DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                  <div className="space-y-2">
                                    <Label htmlFor="category-name">Category Name</Label>
                                    <Input
                                      id="category-name"
                                      placeholder="e.g., Healthcare, Travel"
                                      value={newCategoryName}
                                      onChange={(e) => setNewCategoryName(e.target.value)}
                                      onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                          handleAddCustomCategory()
                                        }
                                      }}
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="category-color">Color</Label>
                                    <div className="flex items-center gap-3">
                                      <input
                                        type="color"
                                        id="category-color"
                                        value={newCategoryColor}
                                        onChange={(e) => setNewCategoryColor(e.target.value)}
                                        className="h-10 w-20 rounded border border-border cursor-pointer"
                                      />
                                      <div className="flex-1">
                                        <Input
                                          value={newCategoryColor}
                                          onChange={(e) => setNewCategoryColor(e.target.value)}
                                          placeholder="#4E79A7"
                                          pattern="^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$"
                                        />
                                      </div>
                                      <div
                                        className="h-10 w-20 rounded border border-border"
                                        style={{ backgroundColor: newCategoryColor }}
                                      />
                                    </div>
                                  </div>
                                </div>
                                <DialogFooter>
                                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                                    Cancel
                                  </Button>
                                  <Button
                                    onClick={handleAddCustomCategory}
                                    disabled={!newCategoryName.trim() || allCategories.includes(newCategoryName.trim() as TransactionCategory)}
                                  >
                                    Add Category
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          </div>
                        </SelectContent>
                      </Select>
                    </td>
                  )}
                  {visibleColumns.has("date") && (
                    <td className="px-3 py-4">
                      <div className="text-sm">
                        <div className="text-foreground">{formatDate(transaction.date)}</div>
                        {transaction.time && (
                          <div className="text-muted-foreground">@{formatTime(transaction.time)}</div>
                        )}
                      </div>
                    </td>
                  )}
                  {visibleColumns.has("amount") && (
                    <td className="px-3 py-4 text-right">
                      <span
                        className={cn(
                          "font-semibold",
                          transaction.type === "income" ? "text-success" : "text-destructive",
                        )}
                      >
                        {formatCurrencyFromCents(Math.abs(transaction.amount))}
                      </span>
                    </td>
                  )}
                  {visibleColumns.has("status") && (
                    <td className="px-3 py-4">
                      <Badge
                        variant={transaction.status === "completed" ? "default" : "secondary"}
                        className={
                          transaction.status === "completed"
                            ? "bg-success/10 text-success border-success/20 hover:bg-success/20"
                            : ""
                        }
                      >
                        {transaction.status}
                      </Badge>
                    </td>
                  )}
                  {visibleColumns.has("account") && (
                    <td className="px-3 py-4">
                      <Select
                        value={transaction.accountId ? String(transaction.accountId) : "none"}
                        onValueChange={(value) => handleAccountChange(transaction.id, value === "none" ? null : parseInt(value))}
                      >
                        <SelectTrigger className="h-8 w-full">
                          <SelectValue placeholder="No Account" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No Account</SelectItem>
                          {accounts.filter((a) => a.isActive).map((account) => (
                            <SelectItem key={account.id} value={String(account.id)}>
                              <div className="flex items-center gap-2">
                                <span>{account.icon}</span>
                                <span>{account.name}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                  )}
                  {visibleColumns.has("budgetCategory") && (
                    <td className="px-3 py-4">
                      <Select
                        value={transaction.budgetCategoryId ? String(transaction.budgetCategoryId) : "none"}
                        onValueChange={(value) => handleBudgetCategoryChange(transaction.id, value === "none" ? null : parseInt(value))}
                      >
                        <SelectTrigger className="h-8 w-full">
                          <SelectValue placeholder="No Budget" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No Budget</SelectItem>
                          {budgetCategories.map((category) => (
                            <SelectItem key={category.id} value={String(category.id)}>
                              <div className="flex items-center gap-2">
                                <span>{category.icon}</span>
                                <span>{category.name}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                  )}
                  {visibleColumns.has("savingsGoal") && (
                    <td className="px-3 py-4">
                      <Select
                        value={transaction.savingsGoalId ? String(transaction.savingsGoalId) : "none"}
                        onValueChange={(value) => handleSavingsGoalChange(transaction.id, value === "none" ? null : parseInt(value))}
                      >
                        <SelectTrigger className="h-8 w-full">
                          <SelectValue placeholder="No Goal" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No Goal</SelectItem>
                          {savingsGoals.map((goal) => (
                            <SelectItem key={goal.id} value={String(goal.id)}>
                              {goal.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                  )}
                  {visibleColumns.has("recurringBill") && (
                    <td className="px-3 py-4">
                      <Select
                        value={transaction.recurringBillId ? String(transaction.recurringBillId) : "none"}
                        onValueChange={(value) => handleRecurringBillChange(transaction.id, value === "none" ? null : parseInt(value))}
                      >
                        <SelectTrigger className="h-8 w-full">
                          <SelectValue placeholder="No Bill" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No Bill</SelectItem>
                          {recurringBills.filter((b) => b.isActive).map((bill) => (
                            <SelectItem key={bill.id} value={String(bill.id)}>
                              {bill.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                  )}
                  <td className="px-3 py-4 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(transaction)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDuplicate(transaction)}>
                          <Copy className="mr-2 h-4 w-4" />
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => handleDelete(transaction.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-4 border-t border-border px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            <div className="text-sm text-muted-foreground">
              Showing{" "}
              <span className="font-medium text-foreground">
                {startIndex}-{endIndex}
              </span>{" "}
              of <span className="font-medium text-foreground">{totalItems}</span> transactions
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Per page:</span>
              <Select value={String(itemsPerPage)} onValueChange={(value) => setItemsPerPage(parseInt(value))}>
                <SelectTrigger className="h-8 w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="8">8</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleSelectAllEntries}
              className="text-xs"
            >
              {sortedTransactions.every((t) => selectedTransactionIds.has(t.id)) ? "Deselect All" : "Select All Entries"}
            </Button>
            <Button variant="outline" size="sm" disabled={!hasPreviousPage} onClick={goToPreviousPage}>
              Previous
            </Button>
            <Button variant="outline" size="sm" disabled={!hasNextPage} onClick={goToNextPage}>
              Next
            </Button>
          </div>
        </div>
      </CardContent>

      {/* Edit Transaction Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[700px] lg:max-w-[900px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Transaction</DialogTitle>
            <DialogDescription>Update the details for this transaction.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-transaction-name">Transaction Name</Label>
              <Input
                id="edit-transaction-name"
                placeholder="e.g., Grocery Shopping, Salary"
                value={editFormData.name}
                onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && editFormData.name.trim() && editFormData.amount) {
                    handleSaveEdit()
                  }
                }}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-transaction-type">Type</Label>
                <Select
                  value={editFormData.type}
                  onValueChange={(value: "income" | "expense") => setEditFormData({ ...editFormData, type: value })}
                >
                  <SelectTrigger id="edit-transaction-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="income">Income</SelectItem>
                    <SelectItem value="expense">Expense</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-transaction-category">Category</Label>
                <Select
                  value={editFormData.category}
                  onValueChange={(value: TransactionCategory) => setEditFormData({ ...editFormData, category: value })}
                >
                  <SelectTrigger
                    id="edit-transaction-category"
                    className="h-10"
                    style={{
                      backgroundColor: getCategoryColor(editFormData.category) + "20",
                      color: getCategoryColor(editFormData.category),
                      borderColor: getCategoryColor(editFormData.category) + "40",
                    }}
                  >
                    <SelectValue>
                      <div className="flex items-center gap-2">
                        <div
                          className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: getCategoryColor(editFormData.category) }}
                        />
                        <span className="font-medium text-sm">{editFormData.category}</span>
                      </div>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent onCloseAutoFocus={(e) => e.preventDefault()}>
                    {allCategories.map((category) => (
                      <SelectItem key={category} value={category}>
                        <div className="flex items-center gap-2">
                          <div
                            className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: getCategoryColor(category) }}
                          />
                          <span>{category}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-transaction-amount">Amount (C$)</Label>
              <Input
                id="edit-transaction-amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={editFormData.amount}
                onChange={(e) => setEditFormData({ ...editFormData, amount: e.target.value })}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && editFormData.name.trim() && editFormData.amount) {
                    handleSaveEdit()
                  }
                }}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-transaction-date">Date</Label>
                <Input
                  id="edit-transaction-date"
                  type="date"
                  value={editFormData.date}
                  onChange={(e) => setEditFormData({ ...editFormData, date: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-transaction-time">Time</Label>
                <Input
                  id="edit-transaction-time"
                  type="time"
                  value={editFormData.time}
                  onChange={(e) => setEditFormData({ ...editFormData, time: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-transaction-status">Status</Label>
              <Select
                value={editFormData.status}
                onValueChange={(value: "completed" | "pending" | "failed") =>
                  setEditFormData({ ...editFormData, status: value })
                }
              >
                <SelectTrigger id="edit-transaction-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-account">Account <span className="text-destructive">*</span></Label>
              <Select
                value={editFormData.accountId === null || editFormData.accountId === "none" ? "" : String(editFormData.accountId)}
                onValueChange={(value) => 
                  setEditFormData({ 
                    ...editFormData, 
                    accountId: value === "" ? null : value 
                  })
                }
                required
              >
                <SelectTrigger id="edit-account">
                  <SelectValue placeholder="Select account (required)" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.filter(a => a.isActive).map((account) => (
                    <SelectItem key={account.id} value={String(account.id)}>
                      <div className="flex items-center gap-2">
                        <span>{account.icon || "💳"}</span>
                        <span>{account.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-budget-category">Budget Category (Optional)</Label>
              <Select
                value={editFormData.budgetCategoryId === null || editFormData.budgetCategoryId === "none" ? "none" : String(editFormData.budgetCategoryId)}
                onValueChange={(value) => 
                  setEditFormData({ 
                    ...editFormData, 
                    budgetCategoryId: value === "none" ? null : value 
                  })
                }
              >
                <SelectTrigger id="edit-budget-category">
                  <SelectValue placeholder="Select budget category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Budget</SelectItem>
                  {budgetCategories.map((category) => (
                    <SelectItem key={category.id} value={String(category.id)}>
                      <div className="flex items-center gap-2">
                        <span>{category.icon}</span>
                        <span>{category.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-savings-goal">Allocate to Savings Goal (Optional)</Label>
              <Select
                value={editFormData.savingsGoalId === "" || editFormData.savingsGoalId === null ? "none" : String(editFormData.savingsGoalId)}
                onValueChange={(value) => 
                  setEditFormData({ 
                    ...editFormData, 
                    savingsGoalId: value === "none" ? "" : value,
                    savingsAmount: value === "none" ? "" : editFormData.savingsAmount
                  })
                }
              >
                <SelectTrigger id="edit-savings-goal">
                  <SelectValue placeholder="Select savings goal" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Savings Goal</SelectItem>
                  {savingsGoals.map((goal) => {
                    const IconComponent = goal.icon
                    return (
                      <SelectItem key={goal.id} value={String(goal.id)}>
                        <div className="flex items-center gap-2">
                          <IconComponent className="h-4 w-4" style={{ color: goal.color }} />
                          <span>{goal.name}</span>
                        </div>
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>

            {editFormData.savingsGoalId && editFormData.savingsGoalId !== "" && (
              <div className="space-y-2">
                <Label htmlFor="edit-savings-amount">Savings Amount (C$)</Label>
                <Input
                  id="edit-savings-amount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={editFormData.savingsAmount}
                  onChange={(e) => setEditFormData({ ...editFormData, savingsAmount: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  This amount will be allocated to the selected savings goal and won't be counted as income or expense.
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="edit-recurring-bill">Recurring Bill (Optional)</Label>
              <Select
                value={editFormData.recurringBillId === null ? "none" : String(editFormData.recurringBillId)}
                onValueChange={(value) => {
                  if (value === "none") {
                    setEditFormData({ ...editFormData, recurringBillId: null })
                  } else {
                    const billId = parseInt(value)
                    const bill = recurringBills.find((b) => b.id === billId)
                    if (bill) {
                      // Auto-fill transaction details from bill
                      setEditFormData({
                        ...editFormData,
                        recurringBillId: billId,
                        name: bill.name,
                        category: bill.category as TransactionCategory,
                        amount: (bill.amount / 100).toFixed(2),
                        type: "expense",
                      })
                    } else {
                      setEditFormData({ ...editFormData, recurringBillId: billId })
                    }
                  }
                }}
              >
                <SelectTrigger id="edit-recurring-bill">
                  <SelectValue placeholder="Select recurring bill" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Recurring Bill</SelectItem>
                  {recurringBills.filter((bill) => bill.isActive).map((bill) => (
                    <SelectItem key={bill.id} value={String(bill.id)}>
                      <div className="flex items-center gap-2">
                        <span>{bill.icon || "📦"}</span>
                        <span>{bill.name}</span>
                        <span className="text-xs text-muted-foreground">
                          ({formatCurrencyFromCents(bill.amount)})
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Select a recurring bill to mark this transaction as a bill payment. The bill's next due date will be updated automatically.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveEdit}
              disabled={!editFormData.name.trim() || !editFormData.amount || parseFloat(editFormData.amount) <= 0}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Transaction Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Transaction</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this transaction? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setTransactionToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Batch Delete Confirmation Dialog */}
      <AlertDialog open={isBatchDeleteDialogOpen} onOpenChange={setIsBatchDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Selected Transactions</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedTransactionIds.size} selected transaction{selectedTransactionIds.size > 1 ? "s" : ""}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmBatchDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete {selectedTransactionIds.size} Transaction{selectedTransactionIds.size > 1 ? "s" : ""}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Category Confirmation Dialog */}
      <AlertDialog open={isDeleteCategoryDialogOpen} onOpenChange={setIsDeleteCategoryDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Custom Category</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the category "{categoryToDelete}"? All transactions using this category will be moved to "Miscellaneous". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setCategoryToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteCategory} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete Category
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}
