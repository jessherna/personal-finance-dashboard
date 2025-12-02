import { NextResponse } from "next/server"
import { getDBConnection } from "@/lib/db/mongodb"
import { createCustomCategoryModel } from "@/lib/models/CustomCategory"
import { verifyUserFromRequest } from "@/lib/utils/auth-helper"

// GET /api/custom-categories - Get all custom categories for a user
export async function GET(request: Request) {
  try {
    // Verify user exists in database
    const verified = await verifyUserFromRequest(request)
    if (!verified) {
      return NextResponse.json({ error: "Unauthorized - User not found or inactive" }, { status: 401 })
    }

    const { userId, userRole } = verified

    const connection = await getDBConnection(userRole || undefined)
    const CustomCategoryModel = createCustomCategoryModel(connection)

    const categories = await CustomCategoryModel.find({ userId }).lean().exec()

    // Convert to Record<string, string> format (name -> color)
    const categoriesMap: Record<string, string> = {}
    categories.forEach((cat: any) => {
      categoriesMap[cat.name] = cat.color
    })

    return NextResponse.json(categoriesMap)
  } catch (error) {
    console.error("Get custom categories error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/custom-categories - Create a new custom category
export async function POST(request: Request) {
  try {
    // Verify user exists in database
    const verified = await verifyUserFromRequest(request)
    if (!verified) {
      return NextResponse.json({ error: "Unauthorized - User not found or inactive" }, { status: 401 })
    }

    const { userId, userRole } = verified

    const body = await request.json()
    const { name, color } = body

    if (!name || !color) {
      return NextResponse.json({ error: "Missing required fields: name and color" }, { status: 400 })
    }

    const connection = await getDBConnection(userRole || undefined)
    const CustomCategoryModel = createCustomCategoryModel(connection)

    // Check if category already exists for this user
    const existingCategory = await CustomCategoryModel.findOne({ userId, name: name.trim() }).lean().exec()
    if (existingCategory) {
      return NextResponse.json({ error: "Category already exists" }, { status: 409 })
    }

    // Get the highest ID to generate a new one
    const existingCategories = await CustomCategoryModel.find({ userId }).sort({ id: -1 }).limit(1).lean().exec()
    const nextId = existingCategories.length > 0 ? (existingCategories[0] as any).id + 1 : 1

    const newCategory = new CustomCategoryModel({
      id: nextId,
      userId,
      name: name.trim(),
      color: color,
    })

    await newCategory.save()

    const formattedCategory = {
      id: newCategory.id,
      name: newCategory.name,
      color: newCategory.color,
    }

    return NextResponse.json(formattedCategory, { status: 201 })
  } catch (error) {
    console.error("Create custom category error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

