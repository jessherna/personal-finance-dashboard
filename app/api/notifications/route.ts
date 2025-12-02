import { NextResponse } from "next/server"
import { getDBConnection } from "@/lib/db/mongodb"
import { createNotificationModel } from "@/lib/models/Notification"

// GET /api/notifications - Get notifications for a user
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = parseInt(searchParams.get("userId") || "0", 10)
    const userRole = request.headers.get("x-user-role") as "user" | "dev" | "admin" | null

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    const connection = await getDBConnection(userRole === "user" ? "user" : "admin")
    const NotificationModel = createNotificationModel(connection)

    const notifications = await NotificationModel.find({ userId })
      .sort({ createdAt: -1 })
      .lean()
      .exec()

    const formattedNotifications = notifications.map((notif: any) => ({
      id: notif.id || notif._id,
      userId: notif.userId,
      type: notif.type,
      title: notif.title,
      message: notif.message,
      isRead: notif.isRead,
      createdAt: notif.createdAt?.toISOString() || new Date().toISOString(),
      link: notif.link,
      metadata: notif.metadata,
    }))

    return NextResponse.json(formattedNotifications)
  } catch (error) {
    console.error("Get notifications error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

