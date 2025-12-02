"use client"

import { useEffect, useRef, useCallback } from "react"

interface UseIdleTimeoutOptions {
  timeout: number // in milliseconds
  onIdle: () => void
  enabled?: boolean
}

/**
 * Hook to track user activity and trigger a callback after a period of inactivity
 * @param timeout - Time in milliseconds before considering user idle
 * @param onIdle - Callback to execute when idle timeout is reached
 * @param enabled - Whether the idle timeout is enabled
 */
export function useIdleTimeout({ timeout, onIdle, enabled = true }: UseIdleTimeoutOptions) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastActivityRef = useRef<number>(Date.now())

  const resetTimer = useCallback(() => {
    if (!enabled) return

    // Clear existing timer
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Update last activity time
    lastActivityRef.current = Date.now()

    // Set new timer
    timeoutRef.current = setTimeout(() => {
      const timeSinceLastActivity = Date.now() - lastActivityRef.current
      if (timeSinceLastActivity >= timeout) {
        onIdle()
      }
    }, timeout)
  }, [timeout, onIdle, enabled])

  useEffect(() => {
    if (!enabled) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      return
    }

    // Initialize timer
    resetTimer()

    // Track user activity events
    const events = [
      "mousedown",
      "mousemove",
      "keypress",
      "scroll",
      "touchstart",
      "click",
      "keydown",
    ]

    const handleActivity = () => {
      resetTimer()
    }

    // Add event listeners
    events.forEach((event) => {
      window.addEventListener(event, handleActivity, { passive: true })
    })

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      events.forEach((event) => {
        window.removeEventListener(event, handleActivity)
      })
    }
  }, [resetTimer, enabled])

  // Return function to manually reset the timer
  return { resetTimer }
}

