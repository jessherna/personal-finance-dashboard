"use client"

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"
import type { User, LoginInput, CreateUserInput } from "@/lib/types/user"
import { useIdleTimeout } from "@/hooks/use-idle-timeout"
import { LoginPromptModal } from "@/components/login-prompt-modal"

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
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)

  const handleAutoLogout = useCallback(async () => {
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
      // Show login prompt after logout
      setShowLoginPrompt(true)
    }
  }, [])

  // Auto-logout after 30 seconds of idle time
  const handleIdleTimeout = useCallback(() => {
    if (user) {
      // Log out the user and show login prompt
      handleAutoLogout()
    }
  }, [user, handleAutoLogout])

  // Enable idle timeout only when user is authenticated
  useIdleTimeout({
    timeout: 900000, // 15 minutes
    onIdle: handleIdleTimeout,
    enabled: !!user && !isLoading,
  })

  // Load user from localStorage on mount and verify with server
  useEffect(() => {
    const loadUser = async () => {
      try {
        const storedUser = localStorage.getItem("user")
        const storedViewAs = localStorage.getItem("isViewingAsUser")
        const token = localStorage.getItem("token")
        
        if (storedUser && token) {
          // Verify token and user with server
          try {
            const parsedUser = JSON.parse(storedUser)
            // Include userId as query param as fallback for token parsing
            const verifyUrl = `/api/auth/verify?userId=${parsedUser.id || ''}`
            
            const response = await fetch(verifyUrl, {
              method: "GET",
              headers: {
                "x-token": token,
              },
            })

            if (response.ok) {
              const data = await response.json()
              if (data.valid && data.user) {
                // User exists in database and is valid
                setUser(data.user)
                // Update localStorage with fresh user data
                localStorage.setItem("user", JSON.stringify(data.user))
                
                // Load view-as mode if exists
                if (storedViewAs === "true") {
                  setIsViewingAsUser(true)
                }
              } else {
                // Invalid token or user - clear invalid data
                console.warn("Token verification returned invalid response")
                localStorage.removeItem("user")
                localStorage.removeItem("token")
                localStorage.removeItem("isViewingAsUser")
              }
            } else {
              // User not found or token invalid - clear invalid data
              const errorData = await response.json().catch(() => ({}))
              console.warn("User verification failed:", errorData.error || "Unknown error")
              localStorage.removeItem("user")
              localStorage.removeItem("token")
              localStorage.removeItem("isViewingAsUser")
            }
          } catch (verifyError) {
            // Network error or other issue - clear invalid data
            console.error("User verification error:", verifyError)
            localStorage.removeItem("user")
            localStorage.removeItem("token")
            localStorage.removeItem("isViewingAsUser")
          }
        }
      } catch (error) {
        console.error("Failed to load/verify user:", error)
        // Clear invalid data
        setUser(null)
        setIsViewingAsUser(false)
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

  return (
    <AuthContext.Provider value={value}>
      {children}
      <LoginPromptModal open={showLoginPrompt} onOpenChange={setShowLoginPrompt} />
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}


