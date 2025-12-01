import { NextResponse } from "next/server"
import { getAllUsers, createUser } from "@/lib/utils/users"
import type { CreateUserInput } from "@/lib/types/user"

// GET /api/users - Get all users (dev only)
export async function GET(request: Request) {
  try {
    // In a real app, verify authentication and dev role here
    const users = getAllUsers()
    return NextResponse.json(users)
  } catch (error) {
    console.error("Get users error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/users - Create a new user (dev only)
export async function POST(request: Request) {
  try {
    // In a real app, verify authentication and dev role here
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

    const { getUserByEmail } = await import("@/lib/utils/users")
    const existingUser = getUserByEmail(email)
    if (existingUser) {
      return NextResponse.json({ error: "User with this email already exists" }, { status: 409 })
    }

    const newUser = createUser({
      email,
      name,
      password,
      role: role || "user",
    })

    // Remove password from response
    const { ...userWithoutPassword } = newUser

    return NextResponse.json(userWithoutPassword, { status: 201 })
  } catch (error) {
    console.error("Create user error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

