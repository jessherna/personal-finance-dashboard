import { getDBConnection } from "@/lib/db/mongodb"
import { createUserModel } from "@/lib/models/User"

/**
 * Verify that a user exists in the database and is active
 * @param userId - The user ID to verify
 * @param userRole - Optional user role hint (to determine which DB to check first)
 * @returns The user object if found and active, null otherwise
 */
export async function verifyUserExists(
  userId: number,
  userRole?: "user" | "dev" | "admin"
): Promise<{ id: number; email: string; name: string; role: string; isActive: boolean } | null> {
  try {
    if (!userId || isNaN(userId)) {
      return null
    }

    // Try both databases to find the user
    // First try based on role hint, then try the other
    let connection = await getDBConnection(userRole || "user")
    let UserModel = createUserModel(connection)
    let user = await UserModel.findOne({ id: userId }).lean().exec()

    // If not found and we have a role hint, try the other database
    if (!user && userRole) {
      const otherRole = userRole === "user" ? "admin" : "user"
      connection = await getDBConnection(otherRole)
      UserModel = createUserModel(connection)
      user = await UserModel.findOne({ id: userId }).lean().exec()
    }

    // If still not found, try both databases systematically
    if (!user) {
      // Try actual DB (for regular users)
      connection = await getDBConnection("user")
      UserModel = createUserModel(connection)
      user = await UserModel.findOne({ id: userId }).lean().exec()

      // If not found, try mock DB (for admin/dev)
      if (!user) {
        connection = await getDBConnection("admin")
        UserModel = createUserModel(connection)
        user = await UserModel.findOne({ id: userId }).lean().exec()
      }
    }

    if (!user) {
      return null
    }

    if (!user.isActive) {
      return null
    }

    return {
      id: user.id || (user._id as any),
      email: user.email,
      name: user.name,
      role: user.role,
      isActive: user.isActive,
    }
  } catch (error) {
    console.error("Error verifying user:", error)
    return null
  }
}

/**
 * Extract and verify user from request headers
 * @param request - The request object
 * @returns The verified user or null
 */
export async function verifyUserFromRequest(request: Request): Promise<{
  userId: number
  userRole: "user" | "dev" | "admin"
  user: { id: number; email: string; name: string; role: string; isActive: boolean }
} | null> {
  try {
    const userId = parseInt(request.headers.get("x-user-id") || "0", 10)
    const userRole = (request.headers.get("x-user-role") || "user") as "user" | "dev" | "admin"

    if (!userId) {
      return null
    }

    const user = await verifyUserExists(userId, userRole)

    if (!user) {
      return null
    }

    // Verify the role matches what was sent
    if (user.role !== userRole) {
      // Role mismatch - use the actual role from database
      return {
        userId: user.id,
        userRole: user.role as "user" | "dev" | "admin",
        user,
      }
    }

    return {
      userId: user.id,
      userRole: user.role as "user" | "dev" | "admin",
      user,
    }
  } catch (error) {
    console.error("Error verifying user from request:", error)
    return null
  }
}

