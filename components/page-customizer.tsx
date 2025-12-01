"use client"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import { Settings2, X, Eye, EyeOff, GripVertical, Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "sonner"
import type { PageLayout, PageElement } from "@/lib/types/page-customization"

interface PageCustomizerProps {
  onLayoutChange?: (layout: PageLayout) => void
}

export function PageCustomizer({ onLayoutChange }: PageCustomizerProps) {
  const pathname = usePathname()
  const { canCustomizePages, user, isViewingAsUser } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [layout, setLayout] = useState<PageLayout | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (canCustomizePages && pathname) {
      loadLayout()
    }
  }, [pathname, canCustomizePages])

  const loadLayout = async () => {
    try {
      // Convert pathname to API path format
      const apiPath = pathname === "/" ? "root" : pathname.slice(1)
      const response = await fetch(`/api/pages/${encodeURIComponent(apiPath)}`)
      if (response.ok) {
        const data = await response.json()
        setLayout(data)
      }
    } catch (error) {
      console.error("Failed to load layout:", error)
    }
  }

  const toggleElementVisibility = async (elementId: string) => {
    if (!layout || !user) return

    setIsLoading(true)
    try {
      const updatedElements = layout.elements.map((el) =>
        el.id === elementId ? { ...el, isVisible: !el.isVisible } : el
      )

      // Convert pathname to API path format
      const apiPath = pathname === "/" ? "root" : pathname.slice(1)
      const response = await fetch(`/api/pages/${encodeURIComponent(apiPath)}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": String(user.id),
        },
        body: JSON.stringify({
          pagePath: pathname,
          elements: updatedElements,
        }),
      })

      if (response.ok) {
        const updatedLayout = await response.json()
        setLayout(updatedLayout)
        onLayoutChange?.(updatedLayout)
        toast.success("Layout updated")
      } else {
        toast.error("Failed to update layout")
      }
    } catch (error) {
      toast.error("Failed to update layout")
    } finally {
      setIsLoading(false)
    }
  }

  const removeElement = async (elementId: string) => {
    if (!layout || !user) return

    if (!confirm("Are you sure you want to remove this element?")) return

    setIsLoading(true)
    try {
      const updatedElements = layout.elements.filter((el) => el.id !== elementId)

      // Convert pathname to API path format
      const apiPath = pathname === "/" ? "root" : pathname.slice(1)
      const response = await fetch(`/api/pages/${encodeURIComponent(apiPath)}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": String(user.id),
        },
        body: JSON.stringify({
          pagePath: pathname,
          elements: updatedElements,
        }),
      })

      if (response.ok) {
        const updatedLayout = await response.json()
        setLayout(updatedLayout)
        onLayoutChange?.(updatedLayout)
        toast.success("Element removed")
      } else {
        toast.error("Failed to remove element")
      }
    } catch (error) {
      toast.error("Failed to remove element")
    } finally {
      setIsLoading(false)
    }
  }

  // Don't show customizer when viewing as a user (it's a management feature)
  if (!canCustomizePages || isViewingAsUser) return null

  return (
    <>
      {/* Floating Customize Button */}
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 h-12 w-12 rounded-full shadow-lg"
        size="icon"
        aria-label="Customize page"
      >
        <Settings2 className="h-5 w-5" />
      </Button>

      {/* Customization Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Customize Page Layout</DialogTitle>
            <DialogDescription>
              Manage page elements. Toggle visibility or remove elements from this page.
            </DialogDescription>
          </DialogHeader>

          {layout && (
            <div className="space-y-4 mt-4">
              {layout.elements.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No elements on this page
                </p>
              ) : (
                layout.elements.map((element) => (
                  <div
                    key={element.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <GripVertical className="h-5 w-5 text-muted-foreground" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{element.component}</span>
                          <Badge variant="outline" className="text-xs">
                            {element.type}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          Position: {element.position}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <Label htmlFor={`toggle-${element.id}`} className="text-sm">
                          {element.isVisible ? (
                            <Eye className="h-4 w-4" />
                          ) : (
                            <EyeOff className="h-4 w-4" />
                          )}
                        </Label>
                        <Switch
                          id={`toggle-${element.id}`}
                          checked={element.isVisible}
                          onCheckedChange={() => toggleElementVisibility(element.id)}
                          disabled={isLoading}
                        />
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeElement(element.id)}
                        disabled={isLoading}
                        aria-label="Remove element"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {!layout && (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">Loading layout...</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

