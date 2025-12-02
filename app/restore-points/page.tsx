"use client"

import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "sonner"
import { RotateCcw, History, RefreshCw, Save } from "lucide-react"
import type { RestorePoint } from "@/lib/types/page-customization"
import { format } from "date-fns"

export default function RestorePointsPage() {
  const router = useRouter()
  const pathname = usePathname()
  const { canRestorePages, user, isAdmin } = useAuth()
  const [selectedPage, setSelectedPage] = useState<string>("/")
  const [restorePoints, setRestorePoints] = useState<RestorePoint[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [restoreDescription, setRestoreDescription] = useState("")

  // Redirect if not admin
  useEffect(() => {
    if (user && !isAdmin) {
      router.push("/")
    }
  }, [user, isAdmin, router])

  useEffect(() => {
    if (selectedPage) {
      loadRestorePoints()
    }
  }, [selectedPage])

  const loadRestorePoints = async () => {
    setIsLoading(true)
    try {
      const apiPath = selectedPage === "/" ? "root" : selectedPage.slice(1)
      const response = await fetch(`/api/pages/${encodeURIComponent(apiPath)}/restore-points`)
      if (response.ok) {
        const data = await response.json()
        setRestorePoints(data)
      } else {
        toast.error("Failed to load restore points")
      }
    } catch (error) {
      toast.error("Failed to load restore points")
    } finally {
      setIsLoading(false)
    }
  }

  const handleRestore = async (restorePointId: string) => {
    if (!user) return

    if (!confirm("Are you sure you want to restore this page? This will overwrite the current layout.")) {
      return
    }

    setIsLoading(true)
    try {
      const apiPath = selectedPage === "/" ? "root" : selectedPage.slice(1)
      const response = await fetch(
        `/api/pages/${encodeURIComponent(apiPath)}/restore-points/${encodeURIComponent(restorePointId)}`,
        {
          method: "POST",
          headers: {
            "x-user-id": String(user.id),
          },
        }
      )

      if (response.ok) {
        toast.success("Page restored successfully")
        loadRestorePoints()
      } else {
        const data = await response.json()
        toast.error(data.error || "Failed to restore page")
      }
    } catch (error) {
      toast.error("Failed to restore page")
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateRestorePoint = async () => {
    if (!user) return

    setIsLoading(true)
    try {
      const apiPath = selectedPage === "/" ? "root" : selectedPage.slice(1)
      const response = await fetch(`/api/pages/${encodeURIComponent(apiPath)}/restore-points`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": String(user.id),
        },
        body: JSON.stringify({
          description: restoreDescription || undefined,
        }),
      })

      if (response.ok) {
        toast.success("Restore point created")
        setIsCreateDialogOpen(false)
        setRestoreDescription("")
        loadRestorePoints()
      } else {
        const data = await response.json()
        toast.error(data.error || "Failed to create restore point")
      }
    } catch (error) {
      toast.error("Failed to create restore point")
    } finally {
      setIsLoading(false)
    }
  }

  const handleResetToDefault = async () => {
    if (!user) return

    if (!confirm("Are you sure you want to reset this page to default? This cannot be undone.")) {
      return
    }

    setIsLoading(true)
    try {
      const apiPath = selectedPage === "/" ? "root" : selectedPage.slice(1)
      const response = await fetch(`/api/pages/${encodeURIComponent(apiPath)}`, {
        method: "POST",
        headers: {
          "x-user-id": String(user.id),
        },
      })

      if (response.ok) {
        toast.success("Page reset to default")
        loadRestorePoints()
      } else {
        const data = await response.json()
        toast.error(data.error || "Failed to reset page")
      }
    } catch (error) {
      toast.error("Failed to reset page")
    } finally {
      setIsLoading(false)
    }
  }

  if (!user || !isAdmin) {
    return null
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 lg:pl-64">
        <Header title="Restore Points" />
        <main className="p-4 sm:p-6 lg:p-8">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Page Restore Points</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Manage restore points and revert page changes
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Select value={selectedPage} onValueChange={setSelectedPage}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Select page" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="/">Dashboard</SelectItem>
                  <SelectItem value="/transactions">Transactions</SelectItem>
                  <SelectItem value="/budget">Budget</SelectItem>
                  <SelectItem value="/bills">Bills</SelectItem>
                  <SelectItem value="/accounts">Accounts</SelectItem>
                </SelectContent>
              </Select>
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Save className="h-4 w-4 mr-2" />
                    Create Restore Point
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create Restore Point</DialogTitle>
                    <DialogDescription>
                      Save the current state of this page as a restore point.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="description">Description (optional)</Label>
                      <Input
                        id="description"
                        placeholder="e.g., Before removing transaction filters"
                        value={restoreDescription}
                        onChange={(e) => setRestoreDescription(e.target.value)}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateRestorePoint} disabled={isLoading}>
                      Create
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              <Button variant="outline" onClick={handleResetToDefault} disabled={isLoading}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Reset to Default
              </Button>
            </div>
          </div>

          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Created</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Version</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Created By</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Loading restore points...
                    </TableCell>
                  </TableRow>
                ) : restorePoints.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No restore points found
                    </TableCell>
                  </TableRow>
                ) : (
                  restorePoints.map((point) => (
                    <TableRow key={point.id}>
                      <TableCell>
                        {format(new Date(point.createdAt), "MMM d, yyyy HH:mm")}
                      </TableCell>
                      <TableCell className="max-w-md">
                        <p className="truncate">{point.description || "No description"}</p>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">v{point.layout.version}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={point.isAutoGenerated ? "secondary" : "default"}>
                          {point.isAutoGenerated ? "Auto" : "Manual"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        User #{point.createdBy}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRestore(point.id)}
                          disabled={isLoading}
                          aria-label="Restore this point"
                        >
                          <RotateCcw className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </main>
      </div>
    </div>
  )
}

