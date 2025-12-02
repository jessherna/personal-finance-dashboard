"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Plus, MoreVertical, Edit, Trash2, DollarSign, Laptop, ShieldAlert, Plane, Home, PiggyBank, Target, Car, Heart, GraduationCap, Gamepad2, ShoppingBag } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { useSavings } from "@/hooks/use-savings"
import type { SavingsGoal } from "@/lib/types"

// Available icons for savings goals
const GOAL_ICONS = [
  { value: "Laptop", icon: Laptop },
  { value: "ShieldAlert", icon: ShieldAlert },
  { value: "Plane", icon: Plane },
  { value: "Home", icon: Home },
  { value: "PiggyBank", icon: PiggyBank },
  { value: "Target", icon: Target },
  { value: "Car", icon: Car },
  { value: "Heart", icon: Heart },
  { value: "GraduationCap", icon: GraduationCap },
  { value: "Gamepad2", icon: Gamepad2 },
  { value: "ShoppingBag", icon: ShoppingBag },
]

// Tableau-inspired colors
const GOAL_COLORS = [
  "#4E79A7", // Blue
  "#F28E2C", // Orange
  "#59A14F", // Green
  "#E15759", // Red
  "#AF58BA", // Purple
  "#76B7B2", // Teal
  "#EDC949", // Yellow
  "#FF9D9A", // Pink
]

