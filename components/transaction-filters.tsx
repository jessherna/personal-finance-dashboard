"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import { Label } from "@/components/ui/label"
import { Search, SlidersHorizontal, Download, Plus, X } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { formatCurrencyFromCents } from "@/lib/utils/format"
import { getCurrentDateInToronto } from "@/lib/utils/date"
import { toast } from "sonner"
import type { Transaction, TransactionType, TransactionStatus, TransactionCategory } from "@/lib/types"
import type { SavingsGoal } from "@/lib/types"
import type { BudgetCategory } from "@/lib/types"
import type { Account } from "@/lib/types"
import type { RecurringBill } from "@/lib/types"

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

interface TransactionFiltersProps {
  transactions: Transaction[]
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>
  customCategories: Record<string, string>
  setCustomCategories: React.Dispatch<React.SetStateAction<Record<string, string>>>
  searchQuery: string
  setSearchQuery: React.Dispatch<React.SetStateAction<string>>
  selectedCategory: string
  setSelectedCategory: React.Dispatch<React.SetStateAction<string>>
  selectedType: string
  setSelectedType: React.Dispatch<React.SetStateAction<string>>
  selectedPeriod: string
  setSelectedPeriod: React.Dispatch<React.SetStateAction<string>>
  minAmount: string
  setMinAmount: React.Dispatch<React.SetStateAction<string>>
  maxAmount: string
  setMaxAmount: React.Dispatch<React.SetStateAction<string>>
  selectedStatus: string
  setSelectedStatus: React.Dispatch<React.SetStateAction<string>>
  dateFrom: string
  setDateFrom: React.Dispatch<React.SetStateAction<string>>
  dateTo: string
  setDateTo: React.Dispatch<React.SetStateAction<string>>
  savingsGoals?: SavingsGoal[]
  setSavingsGoals?: React.Dispatch<React.SetStateAction<SavingsGoal[]>>
  budgetCategories?: BudgetCategory[]
  accounts?: Account[]
  setAccounts?: React.Dispatch<React.SetStateAction<Account[]>>
  selectedAccountId?: number | null
  recurringBills?: RecurringBill[]
  setBills?: React.Dispatch<React.SetStateAction<RecurringBill[]>>
}

