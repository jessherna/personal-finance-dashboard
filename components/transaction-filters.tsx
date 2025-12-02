"use client"

import { useState } from "react"
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
  selectedAccountId,
  recurringBills = [],
  setBills,
}: TransactionFiltersProps) {
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
    date: new Date().toISOString().split("T")[0],
    time: new Date().toTimeString().slice(0, 5),
    amount: "",
    type: "expense" as TransactionType,
    status: "completed" as TransactionStatus,
    accountId: null as number | null | string,
    savingsGoalId: "" as string | number,
    savingsAmount: "",
    budgetCategoryId: null as number | null | string,
    recurringBillId: null as number | null | string,
  })

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

  const handleAddCustomCategory = () => {
    const trimmedName = newCategoryName.trim()
    if (trimmedName && !allCategories.includes(trimmedName as TransactionCategory)) {
      setCustomCategories((prev) => ({
        ...prev,
        [trimmedName]: newCategoryColor,
      }))
      // Auto-select the newly added category
      setNewTransaction({ ...newTransaction, category: trimmedName as TransactionCategory })
      setNewCategoryName("")
      setNewCategoryColor("#4E79A7")
      setIsCategoryDialogOpen(false)
    }
  }

  const handleDeleteCustomCategory = (categoryName: string) => {
    setCategoryToDelete(categoryName)
    setIsDeleteCategoryDialogOpen(true)
  }

  const confirmDeleteCategory = () => {
    if (categoryToDelete) {
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
      setIsDeleteCategoryDialogOpen(false)
      setCategoryToDelete(null)
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
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - days)
      cutoffDate.setHours(0, 0, 0, 0)
      filtered = filtered.filter((transaction) => {
        let transactionDate: Date
        if (transaction.date === "Today") {
          transactionDate = new Date()
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
          transactionDate = new Date()
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
          transactionDate = new Date()
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
    link.setAttribute("download", `transactions_${new Date().toISOString().split("T")[0]}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleAddTransaction = () => {
    if (!newTransaction.name.trim() || !newTransaction.amount) {
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

    const newId = Math.max(...transactions.map((t) => t.id), 0) + 1
    const dateStr = new Date(newTransaction.date).toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    })
    const timeStr = new Date(`2000-01-01T${newTransaction.time}`).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    })

    // Parse budget category ID
    const budgetCategoryId = newTransaction.budgetCategoryId === "none" || newTransaction.budgetCategoryId === ""
      ? null
      : typeof newTransaction.budgetCategoryId === "string"
        ? parseInt(newTransaction.budgetCategoryId)
        : newTransaction.budgetCategoryId

    // Parse account ID - use selectedAccountId if no account is selected in form, otherwise use form value
    const accountId = newTransaction.accountId === "none" || newTransaction.accountId === "" || newTransaction.accountId === null
      ? (selectedAccountId || null)
      : typeof newTransaction.accountId === "string"
        ? parseInt(newTransaction.accountId)
        : newTransaction.accountId

    // Parse recurring bill ID
    const recurringBillId = newTransaction.recurringBillId === "none" || newTransaction.recurringBillId === "" || newTransaction.recurringBillId === null
      ? null
      : typeof newTransaction.recurringBillId === "string"
        ? parseInt(newTransaction.recurringBillId)
        : newTransaction.recurringBillId

    const transaction: Transaction = {
      id: newId,
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
    }

    setTransactions((prev) => [transaction, ...prev])
    
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
        const paymentDate = newTransaction.date // ISO date string
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
      date: new Date().toISOString().split("T")[0],
      time: new Date().toTimeString().slice(0, 5),
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
        <DialogContent className="sm:max-w-[500px]">
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

            <div className="grid grid-cols-2 gap-4">
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

            <div className="grid grid-cols-2 gap-4">
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
              <Label htmlFor="transaction-account">Account (Optional)</Label>
              <Select
                value={newTransaction.accountId === null ? (selectedAccountId ? String(selectedAccountId) : "none") : String(newTransaction.accountId)}
                onValueChange={(value) => 
                  setNewTransaction({ 
                    ...newTransaction, 
                    accountId: value === "none" ? null : value 
                  })
                }
              >
                <SelectTrigger id="transaction-account">
                  <SelectValue placeholder="Select account" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Account</SelectItem>
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
                          (C${(bill.amount / 100).toFixed(2)})
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
              disabled={!newTransaction.name.trim() || !newTransaction.amount || parseFloat(newTransaction.amount) <= 0}
            >
              Add Transaction
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
