export type UserRole = "user" | "dev" | "admin"

export interface User {
  id: number
  email: string
  name: string
  role: UserRole
  createdAt: string // ISO date string
  updatedAt: string // ISO date string
  isActive: boolean
  avatar?: string
}

export interface CreateUserInput {
  email: string
  name: string
  password: string
  role?: UserRole
}

export interface UpdateUserInput {
  email?: string
  name?: string
  role?: UserRole
  isActive?: boolean
}

export interface LoginInput {
  email: string
  password: string
}

export interface AuthResponse {
  user: User
  token: string
}

