"use client"

import { useState } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowUpRight, ArrowDownRight } from "lucide-react"
import type { ExtractedTransaction } from "@/lib/utils/pdf-parser"
import { formatDate } from "@/lib/utils/date"
import { mockAccounts } from "@/lib/data/accounts"
import { mockBudgetCategories } from "@/lib/data/budget"
import { mockSavingsGoals } from "@/lib/data/savings"
import { mockRecurringBills } from "@/lib/data/recurring-bills"
import type { TransactionCategory, TransactionStatus } from "@/lib/types"

const DEFAULT_CATEGORIES: TransactionCategory[] = [
  "Salary",
  "Transportation",
  "Food",
  "Subscription",
  "Rent",
  "Miscellaneous",
  "Entertainment",
]

interface TransactionPreviewTableProps {
  transactions: ExtractedTransaction[]
  onConfirm: (selectedTransactions: ExtractedTransaction[], accountId: number | null) => void
  onCancel: () => void
}

export function TransactionPreviewTable({
  transactions,
  onConfirm,
  onCancel,
}: TransactionPreviewTableProps) {
  const [selectedIds, setSelectedIds] = useState<Set<number>>(
    new Set(transactions.map((_, index) => index))
  )
  const [editedTransactions, setEditedTransactions] = useState<ExtractedTransaction[]>(
    transactions.map((t) => ({
      ...t,
      category: t.category || "Miscellaneous",
      status: "completed" as const,
      time: "00:00",
    }))
  )
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null)

  const toggleSelection = (index: number) => {
    const newSelected = new Set(selectedIds)
    if (newSelected.has(index)) {
      newSelected.delete(index)
    } else {
      newSelected.add(index)
    }
    setSelectedIds(newSelected)
  }

  const toggleAll = () => {
    if (selectedIds.size === transactions.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(transactions.map((_, index) => index)))
    }
  }

  const updateTransaction = (index: number, field: keyof ExtractedTransaction, value: any) => {
    const updated = [...editedTransactions]
    updated[index] = { ...updated[index], [field]: value }
    setEditedTransactions(updated)
  }

  const handleConfirm = () => {
    // Apply bulk account selection to all selected transactions
    const selectedTransactions = editedTransactions
      .filter((_, index) => selectedIds.has(index))
      .map((t) => ({
        ...t,
        accountId: selectedAccountId ?? t.accountId ?? null,
        status: "completed" as const,
        time: "00:00",
      }))
    onConfirm(selectedTransactions, selectedAccountId)
  }

  const formatAmount = (amount: number) => {
    return (amount / 100).toFixed(2)
  }

  const parseAmount = (value: string) => {
    const parsed = parseFloat(value)
    return isNaN(parsed) ? 0 : Math.round(parsed * 100)
  }

  const activeAccounts = mockAccounts.filter((a) => a.isActive)
  const activeSavingsGoals = mockSavingsGoals
  const activeRecurringBills = mockRecurringBills.filter((b) => b.isActive)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Extracted Transactions</h3>
          <p className="text-sm text-muted-foreground">
            Review and edit transactions before importing ({selectedIds.size} of {transactions.length} selected)
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select 
            value={selectedAccountId ? String(selectedAccountId) : "none"} 
            onValueChange={(value) => setSelectedAccountId(value === "none" ? null : parseInt(value))}
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select account (optional)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No account</SelectItem>
              {activeAccounts.map((account) => (
                <SelectItem key={account.id} value={String(account.id)}>
                  {account.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedIds.size === transactions.length && transactions.length > 0}
                  onCheckedChange={toggleAll}
                />
              </TableHead>
              <TableHead>Transaction Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Amount (C$)</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Budget Category</TableHead>
              <TableHead>Savings Goal</TableHead>
              <TableHead>Recurring Bill</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {editedTransactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                  No transactions found
                </TableCell>
              </TableRow>
            ) : (
              editedTransactions.map((transaction, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <Checkbox
                      checked={selectedIds.has(index)}
                      onCheckedChange={() => toggleSelection(index)}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      value={transaction.name}
                      onChange={(e) => updateTransaction(index, "name", e.target.value)}
                      className="w-48"
                      placeholder="Transaction name"
                    />
                  </TableCell>
                  <TableCell>
                    <Select
                      value={transaction.type}
                      onValueChange={(value: "income" | "expense") =>
                        updateTransaction(index, "type", value)
                      }
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="expense">Expense</SelectItem>
                        <SelectItem value="income">Income</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={transaction.category || "Miscellaneous"}
                      onValueChange={(value) => updateTransaction(index, "category", value)}
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DEFAULT_CATEGORIES.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="font-medium">
                    {formatAmount(transaction.amount)}
                  </TableCell>
                  <TableCell>
                    {formatDate(transaction.date)}
                  </TableCell>
                  <TableCell>
                    <Select
                      value={transaction.budgetCategoryId ? String(transaction.budgetCategoryId) : "none"}
                      onValueChange={(value) =>
                        updateTransaction(index, "budgetCategoryId", value === "none" ? null : parseInt(value))
                      }
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No Budget</SelectItem>
                        {mockBudgetCategories.map((category) => (
                          <SelectItem key={category.id} value={String(category.id)}>
                            <div className="flex items-center gap-2">
                              <span>{category.icon}</span>
                              <span>{category.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={transaction.savingsGoalId ? String(transaction.savingsGoalId) : "none"}
                      onValueChange={(value) =>
                        updateTransaction(index, "savingsGoalId", value === "none" ? null : parseInt(value))
                      }
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No Savings Goal</SelectItem>
                        {activeSavingsGoals.map((goal) => (
                          <SelectItem key={goal.id} value={String(goal.id)}>
                            {goal.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={transaction.recurringBillId ? String(transaction.recurringBillId) : "none"}
                      onValueChange={(value) =>
                        updateTransaction(index, "recurringBillId", value === "none" ? null : parseInt(value))
                      }
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No Recurring Bill</SelectItem>
                        {activeRecurringBills.map((bill) => (
                          <SelectItem key={bill.id} value={String(bill.id)}>
                            {bill.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={handleConfirm} disabled={selectedIds.size === 0}>
          Import {selectedIds.size} Transaction{selectedIds.size !== 1 ? "s" : ""}
        </Button>
      </div>
    </div>
  )
}
