import { NextResponse } from "next/server"

export async function POST() {
  // In a real app, you might invalidate the token on the server
  // For now, we just return success and let the client clear localStorage
  return NextResponse.json({ success: true })
}

