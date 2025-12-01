import { NextResponse } from "next/server"
import { getRestorePoints, restorePageLayout, createRestorePoint } from "@/lib/utils/page-customization"
import { getPageLayout } from "@/lib/utils/page-customization"

// GET /api/pages/[path]/restore-points - Get restore points for a page (admin only)
export async function GET(request: Request, { params }: { params: Promise<{ path: string }> }) {
  try {
    // In a real app, verify authentication and admin role here
    const { path } = await params
    const pagePath = `/${decodeURIComponent(path)}`
    
    const restorePoints = getRestorePoints(pagePath)
    
    return NextResponse.json(restorePoints)
  } catch (error) {
    console.error("Get restore points error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/pages/[path]/restore-points - Create a restore point (admin only)
export async function POST(request: Request, { params }: { params: Promise<{ path: string }> }) {
  try {
    // In a real app, verify authentication and admin role here
    const { path } = await params
    // Handle root path specially
    const pagePath = path === "root" || path === "" ? "/" : `/${decodeURIComponent(path)}`
    
    const body = await request.json()
    const { description } = body
    
    // Get userId from headers (in a real app, from auth token)
    const userId = parseInt(request.headers.get("x-user-id") || "0", 10)
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const layout = getPageLayout(pagePath)
    if (!layout) {
      return NextResponse.json({ error: "Page layout not found" }, { status: 404 })
    }
    
    const restorePoint = createRestorePoint(pagePath, layout, userId, false, description)
    
    return NextResponse.json(restorePoint, { status: 201 })
  } catch (error) {
    console.error("Create restore point error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

