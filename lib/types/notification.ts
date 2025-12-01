export type NotificationType = "info" | "warning" | "success" | "error" | "budget" | "savings" | "transaction"

export interface Notification {
  id: string
  userId: number
  type: NotificationType
  title: string
  message: string
  isRead: boolean
  createdAt: string // ISO date string
  link?: string // Optional link to navigate to
  metadata?: Record<string, any> // Additional data
}

export interface CreateNotificationInput {
  userId: number
  type: NotificationType
  title: string
  message: string
  link?: string
  metadata?: Record<string, any>
}

