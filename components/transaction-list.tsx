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
import { ArrowUpRight, ArrowDownRight, MoreVertical, Edit, Trash2, Copy, ArrowUpDown, ArrowUp, ArrowDown, Plus, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { CATEGORY_COLORS } from "@/lib/constants/categories"
import { usePagination } from "@/hooks/use-pagination"
import { filterBySearch, filterByType, filterByCategory } from "@/lib/utils/filters"
import type { Transaction, TransactionCategory, TransactionType, TransactionStatus } from "@/lib/types"
import type { Account } from "@/lib/types"
import type { RecurringBill } from "@/lib/types"
import { useMemo } from "react"

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
  recurringBills?: RecurringBill[]
  setBills?: React.Dispatch<React.SetStateAction<RecurringBill[]>>
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
  recurringBills = [],
  setBills,
}: TransactionListProps) {
  const [sortField, setSortField] = useState<SortField>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeleteCategoryDialogOpen, setIsDeleteCategoryDialogOpen] = useState(false)
  const [transactionToDelete, setTransactionToDelete] = useState<number | null>(null)
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null)
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)
  const [newCategoryName, setNewCategoryName] = useState("")
  const [newCategoryColor, setNewCategoryColor] = useState("#4E79A7")
  const [editFormData, setEditFormData] = useState({
    name: "",
    category: "Miscellaneous" as TransactionCategory,
    date: "",
    time: "",
    amount: "",
    type: "expense" as "income" | "expense",
    status: "completed" as "completed" | "pending" | "failed",
    accountId: null as number | null | string,
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
    if (newCategoryName.trim() && !allCategories.includes(newCategoryName.trim() as TransactionCategory)) {
      setCustomCategories((prev) => ({
        ...prev,
        [newCategoryName.trim()]: newCategoryColor,
      }))
      setNewCategoryName("")
      setNewCategoryColor("#4E79A7")
      setIsDialogOpen(false)
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
      setIsDeleteCategoryDialogOpen(false)
      setCategoryToDelete(null)
    }
  }

  // Filter transactions based on search, category, type, period, and account
  const filteredTransactions = useMemo(() => {
    let filtered = [...transactions]

    // Apply account filter
    if (selectedAccountId !== null && selectedAccountId !== undefined) {
      filtered = filtered.filter((t) => t.accountId === selectedAccountId)
    }

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
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - days)
      cutoffDate.setHours(0, 0, 0, 0) // Set to start of day
      filtered = filtered.filter((transaction) => {
        // Parse date string like "Dec 01, 2025" or "Today" or "Monday"
        let transactionDate: Date
        if (transaction.date === "Today") {
          transactionDate = new Date()
        } else {
          transactionDate = new Date(transaction.date)
        }
        // If date is invalid, include it (to avoid filtering out valid transactions with unusual formats)
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
        aValue = new Date(a.date).getTime()
        bValue = new Date(b.date).getTime()
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
    itemsPerPage: 8,
  })

  const handleCategoryChange = (transactionId: number, newCategory: string) => {
    setTransactions((prev) =>
      prev.map((transaction) =>
        transaction.id === transactionId ? { ...transaction, category: newCategory as TransactionCategory } : transaction,
      ),
    )
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
        // If date is "Today", use today's date
        dateStr = new Date().toISOString().split("T")[0]
      }
    } catch {
      dateStr = new Date().toISOString().split("T")[0]
    }

    // Parse time from "09:00 AM" format to "HH:MM"
    let timeStr = ""
    if (transaction.time) {
      try {
        const time = new Date(`2000-01-01 ${transaction.time}`)
        if (!isNaN(time.getTime())) {
          timeStr = time.toTimeString().slice(0, 5)
        } else {
          timeStr = new Date().toTimeString().slice(0, 5)
        }
      } catch {
        timeStr = new Date().toTimeString().slice(0, 5)
      }
    } else {
      timeStr = new Date().toTimeString().slice(0, 5)
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
      recurringBillId: transaction.recurringBillId === null || transaction.recurringBillId === undefined ? "none" : transaction.recurringBillId,
    })
    setIsEditDialogOpen(true)
  }

  const handleSaveEdit = () => {
    if (!editingTransaction || !editFormData.name.trim() || !editFormData.amount) {
      return
    }

    const amount = parseFloat(editFormData.amount)
    if (isNaN(amount) || amount <= 0) {
      return
    }

    const dateStr = new Date(editFormData.date).toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    })
    const timeStr = new Date(`2000-01-01T${editFormData.time}`).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    })

    // Parse recurring bill ID
    const recurringBillId = editFormData.recurringBillId === "none" || editFormData.recurringBillId === "" || editFormData.recurringBillId === null
      ? null
      : typeof editFormData.recurringBillId === "string"
        ? parseInt(editFormData.recurringBillId)
        : editFormData.recurringBillId

    setTransactions((prev) =>
      prev.map((transaction) =>
        transaction.id === editingTransaction.id
          ? {
              ...transaction,
              name: editFormData.name.trim(),
              category: editFormData.category,
              date: dateStr,
              time: timeStr,
              amount: Math.round(amount * 100),
              type: editFormData.type,
              status: editFormData.status,
              accountId: editFormData.accountId === "none" || editFormData.accountId === "" || editFormData.accountId === null
                ? null
                : typeof editFormData.accountId === "string"
                  ? parseInt(editFormData.accountId)
                  : editFormData.accountId,
              recurringBillId: recurringBillId,
            }
          : transaction,
      ),
    )

    // Update recurring bill if this transaction pays a bill
    if (setBills && recurringBillId !== null) {
      const bill = recurringBills.find((b) => b.id === recurringBillId)
      if (bill) {
        const paymentDate = editFormData.date // ISO date string
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

    setIsEditDialogOpen(false)
    setEditingTransaction(null)
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

  const confirmDelete = () => {
    if (transactionToDelete !== null) {
      setTransactions((prev) => prev.filter((transaction) => transaction.id !== transactionToDelete))
      setIsDeleteDialogOpen(false)
      setTransactionToDelete(null)
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

  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-6 py-4 text-left">
                  <Checkbox />
                </th>
                <th className="px-6 py-4 text-left">
                  <button
                    onClick={() => handleSort("name")}
                    className="flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Transaction
                    <SortIcon field="name" />
                  </button>
                </th>
                <th className="px-6 py-4 text-left">
                  <button
                    onClick={() => handleSort("category")}
                    className="flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Category
                    <SortIcon field="category" />
                  </button>
                </th>
                <th className="px-6 py-4 text-left">
                  <button
                    onClick={() => handleSort("date")}
                    className="flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Date & Time
                    <SortIcon field="date" />
                  </button>
                </th>
                <th className="px-6 py-4 text-right">
                  <button
                    onClick={() => handleSort("amount")}
                    className="flex items-center justify-end ml-auto text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Amount
                    <SortIcon field="amount" />
                  </button>
                </th>
                <th className="px-6 py-4 text-left">
                  <button
                    onClick={() => handleSort("status")}
                    className="flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Status
                    <SortIcon field="status" />
                  </button>
                </th>
                <th className="px-6 py-4 text-right text-sm font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {paginatedTransactions.map((transaction) => (
                <tr key={transaction.id} className="hover:bg-muted/50 transition-colors">
                  <td className="px-6 py-4">
                    <Checkbox />
                  </td>
                  <td className="px-6 py-4">
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
                  <td className="px-6 py-4">
                    <Select
                      value={transaction.category}
                      onValueChange={(value: TransactionCategory) => handleCategoryChange(transaction.id, value)}
                    >
                      <SelectTrigger
                        className="h-8 min-w-fit w-auto border-0 px-3 py-1.5 focus:ring-2 focus:ring-offset-0 transition-all hover:opacity-80"
                        style={{
                          backgroundColor: categoryColorMap[transaction.category] + "20",
                          color: categoryColorMap[transaction.category],
                          borderColor: categoryColorMap[transaction.category] + "40",
                        }}
                      >
                        <SelectValue>
                          <div className="flex items-center gap-2 whitespace-nowrap">
                            <div
                              className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                              style={{ backgroundColor: categoryColorMap[transaction.category] }}
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
                  <td className="px-6 py-4">
                    <div className="text-sm">
                      <div className="text-foreground">{transaction.date}</div>
                      <div className="text-muted-foreground">{transaction.time}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span
                      className={cn(
                        "font-semibold",
                        transaction.type === "income" ? "text-success" : "text-foreground",
                      )}
                    >
                      {transaction.type === "income" ? "+" : "-"}C${(transaction.amount / 100).toLocaleString("en-CA", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </td>
                  <td className="px-6 py-4">
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
                  <td className="px-6 py-4 text-right">
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

        <div className="flex items-center justify-between border-t border-border px-6 py-4">
          <div className="text-sm text-muted-foreground">
            Showing{" "}
            <span className="font-medium text-foreground">
              {startIndex}-{endIndex}
            </span>{" "}
            of <span className="font-medium text-foreground">{totalItems}</span> transactions
          </div>
          <div className="flex gap-2">
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
        <DialogContent className="sm:max-w-[500px]">
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

            <div className="grid grid-cols-2 gap-4">
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
                      backgroundColor: categoryColorMap[editFormData.category] + "20",
                      color: categoryColorMap[editFormData.category],
                      borderColor: categoryColorMap[editFormData.category] + "40",
                    }}
                  >
                    <SelectValue>
                      <div className="flex items-center gap-2">
                        <div
                          className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: categoryColorMap[editFormData.category] }}
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
                            style={{ backgroundColor: categoryColorMap[category] }}
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

            <div className="grid grid-cols-2 gap-4">
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
              <Label htmlFor="edit-account">Account (Optional)</Label>
              <Select
                value={editFormData.accountId === null ? "none" : String(editFormData.accountId)}
                onValueChange={(value) => 
                  setEditFormData({ 
                    ...editFormData, 
                    accountId: value === "none" ? null : value 
                  })
                }
              >
                <SelectTrigger id="edit-account">
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
