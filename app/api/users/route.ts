import { NextResponse } from "next/server"
import { getDBConnection } from "@/lib/db/mongodb"
import { createUserModel } from "@/lib/models/User"
import bcrypt from "bcryptjs"
import type { CreateUserInput } from "@/lib/types/user"

// GET /api/users - Get all users (dev only)
export async function GET(request: Request) {
  try {
    // In a real app, verify authentication and dev role here
    const userRole = request.headers.get("x-user-role") as "user" | "dev" | "admin" | null
    
    // Admin/dev use mock DB
    const connection = await getDBConnection(userRole === "user" ? "user" : "admin")
    const UserModel = createUserModel(connection)

    const users = await UserModel.find({}).lean().exec()

    const formattedUsers = users.map((user: any) => ({
      id: user.id || user._id,
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt?.toISOString() || new Date().toISOString(),
      updatedAt: user.updatedAt?.toISOString() || new Date().toISOString(),
      isActive: user.isActive,
      avatar: user.avatar,
    }))

    return NextResponse.json(formattedUsers)
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
    const userRole = request.headers.get("x-user-role") as "user" | "dev" | "admin" | null

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

    // Determine which database to use based on the new user's role
    // Regular users go to actual DB, admin/dev go to mock DB
    const targetRole = role || "user"
    const connection = await getDBConnection(targetRole === "user" ? "user" : "admin")
    const UserModel = createUserModel(connection)

    // Check if user already exists (check both databases)
    const existingUser = await UserModel.findOne({ email: email.toLowerCase() }).lean().exec()
    
    if (existingUser) {
      // Also check the other database
      const otherConnection = await getDBConnection(targetRole === "user" ? "admin" : "user")
      const OtherUserModel = createUserModel(otherConnection)
      const existingUserOther = await OtherUserModel.findOne({ email: email.toLowerCase() }).lean().exec()
      
      if (existingUserOther) {
        return NextResponse.json({ error: "User with this email already exists" }, { status: 409 })
      }
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
      role: targetRole,
      password: hashedPassword,
      isActive: true,
    })

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

    return NextResponse.json(userResponse, { status: 201 })
  } catch (error) {
    console.error("Create user error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

