"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { useAuth } from "./auth-context"

interface OnboardingStep {
  id: string
  target: string // CSS selector or data attribute
  title: string
  content: string
  placement?: "top" | "bottom" | "left" | "right" | "center"
  action?: () => void // Optional action to perform when step is shown
}

interface OnboardingContextType {
  isActive: boolean
  currentStep: number
  steps: OnboardingStep[]
  startOnboarding: () => void
  stopOnboarding: () => void
  nextStep: () => void
  previousStep: () => void
  goToStep: (step: number) => void
  hasCompletedOnboarding: boolean
  markOnboardingComplete: () => Promise<void>
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined)

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [isActive, setIsActive] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false)

  // Define onboarding steps
  const steps: OnboardingStep[] = [
    {
      id: "welcome",
      target: "body",
      title: "Welcome to Personal Finance Dashboard!",
      content: "Let's take a quick tour to help you get started. You can always access this tour by clicking the Help button in the sidebar.",
      placement: "center",
    },
    {
      id: "sidebar",
      target: "[data-onboarding='sidebar']",
      title: "Navigation Sidebar",
      content: "Use the sidebar to navigate between different sections: Dashboard, Transactions, Budget, Accounts, Bills, and more. The sidebar is always accessible from any page.",
      placement: "right",
    },
    {
      id: "dashboard",
      target: "[data-onboarding='dashboard-metrics']",
      title: "Dashboard Overview",
      content: "Your dashboard shows key financial metrics at a glance: Total Income, Total Expenses, and Net Savings. These are calculated from your transactions.",
      placement: "bottom",
    },
    {
      id: "transactions",
      target: "[data-onboarding='recent-transactions']",
      title: "Recent Transactions",
      content: "View your most recent transactions here. Click on any transaction to see details or edit it.",
      placement: "top",
    },
    {
      id: "header",
      target: "[data-onboarding='header']",
      title: "Header Actions",
      content: "The header contains search, notifications, and your profile. You can also switch accounts if you have multiple accounts set up.",
      placement: "bottom",
    },
    {
      id: "import",
      target: "[data-onboarding='import-link']",
      title: "Import Transactions",
      content: "You can import transactions from PDF bank statements. The app will automatically extract and parse transaction data for you.",
      placement: "right",
    },
    {
      id: "complete",
      target: "body",
      title: "You're All Set!",
      content: "You've completed the tour! Start by adding your accounts and transactions, or import them from PDF statements. Need help? Click the Help button anytime.",
      placement: "center",
    },
  ]

  // Check if user has completed onboarding
  useEffect(() => {
    if (user) {
      // Check localStorage first for quick access
      const completed = localStorage.getItem(`onboarding_completed_${user.id}`)
      if (completed === "true") {
        setHasCompletedOnboarding(true)
      } else {
        // Also check from user data (will be synced with MongoDB)
        setHasCompletedOnboarding(false)
      }
    }
  }, [user])

  const startOnboarding = () => {
    setIsActive(true)
    setCurrentStep(0)
  }

  const stopOnboarding = () => {
    setIsActive(false)
    setCurrentStep(0)
  }

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      // Last step - mark as complete
      markOnboardingComplete()
      stopOnboarding()
    }
  }

  const previousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const goToStep = (step: number) => {
    if (step >= 0 && step < steps.length) {
      setCurrentStep(step)
    }
  }

  const markOnboardingComplete = async () => {
    if (!user) return

    try {
      // Update localStorage
      localStorage.setItem(`onboarding_completed_${user.id}`, "true")
      setHasCompletedOnboarding(true)

      // Update in MongoDB via API
      await fetch(`/api/users/${user.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          hasCompletedOnboarding: true,
        }),
      })
    } catch (error) {
      console.error("Error marking onboarding as complete:", error)
      // Still mark as complete locally even if API call fails
    }
  }

  return (
    <OnboardingContext.Provider
      value={{
        isActive,
        currentStep,
        steps,
        startOnboarding,
        stopOnboarding,
        nextStep,
        previousStep,
        goToStep,
        hasCompletedOnboarding,
        markOnboardingComplete,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  )
}

export function useOnboarding() {
  const context = useContext(OnboardingContext)
  if (context === undefined) {
    throw new Error("useOnboarding must be used within an OnboardingProvider")
  }
  return context
}

