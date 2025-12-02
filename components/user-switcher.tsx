"use client"

import { useState } from "react"
import { Eye, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "sonner"

export function UserSwitcher() {
  const { isViewingAsUser, toggleViewAsUser, clearViewAs, canViewAs } = useAuth()
  const [isOpen, setIsOpen] = useState(false)

  const handleToggleViewAs = () => {
    if (isViewingAsUser) {
      clearViewAs()
      toast.success("Stopped viewing as user")
    } else {
      toggleViewAsUser()
      toast.success("Now viewing as user")
    }
    setIsOpen(false)
  }

  if (!canViewAs) return null

  return (
    <>
      {/* View As Button/Indicator */}
      {isViewingAsUser ? (
        <div className="inline-flex items-center gap-1">
          <Button
            variant="outline"
            onClick={() => setIsOpen(true)}
            className="gap-2"
          >
            <Eye className="h-4 w-4" />
            <span className="hidden sm:inline">Viewing as User</span>
            <span className="sm:hidden">Viewing</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            onClick={handleToggleViewAs}
            aria-label="Stop viewing as user"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <Button
          variant="outline"
          onClick={() => setIsOpen(true)}
          className="gap-2"
        >
          <Eye className="h-4 w-4" />
          <span className="hidden sm:inline">View As User</span>
          <span className="sm:hidden">View As</span>
        </Button>
      )}

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>View As User</DialogTitle>
            <DialogDescription>
              View the application from a user's perspective. The data source (demo or actual) is controlled by the "Data Source" toggle in the header.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {isViewingAsUser ? (
              <div className="p-4 border rounded-lg bg-muted/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Eye className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium">Currently viewing as User</p>
                      <p className="text-sm text-muted-foreground">
                        You are viewing the application from a user's perspective
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-3 mb-4">
                  <Eye className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">View as User Mode</p>
                    <p className="text-sm text-muted-foreground">
                      Switch to view the application from a user's perspective
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleToggleViewAs}>
                {isViewingAsUser ? "Stop Viewing" : "Start Viewing"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
