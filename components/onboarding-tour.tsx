"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { useOnboarding } from "@/contexts/onboarding-context"
import { Button } from "@/components/ui/button"
import { X, ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

export function OnboardingTour() {
  const { isActive, currentStep, steps, nextStep, previousStep, stopOnboarding } = useOnboarding()
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0, height: 0 })
  const [tooltipPosition, setTooltipPosition] = useState<{ top: number; left: number } | null>(null)
  const overlayRef = useRef<HTMLDivElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)

  const updatePosition = useCallback((element: Element, placement: string) => {
    const rect = element.getBoundingClientRect()
    const scrollX = window.scrollX || window.pageXOffset
    const scrollY = window.scrollY || window.pageYOffset

    // Calculate highlight position
    const highlightPadding = 8
    setPosition({
      top: rect.top + scrollY - highlightPadding,
      left: rect.left + scrollX - highlightPadding,
      width: rect.width + highlightPadding * 2,
      height: rect.height + highlightPadding * 2,
    })

    // Tooltip dimensions (approximate)
    const tooltipWidth = 320 // w-80 = 320px
    const tooltipHeight = 200 // approximate height
    const tooltipPadding = 16
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight

    let tooltipTop = 0
    let tooltipLeft = 0

    switch (placement) {
      case "top":
        tooltipTop = rect.top + scrollY - tooltipPadding
        tooltipLeft = rect.left + scrollX + rect.width / 2 - tooltipWidth / 2
        // Adjust if tooltip goes off screen
        if (tooltipLeft < tooltipPadding) tooltipLeft = tooltipPadding
        if (tooltipLeft + tooltipWidth > viewportWidth - tooltipPadding) {
          tooltipLeft = viewportWidth - tooltipWidth - tooltipPadding
        }
        break
      case "bottom":
        tooltipTop = rect.bottom + scrollY + tooltipPadding
        tooltipLeft = rect.left + scrollX + rect.width / 2 - tooltipWidth / 2
        // Adjust if tooltip goes off screen horizontally
        if (tooltipLeft < tooltipPadding) tooltipLeft = tooltipPadding
        if (tooltipLeft + tooltipWidth > viewportWidth - tooltipPadding) {
          tooltipLeft = viewportWidth - tooltipWidth - tooltipPadding
        }
        // If tooltip would go below viewport, place it above instead
        if (tooltipTop + tooltipHeight > scrollY + viewportHeight - tooltipPadding) {
          tooltipTop = rect.top + scrollY - tooltipPadding - tooltipHeight
          // Ensure it doesn't go above viewport either
          if (tooltipTop < scrollY + tooltipPadding) {
            tooltipTop = scrollY + tooltipPadding
          }
        }
        break
      case "left":
        tooltipTop = rect.top + scrollY + rect.height / 2 - tooltipHeight / 2
        tooltipLeft = rect.left + scrollX - tooltipPadding
        // Adjust if tooltip goes off screen
        if (tooltipTop < scrollY + tooltipPadding) tooltipTop = scrollY + tooltipPadding
        if (tooltipTop + tooltipHeight > scrollY + viewportHeight - tooltipPadding) {
          tooltipTop = scrollY + viewportHeight - tooltipHeight - tooltipPadding
        }
        // If tooltip would go off left edge, place it to the right instead
        if (tooltipLeft < tooltipPadding) {
          tooltipLeft = rect.right + scrollX + tooltipPadding
        }
        break
      case "right":
        tooltipTop = rect.top + scrollY + rect.height / 2 - tooltipHeight / 2
        tooltipLeft = rect.right + scrollX + tooltipPadding
        // Adjust if tooltip goes off screen
        if (tooltipTop < scrollY + tooltipPadding) tooltipTop = scrollY + tooltipPadding
        if (tooltipTop + tooltipHeight > scrollY + viewportHeight - tooltipPadding) {
          tooltipTop = scrollY + viewportHeight - tooltipHeight - tooltipPadding
        }
        // If tooltip would go off right edge, place it to the left instead
        if (tooltipLeft + tooltipWidth > viewportWidth - tooltipPadding) {
          tooltipLeft = rect.left + scrollX - tooltipPadding - tooltipWidth
        }
        break
      default:
        tooltipTop = rect.bottom + scrollY + tooltipPadding
        tooltipLeft = rect.left + scrollX + rect.width / 2 - tooltipWidth / 2
        // Adjust if tooltip goes off screen
        if (tooltipLeft < tooltipPadding) tooltipLeft = tooltipPadding
        if (tooltipLeft + tooltipWidth > viewportWidth - tooltipPadding) {
          tooltipLeft = viewportWidth - tooltipWidth - tooltipPadding
        }
    }

    setTooltipPosition({ top: tooltipTop, left: tooltipLeft })
  }, [])

  useEffect(() => {
    if (!isActive || currentStep >= steps.length) return

    const step = steps[currentStep]
    
    // For center placement, show modal-style overlay
    if (step.placement === "center") {
      setPosition({ top: 0, left: 0, width: window.innerWidth, height: window.innerHeight })
      setTooltipPosition({ top: window.innerHeight / 2, left: window.innerWidth / 2 })
      return
    }

    // Function to find and position element
    const findAndPosition = () => {
      const targetElement = document.querySelector(step.target)
      
      if (!targetElement) {
        return false
      }

      // Ensure element is visible
      const rect = targetElement.getBoundingClientRect()
      if (rect.width === 0 && rect.height === 0) {
        return false
      }

      updatePosition(targetElement, step.placement || "bottom")
      return true
    }

    // Try to find element immediately
    if (!findAndPosition()) {
      // If element not found, try multiple times with increasing delays (for dynamic content)
      let attempts = 0
      const maxAttempts = 5
      const interval = setInterval(() => {
        attempts++
        if (findAndPosition() || attempts >= maxAttempts) {
          clearInterval(interval)
          // If still not found after max attempts, show in center as fallback
          if (attempts >= maxAttempts) {
            setPosition({ top: 0, left: 0, width: window.innerWidth, height: window.innerHeight })
            setTooltipPosition({ top: window.innerHeight / 2, left: window.innerWidth / 2 })
          }
        }
      }, 200)

      return () => clearInterval(interval)
    }

    // Execute action if provided
    if (step.action) {
      step.action()
    }
  }, [isActive, currentStep, steps, updatePosition])

  // Scroll to element if needed and recalculate position after scroll
  useEffect(() => {
    if (!isActive || currentStep >= steps.length) return

    const step = steps[currentStep]
    if (step.placement === "center") return

    const targetElement = document.querySelector(step.target)
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: "smooth", block: "center" })
      // Recalculate position after scroll animation completes
      setTimeout(() => {
        const updatedElement = document.querySelector(step.target)
        if (updatedElement) {
          updatePosition(updatedElement, step.placement || "bottom")
        }
      }, 600) // Wait for smooth scroll to complete
    }
  }, [isActive, currentStep, steps, updatePosition])

  // Recalculate position on window resize
  useEffect(() => {
    if (!isActive || currentStep >= steps.length) return

    const step = steps[currentStep]
    if (step.placement === "center") return

    const handleResize = () => {
      const targetElement = document.querySelector(step.target)
      if (targetElement) {
        updatePosition(targetElement, step.placement || "bottom")
      }
    }

    window.addEventListener("resize", handleResize)
    window.addEventListener("scroll", handleResize)
    
    return () => {
      window.removeEventListener("resize", handleResize)
      window.removeEventListener("scroll", handleResize)
    }
  }, [isActive, currentStep, steps, updatePosition])

  if (!isActive || currentStep >= steps.length) return null

  const step = steps[currentStep]
  const isFirstStep = currentStep === 0
  const isLastStep = currentStep === steps.length - 1

  return (
    <>
      {/* Overlay */}
      <div
        ref={overlayRef}
        className="fixed inset-0 z-50 transition-opacity"
        style={{
          backgroundColor: step.placement === "center" ? "rgba(0, 0, 0, 0.8)" : "rgba(0, 0, 0, 0.5)",
        }}
        onClick={step.placement === "center" ? undefined : stopOnboarding}
      >
        {/* Highlight area */}
        {step.placement !== "center" && (
          <div
            className="absolute rounded-lg border-4 border-primary shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]"
            style={{
              top: `${position.top}px`,
              left: `${position.left}px`,
              width: `${position.width}px`,
              height: `${position.height}px`,
            }}
          />
        )}
      </div>

      {/* Tooltip */}
      {tooltipPosition && (
        <div
          ref={tooltipRef}
          className={cn(
            "fixed z-[60] w-80 max-w-[calc(100vw-2rem)] rounded-lg border border-border bg-background p-6 shadow-lg",
            step.placement === "center" && "transform -translate-x-1/2 -translate-y-1/2"
          )}
          style={{
            top: step.placement === "center" ? `${tooltipPosition.top}px` : `${tooltipPosition.top}px`,
            left: step.placement === "center" ? `${tooltipPosition.left}px` : `${tooltipPosition.left}px`,
            transform: step.placement === "center" ? "translate(-50%, -50%)" : "none",
            maxWidth: "calc(100vw - 2rem)",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="mb-4 flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-foreground">{step.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{step.content}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 flex-shrink-0"
              onClick={stopOnboarding}
              aria-label="Close tour"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Progress indicator */}
          <div className="mb-4">
            <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
              <span>Step {currentStep + 1} of {steps.length}</span>
              <span>{Math.round(((currentStep + 1) / steps.length) * 100)}%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={previousStep}
              disabled={isFirstStep}
              className="flex-1"
            >
              <ChevronLeft className="mr-1 h-4 w-4" />
              Previous
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={nextStep}
              className="flex-1"
            >
              {isLastStep ? "Finish" : "Next"}
              {!isLastStep && <ChevronRight className="ml-1 h-4 w-4" />}
            </Button>
          </div>
        </div>
      )}
    </>
  )
}

