"use client"

import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface LoginPromptModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function LoginPromptModal({ open, onOpenChange }: LoginPromptModalProps) {
  const router = useRouter()

  const handleLogin = () => {
    onOpenChange(false)
    router.push("/login")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Session Expired</DialogTitle>
          <DialogDescription>
            You have been logged out due to inactivity. Please log in again to continue.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button onClick={handleLogin} className="w-full sm:w-auto">
            Log In
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

