"use client"

import { useState } from "react"
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
import { Plus, Edit, Trash2, Wallet, CreditCard, TrendingUp, Building2 } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Account, AccountType } from "@/lib/types"

const ACCOUNT_TYPES: { value: AccountType; label: string; icon: typeof Wallet }[] = [
  { value: "checking", label: "Checking", icon: Wallet },
  { value: "savings", label: "Savings", icon: Wallet },
  { value: "credit_card", label: "Credit Card", icon: CreditCard },
  { value: "investment", label: "Investment", icon: TrendingUp },
  { value: "loan", label: "Loan", icon: Building2 },
  { value: "other", label: "Other", icon: Wallet },
]

const ACCOUNT_ICONS = [
  { value: "💳", label: "Card" },
  { value: "💰", label: "Savings" },
  { value: "📈", label: "Investment" },
  { value: "🏦", label: "Bank" },
  { value: "💵", label: "Cash" },
  { value: "📊", label: "Portfolio" },
  { value: "🔒", label: "Secure" },
  { value: "💎", label: "Premium" },
]

const ACCOUNT_COLORS = [
  "#4E79A7", // Blue
  "#F28E2C", // Orange
  "#59A14F", // Green
  "#E15759", // Red
  "#AF58BA", // Purple
  "#76B7B2", // Teal
  "#EDC949", // Yellow
  "#FF9D9A", // Pink
]

interface AccountsListProps {
  accounts?: Account[]
  setAccounts?: React.Dispatch<React.SetStateAction<Account[]>>
  selectedAccountId?: number | null
  onAccountSelect?: (accountId: number | null) => void
}

