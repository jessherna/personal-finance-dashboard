import { NextResponse } from "next/server"
import { getDBConnection } from "@/lib/db/mongodb"
import { createUserModel } from "@/lib/models/User"
import { generateResetToken } from "@/lib/utils/auth"

async function findUserByEmail(email: string) {
  const normalizedEmail = email.toLowerCase()

  let connection = await getDBConnection("user")
  let UserModel = createUserModel(connection)
  let user = await UserModel.findOne({ email: normalizedEmail }).exec()

  if (!user) {
    connection = await getDBConnection("admin")
    UserModel = createUserModel(connection)
    user = await UserModel.findOne({ email: normalizedEmail }).exec()
  }

  return user
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null)
    const email = body?.email as string | undefined

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    const user = await findUserByEmail(email)

    // Respond with success even if user not found to avoid enumeration
    if (!user) {
      return NextResponse.json({
        message: "If an account exists for that email, a reset link has been generated.",
      })
    }

    const resetToken = generateResetToken()
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

    user.resetToken = resetToken
    user.resetTokenExpires = expiresAt
    await user.save()

    return NextResponse.json({
      message: "Password reset link generated.",
      // Included for development since no email service is configured
      resetToken,
      expiresAt: expiresAt.toISOString(),
    })
  } catch (error) {
    console.error("Forgot password error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

