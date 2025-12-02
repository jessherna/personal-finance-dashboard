"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Edit, Trash2, Calendar, Repeat, DollarSign } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/contexts/auth-context"
import { getCurrentDateInToronto } from "@/lib/utils/date"
import { formatCurrencyFromCents } from "@/lib/utils/format"
import { toast } from "sonner"
import type { RecurringBill, RecurringFrequency, BudgetCategory } from "@/lib/types"

const FREQUENCY_OPTIONS: { value: RecurringFrequency; label: string }[] = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "biweekly", label: "Bi-weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "yearly", label: "Yearly" },
]

const CATEGORY_ICONS = [
  { value: "📺", label: "Streaming" },
  { value: "🏠", label: "Rent" },
  { value: "⚡", label: "Utilities" },
  { value: "💪", label: "Fitness" },
  { value: "🚗", label: "Transportation" },
  { value: "📱", label: "Phone" },
  { value: "💳", label: "Credit Card" },
  { value: "🏥", label: "Healthcare" },
  { value: "🎓", label: "Education" },
  { value: "📦", label: "Other" },
]

const CATEGORY_COLORS = [
  "#4E79A7", // Blue
  "#F28E2C", // Orange
  "#59A14F", // Green
  "#E15759", // Red
  "#AF58BA", // Purple
  "#76B7B2", // Teal
  "#EDC949", // Yellow
  "#FF9D9A", // Pink
]

interface RecurringBillsProps {
  bills?: RecurringBill[]
  setBills?: React.Dispatch<React.SetStateAction<RecurringBill[]>>
}

