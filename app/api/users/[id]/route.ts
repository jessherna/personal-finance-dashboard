import { NextResponse } from "next/server"
import { getUserById, updateUser, deleteUser } from "@/lib/utils/users"
import type { UpdateUserInput } from "@/lib/types/user"

// GET /api/users/[id] - Get user by ID
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    // In a real app, verify authentication here
    const { id } = await params
    const userId = parseInt(id, 10)

    if (isNaN(userId)) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 })
    }

    const user = getUserById(userId)
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error("Get user error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PATCH /api/users/[id] - Update user (dev only)
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    // In a real app, verify authentication and dev role here
    const { id } = await params
    const userId = parseInt(id, 10)

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

      // Check if email is already taken by another user
      const { getUserByEmail } = await import("@/lib/utils/users")
      const existingUser = getUserByEmail(body.email)
      if (existingUser && existingUser.id !== userId) {
        return NextResponse.json({ error: "Email already in use" }, { status: 409 })
      }
    }

    const updatedUser = updateUser(userId, body)
    if (!updatedUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error("Update user error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE /api/users/[id] - Delete user (soft delete, dev only)
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    // In a real app, verify authentication and dev role here
    const { id } = await params
    const userId = parseInt(id, 10)

    if (isNaN(userId)) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 })
    }

    const success = deleteUser(userId)
    if (!success) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete user error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

