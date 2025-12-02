import { NextResponse } from "next/server"
import { getDBConnection } from "@/lib/db/mongodb"
import { createUserModel } from "@/lib/models/User"

// GET /api/auth/verify - Verify if the current user token is valid and user exists in database
// This endpoint verifies that the logged-in user exists in the database
export async function GET(request: Request) {
  try {
    // Get token from Authorization header or query param
    const authHeader = request.headers.get("authorization")
    const token = authHeader?.replace("Bearer ", "") || request.headers.get("x-token") || new URL(request.url).searchParams.get("token")

    if (!token) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 })
    }

    // Extract user ID from token (format: token-{userId}-{timestamp})
    // Handle tokens that might have been created with different formats
    let userIdToVerify: number | null = null
    
    // Try to parse token-{userId}-{timestamp} format
    if (token.startsWith("token-")) {
      const tokenParts = token.split("-")
      if (tokenParts.length >= 3 && tokenParts[0] === "token") {
        userIdToVerify = parseInt(tokenParts[1], 10)
      }
    }
    
    // If parsing failed, try to extract from stored user data (fallback)
    if (!userIdToVerify || isNaN(userIdToVerify)) {
      // Try to get userId from query params as fallback
      const userIdParam = new URL(request.url).searchParams.get("userId")
      if (userIdParam) {
        userIdToVerify = parseInt(userIdParam, 10)
      }
    }
    
    if (!userIdToVerify || isNaN(userIdToVerify)) {
      return NextResponse.json({ error: "Invalid token format - could not extract user ID" }, { status: 401 })
    }

    // Try both databases to find the user
    // First try actual DB (for regular users)
    let connection = await getDBConnection("user")
    let UserModel = createUserModel(connection)
    let user = await UserModel.findOne({ id: userIdToVerify }).lean().exec()

    // If not found, try mock DB (for admin/dev)
    if (!user) {
      connection = await getDBConnection("admin")
      UserModel = createUserModel(connection)
      user = await UserModel.findOne({ id: userIdToVerify }).lean().exec()
    }

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    if (!user.isActive) {
      return NextResponse.json({ error: "Account is inactive" }, { status: 403 })
    }

    // Format user response (remove password)
    // Handle both MongoDB _id and numeric id
    const userResponseId = user.id || (user._id && typeof user._id === 'object' ? (user._id as any).toString() : user._id)
    
    const userResponse = {
      id: typeof userResponseId === 'number' ? userResponseId : parseInt(String(userResponseId), 10),
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt?.toISOString() || new Date().toISOString(),
      updatedAt: user.updatedAt?.toISOString() || new Date().toISOString(),
      isActive: user.isActive,
      avatar: user.avatar,
      hasCompletedOnboarding: user.hasCompletedOnboarding || false,
    }

    return NextResponse.json({
      valid: true,
      user: userResponse,
    })
  } catch (error) {
    console.error("Token verification error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