export function RecurringBills({ bills: initialBills, setBills: setInitialBills }: RecurringBillsProps) {
  const { user, isViewingAsUser } = useAuth()
  const [bills, setBills] = useState<RecurringBill[]>(initialBills || [])
  const [budgetCategories, setBudgetCategories] = useState<BudgetCategory[]>([])
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedBillId, setSelectedBillId] = useState<number | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isSavingEdit, setIsSavingEdit] = useState(false)

  // Fetch budget categories from API
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
  const [newBill, setNewBill] = useState({
    name: "",
    amount: "",
    frequency: "monthly" as RecurringFrequency,
    nextDueDate: "",
    category: "Subscription",
    icon: "📦",
    color: CATEGORY_COLORS[0],
    isActive: true,
    notes: "",
    budgetCategoryId: null as number | null | string,
  })
  const [editBill, setEditBill] = useState({
    name: "",
    amount: "",
    frequency: "monthly" as RecurringFrequency,
    nextDueDate: "",
    category: "Subscription",
    icon: "📦",
    color: CATEGORY_COLORS[0],
    isActive: true,
    notes: "",
    budgetCategoryId: null as number | null | string,
  })

  // Update parent state if provided
  const updateBills = (newBills: RecurringBill[]) => {
    setBills(newBills)
    if (setInitialBills) {
      setInitialBills(newBills)
    }
  }

  const handleAddBill = async () => {
    if (!newBill.name.trim() || !newBill.amount || !newBill.nextDueDate || !user) return

    const amount = parseFloat(newBill.amount)
    if (isNaN(amount) || amount <= 0) return

    try {
      setIsSaving(true)
      const effectiveUserId = isViewingAsUser ? 2 : user.id

      const budgetCategoryId = newBill.budgetCategoryId === "none" || newBill.budgetCategoryId === ""
        ? null
        : typeof newBill.budgetCategoryId === "string"
          ? parseInt(newBill.budgetCategoryId)
          : newBill.budgetCategoryId

      const response = await fetch("/api/recurring-bills", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": String(effectiveUserId),
          "x-user-role": user.role || "user",
        },
        body: JSON.stringify({
          name: newBill.name.trim(),
          amount: Math.round(amount * 100), // Convert to cents
          frequency: newBill.frequency,
          nextDueDate: newBill.nextDueDate,
          category: newBill.category,
          icon: newBill.icon,
          color: newBill.color,
          isActive: newBill.isActive,
          notes: newBill.notes || undefined,
          budgetCategoryId: budgetCategoryId,
        }),
      })

      if (response.ok) {
        const bill = await response.json()
        updateBills([...bills, bill])
        setNewBill({
          name: "",
          amount: "",
          frequency: "monthly",
          nextDueDate: "",
          category: "Subscription",
          icon: "📦",
          color: CATEGORY_COLORS[0],
          isActive: true,
          notes: "",
          budgetCategoryId: null,
        })
        setIsAddDialogOpen(false)
        toast.success("Recurring bill created successfully")
      } else {
        const error = await response.json()
        toast.error(error.error || "Failed to create recurring bill")
      }
    } catch (error) {
      console.error("Error creating recurring bill:", error)
      toast.error("Failed to create recurring bill")
    } finally {
      setIsSaving(false)
    }
  }

  const handleOpenEdit = (billId: number) => {
    const bill = bills.find((b) => b.id === billId)
    if (!bill) return

    // Format nextDueDate for date input (YYYY-MM-DD format)
    // Handle timezone issues by parsing as local date
    let formattedDate = bill.nextDueDate
    if (bill.nextDueDate) {
      try {
        // If it's already in YYYY-MM-DD format, use it directly
        if (bill.nextDueDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
          formattedDate = bill.nextDueDate
        } else {
          // Otherwise, parse and format as YYYY-MM-DD in local timezone
          const date = new Date(bill.nextDueDate)
          if (!isNaN(date.getTime())) {
            const year = date.getFullYear()
            const month = String(date.getMonth() + 1).padStart(2, "0")
            const day = String(date.getDate()).padStart(2, "0")
            formattedDate = `${year}-${month}-${day}`
          }
        }
      } catch {
        // If parsing fails, use original value
        formattedDate = bill.nextDueDate
      }
    }

    setEditBill({
      name: bill.name,
      amount: (bill.amount / 100).toFixed(2),
      frequency: bill.frequency,
      nextDueDate: formattedDate,
      category: bill.category,
      icon: bill.icon || "📦",
      color: bill.color || CATEGORY_COLORS[0],
      isActive: bill.isActive,
      notes: bill.notes || "",
      budgetCategoryId: bill.budgetCategoryId === null || bill.budgetCategoryId === undefined ? "none" : bill.budgetCategoryId,
    })
    setSelectedBillId(billId)
    setIsEditDialogOpen(true)
  }

  const handleSaveEdit = async () => {
    if (!selectedBillId || !editBill.name.trim() || !editBill.amount || !editBill.nextDueDate || !user) return

    const amount = parseFloat(editBill.amount)
    if (isNaN(amount) || amount <= 0) return

    const budgetCategoryId = editBill.budgetCategoryId === "none" || editBill.budgetCategoryId === ""
      ? null
      : typeof editBill.budgetCategoryId === "string"
        ? parseInt(editBill.budgetCategoryId)
        : editBill.budgetCategoryId

    const originalBill = bills.find((b) => b.id === selectedBillId)
    if (!originalBill) {
      toast.error("Original bill not found for rollback.")
      return
    }

    // Optimistic update
    updateBills(
      bills.map((bill) =>
        bill.id === selectedBillId
          ? {
              ...bill,
              name: editBill.name.trim(),
              amount: Math.round(amount * 100),
              frequency: editBill.frequency,
              nextDueDate: editBill.nextDueDate,
              category: editBill.category,
              icon: editBill.icon,
              color: editBill.color,
              isActive: editBill.isActive,
              notes: editBill.notes || undefined,
              budgetCategoryId: budgetCategoryId,
            }
          : bill
      )
    )

    try {
      setIsSavingEdit(true)
      const effectiveUserId = isViewingAsUser ? 2 : user.id
      const headers = {
        "Content-Type": "application/json",
        "x-user-id": String(effectiveUserId),
        "x-user-role": user.role || "user",
      }

      const response = await fetch(`/api/recurring-bills/${selectedBillId}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({
          name: editBill.name.trim(),
          amount: Math.round(amount * 100),
          frequency: editBill.frequency,
          nextDueDate: editBill.nextDueDate,
          category: editBill.category,
          icon: editBill.icon,
          color: editBill.color,
          isActive: editBill.isActive,
          notes: editBill.notes || undefined,
          budgetCategoryId: budgetCategoryId,
        }),
      })

      if (response.ok) {
        const updatedBill = await response.json()
        updateBills(
          bills.map((bill) =>
            bill.id === selectedBillId ? updatedBill : bill
          )
        )
        toast.success("Recurring bill updated successfully")
        setSelectedBillId(null)
        setIsEditDialogOpen(false)
      } else {
        // Revert on error
        updateBills(
          bills.map((bill) =>
            bill.id === selectedBillId ? originalBill : bill
          )
        )
        const error = await response.json()
        toast.error(error.error || "Failed to update recurring bill")
      }
    } catch (error) {
      console.error("Error updating recurring bill:", error)
      toast.error("Failed to update recurring bill due to network error.")
      // Revert on network error
      updateBills(
        bills.map((bill) =>
          bill.id === selectedBillId ? originalBill : bill
        )
      )
    } finally {
      setIsSavingEdit(false)
    }
  }

  const handleOpenDelete = (billId: number) => {
    setSelectedBillId(billId)
    setIsDeleteDialogOpen(true)
  }

  const handleDeleteBill = () => {
    if (!selectedBillId) return
    updateBills(bills.filter((bill) => bill.id !== selectedBillId))
    setSelectedBillId(null)
    setIsDeleteDialogOpen(false)
  }

  const getDaysUntilDue = (dueDate: string) => {
    // Use Toronto timezone for current date calculations
    const today = getCurrentDateInToronto()
    today.setHours(0, 0, 0, 0)
    const due = new Date(dueDate)
    due.setHours(0, 0, 0, 0)
    const diffTime = due.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const formatNextDueDate = (dateString: string) => {
    // Parse date string as local date to avoid timezone issues
    // If it's in YYYY-MM-DD format, parse it as local date
    if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const [year, month, day] = dateString.split("-").map(Number)
      const date = new Date(year, month - 1, day) // month is 0-indexed
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    }
    // Otherwise, parse as normal
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
  }

  return (
    <Card>
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle>Recurring Bills</CardTitle>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2 w-fit" aria-label="Add new recurring bill">
              <Plus className="h-4 w-4" aria-hidden="true" />
              Add Bill
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] max-h-[90vh] flex flex-col">
            <DialogHeader>
              <DialogTitle>Add Recurring Bill</DialogTitle>
              <DialogDescription>Create a new recurring bill to track your regular expenses.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4 overflow-y-auto flex-1 min-h-0">
              <div className="space-y-2">
                <Label htmlFor="bill-name">Bill Name</Label>
                <Input
                  id="bill-name"
                  placeholder="e.g., Netflix, Rent, Electricity"
                  value={newBill.name}
                  onChange={(e) => setNewBill({ ...newBill, name: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bill-amount">Amount (C$)</Label>
                  <Input
                    id="bill-amount"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={newBill.amount}
                    onChange={(e) => setNewBill({ ...newBill, amount: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bill-frequency">Frequency</Label>
                  <Select
                    value={newBill.frequency}
                    onValueChange={(value: RecurringFrequency) => setNewBill({ ...newBill, frequency: value })}
                  >
                    <SelectTrigger id="bill-frequency">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FREQUENCY_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bill-next-due">Next Due Date</Label>
                <Input
                  id="bill-next-due"
                  type="date"
                  value={newBill.nextDueDate}
                  onChange={(e) => setNewBill({ ...newBill, nextDueDate: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bill-category">Transaction Category</Label>
                <Input
                  id="bill-category"
                  placeholder="e.g., Subscription, Rent, Utilities"
                  value={newBill.category}
                  onChange={(e) => setNewBill({ ...newBill, category: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  This category will be used when creating transactions from this bill
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bill-budget">Budget Category (Optional)</Label>
                <Select
                  value={newBill.budgetCategoryId === null ? "none" : String(newBill.budgetCategoryId)}
                  onValueChange={(value) =>
                    setNewBill({ ...newBill, budgetCategoryId: value === "none" ? null : value })
                  }
                >
                  <SelectTrigger id="bill-budget">
                    <SelectValue placeholder="Select budget category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Budget Category</SelectItem>
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
                <p className="text-xs text-muted-foreground">
                  Link this bill to a budget category for spending tracking
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bill-icon">Icon (Emoji)</Label>
                <div className="grid grid-cols-5 gap-2">
                  {CATEGORY_ICONS.map((icon) => (
                    <button
                      key={icon.value}
                      type="button"
                      onClick={() => setNewBill({ ...newBill, icon: icon.value })}
                      className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-lg border-2 text-xl transition-all hover:scale-110",
                        newBill.icon === icon.value
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/50"
                      )}
                      aria-label={`Select ${icon.label} icon`}
                    >
                      {icon.value}
                    </button>
                  ))}
                </div>
                <Input
                  id="bill-icon"
                  placeholder="Or enter custom emoji"
                  value={newBill.icon}
                  onChange={(e) => setNewBill({ ...newBill, icon: e.target.value })}
                  maxLength={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bill-color">Color</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    id="bill-color"
                    value={newBill.color}
                    onChange={(e) => setNewBill({ ...newBill, color: e.target.value })}
                    className="h-10 w-16 rounded border border-border cursor-pointer flex-shrink-0"
                  />
                  <Input
                    value={newBill.color}
                    onChange={(e) => setNewBill({ ...newBill, color: e.target.value })}
                    placeholder="#4E79A7"
                    className="flex-1"
                  />
                  <div
                    className="h-10 w-16 rounded border border-border flex-shrink-0"
                    style={{ backgroundColor: newBill.color }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bill-notes">Notes (Optional)</Label>
                <Input
                  id="bill-notes"
                  placeholder="Additional information"
                  value={newBill.notes}
                  onChange={(e) => setNewBill({ ...newBill, notes: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleAddBill}
                disabled={!newBill.name.trim() || !newBill.amount || !newBill.nextDueDate || parseFloat(newBill.amount) <= 0 || isSaving}
              >
                {isSaving ? "Adding..." : "Add Bill"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="space-y-4">
        {bills.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Repeat className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No recurring bills yet.</p>
            <p className="text-sm">Add your first recurring bill to start tracking.</p>
          </div>
        ) : (
          bills.map((bill) => {
            const daysUntilDue = getDaysUntilDue(bill.nextDueDate)
            const isOverdue = daysUntilDue < 0
            const isDueSoon = daysUntilDue >= 0 && daysUntilDue <= 7

            return (
              <div
                key={bill.id}
                className={cn(
                  "rounded-lg border p-4 space-y-3",
                  !bill.isActive && "opacity-50",
                  isOverdue && "border-destructive bg-destructive/5"
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div
                      className="flex h-12 w-12 items-center justify-center rounded-lg text-2xl flex-shrink-0"
                      style={{ backgroundColor: (bill.color || CATEGORY_COLORS[0]) + "20" }}
                    >
                      {bill.icon || "📦"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="font-semibold text-foreground truncate">{bill.name}</div>
                        {!bill.isActive && (
                          <Badge variant="secondary" className="text-xs">
                            Inactive
                          </Badge>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          {formatCurrencyFromCents(bill.amount)}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Repeat className="h-3 w-3" />
                          {FREQUENCY_OPTIONS.find((f) => f.value === bill.frequency)?.label}
                        </span>
                        <span>•</span>
                        <span>{bill.category}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleOpenEdit(bill.id)}
                      aria-label={`Edit ${bill.name}`}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => handleOpenDelete(bill.id)}
                      aria-label={`Delete ${bill.name}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-border">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Next due:</span>
                      <span className={cn("font-medium", isOverdue && "text-destructive", isDueSoon && !isOverdue && "text-orange-500")}>
                        {formatNextDueDate(bill.nextDueDate)}
                      </span>
                    </div>
                    {isOverdue && (
                      <Badge variant="destructive" className="text-xs">
                        Overdue
                      </Badge>
                    )}
                    {isDueSoon && !isOverdue && (
                      <Badge variant="outline" className="text-xs border-orange-500 text-orange-500">
                        Due Soon
                      </Badge>
                    )}
                    {daysUntilDue > 7 && (
                      <Badge variant="outline" className="text-xs">
                        {daysUntilDue} days
                      </Badge>
                    )}
                  </div>
                  {bill.lastPaidDate && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>Last paid:</span>
                      <span className="font-medium">{formatNextDueDate(bill.lastPaidDate)}</span>
                    </div>
                  )}
                </div>
              </div>
            )
          })
        )}
      </CardContent>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Edit Recurring Bill</DialogTitle>
            <DialogDescription>Update your recurring bill details.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 overflow-y-auto flex-1 min-h-0">
            <div className="space-y-2">
              <Label htmlFor="edit-bill-name">Bill Name</Label>
              <Input
                id="edit-bill-name"
                placeholder="e.g., Netflix, Rent, Electricity"
                value={editBill.name}
                onChange={(e) => setEditBill({ ...editBill, name: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-bill-amount">Amount (C$)</Label>
                <Input
                  id="edit-bill-amount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={editBill.amount}
                  onChange={(e) => setEditBill({ ...editBill, amount: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-bill-frequency">Frequency</Label>
                <Select
                  value={editBill.frequency}
                  onValueChange={(value: RecurringFrequency) => setEditBill({ ...editBill, frequency: value })}
                >
                  <SelectTrigger id="edit-bill-frequency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FREQUENCY_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-bill-next-due">Next Due Date</Label>
              <Input
                id="edit-bill-next-due"
                type="date"
                value={editBill.nextDueDate}
                onChange={(e) => setEditBill({ ...editBill, nextDueDate: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-bill-category">Transaction Category</Label>
              <Input
                id="edit-bill-category"
                placeholder="e.g., Subscription, Rent, Utilities"
                value={editBill.category}
                onChange={(e) => setEditBill({ ...editBill, category: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                This category will be used when creating transactions from this bill
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-bill-budget">Budget Category (Optional)</Label>
              <Select
                value={editBill.budgetCategoryId === null ? "none" : String(editBill.budgetCategoryId)}
                onValueChange={(value) =>
                  setEditBill({ ...editBill, budgetCategoryId: value === "none" ? null : value })
                }
              >
                <SelectTrigger id="edit-bill-budget">
                  <SelectValue placeholder="Select budget category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Budget Category</SelectItem>
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
              <p className="text-xs text-muted-foreground">
                Link this bill to a budget category for spending tracking
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-bill-icon">Icon (Emoji)</Label>
              <div className="grid grid-cols-5 gap-2">
                {CATEGORY_ICONS.map((icon) => (
                  <button
                    key={icon.value}
                    type="button"
                    onClick={() => setEditBill({ ...editBill, icon: icon.value })}
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-lg border-2 text-xl transition-all hover:scale-110",
                      editBill.icon === icon.value
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50"
                    )}
                    aria-label={`Select ${icon.label} icon`}
                  >
                    {icon.value}
                  </button>
                ))}
              </div>
              <Input
                id="edit-bill-icon"
                placeholder="Or enter custom emoji"
                value={editBill.icon}
                onChange={(e) => setEditBill({ ...editBill, icon: e.target.value })}
                maxLength={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-bill-color">Color</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  id="edit-bill-color"
                  value={editBill.color}
                  onChange={(e) => setEditBill({ ...editBill, color: e.target.value })}
                  className="h-10 w-16 rounded border border-border cursor-pointer flex-shrink-0"
                />
                <Input
                  value={editBill.color}
                  onChange={(e) => setEditBill({ ...editBill, color: e.target.value })}
                  placeholder="#4E79A7"
                  className="flex-1"
                />
                <div
                  className="h-10 w-16 rounded border border-border flex-shrink-0"
                  style={{ backgroundColor: editBill.color }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-bill-notes">Notes (Optional)</Label>
              <Input
                id="edit-bill-notes"
                placeholder="Additional information"
                value={editBill.notes}
                onChange={(e) => setEditBill({ ...editBill, notes: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveEdit}
              disabled={!editBill.name.trim() || !editBill.amount || !editBill.nextDueDate || parseFloat(editBill.amount) <= 0 || isSavingEdit}
            >
              {isSavingEdit ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Recurring Bill</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedBillId ? bills.find((b) => b.id === selectedBillId)?.name : "this bill"}"? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedBillId(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteBill} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}

