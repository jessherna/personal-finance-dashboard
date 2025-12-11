"use client"

import { useState, useEffect } from "react"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "sonner"
import { Search, Tag, CheckCircle2, AlertCircle, Plus, X } from "lucide-react"
import type { TransactionCategory } from "@/lib/types"
import { formatCurrencyFromCents } from "@/lib/utils/format"

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

interface UniqueTransaction {
  name: string
  count: number
  dominantCategory: string
  isMixed: boolean
  categoryDistribution: Record<string, number>
  sampleTransactions: Array<{
    id: number
    category: string
    date: string
    amount: number
    type: string
  }>
}

export default function CategorizePage() {
  const { user, isViewingAsUser } = useAuth()
  const [uniqueTransactions, setUniqueTransactions] = useState<UniqueTransaction[]>([])
  const [filteredTransactions, setFilteredTransactions] = useState<UniqueTransaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>("all")
  const [customCategories, setCustomCategories] = useState<Record<string, string>>({})
  const [updatingNames, setUpdatingNames] = useState<Set<string>>(new Set())
  const [categoryAssignments, setCategoryAssignments] = useState<Record<string, TransactionCategory>>({})
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState("")
  const [newCategoryColor, setNewCategoryColor] = useState("#4E79A7")

  // Fetch unique transactions and custom categories
  useEffect(() => {
    const fetchData = async () => {
      if (!user) {
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        const effectiveUserId = isViewingAsUser ? 2 : user.id
        const headers = {
          "x-user-id": String(effectiveUserId),
          "x-user-role": user.role || "user",
        }

        const [uniqueRes, categoriesRes] = await Promise.all([
          fetch("/api/transactions/unique", { headers }),
          fetch("/api/custom-categories", { headers }),
        ])

        if (uniqueRes.ok) {
          const data = await uniqueRes.json()
          setUniqueTransactions(data)
          setFilteredTransactions(data)
        } else {
          setUniqueTransactions([])
          setFilteredTransactions([])
        }

        if (categoriesRes.ok) {
          const categoriesData = await categoriesRes.json()
          setCustomCategories(categoriesData)
        } else {
          setCustomCategories({})
        }
      } catch (error) {
        console.error("Error fetching data:", error)
        setUniqueTransactions([])
        setFilteredTransactions([])
        setCustomCategories({})
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [user, isViewingAsUser])

  // Filter transactions based on search and category filter
  useEffect(() => {
    let filtered = [...uniqueTransactions]

    // Apply search filter
    if (searchQuery.trim()) {
      const lowerQuery = searchQuery.toLowerCase()
      filtered = filtered.filter((txn) => txn.name.toLowerCase().includes(lowerQuery))
    }

    // Apply category filter
    if (selectedCategoryFilter !== "all") {
      if (selectedCategoryFilter === "mixed") {
        filtered = filtered.filter((txn) => txn.isMixed)
      } else {
        filtered = filtered.filter((txn) => txn.dominantCategory === selectedCategoryFilter)
      }
    }

    setFilteredTransactions(filtered)
  }, [searchQuery, selectedCategoryFilter, uniqueTransactions])

  const allCategories = [...DEFAULT_CATEGORIES, ...Object.keys(customCategories)] as TransactionCategory[]
  const categoryColorMap = { ...CATEGORY_COLOR_MAP, ...customCategories }

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
      
      setNewCategoryName("")
      setNewCategoryColor("#4E79A7")
      setIsCategoryDialogOpen(false)
      toast.success(`Category "${trimmedName}" added successfully`)
    } catch (error) {
      console.error("Error adding custom category:", error)
      toast.error("Network error. Please try again.")
    }
  }

  const handleCategoryChange = async (transactionName: string, category: TransactionCategory) => {
    if (!user) {
      toast.error("You must be logged in to update categories")
      return
    }

    setUpdatingNames((prev) => new Set(prev).add(transactionName))
    setCategoryAssignments((prev) => ({ ...prev, [transactionName]: category }))

    try {
      const effectiveUserId = isViewingAsUser ? 2 : user.id
      const response = await fetch("/api/transactions/update-category", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": String(effectiveUserId),
          "x-user-role": user.role || "user",
        },
        body: JSON.stringify({
          transactionName,
          category,
        }),
      })

      if (response.ok) {
        const result = await response.json()
        toast.success(result.message || `Updated category for "${transactionName}"`)

        // Update local state
        setUniqueTransactions((prev) =>
          prev.map((txn) => {
            if (txn.name === transactionName) {
              return {
                ...txn,
                dominantCategory: category,
                isMixed: false,
                categoryDistribution: { [category]: txn.count },
                sampleTransactions: txn.sampleTransactions.map((sample) => ({
                  ...sample,
                  category,
                })),
              }
            }
            return txn
          })
        )
      } else {
        const error = await response.json()
        toast.error(error.error || "Failed to update category")
        // Revert local state
        setCategoryAssignments((prev) => {
          const updated = { ...prev }
          delete updated[transactionName]
          return updated
        })
      }
    } catch (error) {
      console.error("Error updating category:", error)
      toast.error("Network error. Please try again.")
      // Revert local state
      setCategoryAssignments((prev) => {
        const updated = { ...prev }
        delete updated[transactionName]
        return updated
      })
    } finally {
      setUpdatingNames((prev) => {
        const updated = new Set(prev)
        updated.delete(transactionName)
        return updated
      })
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1 lg:pl-64">
          <Header title="Categorize Transactions" />
          <main className="p-4 sm:p-6 lg:p-8">
            <div className="flex items-center justify-center h-64">
              <p className="text-muted-foreground">Loading unique transactions...</p>
            </div>
          </main>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 lg:pl-64">
        <Header title="Categorize Transactions" />
        <main className="p-4 sm:p-6 lg:p-8">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Unique Transactions</CardTitle>
              <CardDescription>
                View and categorize your unique transactions. Assigning a category will update all transactions with the same name.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search transaction names..."
                    className="pl-9"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Select value={selectedCategoryFilter} onValueChange={setSelectedCategoryFilter}>
                  <SelectTrigger className="w-full sm:w-[200px]">
                    <SelectValue placeholder="Filter by category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="mixed">Mixed Categories</SelectItem>
                    {allCategories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="text-sm text-muted-foreground mb-4">
                Showing {filteredTransactions.length} of {uniqueTransactions.length} unique transaction{uniqueTransactions.length !== 1 ? "s" : ""}
              </div>
            </CardContent>
          </Card>

          {filteredTransactions.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">
                  {searchQuery || selectedCategoryFilter !== "all"
                    ? "No transactions match your filters."
                    : "No unique transactions found."}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredTransactions.map((txn) => {
                const isUpdating = updatingNames.has(txn.name)
                const assignedCategory = categoryAssignments[txn.name] || txn.dominantCategory
                const categoryEntries = Object.entries(txn.categoryDistribution).sort((a, b) => b[1] - a[1])

                return (
                  <Card key={txn.name}>
                    <CardContent className="pt-6">
                      <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                        <div className="flex-1">
                          <div className="flex items-start justify-between gap-4 mb-3">
                            <div>
                              <h3 className="font-semibold text-lg mb-1">{txn.name}</h3>
                              <div className="flex items-center gap-2 flex-wrap">
                                <Badge variant="outline" className="text-xs">
                                  {txn.count} occurrence{txn.count !== 1 ? "s" : ""}
                                </Badge>
                                {txn.isMixed && (
                                  <Badge variant="secondary" className="text-xs">
                                    <AlertCircle className="h-3 w-3 mr-1" />
                                    Mixed Categories
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Category Distribution */}
                          {txn.isMixed && (
                            <div className="mb-4">
                              <p className="text-sm text-muted-foreground mb-2">Current category distribution:</p>
                              <div className="flex flex-wrap gap-2">
                                {categoryEntries.map(([category, count]) => (
                                  <Badge
                                    key={category}
                                    variant="outline"
                                    className="text-xs"
                                    style={{
                                      borderColor: categoryColorMap[category] + "40",
                                      backgroundColor: categoryColorMap[category] + "10",
                                    }}
                                  >
                                    <div
                                      className="h-2 w-2 rounded-full mr-1.5"
                                      style={{ backgroundColor: categoryColorMap[category] }}
                                    />
                                    {category}: {count}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Sample Transactions */}
                          {txn.sampleTransactions.length > 0 && (
                            <div className="mt-3">
                              <p className="text-xs text-muted-foreground mb-1">Sample transactions:</p>
                              <div className="space-y-1">
                                {txn.sampleTransactions.map((sample) => (
                                  <div key={sample.id} className="text-xs text-muted-foreground flex items-center gap-2">
                                    <span>{new Date(sample.date).toLocaleDateString()}</span>
                                    <span>•</span>
                                    <span>{formatCurrencyFromCents(sample.amount)}</span>
                                    <span>•</span>
                                    <Badge
                                      variant="outline"
                                      className="text-xs"
                                      style={{
                                        borderColor: categoryColorMap[sample.category] + "40",
                                        backgroundColor: categoryColorMap[sample.category] + "10",
                                      }}
                                    >
                                      {sample.category}
                                    </Badge>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Category Selector */}
                        <div className="lg:w-64 flex-shrink-0">
                          <Label htmlFor={`category-${txn.name}`} className="text-sm font-medium mb-2 block">
                            Assign Category
                          </Label>
                          <Select
                            value={assignedCategory}
                            onValueChange={(value: TransactionCategory) => handleCategoryChange(txn.name, value)}
                            disabled={isUpdating}
                          >
                            <SelectTrigger
                              id={`category-${txn.name}`}
                              className="h-10"
                              style={{
                                backgroundColor: categoryColorMap[assignedCategory] + "20",
                                color: categoryColorMap[assignedCategory],
                                borderColor: categoryColorMap[assignedCategory] + "40",
                              }}
                            >
                              <SelectValue>
                                <div className="flex items-center gap-2">
                                  <div
                                    className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                                    style={{ backgroundColor: categoryColorMap[assignedCategory] }}
                                  />
                                  <span className="font-medium text-sm">{assignedCategory}</span>
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
                                          // Note: Delete functionality could be added here if needed
                                        }}
                                        className="ml-auto p-1 hover:bg-destructive/10 rounded transition-colors opacity-0 group-hover:opacity-100"
                                        aria-label={`Delete ${category} category`}
                                        style={{ display: "none" }} // Hide delete button for now
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
                          {isUpdating && (
                            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                              <Tag className="h-3 w-3" />
                              Updating...
                            </p>
                          )}
                          {!isUpdating && categoryAssignments[txn.name] && (
                            <p className="text-xs text-green-600 dark:text-green-400 mt-1 flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3" />
                              Updated
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

