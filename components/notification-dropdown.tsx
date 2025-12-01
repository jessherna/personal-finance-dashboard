"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Bell, Check, CheckCheck, Trash2, AlertCircle, Info, CheckCircle2, AlertTriangle, TrendingUp, Wallet } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { useNotifications } from "@/contexts/notification-context"
import { formatDistanceToNow } from "@/lib/utils/date"
import { cn } from "@/lib/utils"
import type { Notification } from "@/lib/types/notification"

const notificationIcons = {
  info: Info,
  warning: AlertTriangle,
  success: CheckCircle2,
  error: AlertCircle,
  budget: TrendingUp,
  savings: Wallet,
  transaction: Wallet,
}

const notificationColors = {
  info: "text-blue-600 bg-blue-50 dark:bg-blue-950",
  warning: "text-amber-600 bg-amber-50 dark:bg-amber-950",
  success: "text-green-600 bg-green-50 dark:bg-green-950",
  error: "text-red-600 bg-red-50 dark:bg-red-950",
  budget: "text-purple-600 bg-purple-50 dark:bg-purple-950",
  savings: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950",
  transaction: "text-indigo-600 bg-indigo-50 dark:bg-indigo-950",
}

export function NotificationDropdown() {
  const router = useRouter()
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification } = useNotifications()
  const [isOpen, setIsOpen] = useState(false)

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.isRead) {
      await markAsRead(notification.id)
    }
    if (notification.link) {
      router.push(notification.link)
      setIsOpen(false)
    }
  }

  const handleMarkAllAsRead = async () => {
    await markAllAsRead()
  }

  const handleDelete = async (e: React.MouseEvent, notificationId: string) => {
    e.stopPropagation()
    await deleteNotification(notificationId)
  }

  const unreadNotifications = notifications.filter((n) => !n.isRead)
  const readNotifications = notifications.filter((n) => n.isRead)

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="View notifications"
        >
          <Bell className="h-5 w-5" aria-hidden="true" />
          {unreadCount > 0 && (
            <span className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 sm:w-96 p-0" align="end">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold">Notifications</h3>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                {unreadCount} new
              </Badge>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllAsRead}
              className="h-8 text-xs"
            >
              <CheckCheck className="h-3 w-3 mr-1" />
              Mark all read
            </Button>
          )}
        </div>

        <ScrollArea className="h-[400px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Bell className="h-12 w-12 text-muted-foreground/50 mb-3" />
              <p className="text-sm font-medium text-muted-foreground">No notifications</p>
              <p className="text-xs text-muted-foreground mt-1">You're all caught up!</p>
            </div>
          ) : (
            <div className="divide-y">
              {/* Unread notifications */}
              {unreadNotifications.length > 0 && (
                <>
                  {unreadNotifications.map((notification) => {
                    const Icon = notificationIcons[notification.type] || Info
                    return (
                      <div
                        key={notification.id}
                        className={cn(
                          "relative cursor-pointer transition-colors hover:bg-muted/50",
                          !notification.isRead && "bg-muted/30"
                        )}
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <div className="flex items-start gap-3 p-4">
                          <div className={cn(
                            "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                            notificationColors[notification.type]
                          )}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0 space-y-1">
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-sm font-medium leading-none">
                                {notification.title}
                              </p>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 -mt-1 -mr-1"
                                onClick={(e) => handleDelete(e, notification.id)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {notification.message}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                            </p>
                          </div>
                          {!notification.isRead && (
                            <div className="mt-2 h-2 w-2 rounded-full bg-primary shrink-0" />
                          )}
                        </div>
                      </div>
                    )
                  })}
                </>
              )}

              {/* Read notifications */}
              {readNotifications.length > 0 && (
                <>
                  {unreadNotifications.length > 0 && (
                    <div className="px-4 py-2 text-xs font-medium text-muted-foreground bg-muted/30">
                      Older
                    </div>
                  )}
                  {readNotifications.map((notification) => {
                    const Icon = notificationIcons[notification.type] || Info
                    return (
                      <div
                        key={notification.id}
                        className="relative cursor-pointer transition-colors hover:bg-muted/50"
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <div className="flex items-start gap-3 p-4">
                          <div className={cn(
                            "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg opacity-60",
                            notificationColors[notification.type]
                          )}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0 space-y-1">
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-sm font-medium leading-none text-muted-foreground">
                                {notification.title}
                              </p>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 -mt-1 -mr-1"
                                onClick={(e) => handleDelete(e, notification.id)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {notification.message}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                            </p>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </>
              )}
            </div>
          )}
        </ScrollArea>

        {notifications.length > 0 && (
          <div className="border-t p-2">
            <Button
              variant="ghost"
              className="w-full justify-center text-xs"
              onClick={() => setIsOpen(false)}
            >
              Close
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}

