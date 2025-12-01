import { NextResponse } from "next/server"
import { markAllAsRead } from "@/lib/utils/notifications"

// POST /api/notifications/read-all - Mark all notifications as read
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { userId } = body

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    const count = markAllAsRead(userId)
    return NextResponse.json({ success: true, count })
  } catch (error) {
    console.error("Mark all as read error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