export function SavingsGoalsList() {
  const { user, isViewingAsUser } = useAuth()
  const [goals, setGoals] = useState<SavingsGoal[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  
  useEffect(() => {
    const fetchGoals = async () => {
      if (!user) {
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        const effectiveUserId = isViewingAsUser ? 2 : user.id
        const response = await fetch("/api/savings-goals", {
          headers: {
            "x-user-id": String(effectiveUserId),
            "x-user-role": user.role || "user",
          },
        })

        if (response.ok) {
          const data = await response.json()
          // Handle icon - it might be a string or component
          setGoals(data)
        } else {
          setGoals([])
        }
      } catch (error) {
        console.error("Error fetching savings goals:", error)
        setGoals([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchGoals()
  }, [user, isViewingAsUser])
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isAddFundsDialogOpen, setIsAddFundsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedGoalId, setSelectedGoalId] = useState<number | null>(null)
  const [fundAmount, setFundAmount] = useState("")
  const [newGoal, setNewGoal] = useState({
    name: "",
    target: "",
    dueDateMonth: "",
    color: GOAL_COLORS[0],
    icon: "PiggyBank",
    monthlyContribution: "",
  })
  const [editGoal, setEditGoal] = useState({
    name: "",
    target: "",
    dueDateMonth: "",
    color: GOAL_COLORS[0],
    icon: "PiggyBank",
    monthlyContribution: "",
  })

  const { goals: goalsWithProgress } = useSavings({ goals })

  const handleAddGoal = () => {
    if (!newGoal.name.trim() || !newGoal.target || !newGoal.dueDateMonth) return

    const selectedIcon = GOAL_ICONS.find((item) => item.value === newGoal.icon)?.icon || PiggyBank
    
    // Format the date from YYYY-MM to "Nov 2025" format
    const date = new Date(newGoal.dueDateMonth + "-01")
    const formattedDate = date.toLocaleDateString("en-US", { month: "short", year: "numeric" })

    const goal: SavingsGoal = {
      id: Date.now(), // Simple ID generation
      name: newGoal.name.trim(),
      icon: selectedIcon,
      current: 0,
      target: Number.parseFloat(newGoal.target),
      dueDate: formattedDate,
      color: newGoal.color,
      monthlyContribution: newGoal.monthlyContribution ? Number.parseFloat(newGoal.monthlyContribution) : undefined,
    }

    setGoals((prev) => [...prev, goal])
    setNewGoal({
      name: "",
      target: "",
      dueDateMonth: "",
      color: GOAL_COLORS[0],
      icon: "PiggyBank",
      monthlyContribution: "",
    })
    setIsDialogOpen(false)
  }

  const handleOpenAddFunds = (goalId: number) => {
    setSelectedGoalId(goalId)
    setFundAmount("")
    setIsAddFundsDialogOpen(true)
  }

  const handleAddFunds = () => {
    if (!selectedGoalId || !fundAmount) return

    const amount = parseFloat(fundAmount)
    if (isNaN(amount) || amount <= 0) return

    setGoals((prev) =>
      prev.map((goal) =>
        goal.id === selectedGoalId
          ? { ...goal, current: goal.current + amount }
          : goal
      )
    )

    setFundAmount("")
    setSelectedGoalId(null)
    setIsAddFundsDialogOpen(false)
  }

  const handleOpenEdit = (goalId: number) => {
    const goal = goals.find((g) => g.id === goalId)
    if (!goal) return

    // Convert dueDate from "Nov 2025" to "2025-11" format
    const dateParts = goal.dueDate.split(" ")
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    const monthIndex = monthNames.indexOf(dateParts[0])
    const year = dateParts[1]
    const month = String(monthIndex + 1).padStart(2, "0")
    const dueDateMonth = `${year}-${month}`

    // Find icon value from GOAL_ICONS
    const iconValue = GOAL_ICONS.find((item) => item.icon === goal.icon)?.value || "PiggyBank"

    setEditGoal({
      name: goal.name,
      target: goal.target.toString(),
      dueDateMonth,
      color: goal.color,
      icon: iconValue,
      monthlyContribution: goal.monthlyContribution?.toString() || "",
    })
    setSelectedGoalId(goalId)
    setIsEditDialogOpen(true)
  }

  const handleSaveEdit = () => {
    if (!selectedGoalId || !editGoal.name.trim() || !editGoal.target || !editGoal.dueDateMonth) return

    const selectedIcon = GOAL_ICONS.find((item) => item.value === editGoal.icon)?.icon || PiggyBank
    
    // Format the date from YYYY-MM to "Nov 2025" format
    const date = new Date(editGoal.dueDateMonth + "-01")
    const formattedDate = date.toLocaleDateString("en-US", { month: "short", year: "numeric" })

    setGoals((prev) =>
      prev.map((goal) =>
        goal.id === selectedGoalId
          ? {
              ...goal,
              name: editGoal.name.trim(),
              target: Number.parseFloat(editGoal.target),
              dueDate: formattedDate,
              icon: selectedIcon,
              color: editGoal.color,
              monthlyContribution: editGoal.monthlyContribution ? Number.parseFloat(editGoal.monthlyContribution) : undefined,
            }
          : goal
      )
    )

    setSelectedGoalId(null)
    setIsEditDialogOpen(false)
  }

  const handleOpenDelete = (goalId: number) => {
    setSelectedGoalId(goalId)
    setIsDeleteDialogOpen(true)
  }

  const handleDeleteGoal = () => {
    if (!selectedGoalId) return

    setGoals((prev) => prev.filter((goal) => goal.id !== selectedGoalId))
    setSelectedGoalId(null)
    setIsDeleteDialogOpen(false)
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Savings Goals</CardTitle>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2" aria-label="Add new savings goal">
              <Plus className="h-4 w-4" aria-hidden="true" />
              Add Goal
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] max-h-[90vh] flex flex-col">
            <DialogHeader>
              <DialogTitle>Add New Savings Goal</DialogTitle>
              <DialogDescription>Create a new savings goal to track your progress.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4 overflow-y-auto flex-1 min-h-0">
              <div className="space-y-2">
                <Label htmlFor="goal-name">Goal Name</Label>
                <Input
                  id="goal-name"
                  placeholder="e.g., New Car, Vacation"
                  value={newGoal.name}
                  onChange={(e) => setNewGoal({ ...newGoal, name: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="goal-target">Target Amount (C$)</Label>
                  <Input
                    id="goal-target"
                    type="number"
                    placeholder="50000"
                    value={newGoal.target}
                    onChange={(e) => setNewGoal({ ...newGoal, target: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="goal-due-date">Due Date</Label>
                  <Input
                    id="goal-due-date"
                    type="month"
                    value={newGoal.dueDateMonth}
                    onChange={(e) => setNewGoal({ ...newGoal, dueDateMonth: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="goal-icon">Icon</Label>
                  <Select value={newGoal.icon} onValueChange={(value) => setNewGoal({ ...newGoal, icon: value })}>
                    <SelectTrigger id="goal-icon">
                      <SelectValue>
                        {(() => {
                          const selectedIconItem = GOAL_ICONS.find((item) => item.value === newGoal.icon)
                          const IconComponent = selectedIconItem?.icon || PiggyBank
                          return (
                            <div className="flex items-center gap-2">
                              <IconComponent className="h-4 w-4" />
                              <span>{newGoal.icon}</span>
                            </div>
                          )
                        })()}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {GOAL_ICONS.map((item) => {
                        const IconComponent = item.icon
                        return (
                          <SelectItem key={item.value} value={item.value}>
                            <div className="flex items-center gap-2">
                              <IconComponent className="h-4 w-4" />
                              <span>{item.value}</span>
                            </div>
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="goal-color">Color</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      id="goal-color"
                      value={newGoal.color}
                      onChange={(e) => setNewGoal({ ...newGoal, color: e.target.value })}
                      className="h-10 w-16 rounded border border-border cursor-pointer"
                    />
                    <Input
                      value={newGoal.color}
                      onChange={(e) => setNewGoal({ ...newGoal, color: e.target.value })}
                      placeholder="#4E79A7"
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="goal-monthly">Monthly Contribution (C$) - Optional</Label>
                <Input
                  id="goal-monthly"
                  type="number"
                  placeholder="5000"
                  value={newGoal.monthlyContribution}
                  onChange={(e) => setNewGoal({ ...newGoal, monthlyContribution: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddGoal} disabled={!newGoal.name.trim() || !newGoal.target || !newGoal.dueDateMonth}>
                Add Goal
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <Dialog open={isAddFundsDialogOpen} onOpenChange={setIsAddFundsDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Add Funds</DialogTitle>
            <DialogDescription>
              Add money to {selectedGoalId ? goals.find((g) => g.id === selectedGoalId)?.name : "this goal"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="fund-amount">Amount (C$)</Label>
              <Input
                id="fund-amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={fundAmount}
                onChange={(e) => setFundAmount(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && fundAmount && parseFloat(fundAmount) > 0) {
                    handleAddFunds()
                  }
                }}
              />
            </div>
            {selectedGoalId && (() => {
              const goal = goals.find((g) => g.id === selectedGoalId)
              if (!goal) return null
              return (
                <div className="rounded-lg bg-muted/50 p-3 space-y-1">
                  <div className="text-xs text-muted-foreground">Current Balance</div>
                  <div className="font-semibold text-foreground">C${goal.current.toLocaleString()}</div>
                  {fundAmount && !isNaN(parseFloat(fundAmount)) && parseFloat(fundAmount) > 0 && (
                    <>
                      <div className="text-xs text-muted-foreground mt-2">New Balance</div>
                      <div className="font-semibold text-foreground">
                        C${(goal.current + parseFloat(fundAmount)).toLocaleString()}
                      </div>
                    </>
                  )}
                </div>
              )
            })()}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddFundsDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAddFunds}
              disabled={!fundAmount || parseFloat(fundAmount) <= 0 || isNaN(parseFloat(fundAmount))}
            >
              Add Funds
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Edit Savings Goal</DialogTitle>
            <DialogDescription>Update your savings goal details.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 overflow-y-auto flex-1 min-h-0">
            <div className="space-y-2">
              <Label htmlFor="edit-goal-name">Goal Name</Label>
              <Input
                id="edit-goal-name"
                placeholder="e.g., New Car, Vacation"
                value={editGoal.name}
                onChange={(e) => setEditGoal({ ...editGoal, name: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-goal-target">Target Amount (C$)</Label>
                <Input
                  id="edit-goal-target"
                  type="number"
                  placeholder="50000"
                  value={editGoal.target}
                  onChange={(e) => setEditGoal({ ...editGoal, target: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-goal-due-date">Due Date</Label>
                <Input
                  id="edit-goal-due-date"
                  type="month"
                  value={editGoal.dueDateMonth}
                  onChange={(e) => setEditGoal({ ...editGoal, dueDateMonth: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-goal-icon">Icon</Label>
                <Select value={editGoal.icon} onValueChange={(value) => setEditGoal({ ...editGoal, icon: value })}>
                  <SelectTrigger id="edit-goal-icon">
                    <SelectValue>
                      {(() => {
                        const selectedIconItem = GOAL_ICONS.find((item) => item.value === editGoal.icon)
                        const IconComponent = selectedIconItem?.icon || PiggyBank
                        return (
                          <div className="flex items-center gap-2">
                            <IconComponent className="h-4 w-4" />
                            <span>{editGoal.icon}</span>
                          </div>
                        )
                      })()}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {GOAL_ICONS.map((item) => {
                      const IconComponent = item.icon
                      return (
                        <SelectItem key={item.value} value={item.value}>
                          <div className="flex items-center gap-2">
                            <IconComponent className="h-4 w-4" />
                            <span>{item.value}</span>
                          </div>
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-goal-color">Color</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    id="edit-goal-color"
                    value={editGoal.color}
                    onChange={(e) => setEditGoal({ ...editGoal, color: e.target.value })}
                    className="h-10 w-16 rounded border border-border cursor-pointer"
                  />
                  <Input
                    value={editGoal.color}
                    onChange={(e) => setEditGoal({ ...editGoal, color: e.target.value })}
                    placeholder="#4E79A7"
                    className="flex-1"
                  />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-goal-monthly">Monthly Contribution (C$) - Optional</Label>
              <Input
                id="edit-goal-monthly"
                type="number"
                placeholder="5000"
                value={editGoal.monthlyContribution}
                onChange={(e) => setEditGoal({ ...editGoal, monthlyContribution: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={!editGoal.name.trim() || !editGoal.target || !editGoal.dueDateMonth}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Savings Goal</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedGoalId ? goals.find((g) => g.id === selectedGoalId)?.name : "this goal"}"? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedGoalId(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteGoal} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <CardContent className="space-y-6">
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Loading savings goals...</div>
        ) : goalsWithProgress.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">No savings goals yet. Add one to get started!</div>
        ) : (
          goalsWithProgress.map((goal) => {
            // Handle icon - it might be a string or component
            const IconComponent = typeof goal.icon === 'string' 
              ? PiggyBank // Fallback icon if it's a string
              : goal.icon

          return (
            <div key={goal.id} className="space-y-4 rounded-lg border border-border p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-lg"
                    style={{ backgroundColor: goal.color + "20" }}
                  >
                    <IconComponent className="h-6 w-6" style={{ color: goal.color }} />
                  </div>
                  <div>
                    <div className="font-semibold text-foreground">{goal.name}</div>
                    <div className="text-sm text-muted-foreground">Due {goal.dueDate}</div>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleOpenEdit(goal.id)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit Goal
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleOpenAddFunds(goal.id)}>
                      <DollarSign className="mr-2 h-4 w-4" />
                      Add Money
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      className="text-destructive"
                      onClick={() => handleOpenDelete(goal.id)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Goal
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-medium text-foreground">{goal.progress.percentage}%</span>
                </div>
                <Progress
                  value={goal.progress.percentage}
                  className="h-2.5"
                  style={{ "--progress-color": goal.color } as any}
                />
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-foreground">C${goal.current.toLocaleString()}</span>
                  <span className="text-muted-foreground">C${goal.target.toLocaleString()}</span>
                </div>
              </div>

              <div className="flex items-center gap-4 rounded-lg bg-muted/50 p-3">
                <div className="flex-1">
                  <div className="text-xs text-muted-foreground">Remaining</div>
                  <div className="font-semibold text-foreground">C${goal.progress.remaining.toLocaleString()}</div>
                </div>
                <div className="h-8 w-px bg-border" />
                <div className="flex-1">
                  <div className="text-xs text-muted-foreground">Monthly</div>
                  <div className="font-semibold text-foreground">C${goal.monthlyContribution?.toLocaleString()}</div>
                </div>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="gap-2 bg-transparent"
                  onClick={() => handleOpenAddFunds(goal.id)}
                >
                  <Plus className="h-3 w-3" />
                  Add Funds
                </Button>
              </div>
            </div>
          )
          })
        )}
      </CardContent>
    </Card>
  )
}