export function TransactionFilters({
  transactions,
  setTransactions,
  customCategories,
  setCustomCategories,
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory,
  selectedType,
  setSelectedType,
  selectedPeriod,
  setSelectedPeriod,
  minAmount,
  setMinAmount,
  maxAmount,
  setMaxAmount,
  selectedStatus,
  setSelectedStatus,
  dateFrom,
  setDateFrom,
  dateTo,
  setDateTo,
  savingsGoals = [],
  setSavingsGoals,
  budgetCategories = [],
  accounts = [],
  setAccounts,
  selectedAccountId,
  recurringBills = [],
  setBills,
}: TransactionFiltersProps) {
  const { user, isViewingAsUser } = useAuth()
  const [isSaving, setIsSaving] = useState(false)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false)
  const [isAdvancedFilterOpen, setIsAdvancedFilterOpen] = useState(false)
  const [isDeleteCategoryDialogOpen, setIsDeleteCategoryDialogOpen] = useState(false)
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null)
  const [newCategoryName, setNewCategoryName] = useState("")
  const [newCategoryColor, setNewCategoryColor] = useState("#4E79A7")
  const [newTransaction, setNewTransaction] = useState({
    name: "",
    category: "Miscellaneous" as TransactionCategory,
    date: "", // Will be set when dialog opens
    time: "", // Will be set when dialog opens
    amount: "",
    type: "expense" as TransactionType,
    status: "completed" as TransactionStatus,
    accountId: null as number | null | string,
    savingsGoalId: "" as string | number,
    savingsAmount: "",
    budgetCategoryId: null as number | null | string,
    recurringBillId: null as number | null | string,
  })

  // Set date and time when dialog opens
  useEffect(() => {
    if (isAddDialogOpen) {
      const now = getCurrentDateInToronto()
      setNewTransaction((prev) => ({
        ...prev,
        date: now.toISOString().split("T")[0],
        time: now.toTimeString().slice(0, 5),
      }))
    }
  }, [isAddDialogOpen])

  // Auto-suggest budget category based on transaction name or category
  useEffect(() => {
    if (isAddDialogOpen && newTransaction.name && budgetCategories.length > 0 && !newTransaction.budgetCategoryId) {
      const nameLower = newTransaction.name.toLowerCase()
      const categoryLower = newTransaction.category.toLowerCase()
      
      // Try to find a matching budget category by name or transaction category
      const matchingBudgetCategory = budgetCategories.find((budgetCat) => {
        const budgetNameLower = budgetCat.name.toLowerCase()
        // Match if transaction name contains budget category name or vice versa
        // Or if transaction category matches budget category name
        return nameLower.includes(budgetNameLower) || 
               budgetNameLower.includes(nameLower) ||
               categoryLower === budgetNameLower ||
               (categoryLower === "food" && (budgetNameLower.includes("grocery") || budgetNameLower.includes("food"))) ||
               (categoryLower === "rent" && budgetNameLower.includes("rent")) ||
               (categoryLower === "subscription" && (budgetNameLower.includes("subscription") || budgetNameLower.includes("utility")))
      })
      
      if (matchingBudgetCategory) {
        setNewTransaction((prev) => ({
          ...prev,
          budgetCategoryId: matchingBudgetCategory.id,
        }))
      }
    }
  }, [isAddDialogOpen, newTransaction.name, newTransaction.category, budgetCategories, newTransaction.budgetCategoryId])

  // Merge default and custom categories
  const allCategories = [...DEFAULT_CATEGORIES, ...Object.keys(customCategories)] as TransactionCategory[]
  const categoryColorMap = { ...CATEGORY_COLOR_MAP, ...customCategories }

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
      
      // Auto-select the newly added category
      setNewTransaction({ ...newTransaction, category: trimmedName as TransactionCategory })
      setNewCategoryName("")
      setNewCategoryColor("#4E79A7")
      setIsCategoryDialogOpen(false)
      toast.success(`Category "${trimmedName}" added successfully`)
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
      
      // If the deleted category was selected, reset to Miscellaneous
      if (newTransaction.category === categoryToDelete) {
        setNewTransaction({ ...newTransaction, category: "Miscellaneous" })
      }
      
      toast.success(`Category "${categoryToDelete}" deleted successfully`)
      setIsDeleteCategoryDialogOpen(false)
      setCategoryToDelete(null)
    } catch (error) {
      console.error("Error deleting custom category:", error)
      toast.error("Network error. Please try again.")
    }
  }

  const handleExportTransactions = () => {
    // Filter transactions based on current filters
    let filtered = [...transactions]

    // Apply search filter
    if (searchQuery.trim()) {
      const lowerQuery = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (t) => t.name.toLowerCase().includes(lowerQuery) || t.category.toLowerCase().includes(lowerQuery),
      )
    }

    // Apply type filter
    if (selectedType !== "all") {
      filtered = filtered.filter((t) => t.type === selectedType)
    }

    // Apply category filter
    if (selectedCategory !== "all") {
      filtered = filtered.filter((t) => t.category === selectedCategory)
    }

    // Apply period filter
    if (selectedPeriod !== "all") {
      const days = parseInt(selectedPeriod)
      // Use Toronto timezone for current date calculations
      const cutoffDate = getCurrentDateInToronto()
      cutoffDate.setDate(cutoffDate.getDate() - days)
      cutoffDate.setHours(0, 0, 0, 0)
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
        return transactionDate >= cutoffDate
      })
    }

    // Apply advanced filters (using absolute values for amount comparison)
    if (minAmount) {
      const min = parseFloat(minAmount) * 100 // Convert to cents
      filtered = filtered.filter((t) => Math.abs(t.amount) >= min)
    }

    if (maxAmount) {
      const max = parseFloat(maxAmount) * 100 // Convert to cents
      filtered = filtered.filter((t) => Math.abs(t.amount) <= max)
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

    // Convert to CSV
    const headers = ["ID", "Name", "Category", "Type", "Amount (C$)", "Date", "Time", "Status"]
    const rows = filtered.map((t) => [
      t.id.toString(),
      t.name,
      t.category,
      t.type,
      (t.amount / 100).toFixed(2),
      t.date,
      t.time || "",
      t.status || "",
    ])

    const csvContent = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n")

    // Create and download file
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `transactions_${getCurrentDateInToronto().toISOString().split("T")[0]}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleAddTransaction = async () => {
    if (!newTransaction.name.trim() || !newTransaction.amount || !user) {
      return
    }

    // Require account selection
    const accountIdValue = newTransaction.accountId === null || newTransaction.accountId === "" || newTransaction.accountId === "none"
      ? (selectedAccountId || null)
      : newTransaction.accountId
    
    if (!accountIdValue) {
      toast.error("Please select an account. Account is required.")
      return
    }

    const amount = parseFloat(newTransaction.amount)
    if (isNaN(amount) || amount <= 0) {
      return
    }

    // Validate savings amount if savings goal is selected
    let savingsAmount = 0
    if (newTransaction.savingsGoalId && newTransaction.savingsAmount) {
      savingsAmount = parseFloat(newTransaction.savingsAmount)
      if (isNaN(savingsAmount) || savingsAmount <= 0) {
        return
      }
    }

    try {
      setIsSaving(true)
      const effectiveUserId = isViewingAsUser ? 2 : user.id

      // Parse budget category ID
      const budgetCategoryId = newTransaction.budgetCategoryId === "none" || newTransaction.budgetCategoryId === ""
        ? null
        : typeof newTransaction.budgetCategoryId === "string"
          ? parseInt(newTransaction.budgetCategoryId)
          : newTransaction.budgetCategoryId

      // Parse account ID - account is required, so use form value or selectedAccountId
      const accountId = newTransaction.accountId === null || newTransaction.accountId === "" || newTransaction.accountId === "none"
        ? (selectedAccountId ? parseInt(String(selectedAccountId)) : null)
        : typeof newTransaction.accountId === "string"
          ? parseInt(newTransaction.accountId)
          : newTransaction.accountId
      
      // Ensure account is selected (should not happen due to validation above, but double-check)
      if (!accountId) {
        toast.error("Please select an account. Account is required.")
        setIsSaving(false)
        return
      }

      // Parse recurring bill ID
      const recurringBillId = newTransaction.recurringBillId === "none" || newTransaction.recurringBillId === "" || newTransaction.recurringBillId === null
        ? null
        : typeof newTransaction.recurringBillId === "string"
          ? parseInt(newTransaction.recurringBillId)
          : newTransaction.recurringBillId

      // Format date as ISO string for API
      const dateStr = new Date(newTransaction.date).toISOString().split("T")[0]
      const timeStr = newTransaction.time || "00:00"

      const response = await fetch("/api/transactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": String(effectiveUserId),
          "x-user-role": user.role || "user",
        },
        body: JSON.stringify({
          name: newTransaction.name.trim(),
          category: newTransaction.category,
          date: dateStr,
          time: timeStr,
          amount: Math.round(amount * 100), // Convert to cents
          type: newTransaction.type,
          status: newTransaction.status,
          accountId: accountId,
          savingsGoalId: newTransaction.savingsGoalId ? Number(newTransaction.savingsGoalId) : undefined,
          savingsAmount: savingsAmount > 0 ? Math.round(savingsAmount * 100) : undefined, // Convert to cents
          budgetCategoryId: budgetCategoryId,
          recurringBillId: recurringBillId,
        }),
      })

      if (response.ok) {
        const transaction = await response.json()
        // Format date for display
        const displayDate = new Date(transaction.date).toLocaleDateString("en-US", {
          month: "short",
          day: "2-digit",
          year: "numeric",
        })
        const displayTime = transaction.time ? new Date(`2000-01-01T${transaction.time}`).toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        }) : undefined

        const formattedTransaction: Transaction = {
          ...transaction,
          date: displayDate,
          time: displayTime,
        }

        setTransactions((prev) => [formattedTransaction, ...prev])
        
        // Refresh accounts since transaction creation affects account balances
        if (setAccounts) {
          try {
            const accountsResponse = await fetch("/api/accounts", {
              headers: {
                "x-user-id": String(effectiveUserId),
                "x-user-role": user.role || "user",
              },
            })
            if (accountsResponse.ok) {
              const accountsData = await accountsResponse.json()
              setAccounts(accountsData)
            }
          } catch (error) {
            console.error("Error refreshing accounts:", error)
          }
        }
        
        // Update savings goal if savings amount is allocated
        if (setSavingsGoals && newTransaction.savingsGoalId && savingsAmount > 0) {
          const goalId = Number(newTransaction.savingsGoalId)
          setSavingsGoals((prev) =>
            prev.map((goal) =>
              goal.id === goalId
                ? { ...goal, current: goal.current + savingsAmount }
                : goal
            )
          )
        }

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
        
        // Reset form
        setNewTransaction({
          name: "",
          category: "Miscellaneous",
          date: getCurrentDateInToronto().toISOString().split("T")[0],
          time: getCurrentDateInToronto().toTimeString().slice(0, 5),
          amount: "",
          type: "expense",
          status: "completed",
          accountId: selectedAccountId || null,
          savingsGoalId: "",
          savingsAmount: "",
          budgetCategoryId: null,
          recurringBillId: null,
        })
        
        setIsAddDialogOpen(false)
        toast.success("Transaction created successfully")
      } else {
        const error = await response.json()
        toast.error(error.error || "Failed to create transaction")
      }
    } catch (error) {
      console.error("Error creating transaction:", error)
      toast.error("Failed to create transaction")
    } finally {
      setIsSaving(false)
    }
  }
  return (
    <div className="flex flex-wrap items-center gap-4">
      <div className="relative flex-1 min-w-[300px]">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search transactions..."
          className="pl-9"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <Select value={selectedCategory} onValueChange={setSelectedCategory}>
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="Category" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Categories</SelectItem>
          <SelectItem value="Food">Food</SelectItem>
          <SelectItem value="Transportation">Transportation</SelectItem>
          <SelectItem value="Subscription">Subscription</SelectItem>
          <SelectItem value="Rent">Rent</SelectItem>
          <SelectItem value="Salary">Salary</SelectItem>
          <SelectItem value="Miscellaneous">Miscellaneous</SelectItem>
          <SelectItem value="Entertainment">Entertainment</SelectItem>
          {Object.keys(customCategories).map((category) => (
            <SelectItem key={category} value={category}>
              {category}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={selectedType} onValueChange={setSelectedType}>
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="Type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Types</SelectItem>
          <SelectItem value="income">Income</SelectItem>
          <SelectItem value="expense">Expense</SelectItem>
        </SelectContent>
      </Select>

      <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="Period" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Time</SelectItem>
          <SelectItem value="7">Last 7 days</SelectItem>
          <SelectItem value="30">Last 30 days</SelectItem>
          <SelectItem value="90">Last 90 days</SelectItem>
          <SelectItem value="365">Last year</SelectItem>
        </SelectContent>
      </Select>

      <Dialog open={isAdvancedFilterOpen} onOpenChange={setIsAdvancedFilterOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="icon" aria-label="Advanced filters">
            <SlidersHorizontal className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Advanced Filters</DialogTitle>
            <DialogDescription>Apply additional filters to refine your transaction search.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="min-amount">Min Amount (C$)</Label>
                <Input
                  id="min-amount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={minAmount}
                  onChange={(e) => setMinAmount(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="max-amount">Max Amount (C$)</Label>
                <Input
                  id="max-amount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={maxAmount}
                  onChange={(e) => setMaxAmount(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status-filter">Status</Label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger id="status-filter">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date-from">Date From</Label>
                <Input
                  id="date-from"
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="date-to">Date To</Label>
                <Input
                  id="date-to"
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setMinAmount("")
                setMaxAmount("")
                setSelectedStatus("all")
                setDateFrom("")
                setDateTo("")
                setIsAdvancedFilterOpen(false)
              }}
            >
              Clear All
            </Button>
            <Button onClick={() => setIsAdvancedFilterOpen(false)}>Apply Filters</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Button
        variant="outline"
        className="gap-2 bg-transparent"
        onClick={() => {
          // Get filtered transactions from TransactionList
          // We'll need to pass the filtered transactions or create an export function
          handleExportTransactions()
        }}
      >
        <Download className="h-4 w-4" />
        Export
      </Button>

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogTrigger asChild>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Add Transaction
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[700px] lg:max-w-[900px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Transaction</DialogTitle>
            <DialogDescription>Enter the details for your new transaction.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="transaction-name">Transaction Name</Label>
              <Input
                id="transaction-name"
                placeholder="e.g., Grocery Shopping, Salary"
                value={newTransaction.name}
                onChange={(e) => setNewTransaction({ ...newTransaction, name: e.target.value })}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newTransaction.name.trim() && newTransaction.amount) {
                    handleAddTransaction()
                  }
                }}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="transaction-type">Type</Label>
                <Select
                  value={newTransaction.type}
                  onValueChange={(value: TransactionType) => setNewTransaction({ ...newTransaction, type: value })}
                >
                  <SelectTrigger id="transaction-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="income">Income</SelectItem>
                    <SelectItem value="expense">Expense</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="transaction-category">Category</Label>
                <Select
                  value={newTransaction.category}
                  onValueChange={(value: TransactionCategory) => setNewTransaction({ ...newTransaction, category: value })}
                >
                  <SelectTrigger
                    id="transaction-category"
                    className="h-10"
                    style={{
                      backgroundColor: categoryColorMap[newTransaction.category] + "20",
                      color: categoryColorMap[newTransaction.category],
                      borderColor: categoryColorMap[newTransaction.category] + "40",
                    }}
                  >
                    <SelectValue>
                      <div className="flex items-center gap-2">
                        <div
                          className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: categoryColorMap[newTransaction.category] }}
                        />
                        <span className="font-medium text-sm">{newTransaction.category}</span>
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
                              style={{ backgroundColor: categoryColorMap[category] }}
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
                      <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
                        <DialogTrigger asChild>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setIsCategoryDialogOpen(true)
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
                            <Button variant="outline" onClick={() => setIsCategoryDialogOpen(false)}>
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
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="transaction-amount">Amount (C$)</Label>
              <Input
                id="transaction-amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={newTransaction.amount}
                onChange={(e) => setNewTransaction({ ...newTransaction, amount: e.target.value })}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newTransaction.name.trim() && newTransaction.amount) {
                    handleAddTransaction()
                  }
                }}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="transaction-date">Date</Label>
                <Input
                  id="transaction-date"
                  type="date"
                  value={newTransaction.date}
                  onChange={(e) => setNewTransaction({ ...newTransaction, date: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="transaction-time">Time</Label>
                <Input
                  id="transaction-time"
                  type="time"
                  value={newTransaction.time}
                  onChange={(e) => setNewTransaction({ ...newTransaction, time: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="transaction-status">Status</Label>
              <Select
                value={newTransaction.status}
                onValueChange={(value: TransactionStatus) => setNewTransaction({ ...newTransaction, status: value })}
              >
                <SelectTrigger id="transaction-status">
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
              <Label htmlFor="transaction-account">Account <span className="text-destructive">*</span></Label>
              <Select
                value={
                  newTransaction.accountId === null || newTransaction.accountId === "" || newTransaction.accountId === "none"
                    ? (selectedAccountId ? String(selectedAccountId) : "")
                    : String(newTransaction.accountId)
                }
                onValueChange={(value) => 
                  setNewTransaction({ 
                    ...newTransaction, 
                    accountId: value === "" ? null : value 
                  })
                }
                required
              >
                <SelectTrigger id="transaction-account">
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
              <Label htmlFor="transaction-budget">Budget Category (Optional)</Label>
              <Select
                value={newTransaction.budgetCategoryId === null ? "none" : String(newTransaction.budgetCategoryId)}
                onValueChange={(value) => 
                  setNewTransaction({ 
                    ...newTransaction, 
                    budgetCategoryId: value === "none" ? null : value 
                  })
                }
              >
                <SelectTrigger id="transaction-budget">
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
              <Label htmlFor="transaction-savings-goal">Allocate to Savings Goal (Optional)</Label>
              <Select
                value={newTransaction.savingsGoalId === "" ? "none" : String(newTransaction.savingsGoalId)}
                onValueChange={(value) => 
                  setNewTransaction({ 
                    ...newTransaction, 
                    savingsGoalId: value === "none" ? "" : value,
                    savingsAmount: value === "none" ? "" : newTransaction.savingsAmount
                  })
                }
              >
                <SelectTrigger id="transaction-savings-goal">
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

            {newTransaction.savingsGoalId && newTransaction.savingsGoalId !== "" && (
              <div className="space-y-2">
                <Label htmlFor="transaction-savings-amount">Savings Amount (C$)</Label>
                <Input
                  id="transaction-savings-amount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={newTransaction.savingsAmount}
                  onChange={(e) => setNewTransaction({ ...newTransaction, savingsAmount: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  This amount will be allocated to the selected savings goal and won't be counted as income or expense.
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="transaction-recurring-bill">Recurring Bill (Optional)</Label>
              <Select
                value={newTransaction.recurringBillId === null ? "none" : String(newTransaction.recurringBillId)}
                onValueChange={(value) => {
                  if (value === "none") {
                    setNewTransaction({ ...newTransaction, recurringBillId: null })
                  } else {
                    const billId = parseInt(value)
                    const bill = recurringBills.find((b) => b.id === billId)
                    if (bill) {
                      // Auto-fill transaction details from bill
                      setNewTransaction({
                        ...newTransaction,
                        recurringBillId: billId,
                        name: bill.name,
                        category: bill.category as TransactionCategory,
                        amount: (bill.amount / 100).toFixed(2),
                        type: "expense",
                        budgetCategoryId: bill.budgetCategoryId || null,
                      })
                    } else {
                      setNewTransaction({ ...newTransaction, recurringBillId: billId })
                    }
                  }
                }}
              >
                <SelectTrigger id="transaction-recurring-bill">
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
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAddTransaction}
              disabled={
                !newTransaction.name.trim() || 
                !newTransaction.amount || 
                parseFloat(newTransaction.amount) <= 0 || 
                isSaving ||
                (!newTransaction.accountId && !selectedAccountId)
              }
            >
              {isSaving ? "Adding..." : "Add Transaction"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
    </div>
  )
}
