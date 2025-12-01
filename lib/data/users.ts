import type { User } from "@/lib/types/user"

// Mock users data - in a real app, this would come from a database
export const mockUsers: User[] = [
  {
    id: 1,
    email: "admin@example.com",
    name: "Admin User",
    role: "admin",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
    isActive: true,
    avatar: "/placeholder-user.jpg",
  },
  {
    id: 2,
    email: "john.doe@example.com",
    name: "John Doe",
    role: "user",
    createdAt: "2024-01-15T00:00:00Z",
    updatedAt: "2024-01-15T00:00:00Z",
    isActive: true,
  },
  {
    id: 3,
    email: "jane.smith@example.com",
    name: "Jane Smith",
    role: "user",
    createdAt: "2024-02-01T00:00:00Z",
    updatedAt: "2024-02-01T00:00:00Z",
    isActive: true,
  },
  {
    id: 4,
    email: "dev@example.com",
    name: "Developer",
    role: "dev",
    createdAt: "2024-02-10T00:00:00Z",
    updatedAt: "2024-02-10T00:00:00Z",
    isActive: true,
  },
  {
    id: 5,
    email: "inactive@example.com",
    name: "Inactive User",
    role: "user",
    createdAt: "2024-01-20T00:00:00Z",
    updatedAt: "2024-01-20T00:00:00Z",
    isActive: false,
  },
]

// Mock passwords (in a real app, these would be hashed)
export const mockPasswords: Record<number, string> = {
  1: "admin123",
  2: "user123",
  3: "user123",
  4: "dev123",
  5: "user123",
}

