import { NextResponse } from "next/server"
import { getDBConnection } from "@/lib/db/mongodb"
import { createNotificationModel } from "@/lib/models/Notification"

// POST /api/notifications/read-all - Mark all notifications as read
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { userId } = body
    const userRole = request.headers.get("x-user-role") as "user" | "dev" | "admin" | null

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    const connection = await getDBConnection(userRole === "user" ? "user" : "admin")
    const NotificationModel = createNotificationModel(connection)

    const result = await NotificationModel.updateMany(
      { userId, isRead: false },
      { $set: { isRead: true } }
    )

    return NextResponse.json({ success: true, count: result.modifiedCount })
  } catch (error) {
    console.error("Mark all as read error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

