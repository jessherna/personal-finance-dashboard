"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Laptop, ShieldAlert, Plane, Home, PiggyBank, Target, Car, Heart, GraduationCap, Gamepad2, ShoppingBag } from "lucide-react"
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

export function SavingsGoals() {
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
          // Convert icon strings back to components if needed, or use as-is
          setGoals(data.slice(0, 2))
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
  const [newGoal, setNewGoal] = useState({
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

  return (
    <Card>
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle>Savings Goal</CardTitle>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2 w-fit" aria-label="Add new savings goal">
              <Plus className="h-4 w-4" aria-hidden="true" />
              Add Goal
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Add New Savings Goal</DialogTitle>
              <DialogDescription>Create a new savings goal to track your progress.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
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
      <CardContent className="space-y-4 sm:space-y-6">
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Loading savings goals...</div>
        ) : goalsWithProgress.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">No savings goals yet</div>
        ) : (
          goalsWithProgress.map((goal) => {
            // Handle icon - it might be a string or component
            const IconComponent = typeof goal.icon === 'string' 
              ? PiggyBank // Fallback icon if it's a string
              : goal.icon
          return (
            <div key={goal.id} className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-lg flex-shrink-0"
                    style={{ backgroundColor: goal.color + "20" }}
                    aria-hidden="true"
                  >
                    <IconComponent className="h-5 w-5" style={{ color: goal.color }} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-foreground truncate">{goal.name}</div>
                    <div className="text-sm text-muted-foreground">
                      C${goal.current.toLocaleString()} of C${goal.target.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
              <Progress
                value={goal.progress.percentage}
                className="h-2"
                style={{ "--progress-color": goal.color } as any}
                aria-label={`${goal.name} savings progress: ${goal.progress.percentage}% complete`}
                aria-valuenow={goal.progress.percentage}
                aria-valuemin={0}
                aria-valuemax={100}
              />
              <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <span className="text-muted-foreground">Due {goal.dueDate}</span>
                <span className="font-medium text-foreground">{goal.progress.percentage}% complete</span>
              </div>
            </div>
          )
          })
        )}
      </CardContent>
    </Card>
  )
}
