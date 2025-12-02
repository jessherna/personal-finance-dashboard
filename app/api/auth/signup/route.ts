import { NextResponse } from "next/server"
import { getDBConnection } from "@/lib/db/mongodb"
import { createUserModel } from "@/lib/models/User"
import bcrypt from "bcryptjs"
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

    // Only allow user role for signups (dev and admin must be created by existing admins)
    const userRole = "user"

    // Use actual database for new user signups
    const connection = await getDBConnection("user")
    const UserModel = createUserModel(connection)

    // Check if user already exists (check both databases)
    const existingUserActual = await UserModel.findOne({ email: email.toLowerCase() }).lean().exec()
    
    if (existingUserActual) {
      return NextResponse.json({ error: "User with this email already exists" }, { status: 409 })
    }

    // Check mock DB too
    const mockConnection = await getDBConnection("admin")
    const MockUserModel = createUserModel(mockConnection)
    const existingUserMock = await MockUserModel.findOne({ email: email.toLowerCase() }).lean().exec()
    
    if (existingUserMock) {
      return NextResponse.json({ error: "User with this email already exists" }, { status: 409 })
    }

    // Get the highest ID to generate new one
    const existingUsers = await UserModel.find({}).sort({ id: -1 }).limit(1).lean().exec()
    const maxId = existingUsers.length > 0 && existingUsers[0].id ? existingUsers[0].id : 0

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create new user
    const newUser = await UserModel.create({
      id: maxId + 1,
      email: email.toLowerCase(),
      name,
      role: userRole,
      password: hashedPassword,
      isActive: true,
    })

    // Generate a simple token (in a real app, use JWT or similar)
    const token = `token-${newUser.id}-${Date.now()}`

    // Format user response (remove password)
    const userResponse = {
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      role: newUser.role,
      createdAt: newUser.createdAt?.toISOString() || new Date().toISOString(),
      updatedAt: newUser.updatedAt?.toISOString() || new Date().toISOString(),
      isActive: newUser.isActive,
      avatar: newUser.avatar,
    }

    return NextResponse.json({
      user: userResponse,
      token,
    }, { status: 201 })
  } catch (error) {
    console.error("Signup error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

