"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { PageWrapper } from "@/components/page-wrapper"
import { MetricCard } from "@/components/metric-card"
import { RecentTransactions } from "@/components/recent-transactions"
import { SpendingChart } from "@/components/spending-chart"
import { BudgetChart } from "@/components/budget-chart"
import { SavingsGoals } from "@/components/savings-goals"
import { RecurringBillsKPI } from "@/components/recurring-bills-kpi"
import { useAuth } from "@/contexts/auth-context"
import type { Transaction } from "@/lib/types"

export default function DashboardPage() {
  const router = useRouter()
  const { user, isAdmin, isDev, isViewingAsUser, isLoading } = useAuth()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [dashboardMetrics, setDashboardMetrics] = useState([
    { label: "Total Balance", value: "$0.00", change: "+0%", trend: "up" as const },
    { label: "Monthly Income", value: "$0.00", change: "+0%", trend: "up" as const },
    { label: "Monthly Expenses", value: "$0.00", change: "+0%", trend: "down" as const },
    { label: "Savings Rate", value: "0%", change: "+0%", trend: "up" as const },
  ])

  // Fetch transactions to calculate metrics
  useEffect(() => {
    const fetchTransactions = async () => {
      if (!user) return

      try {
        const effectiveUserId = isViewingAsUser ? 2 : user.id
        const response = await fetch("/api/transactions", {
          headers: {
            "x-user-id": String(effectiveUserId),
            "x-user-role": user.role || "user",
          },
        })

        if (response.ok) {
          const data = await response.json()
          setTransactions(data || [])
          
          // Calculate metrics from transactions (only from actual transaction data)
          const now = new Date()
          const currentMonth = now.getMonth()
          const currentYear = now.getFullYear()
          
          // Filter transactions for current month
          const monthlyTransactions = (data || []).filter((t: Transaction) => {
            const txnDate = new Date(t.date)
            return txnDate.getMonth() === currentMonth && txnDate.getFullYear() === currentYear
          })
          
          // Calculate income and expenses from actual transactions only
          const income = monthlyTransactions
            .filter((t: Transaction) => t.type === "income")
            .reduce((sum: number, t: Transaction) => sum + (t.amount || 0), 0)
          
          const expenses = monthlyTransactions
            .filter((t: Transaction) => t.type === "expense")
            .reduce((sum: number, t: Transaction) => sum + (t.amount || 0), 0)
          
          // Calculate total balance from all transactions
          const totalIncome = (data || [])
            .filter((t: Transaction) => t.type === "income")
            .reduce((sum: number, t: Transaction) => sum + (t.amount || 0), 0)
          
          const totalExpenses = (data || [])
            .filter((t: Transaction) => t.type === "expense")
            .reduce((sum: number, t: Transaction) => sum + (t.amount || 0), 0)
          
          const totalBalance = totalIncome - totalExpenses
          const savingsRate = income > 0 ? ((income - expenses) / income * 100).toFixed(1) : "0"
          
          // Update metrics - these should be 0 if no transactions exist
          setDashboardMetrics([
            {
              label: "Total Income",
              value: `C$${(totalIncome / 100).toFixed(2)}`,
              change: "+0%",
              trend: "up",
            },
            {
              label: "Total Expenses",
              value: `C$${(totalExpenses / 100).toFixed(2)}`,
              change: "+0%",
              trend: "down",
            },
            {
              label: "Net Savings",
              value: `C$${(totalBalance / 100).toFixed(2)}`,
              change: "+0%",
              trend: "up",
            },
            {
              label: "Savings Rate",
              value: `${savingsRate}%`,
              change: "+0%",
              trend: "up",
            },
          ])
        } else {
          // If API fails, reset to 0
          setTransactions([])
          setDashboardMetrics([
            { label: "Total Income", value: "C$0.00", change: "+0%", trend: "up" as const },
            { label: "Total Expenses", value: "C$0.00", change: "+0%", trend: "down" as const },
            { label: "Net Savings", value: "C$0.00", change: "+0%", trend: "up" as const },
            { label: "Savings Rate", value: "0%", change: "+0%", trend: "up" as const },
          ])
        }
      } catch (error) {
        console.error("Error fetching transactions:", error)
      }
    }

    fetchTransactions()
  }, [user, isViewingAsUser])

  // Redirect admin/dev to management dashboard unless viewing as a user
  useEffect(() => {
    if (!isLoading && user && (isAdmin || isDev) && !isViewingAsUser) {
      router.push("/admin")
    }
  }, [user, isAdmin, isDev, isViewingAsUser, isLoading, router])

  // Show loading or nothing while redirecting
  if (isLoading || (user && (isAdmin || isDev) && !isViewingAsUser)) {
    return null
  }

  return (
    <PageWrapper>
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1 lg:pl-64">
          <Header title="Analytics" />
          <main className="p-4 sm:p-6 lg:p-8">
            <div 
              data-onboarding="dashboard-metrics"
              className="mb-6 grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-4 lg:mb-8"
            >
              {dashboardMetrics.map((metric, index) => (
                <MetricCard key={index} {...metric} />
              ))}
            </div>

            <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
              <div className="space-y-4 sm:space-y-6">
                <div data-onboarding="recent-transactions">
                  <RecentTransactions />
                </div>
                <BudgetChart />
              </div>
              <div className="space-y-4 sm:space-y-6">
                <SpendingChart />
                <SavingsGoals />
                <RecurringBillsKPI />
              </div>
            </div>
          </main>
        </div>
      </div>
    </PageWrapper>
  )
}
