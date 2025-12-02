import { NextResponse } from "next/server"
import { getDBConnection } from "@/lib/db/mongodb"
import { createUserModel } from "@/lib/models/User"
import bcrypt from "bcryptjs"
import type { LoginInput } from "@/lib/types/user"

export async function POST(request: Request) {
  try {
    const body: LoginInput = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    // Try both databases (users can be in either)
    // First try actual DB (for regular users)
    let connection = await getDBConnection("user")
    let UserModel = createUserModel(connection)
    let user = await UserModel.findOne({ email: email.toLowerCase() }).lean().exec()

    // If not found, try mock DB (for admin/dev)
    if (!user) {
      connection = await getDBConnection("admin")
      UserModel = createUserModel(connection)
      user = await UserModel.findOne({ email: email.toLowerCase() }).lean().exec()
    }

    if (!user) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 })
    }

    if (!user.isActive) {
      return NextResponse.json({ error: "Account is inactive" }, { status: 403 })
    }

    // Verify password
    if (!user.password) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 })
    }

    const isValidPassword = await bcrypt.compare(password, user.password)
    if (!isValidPassword) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 })
    }

    // Generate a simple token (in a real app, use JWT or similar)
    const token = `token-${user.id}-${Date.now()}`

    // Format user response (remove password)
    const userResponse = {
      id: user.id || user._id,
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt?.toISOString() || new Date().toISOString(),
      updatedAt: user.updatedAt?.toISOString() || new Date().toISOString(),
      isActive: user.isActive,
      avatar: user.avatar,
    }

    return NextResponse.json({
      user: userResponse,
      token,
    })
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

