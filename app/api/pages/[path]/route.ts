import { NextResponse } from "next/server"
import { getPageLayout, updatePageLayout, resetPageToDefault } from "@/lib/utils/page-customization"
import type { PageCustomizationInput } from "@/lib/types/page-customization"

// GET /api/pages/[path] - Get page layout
export async function GET(request: Request, { params }: { params: Promise<{ path: string }> }) {
  try {
    const { path } = await params
    // Handle root path specially
    const pagePath = path === "root" || path === "" ? "/" : `/${decodeURIComponent(path)}`
    
    const layout = getPageLayout(pagePath)
    if (!layout) {
      return NextResponse.json({ error: "Page layout not found" }, { status: 404 })
    }
    
    return NextResponse.json(layout)
  } catch (error) {
    console.error("Get page layout error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PATCH /api/pages/[path] - Update page layout (dev/admin only)
export async function PATCH(request: Request, { params }: { params: Promise<{ path: string }> }) {
  try {
    // In a real app, verify authentication and dev/admin role here
    const { path } = await params
    // Handle root path specially
    const pagePath = path === "root" || path === "" ? "/" : `/${decodeURIComponent(path)}`
    
    const body: PageCustomizationInput = await request.json()
    
    // Get userId from headers (in a real app, from auth token)
    const userId = parseInt(request.headers.get("x-user-id") || "0", 10)
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const updatedLayout = updatePageLayout(pagePath, body, userId)
    
    return NextResponse.json(updatedLayout)
  } catch (error) {
    console.error("Update page layout error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/pages/[path]/reset - Reset page to default (admin only)
export async function POST(request: Request, { params }: { params: Promise<{ path: string }> }) {
  try {
    // In a real app, verify authentication and admin role here
    const { path } = await params
    // Handle root path specially
    const pagePath = path === "root" || path === "" ? "/" : `/${decodeURIComponent(path)}`
    
    // Get userId from headers (in a real app, from auth token)
    const userId = parseInt(request.headers.get("x-user-id") || "0", 10)
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const resetLayout = resetPageToDefault(pagePath, userId)
    if (!resetLayout) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 })
    }
    
    return NextResponse.json(resetLayout)
  } catch (error) {
    console.error("Reset page error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

