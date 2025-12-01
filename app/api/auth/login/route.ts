import { NextResponse } from "next/server"
import { getUserByEmail, verifyPassword } from "@/lib/utils/users"
import type { LoginInput } from "@/lib/types/user"

export async function POST(request: Request) {
  try {
    const body: LoginInput = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    const user = getUserByEmail(email)
    if (!user) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 })
    }

    if (!user.isActive) {
      return NextResponse.json({ error: "Account is inactive" }, { status: 403 })
    }

    const isValidPassword = verifyPassword(user.id, password)
    if (!isValidPassword) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 })
    }

    // Generate a simple token (in a real app, use JWT or similar)
    const token = `mock-token-${user.id}-${Date.now()}`

    // Remove password from response
    const { ...userWithoutPassword } = user

    return NextResponse.json({
      user: userWithoutPassword,
      token,
    })
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

