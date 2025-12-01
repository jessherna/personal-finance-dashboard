"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import type { Notification } from "@/lib/types/notification"
import { useAuth } from "./auth-context"

interface NotificationContextType {
  notifications: Notification[]
  unreadCount: number
  isLoading: boolean
  markAsRead: (notificationId: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  deleteNotification: (notificationId: string) => Promise<void>
  refreshNotifications: () => Promise<void>
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user, isViewingAsUser } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Get effective user ID (use mock data when viewing as user)
  const getEffectiveUserId = () => {
    if (isViewingAsUser) {
      return 2 // Use John Doe's ID for mock data
    }
    return user?.id || 0
  }

  const loadNotifications = async () => {
    if (!user) {
      setNotifications([])
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    try {
      const userId = getEffectiveUserId()
      const response = await fetch(`/api/notifications?userId=${userId}`)
      if (response.ok) {
        const data = await response.json()
        setNotifications(data)
      }
    } catch (error) {
      console.error("Failed to load notifications:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadNotifications()
    // Refresh notifications every 30 seconds
    const interval = setInterval(loadNotifications, 30000)
    return () => clearInterval(interval)
  }, [user, isViewingAsUser])

  const markAsRead = async (notificationId: string) => {
    try {
      const userId = getEffectiveUserId()
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      })

      if (response.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n))
        )
      }
    } catch (error) {
      console.error("Failed to mark notification as read:", error)
    }
  }

  const markAllAsRead = async () => {
    try {
      const userId = getEffectiveUserId()
      const response = await fetch(`/api/notifications/read-all`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      })

      if (response.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
      }
    } catch (error) {
      console.error("Failed to mark all as read:", error)
    }
  }

  const deleteNotification = async (notificationId: string) => {
    try {
      const userId = getEffectiveUserId()
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      })

      if (response.ok) {
        setNotifications((prev) => prev.filter((n) => n.id !== notificationId))
      }
    } catch (error) {
      console.error("Failed to delete notification:", error)
    }
  }

  const refreshNotifications = async () => {
    await loadNotifications()
  }

  const unreadCount = notifications.filter((n) => !n.isRead).length

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refreshNotifications,
  }

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>
}

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (context === undefined) {
    throw new Error("useNotifications must be used within a NotificationProvider")
  }
  return context
}

