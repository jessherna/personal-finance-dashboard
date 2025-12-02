import { NextResponse } from "next/server"
import { getDBConnection } from "@/lib/db/mongodb"
import { createUserModel } from "@/lib/models/User"
import type { UpdateUserInput } from "@/lib/types/user"

// GET /api/users/[id] - Get user by ID
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const userId = parseInt(id, 10)
    const userRole = request.headers.get("x-user-role") as "user" | "dev" | "admin" | null

    if (isNaN(userId)) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 })
    }

    // Try both databases
    let connection = await getDBConnection("user")
    let UserModel = createUserModel(connection)
    let user = await UserModel.findOne({ id: userId }).lean().exec()

    if (!user) {
      connection = await getDBConnection("admin")
      UserModel = createUserModel(connection)
      user = await UserModel.findOne({ id: userId }).lean().exec()
    }

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const userResponse = {
      id: user.id || user._id,
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt?.toISOString() || new Date().toISOString(),
      updatedAt: user.updatedAt?.toISOString() || new Date().toISOString(),
      isActive: user.isActive,
      avatar: user.avatar,
      hasCompletedOnboarding: user.hasCompletedOnboarding || false,
    }

    return NextResponse.json(userResponse)
  } catch (error) {
    console.error("Get user error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PATCH /api/users/[id] - Update user (dev only)
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const userId = parseInt(id, 10)
    const userRole = request.headers.get("x-user-role") as "user" | "dev" | "admin" | null

    if (isNaN(userId)) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 })
    }

    const body: UpdateUserInput = await request.json()

    // Validate email if provided
    if (body.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(body.email)) {
        return NextResponse.json({ error: "Invalid email format" }, { status: 400 })
      }
    }

    // Try both databases to find user
    let connection = await getDBConnection("user")
    let UserModel = createUserModel(connection)
    let user = await UserModel.findOne({ id: userId })

    if (!user) {
      connection = await getDBConnection("admin")
      UserModel = createUserModel(connection)
      user = await UserModel.findOne({ id: userId })
    }

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Check if email is already taken by another user
    if (body.email && body.email.toLowerCase() !== user.email.toLowerCase()) {
      const existingUser = await UserModel.findOne({ email: body.email.toLowerCase(), id: { $ne: userId } }).lean().exec()
      if (existingUser) {
        // Also check the other database
        const otherConnection = await getDBConnection(user.role === "user" ? "admin" : "user")
        const OtherUserModel = createUserModel(otherConnection)
        const existingUserOther = await OtherUserModel.findOne({ email: body.email.toLowerCase() }).lean().exec()
        if (existingUserOther) {
          return NextResponse.json({ error: "Email already in use" }, { status: 409 })
        }
      }
    }

    // Update user
    if (body.email) user.email = body.email.toLowerCase()
    if (body.name) user.name = body.name
    if (body.role) user.role = body.role
    if (body.isActive !== undefined) user.isActive = body.isActive
    if (body.avatar !== undefined) user.avatar = body.avatar
    if ((body as any).hasCompletedOnboarding !== undefined) {
      user.hasCompletedOnboarding = (body as any).hasCompletedOnboarding
    }

    await user.save()

    const userResponse = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt?.toISOString() || new Date().toISOString(),
      updatedAt: user.updatedAt?.toISOString() || new Date().toISOString(),
      isActive: user.isActive,
      avatar: user.avatar,
      hasCompletedOnboarding: user.hasCompletedOnboarding || false,
    }

    return NextResponse.json(userResponse)
  } catch (error) {
    console.error("Update user error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE /api/users/[id] - Delete user (soft delete, dev only)
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const userId = parseInt(id, 10)

    if (isNaN(userId)) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 })
    }

    // Try both databases
    let connection = await getDBConnection("user")
    let UserModel = createUserModel(connection)
    let user = await UserModel.findOne({ id: userId })

    if (!user) {
      connection = await getDBConnection("admin")
      UserModel = createUserModel(connection)
      user = await UserModel.findOne({ id: userId })
    }

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Soft delete
    user.isActive = false
    await user.save()

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete user error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

