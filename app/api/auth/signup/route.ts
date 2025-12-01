import { NextResponse } from "next/server"
import { getUserByEmail, createUser } from "@/lib/utils/users"
import type { CreateUserInput } from "@/lib/types/user"

export async function POST(request: Request) {
  try {
    const body: CreateUserInput = await request.json()
    const { email, name, password, role } = body

    if (!email || !name || !password) {
      return NextResponse.json({ error: "Email, name, and password are required" }, { status: 400 })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 })
    }

    // Validate password length
    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 })
    }

    // Check if user already exists
    const existingUser = getUserByEmail(email)
    if (existingUser) {
      return NextResponse.json({ error: "User with this email already exists" }, { status: 409 })
    }

    // Only allow user role for signups (dev and admin must be created by existing admins)
    const userRole = "user"

    const newUser = createUser({
      email,
      name,
      password,
      role: userRole,
    })

    // Generate a simple token (in a real app, use JWT or similar)
    const token = `mock-token-${newUser.id}-${Date.now()}`

    // Remove password from response
    const { ...userWithoutPassword } = newUser

    return NextResponse.json({
      user: userWithoutPassword,
      token,
    }, { status: 201 })
  } catch (error) {
    console.error("Signup error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

