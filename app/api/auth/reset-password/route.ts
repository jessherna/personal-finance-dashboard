import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { getDBConnection } from "@/lib/db/mongodb"
import { createUserModel } from "@/lib/models/User"
import { isValidPassword } from "@/lib/utils/auth"

async function findUserByToken(token: string) {
  const now = new Date()

  let connection = await getDBConnection("user")
  let UserModel = createUserModel(connection)
  let user = await UserModel.findOne({
    resetToken: token,
    resetTokenExpires: { $gt: now },
  }).exec()

  if (!user) {
    connection = await getDBConnection("admin")
    UserModel = createUserModel(connection)
    user = await UserModel.findOne({
      resetToken: token,
      resetTokenExpires: { $gt: now },
    }).exec()
  }

  return user
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null)
    const token = body?.token as string | undefined
    const password = body?.password as string | undefined

    if (!token || !password) {
      return NextResponse.json({ error: "Token and password are required" }, { status: 400 })
    }

    if (!isValidPassword(password)) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long" },
        { status: 400 }
      )
    }

    const user = await findUserByToken(token)

    if (!user) {
      return NextResponse.json({ error: "Invalid or expired reset token" }, { status: 400 })
    }

    const hashedPassword = await bcrypt.hash(password, 10)
    user.password = hashedPassword
    user.resetToken = undefined
    user.resetTokenExpires = undefined
    await user.save()

    return NextResponse.json({ message: "Password has been reset successfully" })
  } catch (error) {
    console.error("Reset password error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