export function AccountsList({
  accounts: initialAccounts,
  setAccounts: setInitialAccounts,
  selectedAccountId,
  onAccountSelect,
}: AccountsListProps) {
  const [accounts, setAccounts] = useState<Account[]>(initialAccounts || [])
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedAccountIdLocal, setSelectedAccountIdLocal] = useState<number | null>(selectedAccountId || null)
  const [newAccount, setNewAccount] = useState({
    name: "",
    type: "checking" as AccountType,
    balance: "",
    currency: "C$",
    bankName: "",
    accountNumber: "",
    icon: "💳",
    color: ACCOUNT_COLORS[0],
    isActive: true,
    notes: "",
  })
  const [editAccount, setEditAccount] = useState({
    name: "",
    type: "checking" as AccountType,
    balance: "",
    currency: "C$",
    bankName: "",
    accountNumber: "",
    icon: "💳",
    color: ACCOUNT_COLORS[0],
    isActive: true,
    notes: "",
  })

  // Update parent state if provided
  const updateAccounts = (newAccounts: Account[]) => {
    setAccounts(newAccounts)
    if (setInitialAccounts) {
      setInitialAccounts(newAccounts)
    }
  }

  const handleAddAccount = () => {
    if (!newAccount.name.trim() || !newAccount.balance) return

    const balance = parseFloat(newAccount.balance)
    if (isNaN(balance)) return

    const account: Account = {
      id: Math.max(...accounts.map((a) => a.id), 0) + 1,
      name: newAccount.name.trim(),
      type: newAccount.type,
      balance: Math.round(balance * 100), // Convert to cents
      currency: newAccount.currency,
      bankName: newAccount.bankName || undefined,
      accountNumber: newAccount.accountNumber || undefined,
      icon: newAccount.icon,
      color: newAccount.color,
      isActive: newAccount.isActive,
      notes: newAccount.notes || undefined,
    }

    updateAccounts([...accounts, account])
    setNewAccount({
      name: "",
      type: "checking",
      balance: "",
      currency: "C$",
      bankName: "",
      accountNumber: "",
      icon: "💳",
      color: ACCOUNT_COLORS[0],
      isActive: true,
      notes: "",
    })
    setIsAddDialogOpen(false)
  }

  const handleOpenEdit = (accountId: number) => {
    const account = accounts.find((a) => a.id === accountId)
    if (!account) return

    setEditAccount({
      name: account.name,
      type: account.type,
      balance: (account.balance / 100).toFixed(2),
      currency: account.currency,
      bankName: account.bankName || "",
      accountNumber: account.accountNumber || "",
      icon: account.icon || "💳",
      color: account.color || ACCOUNT_COLORS[0],
      isActive: account.isActive,
      notes: account.notes || "",
    })
    setSelectedAccountIdLocal(accountId)
    setIsEditDialogOpen(true)
  }

  const handleSaveEdit = () => {
    if (!selectedAccountIdLocal || !editAccount.name.trim() || !editAccount.balance) return

    const balance = parseFloat(editAccount.balance)
    if (isNaN(balance)) return

    updateAccounts(
      accounts.map((account) =>
        account.id === selectedAccountIdLocal
          ? {
              ...account,
              name: editAccount.name.trim(),
              type: editAccount.type,
              balance: Math.round(balance * 100),
              currency: editAccount.currency,
              bankName: editAccount.bankName || undefined,
              accountNumber: editAccount.accountNumber || undefined,
              icon: editAccount.icon,
              color: editAccount.color,
              isActive: editAccount.isActive,
              notes: editAccount.notes || undefined,
            }
          : account
      )
    )

    setSelectedAccountIdLocal(null)
    setIsEditDialogOpen(false)
  }

  const handleOpenDelete = (accountId: number) => {
    setSelectedAccountIdLocal(accountId)
    setIsDeleteDialogOpen(true)
  }

  const handleDeleteAccount = () => {
    if (!selectedAccountIdLocal) return
    updateAccounts(accounts.filter((account) => account.id !== selectedAccountIdLocal))
    if (onAccountSelect && selectedAccountId === selectedAccountIdLocal) {
      onAccountSelect(null)
    }
    setSelectedAccountIdLocal(null)
    setIsDeleteDialogOpen(false)
  }

  const handleAccountSelect = (accountId: number | null) => {
    setSelectedAccountIdLocal(accountId)
    if (onAccountSelect) {
      onAccountSelect(accountId)
    }
  }

  const totalBalance = accounts
    .filter((a) => a.isActive)
    .reduce((sum, account) => sum + account.balance, 0)

  return (
    <Card>
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle>Accounts</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Total: {accounts.filter((a) => a.isActive).length} active account{accounts.filter((a) => a.isActive).length !== 1 ? "s" : ""}
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2 w-fit" aria-label="Add new account">
              <Plus className="h-4 w-4" aria-hidden="true" />
              Add Account
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] max-h-[90vh] flex flex-col">
            <DialogHeader>
              <DialogTitle>Add Account</DialogTitle>
              <DialogDescription>Add a new account to track your finances.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4 overflow-y-auto flex-1 min-h-0">
              <div className="space-y-2">
                <Label htmlFor="account-name">Account Name</Label>
                <Input
                  id="account-name"
                  placeholder="e.g., Primary Checking, Savings"
                  value={newAccount.name}
                  onChange={(e) => setNewAccount({ ...newAccount, name: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="account-type">Account Type</Label>
                  <Select
                    value={newAccount.type}
                    onValueChange={(value: AccountType) => setNewAccount({ ...newAccount, type: value })}
                  >
                    <SelectTrigger id="account-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ACCOUNT_TYPES.map((type) => {
                        const IconComponent = type.icon
                        return (
                          <SelectItem key={type.value} value={type.value}>
                            <div className="flex items-center gap-2">
                              <IconComponent className="h-4 w-4" />
                              <span>{type.label}</span>
                            </div>
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="account-balance">Balance (C$)</Label>
                  <Input
                    id="account-balance"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={newAccount.balance}
                    onChange={(e) => setNewAccount({ ...newAccount, balance: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="account-bank">Bank Name (Optional)</Label>
                  <Input
                    id="account-bank"
                    placeholder="e.g., TD Bank, RBC"
                    value={newAccount.bankName}
                    onChange={(e) => setNewAccount({ ...newAccount, bankName: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="account-number">Account Number (Optional)</Label>
                  <Input
                    id="account-number"
                    placeholder="Last 4 digits"
                    value={newAccount.accountNumber}
                    onChange={(e) => setNewAccount({ ...newAccount, accountNumber: e.target.value })}
                    maxLength={4}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="account-icon">Icon (Emoji)</Label>
                <div className="grid grid-cols-4 gap-2">
                  {ACCOUNT_ICONS.map((icon) => (
                    <button
                      key={icon.value}
                      type="button"
                      onClick={() => setNewAccount({ ...newAccount, icon: icon.value })}
                      className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-lg border-2 text-xl transition-all hover:scale-110",
                        newAccount.icon === icon.value
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
                  id="account-icon"
                  placeholder="Or enter custom emoji"
                  value={newAccount.icon}
                  onChange={(e) => setNewAccount({ ...newAccount, icon: e.target.value })}
                  maxLength={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="account-color">Color</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    id="account-color"
                    value={newAccount.color}
                    onChange={(e) => setNewAccount({ ...newAccount, color: e.target.value })}
                    className="h-10 w-16 rounded border border-border cursor-pointer flex-shrink-0"
                  />
                  <Input
                    value={newAccount.color}
                    onChange={(e) => setNewAccount({ ...newAccount, color: e.target.value })}
                    placeholder="#4E79A7"
                    className="flex-1"
                  />
                  <div
                    className="h-10 w-16 rounded border border-border flex-shrink-0"
                    style={{ backgroundColor: newAccount.color }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="account-notes">Notes (Optional)</Label>
                <Input
                  id="account-notes"
                  placeholder="Additional information"
                  value={newAccount.notes}
                  onChange={(e) => setNewAccount({ ...newAccount, notes: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleAddAccount}
                disabled={!newAccount.name.trim() || !newAccount.balance || isNaN(parseFloat(newAccount.balance))}
              >
                Add Account
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Total Balance Summary */}
        <div className="rounded-lg border bg-muted/50 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Balance</p>
              <p className="text-2xl font-bold text-foreground">
                C${(totalBalance / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <Wallet className="h-8 w-8 text-muted-foreground" />
          </div>
        </div>

        {/* Accounts List */}
        {accounts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Wallet className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No accounts yet.</p>
            <p className="text-sm">Add your first account to start tracking.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {accounts.map((account) => {
              const isSelected = selectedAccountIdLocal === account.id
              const isDebt = account.balance < 0
              const TypeIcon = ACCOUNT_TYPES.find((t) => t.value === account.type)?.icon || Wallet

              return (
                <div
                  key={account.id}
                  className={cn(
                    "rounded-lg border p-4 space-y-3 transition-all cursor-pointer",
                    isSelected && "border-primary bg-primary/5 ring-2 ring-primary/20",
                    !account.isActive && "opacity-50",
                    !isSelected && "hover:bg-muted/50"
                  )}
                  onClick={() => handleAccountSelect(account.id)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div
                        className="flex h-12 w-12 items-center justify-center rounded-lg text-2xl flex-shrink-0"
                        style={{ backgroundColor: (account.color || ACCOUNT_COLORS[0]) + "20" }}
                      >
                        {account.icon || "💳"}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="font-semibold text-foreground truncate">{account.name}</div>
                          {!account.isActive && (
                            <Badge variant="secondary" className="text-xs">
                              Inactive
                            </Badge>
                          )}
                          {isSelected && (
                            <Badge variant="default" className="text-xs">
                              Selected
                            </Badge>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <TypeIcon className="h-3 w-3" />
                            <span>{ACCOUNT_TYPES.find((t) => t.value === account.type)?.label}</span>
                          </div>
                          {account.bankName && (
                            <>
                              <span>•</span>
                              <span>{account.bankName}</span>
                            </>
                          )}
                          {account.accountNumber && (
                            <>
                              <span>•</span>
                              <span>{account.accountNumber}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleOpenEdit(account.id)}
                        aria-label={`Edit ${account.name}`}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => handleOpenDelete(account.id)}
                        aria-label={`Delete ${account.name}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-border">
                    <span className="text-sm text-muted-foreground">Balance</span>
                    <span
                      className={cn(
                        "text-lg font-bold",
                        isDebt ? "text-destructive" : "text-foreground"
                      )}
                    >
                      {account.currency}
                      {(Math.abs(account.balance) / 100).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                      {isDebt && " (debt)"}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Edit Account</DialogTitle>
            <DialogDescription>Update your account details.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 overflow-y-auto flex-1 min-h-0">
            <div className="space-y-2">
              <Label htmlFor="edit-account-name">Account Name</Label>
              <Input
                id="edit-account-name"
                placeholder="e.g., Primary Checking, Savings"
                value={editAccount.name}
                onChange={(e) => setEditAccount({ ...editAccount, name: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-account-type">Account Type</Label>
                <Select
                  value={editAccount.type}
                  onValueChange={(value: AccountType) => setEditAccount({ ...editAccount, type: value })}
                >
                  <SelectTrigger id="edit-account-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ACCOUNT_TYPES.map((type) => {
                      const IconComponent = type.icon
                      return (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center gap-2">
                            <IconComponent className="h-4 w-4" />
                            <span>{type.label}</span>
                          </div>
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-account-balance">Balance (C$)</Label>
                <Input
                  id="edit-account-balance"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={editAccount.balance}
                  onChange={(e) => setEditAccount({ ...editAccount, balance: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-account-bank">Bank Name (Optional)</Label>
                <Input
                  id="edit-account-bank"
                  placeholder="e.g., TD Bank, RBC"
                  value={editAccount.bankName}
                  onChange={(e) => setEditAccount({ ...editAccount, bankName: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-account-number">Account Number (Optional)</Label>
                <Input
                  id="edit-account-number"
                  placeholder="Last 4 digits"
                  value={editAccount.accountNumber}
                  onChange={(e) => setEditAccount({ ...editAccount, accountNumber: e.target.value })}
                  maxLength={4}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-account-icon">Icon (Emoji)</Label>
              <div className="grid grid-cols-4 gap-2">
                {ACCOUNT_ICONS.map((icon) => (
                  <button
                    key={icon.value}
                    type="button"
                    onClick={() => setEditAccount({ ...editAccount, icon: icon.value })}
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-lg border-2 text-xl transition-all hover:scale-110",
                      editAccount.icon === icon.value
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
                id="edit-account-icon"
                placeholder="Or enter custom emoji"
                value={editAccount.icon}
                onChange={(e) => setEditAccount({ ...editAccount, icon: e.target.value })}
                maxLength={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-account-color">Color</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  id="edit-account-color"
                  value={editAccount.color}
                  onChange={(e) => setEditAccount({ ...editAccount, color: e.target.value })}
                  className="h-10 w-16 rounded border border-border cursor-pointer flex-shrink-0"
                />
                <Input
                  value={editAccount.color}
                  onChange={(e) => setEditAccount({ ...editAccount, color: e.target.value })}
                  placeholder="#4E79A7"
                  className="flex-1"
                />
                <div
                  className="h-10 w-16 rounded border border-border flex-shrink-0"
                  style={{ backgroundColor: editAccount.color }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-account-notes">Notes (Optional)</Label>
              <Input
                id="edit-account-notes"
                placeholder="Additional information"
                value={editAccount.notes}
                onChange={(e) => setEditAccount({ ...editAccount, notes: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveEdit}
              disabled={!editAccount.name.trim() || !editAccount.balance || isNaN(parseFloat(editAccount.balance))}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Account</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedAccountIdLocal ? accounts.find((a) => a.id === selectedAccountIdLocal)?.name : "this account"}"? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedAccountIdLocal(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAccount} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}

