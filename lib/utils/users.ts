import type { User, CreateUserInput, UpdateUserInput } from "@/lib/types/user"
import { mockUsers, mockPasswords } from "@/lib/data/users"

/**
 * Get all users
 */
export function getAllUsers(): User[] {
  return [...mockUsers]
}

/**
 * Get user by ID
 */
export function getUserById(id: number): User | undefined {
  return mockUsers.find((user) => user.id === id)
}

/**
 * Get user by email
 */
export function getUserByEmail(email: string): User | undefined {
  return mockUsers.find((user) => user.email.toLowerCase() === email.toLowerCase())
}

/**
 * Verify user password (mock implementation)
 * In a real app, this would verify against a hashed password
 */
export function verifyPassword(userId: number, password: string): boolean {
  const storedPassword = mockPasswords[userId]
  return storedPassword === password
}

/**
 * Create a new user
 */
export function createUser(input: CreateUserInput): User {
  const newId = Math.max(...mockUsers.map((u) => u.id), 0) + 1
  const now = new Date().toISOString()
  
  const newUser: User = {
    id: newId,
    email: input.email,
    name: input.name,
    role: input.role || "user",
    createdAt: now,
    updatedAt: now,
    isActive: true,
  }
  
  mockUsers.push(newUser)
  mockPasswords[newId] = input.password
  
  return newUser
}

/**
 * Update an existing user
 */
export function updateUser(id: number, input: UpdateUserInput): User | null {
  const userIndex = mockUsers.findIndex((u) => u.id === id)
  if (userIndex === -1) return null
  
  const updatedUser: User = {
    ...mockUsers[userIndex],
    ...input,
    updatedAt: new Date().toISOString(),
  }
  
  mockUsers[userIndex] = updatedUser
  return updatedUser
}

/**
 * Delete a user (soft delete by setting isActive to false)
 */
export function deleteUser(id: number): boolean {
  const user = getUserById(id)
  if (!user) return false
  
  user.isActive = false
  user.updatedAt = new Date().toISOString()
  return true
}

/**
 * Check if user has admin role
 */
export function isAdminUser(user: User | null | undefined): boolean {
  return user?.role === "admin"
}

/**
 * Check if user has dev role
 */
export function isDevUser(user: User | null | undefined): boolean {
  return user?.role === "dev"
}

/**
 * Check if user has user role
 */
export function isRegularUser(user: User | null | undefined): boolean {
  return user?.role === "user"
}

/**
 * Check if user has dev or admin role (can customize pages)
 */
export function canCustomizePages(user: User | null | undefined): boolean {
  return user?.role === "dev" || user?.role === "admin"
}

/**
 * Check if user has admin role (can restore pages)
 */
export function canRestorePages(user: User | null | undefined): boolean {
  return user?.role === "admin"
}

/**
 * Get role hierarchy level (higher = more permissions)
 */
export function getRoleLevel(role: User["role"]): number {
  switch (role) {
    case "admin":
      return 3
    case "dev":
      return 2
    case "user":
      return 1
    default:
      return 0
  }
}

/**
 * Check if user has equal or higher role than required
 */
export function hasMinimumRole(user: User | null | undefined, requiredRole: User["role"]): boolean {
  if (!user) return false
  return getRoleLevel(user.role) >= getRoleLevel(requiredRole)
}

