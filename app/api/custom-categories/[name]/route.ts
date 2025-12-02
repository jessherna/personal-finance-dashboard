import { NextResponse } from "next/server"
import { getDBConnection } from "@/lib/db/mongodb"
import { createCustomCategoryModel } from "@/lib/models/CustomCategory"
import { verifyUserFromRequest } from "@/lib/utils/auth-helper"

// DELETE /api/custom-categories/[name] - Delete a custom category
export async function DELETE(request: Request, { params }: { params: Promise<{ name: string }> }) {
  try {
    // Verify user exists in database
    const verified = await verifyUserFromRequest(request)
    if (!verified) {
      return NextResponse.json({ error: "Unauthorized - User not found or inactive" }, { status: 401 })
    }

    const { userId, userRole } = verified
    const { name } = await params

    if (!name) {
      return NextResponse.json({ error: "Category name is required" }, { status: 400 })
    }

    const connection = await getDBConnection(userRole || undefined)
    const CustomCategoryModel = createCustomCategoryModel(connection)

    // Decode the category name (it might be URL encoded)
    const decodedName = decodeURIComponent(name)

    const category = await CustomCategoryModel.findOne({ userId, name: decodedName })

    if (!category) {
      return NextResponse.json({ error: "Custom category not found" }, { status: 404 })
    }

    await category.deleteOne()

    return NextResponse.json({ message: "Custom category deleted successfully" })
  } catch (error) {
    console.error("Delete custom category error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

