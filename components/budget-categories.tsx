"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, TrendingUp, Edit } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/contexts/auth-context"
import { useBudget } from "@/hooks/use-budget"
import type { BudgetCategory, Transaction } from "@/lib/types"

// Common emoji icons for budget categories
const CATEGORY_ICONS = [
  { value: "🚗", label: "Transportation" },
  { value: "🍔", label: "Food" },
  { value: "📱", label: "Subscription" },
  { value: "🏠", label: "Rent" },
  { value: "🎮", label: "Entertainment" },
  { value: "💊", label: "Healthcare" },
  { value: "👕", label: "Clothing" },
  { value: "✈️", label: "Travel" },
  { value: "🎓", label: "Education" },
  { value: "💳", label: "Credit Card" },
  { value: "💰", label: "Savings" },
  { value: "📦", label: "Miscellaneous" },
]

// Tableau-inspired colors
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

export function BudgetCategories() {
  const { user, isViewingAsUser } = useAuth()
  const [categories, setCategories] = useState<BudgetCategory[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null)
  const [newCategory, setNewCategory] = useState({
    name: "",
    budget: "",
    spent: "0",
    icon: "📦",
    color: CATEGORY_COLORS[0],
  })
  const [editCategory, setEditCategory] = useState({
    name: "",
    budget: "",
    spent: "0",
    icon: "📦",
    color: CATEGORY_COLORS[0],
  })

  const { categories: categoriesWithAnalysis } = useBudget({ categories })

  const handleAddCategory = () => {
    if (!newCategory.name.trim() || !newCategory.budget) return

    const budget = parseFloat(newCategory.budget)
    const spent = parseFloat(newCategory.spent || "0")

    if (isNaN(budget) || budget <= 0 || isNaN(spent) || spent < 0) return

    const category: BudgetCategory = {
      id: Math.max(...categories.map((c) => c.id), 0) + 1,
      name: newCategory.name.trim(),
      budget: Math.round(budget * 100), // Convert to cents
      spent: Math.round(spent * 100), // Convert to cents
      icon: newCategory.icon,
      color: newCategory.color,
    }

    setCategories((prev) => [...prev, category])
    setNewCategory({
      name: "",
      budget: "",
      spent: "0",
      icon: "📦",
      color: CATEGORY_COLORS[0],
    })
    setIsAddDialogOpen(false)
  }

  const handleOpenEdit = (categoryId: number) => {
    const category = categories.find((c) => c.id === categoryId)
    if (!category) return

    setEditCategory({
      name: category.name,
      budget: (category.budget / 100).toFixed(2), // Convert from cents to dollars
      spent: (category.spent / 100).toFixed(2), // Convert from cents to dollars
      icon: category.icon,
      color: category.color,
    })
    setSelectedCategoryId(categoryId)
    setIsEditDialogOpen(true)
  }

  const handleSaveEdit = () => {
    if (!selectedCategoryId || !editCategory.name.trim() || !editCategory.budget) return

    const budget = parseFloat(editCategory.budget)
    const spent = parseFloat(editCategory.spent || "0")

    if (isNaN(budget) || budget <= 0 || isNaN(spent) || spent < 0) return

    setCategories((prev) =>
      prev.map((category) =>
        category.id === selectedCategoryId
          ? {
              ...category,
              name: editCategory.name.trim(),
              budget: Math.round(budget * 100), // Convert to cents
              spent: Math.round(spent * 100), // Convert to cents
              icon: editCategory.icon,
              color: editCategory.color,
            }
          : category
      )
    )

    setSelectedCategoryId(null)
    setIsEditDialogOpen(false)
  }

  return (
    <Card>
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle>Budget Categories</CardTitle>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2 w-fit" aria-label="Add new budget category">
              <Plus className="h-4 w-4" aria-hidden="true" />
              Add Category
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] max-h-[90vh] flex flex-col">
            <DialogHeader>
              <DialogTitle>Add Budget Category</DialogTitle>
              <DialogDescription>Create a new budget category to track your spending.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4 overflow-y-auto flex-1 min-h-0">
              <div className="space-y-2">
                <Label htmlFor="category-name">Category Name</Label>
                <Input
                  id="category-name"
                  placeholder="e.g., Healthcare, Travel"
                  value={newCategory.name}
                  onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && newCategory.name.trim() && newCategory.budget) {
                      handleAddCategory()
                    }
                  }}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category-budget">Budget (C$)</Label>
                  <Input
                    id="category-budget"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={newCategory.budget}
                    onChange={(e) => setNewCategory({ ...newCategory, budget: e.target.value })}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && newCategory.name.trim() && newCategory.budget) {
                        handleAddCategory()
                      }
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category-spent">Spent (C$)</Label>
                  <Input
                    id="category-spent"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={newCategory.spent}
                    onChange={(e) => setNewCategory({ ...newCategory, spent: e.target.value })}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && newCategory.name.trim() && newCategory.budget) {
                        handleAddCategory()
                      }
                    }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category-icon">Icon (Emoji)</Label>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                  {CATEGORY_ICONS.map((icon) => (
                    <button
                      key={icon.value}
                      type="button"
                      onClick={() => setNewCategory({ ...newCategory, icon: icon.value })}
                      className={cn(
                        "flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-lg border-2 text-xl sm:text-2xl transition-all hover:scale-110",
                        newCategory.icon === icon.value
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
                  id="category-icon"
                  placeholder="Or enter custom emoji"
                  value={newCategory.icon}
                  onChange={(e) => setNewCategory({ ...newCategory, icon: e.target.value })}
                  maxLength={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category-color">Color</Label>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      id="category-color"
                      value={newCategory.color}
                      onChange={(e) => setNewCategory({ ...newCategory, color: e.target.value })}
                      className="h-10 w-16 rounded border border-border cursor-pointer flex-shrink-0"
                    />
                    <Input
                      value={newCategory.color}
                      onChange={(e) => setNewCategory({ ...newCategory, color: e.target.value })}
                      placeholder="#4E79A7"
                      pattern="^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$"
                      className="flex-1"
                    />
                    <div
                      className="h-10 w-16 rounded border border-border flex-shrink-0"
                      style={{ backgroundColor: newCategory.color }}
                    />
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {CATEGORY_COLORS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setNewCategory({ ...newCategory, color })}
                        className={cn(
                          "h-8 w-8 rounded border-2 transition-all hover:scale-110 flex-shrink-0",
                          newCategory.color === color
                            ? "border-primary ring-2 ring-primary/20"
                            : "border-border hover:border-primary/50"
                        )}
                        style={{ backgroundColor: color }}
                        aria-label={`Select color ${color}`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleAddCategory}
                disabled={!newCategory.name.trim() || !newCategory.budget || parseFloat(newCategory.budget) <= 0}
              >
                Add Category
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Edit Budget Category</DialogTitle>
            <DialogDescription>Update your budget category details.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 overflow-y-auto flex-1 min-h-0">
            <div className="space-y-2">
              <Label htmlFor="edit-category-name">Category Name</Label>
              <Input
                id="edit-category-name"
                placeholder="e.g., Healthcare, Travel"
                value={editCategory.name}
                onChange={(e) => setEditCategory({ ...editCategory, name: e.target.value })}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && editCategory.name.trim() && editCategory.budget) {
                    handleSaveEdit()
                  }
                }}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-category-budget">Budget (C$)</Label>
                <Input
                  id="edit-category-budget"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={editCategory.budget}
                  onChange={(e) => setEditCategory({ ...editCategory, budget: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && editCategory.name.trim() && editCategory.budget) {
                      handleSaveEdit()
                    }
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-category-spent">Spent (C$)</Label>
                <Input
                  id="edit-category-spent"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={editCategory.spent}
                  onChange={(e) => setEditCategory({ ...editCategory, spent: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && editCategory.name.trim() && editCategory.budget) {
                      handleSaveEdit()
                    }
                  }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-category-icon">Icon (Emoji)</Label>
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                {CATEGORY_ICONS.map((icon) => (
                  <button
                    key={icon.value}
                    type="button"
                    onClick={() => setEditCategory({ ...editCategory, icon: icon.value })}
                    className={cn(
                      "flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-lg border-2 text-xl sm:text-2xl transition-all hover:scale-110",
                      editCategory.icon === icon.value
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
                id="edit-category-icon"
                placeholder="Or enter custom emoji"
                value={editCategory.icon}
                onChange={(e) => setEditCategory({ ...editCategory, icon: e.target.value })}
                maxLength={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-category-color">Color</Label>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    id="edit-category-color"
                    value={editCategory.color}
                    onChange={(e) => setEditCategory({ ...editCategory, color: e.target.value })}
                    className="h-10 w-16 rounded border border-border cursor-pointer flex-shrink-0"
                  />
                  <Input
                    value={editCategory.color}
                    onChange={(e) => setEditCategory({ ...editCategory, color: e.target.value })}
                    placeholder="#4E79A7"
                    pattern="^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$"
                    className="flex-1"
                  />
                  <div
                    className="h-10 w-16 rounded border border-border flex-shrink-0"
                    style={{ backgroundColor: editCategory.color }}
                  />
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {CATEGORY_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setEditCategory({ ...editCategory, color })}
                      className={cn(
                        "h-8 w-8 rounded border-2 transition-all hover:scale-110 flex-shrink-0",
                        editCategory.color === color
                          ? "border-primary ring-2 ring-primary/20"
                          : "border-border hover:border-primary/50"
                      )}
                      style={{ backgroundColor: color }}
                      aria-label={`Select color ${color}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveEdit}
              disabled={!editCategory.name.trim() || !editCategory.budget || parseFloat(editCategory.budget) <= 0}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <CardContent className="space-y-4 sm:space-y-6">
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Loading budget categories...</div>
        ) : categoriesWithAnalysis.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">No budget categories yet. Add one to get started!</div>
        ) : (
          categoriesWithAnalysis.map((category) => {
          return (
            <div key={category.id} className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-lg text-xl flex-shrink-0"
                    style={{ backgroundColor: category.color + "20" }}
                    aria-hidden="true"
                  >
                    {category.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-foreground truncate">{category.name}</div>
                    <div className="text-sm text-muted-foreground">
                      C${category.spent.toLocaleString()} of C${category.budget.toLocaleString()}
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 flex-shrink-0 focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label={`Edit ${category.name} budget category`}
                  onClick={() => handleOpenEdit(category.id)}
                >
                  <Edit className="h-4 w-4" aria-hidden="true" />
                </Button>
              </div>

              <div className="space-y-2">
                <Progress
                  value={Math.min(category.percentage, 100)}
                  className="h-2"
                  style={
                    { "--progress-color": category.isOverBudget ? "hsl(var(--destructive))" : category.color } as any
                  }
                  aria-label={`${category.name} budget: ${category.percentage}% used`}
                  aria-valuenow={category.percentage}
                  aria-valuemin={0}
                  aria-valuemax={100}
                />
                <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                  <span className={cn("font-medium", category.isOverBudget ? "text-destructive" : "text-foreground")}>
                    {category.percentage}% used
                  </span>
                  {category.isOverBudget && (
                    <span className="flex items-center gap-1 text-destructive" aria-label={`Budget exceeded by C$${category.exceeded.toLocaleString()}`}>
                      <TrendingUp className="h-3 w-3" aria-hidden="true" />
                      Exceeded by C${category.exceeded.toLocaleString()}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )
          })
        )}
      </CardContent>
    </Card>
  )
}
