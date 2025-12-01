import { NextResponse } from "next/server"
import { getUserNotifications } from "@/lib/utils/notifications"

// GET /api/notifications - Get notifications for a user
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = parseInt(searchParams.get("userId") || "0", 10)

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    const notifications = getUserNotifications(userId)
    // Sort by created date (newest first)
    const sortedNotifications = notifications.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )

    return NextResponse.json(sortedNotifications)
  } catch (error) {
    console.error("Get notifications error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

