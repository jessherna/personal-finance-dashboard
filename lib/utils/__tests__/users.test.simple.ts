/**
 * Simple test cases for user management functions
 * These can be run manually or with a test runner
 */

import {
  getAllUsers,
  getUserById,
  getUserByEmail,
  verifyPassword,
  createUser,
  updateUser,
  deleteUser,
  isDevUser,
  isRegularUser,
} from "../users"
import type { User } from "@/lib/types/user"

// Test helper function
function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Test failed: ${message}`)
  }
  console.log(`✓ ${message}`)
}

// Test runner
export function runUserTests() {
  console.log("Running user management tests...\n")

  try {
    // Test getAllUsers
    const allUsers = getAllUsers()
    assert(allUsers.length > 0, "getAllUsers returns users")

    // Test getUserById
    const userById = getUserById(1)
    assert(userById !== undefined, "getUserById returns user for valid id")
    assert(getUserById(999) === undefined, "getUserById returns undefined for invalid id")

    // Test getUserByEmail
    const userByEmail = getUserByEmail("admin@example.com")
    assert(userByEmail !== undefined, "getUserByEmail returns user for valid email")
    assert(
      getUserByEmail("nonexistent@example.com") === undefined,
      "getUserByEmail returns undefined for invalid email"
    )

    // Test verifyPassword
    assert(verifyPassword(1, "admin123") === true, "verifyPassword returns true for correct password")
    assert(
      verifyPassword(1, "wrongpassword") === false,
      "verifyPassword returns false for incorrect password"
    )

    // Test createUser
    const newUser = createUser({
      email: "test@example.com",
      name: "Test User",
      password: "test123",
    })
    assert(newUser.id > 0, "createUser creates user with valid id")
    assert(newUser.role === "user", "createUser defaults to user role")
    assert(newUser.isActive === true, "createUser sets isActive to true")

    // Test updateUser
    const updated = updateUser(newUser.id, { name: "Updated Name" })
    assert(updated !== null, "updateUser updates user successfully")
    assert(updated?.name === "Updated Name", "updateUser updates name correctly")

    // Test deleteUser (soft delete)
    const deleteResult = deleteUser(newUser.id)
    assert(deleteResult === true, "deleteUser returns true for valid user")
    const deletedUser = getUserById(newUser.id)
    assert(deletedUser?.isActive === false, "deleteUser sets isActive to false")

    // Test isDevUser
    const devUser: User = {
      id: 1,
      email: "dev@example.com",
      name: "Dev",
      role: "dev",
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-01T00:00:00Z",
      isActive: true,
    }
    assert(isDevUser(devUser) === true, "isDevUser returns true for dev user")
    assert(isDevUser(null) === false, "isDevUser returns false for null")

    // Test isRegularUser
    const regularUser: User = {
      id: 2,
      email: "user@example.com",
      name: "User",
      role: "user",
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-01T00:00:00Z",
      isActive: true,
    }
    assert(isRegularUser(regularUser) === true, "isRegularUser returns true for regular user")
    assert(isRegularUser(devUser) === false, "isRegularUser returns false for dev user")

    console.log("\n✅ All tests passed!")
    return true
  } catch (error) {
    console.error("\n❌ Test failed:", error)
    return false
  }
}

// Export test cases for documentation
export const testCases = {
  getAllUsers: {
    description: "Should return all users",
    test: () => getAllUsers().length > 0,
  },
  getUserById: {
    description: "Should return user by id",
    test: () => getUserById(1) !== undefined,
  },
  getUserByEmail: {
    description: "Should return user by email (case-insensitive)",
    test: () => getUserByEmail("admin@example.com") !== undefined,
  },
  verifyPassword: {
    description: "Should verify password correctly",
    test: () => verifyPassword(1, "admin123") === true,
  },
  createUser: {
    description: "Should create new user with default role 'user'",
    test: () => {
      const user = createUser({
        email: "new@example.com",
        name: "New User",
        password: "pass123",
      })
      return user.role === "user" && user.isActive === true
    },
  },
  updateUser: {
    description: "Should update user fields",
    test: () => {
      const user = createUser({
        email: "update@example.com",
        name: "Original",
        password: "pass123",
      })
      const updated = updateUser(user.id, { name: "Updated" })
      return updated?.name === "Updated"
    },
  },
  deleteUser: {
    description: "Should soft delete user (set isActive to false)",
    test: () => {
      const user = createUser({
        email: "delete@example.com",
        name: "Delete Me",
        password: "pass123",
      })
      deleteUser(user.id)
      return getUserById(user.id)?.isActive === false
    },
  },
  isDevUser: {
    description: "Should identify dev users",
    test: () => {
      const devUser: User = {
        id: 1,
        email: "dev@example.com",
        name: "Dev",
        role: "dev",
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
        isActive: true,
      }
      return isDevUser(devUser) === true && isDevUser(null) === false
    },
  },
  isRegularUser: {
    description: "Should identify regular users",
    test: () => {
      const regularUser: User = {
        id: 2,
        email: "user@example.com",
        name: "User",
        role: "user",
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
        isActive: true,
      }
      return isRegularUser(regularUser) === true
    },
  },
}

