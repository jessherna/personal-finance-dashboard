import { NextResponse } from "next/server"
import { restorePageLayout } from "@/lib/utils/page-customization"

// POST /api/pages/[path]/restore-points/[id] - Restore page to a restore point (admin only)
export async function POST(
  request: Request,
  { params }: { params: Promise<{ path: string; id: string }> }
) {
  try {
    // In a real app, verify authentication and admin role here
    const { path, id } = await params
    // Handle root path specially
    const pagePath = path === "root" || path === "" ? "/" : `/${decodeURIComponent(path)}`
    const restorePointId = decodeURIComponent(id)
    
    // Get userId from headers (in a real app, from auth token)
    const userId = parseInt(request.headers.get("x-user-id") || "0", 10)
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const restoredLayout = restorePageLayout(pagePath, restorePointId, userId)
    if (!restoredLayout) {
      return NextResponse.json({ error: "Restore point not found" }, { status: 404 })
    }
    
    return NextResponse.json(restoredLayout)
  } catch (error) {
    console.error("Restore page error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

