import { NextResponse } from "next/server"
import { getDBConnection } from "@/lib/db/mongodb"
import { createNotificationModel } from "@/lib/models/Notification"

// POST /api/notifications/[id]/read - Mark notification as read
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { userId } = body
    const userRole = request.headers.get("x-user-role") as "user" | "dev" | "admin" | null

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    const connection = await getDBConnection(userRole === "user" ? "user" : "admin")
    const NotificationModel = createNotificationModel(connection)

    const notification = await NotificationModel.findOne({ id, userId })
    if (!notification) {
      return NextResponse.json({ error: "Notification not found" }, { status: 404 })
    }

    notification.isRead = true
    await notification.save()

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Mark notification as read error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE /api/notifications/[id] - Delete notification
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { userId } = body
    const userRole = request.headers.get("x-user-role") as "user" | "dev" | "admin" | null

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    const connection = await getDBConnection(userRole === "user" ? "user" : "admin")
    const NotificationModel = createNotificationModel(connection)

    const result = await NotificationModel.deleteOne({ id, userId })
    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Notification not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete notification error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

