import type { Notification, CreateNotificationInput } from "@/lib/types/notification"
import { mockNotifications } from "@/lib/data/notifications"

/**
 * Get notifications for a user
 */
export function getUserNotifications(userId: number): Notification[] {
  return mockNotifications.filter((n) => n.userId === userId)
}

/**
 * Get unread notification count for a user
 */
export function getUnreadCount(userId: number): number {
  return getUserNotifications(userId).filter((n) => !n.isRead).length
}

/**
 * Mark notification as read
 */
export function markAsRead(notificationId: string, userId: number): boolean {
  const notification = mockNotifications.find(
    (n) => n.id === notificationId && n.userId === userId
  )
  if (notification) {
    notification.isRead = true
    return true
  }
  return false
}

/**
 * Mark all notifications as read for a user
 */
export function markAllAsRead(userId: number): number {
  const userNotifications = getUserNotifications(userId)
  const unreadCount = userNotifications.filter((n) => !n.isRead).length
  userNotifications.forEach((n) => {
    n.isRead = true
  })
  return unreadCount
}

/**
 * Create a new notification
 */
export function createNotification(input: CreateNotificationInput): Notification {
  const notification: Notification = {
    id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    userId: input.userId,
    type: input.type,
    title: input.title,
    message: input.message,
    isRead: false,
    createdAt: new Date().toISOString(),
    link: input.link,
    metadata: input.metadata,
  }
  
  mockNotifications.unshift(notification) // Add to beginning
  return notification
}

/**
 * Delete a notification
 */
export function deleteNotification(notificationId: string, userId: number): boolean {
  const index = mockNotifications.findIndex(
    (n) => n.id === notificationId && n.userId === userId
  )
  if (index > -1) {
    mockNotifications.splice(index, 1)
    return true
  }
  return false
}

