"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import type { User, LoginInput, CreateUserInput } from "@/lib/types/user"

interface AuthContextType {
  user: User | null
  isViewingAsUser: boolean // Generic "View As User" mode (perspective mode, data source controlled by toggle)
  isLoading: boolean
  login: (input: LoginInput) => Promise<{ success: boolean; error?: string }>
  signup: (input: CreateUserInput) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  toggleViewAsUser: () => void
  clearViewAs: () => void
  isAuthenticated: boolean
  isAdmin: boolean
  isDev: boolean
  canCustomizePages: boolean
  canRestorePages: boolean
  canViewAs: boolean // Can use view-as feature
  effectiveUser: User | null // The user whose perspective we're using (user when viewing as, or actual user)
  isRegularUser: boolean // True if logged in as regular user OR viewing as user
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isViewingAsUser, setIsViewingAsUser] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState(true)

  // Load user from localStorage on mount
  useEffect(() => {
    const loadUser = async () => {
      try {
        const storedUser = localStorage.getItem("user")
        const storedViewAs = localStorage.getItem("isViewingAsUser")
        const token = localStorage.getItem("token")
        
        if (storedUser && token) {
          const parsedUser = JSON.parse(storedUser)
          // Verify token is still valid (in a real app, you'd verify with the server)
          setUser(parsedUser)
          
          // Load view-as mode if exists
          if (storedViewAs === "true") {
            setIsViewingAsUser(true)
          }
        }
      } catch (error) {
        console.error("Failed to load user:", error)
        localStorage.removeItem("user")
        localStorage.removeItem("token")
        localStorage.removeItem("isViewingAsUser")
      } finally {
        setIsLoading(false)
      }
    }
    
    loadUser()
  }, [])

  const login = async (input: LoginInput): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      })

      const data = await response.json()

      if (!response.ok) {
        return { success: false, error: data.error || "Login failed" }
      }

      setUser(data.user)
      localStorage.setItem("user", JSON.stringify(data.user))
      localStorage.setItem("token", data.token)
      
      return { success: true }
    } catch (error) {
      return { success: false, error: "Network error. Please try again." }
    }
  }

  const signup = async (input: CreateUserInput): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      })

      const data = await response.json()

      if (!response.ok) {
        return { success: false, error: data.error || "Signup failed" }
      }

      setUser(data.user)
      localStorage.setItem("user", JSON.stringify(data.user))
      localStorage.setItem("token", data.token)
      
      return { success: true }
    } catch (error) {
      return { success: false, error: "Network error. Please try again." }
    }
  }

  const logout = async (): Promise<void> => {
    try {
      await fetch("/api/auth/logout", { method: "POST" })
    } catch (error) {
      console.error("Logout error:", error)
    } finally {
      setUser(null)
      setIsViewingAsUser(false)
      localStorage.removeItem("user")
      localStorage.removeItem("token")
      localStorage.removeItem("isViewingAsUser")
    }
  }

  const toggleViewAsUser = () => {
    const newState = !isViewingAsUser
    setIsViewingAsUser(newState)
    localStorage.setItem("isViewingAsUser", String(newState))
  }

  const clearViewAs = () => {
    setIsViewingAsUser(false)
    localStorage.removeItem("isViewingAsUser")
  }

  // Effective user is the actual logged-in user (never show real user data when viewing as)
  const effectiveUser = user
  const canViewAs = user?.role === "admin" || user?.role === "dev"
  // True if logged in as regular user OR viewing as user (both use mock data)
  const isRegularUser = user?.role === "user" || isViewingAsUser

  const value: AuthContextType = {
    user,
    isViewingAsUser,
    isLoading,
    login,
    signup,
    logout,
    toggleViewAsUser,
    clearViewAs,
    isAuthenticated: !!user,
    isAdmin: user?.role === "admin",
    isDev: user?.role === "dev" || user?.role === "admin",
    canCustomizePages: user?.role === "dev" || user?.role === "admin",
    canRestorePages: user?.role === "admin",
    canViewAs,
    effectiveUser,
    isRegularUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}


