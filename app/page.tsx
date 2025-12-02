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
import { getCurrentDateInToronto } from "@/lib/utils/date"
import { formatCurrencyFromCents } from "@/lib/utils/format"
import type { Transaction } from "@/lib/types"

export default function DashboardPage() {
  const router = useRouter()
  const { user, isAdmin, isDev, isViewingAsUser, isLoading } = useAuth()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [dashboardMetrics, setDashboardMetrics] = useState([
    { title: "Total Balance", value: "C$0.00", change: "+0%", changeType: "positive" as const, subtitle: "Across all accounts" },
    { title: "Monthly Spending", value: "C$0.00", change: "+0%", changeType: "negative" as const, subtitle: "Compared to last month" },
    { title: "Savings Progress", value: "C$0.00", change: "+0%", changeType: "positive" as const, subtitle: "0% of goal" },
    { title: "Credit Card Debt", value: "C$0.00", change: "+0%", changeType: "positive" as const, subtitle: "Compared to last month" },
  ])

  // Fetch transactions to calculate metrics
  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) return

      try {
        const effectiveUserId = isViewingAsUser ? 2 : user.id
        const headers = {
          "x-user-id": String(effectiveUserId),
          "x-user-role": user.role || "user",
        }

        // Fetch all necessary data
        const [transactionsRes, accountsRes, savingsGoalsRes] = await Promise.all([
          fetch("/api/transactions", { headers }),
          fetch("/api/accounts", { headers }),
          fetch("/api/savings-goals", { headers }),
        ])

        if (transactionsRes.ok && accountsRes.ok) {
          const transactions: Transaction[] = await transactionsRes.json()
          const accounts = await accountsRes.json()
          const savingsGoals = savingsGoalsRes.ok ? await savingsGoalsRes.json() : []
          
          setTransactions(transactions || [])
          
          // Ensure accounts is an array
          if (!Array.isArray(accounts)) {
            console.error("Accounts is not an array:", accounts)
            return
          }
          
          // Use Toronto timezone for current date calculations
          const now = getCurrentDateInToronto()
          const currentMonth = now.getMonth()
          const currentYear = now.getFullYear()
          
          // Calculate previous month
          const previousMonthDate = new Date(currentYear, currentMonth - 1, 1)
          const previousMonth = previousMonthDate.getMonth()
          const previousYear = previousMonthDate.getFullYear()
          
          // Helper function to filter transactions by month and year
          const filterTransactionsByMonth = (txns: Transaction[], month: number, year: number) => {
            return txns.filter((t: Transaction) => {
              try {
                const txnDate = new Date(t.date)
                if (isNaN(txnDate.getTime())) return false
                return txnDate.getMonth() === month && txnDate.getFullYear() === year
              } catch {
                return false
              }
            })
          }
          
          // Helper function to check if transaction is effectively an expense
          // Credit card payments (income to credit cards) should be treated as expenses
          const isEffectiveExpense = (t: Transaction): boolean => {
            if (t.type === "expense") return true
            // Income transactions to credit cards are actually payments (expenses)
            if (t.type === "income" && t.accountId) {
              const account = accounts.find((acc: any) => acc.id === t.accountId)
              return account?.type === "credit_card"
            }
            return false
          }
          
          // 1. Calculate Total Balance (sum of all active account balances, excluding credit cards)
          const totalBalance = accounts.reduce((sum: number, acc: any) => {
            // Only include active accounts (default to true if undefined)
            if (acc.isActive === false) return sum
            // Exclude credit cards from balance calculation (they have limits, not balances)
            if (acc.type === "credit_card") return sum
            // For debt accounts, balance is negative, so we sum them as-is
            // Ensure balance is a number
            const balance = typeof acc.balance === "number" ? acc.balance : 0
            return sum + balance
          }, 0)
          
          // Calculate balance change: sum of all transactions (income - expenses) for current month vs previous month
          // Credit card payments (income to credit cards) count as expenses
          const currentMonthTransactions = filterTransactionsByMonth(transactions || [], currentMonth, currentYear)
          const previousMonthTransactions = filterTransactionsByMonth(transactions || [], previousMonth, previousYear)
          
          const currentMonthBalanceChange = currentMonthTransactions.reduce((sum: number, t: Transaction) => {
            if (isEffectiveExpense(t)) {
              return sum - t.amount
            }
            // Regular income (not to credit cards)
            return sum + t.amount
          }, 0)
          
          const previousMonthBalanceChange = previousMonthTransactions.reduce((sum: number, t: Transaction) => {
            if (isEffectiveExpense(t)) {
              return sum - t.amount
            }
            // Regular income (not to credit cards)
            return sum + t.amount
          }, 0)
          
          // Calculate percentage change for balance
          const balanceChangePercent = previousMonthBalanceChange !== 0
            ? ((currentMonthBalanceChange - previousMonthBalanceChange) / Math.abs(previousMonthBalanceChange)) * 100
            : (currentMonthBalanceChange !== 0 ? (currentMonthBalanceChange > 0 ? 100 : -100) : 0)
          
          // 2. Calculate Monthly Spending (current month vs previous month)
          // Include both expenses and credit card payments (income to credit cards)
          const currentMonthExpenses = currentMonthTransactions
            .filter((t: Transaction) => isEffectiveExpense(t))
            .reduce((sum: number, t: Transaction) => sum + (t.amount || 0), 0)
          
          const previousMonthExpenses = previousMonthTransactions
            .filter((t: Transaction) => isEffectiveExpense(t))
            .reduce((sum: number, t: Transaction) => sum + (t.amount || 0), 0)
          
          // Calculate percentage change for spending
          const spendingChangePercent = previousMonthExpenses !== 0
            ? ((currentMonthExpenses - previousMonthExpenses) / previousMonthExpenses) * 100
            : (currentMonthExpenses !== 0 ? 100 : 0)
          
          // 3. Calculate Savings Progress (percentage of savings goals)
          const totalSavings = savingsGoals.reduce((sum: number, goal: any) => sum + (goal.current || 0), 0)
          const totalTarget = savingsGoals.reduce((sum: number, goal: any) => sum + (goal.target || 0), 0)
          const savingsProgressPercent = totalTarget > 0 ? Math.round((totalSavings / totalTarget) * 100) : 0
          
          // Calculate savings change: contributions in current month vs previous month
          const currentMonthSavingsContributions = currentMonthTransactions
            .filter((t: Transaction) => t.savingsGoalId !== null && t.savingsAmount && t.savingsAmount > 0)
            .reduce((sum: number, t: Transaction) => sum + (t.savingsAmount || 0), 0)
          
          const previousMonthSavingsContributions = previousMonthTransactions
            .filter((t: Transaction) => t.savingsGoalId !== null && t.savingsAmount && t.savingsAmount > 0)
            .reduce((sum: number, t: Transaction) => sum + (t.savingsAmount || 0), 0)
          
          // Calculate percentage change for savings
          const savingsChangePercent = previousMonthSavingsContributions !== 0
            ? ((currentMonthSavingsContributions - previousMonthSavingsContributions) / previousMonthSavingsContributions) * 100
            : (currentMonthSavingsContributions !== 0 ? 100 : 0)
          
          // 4. Calculate Credit Card Debt
          // For credit cards, calculate debt from transactions (expenses increase debt, payments decrease debt)
          // Start with 0 and calculate based on all transactions
          const allCreditCardTransactions = (transactions || []).filter((t: Transaction) => {
            if (!t.accountId) return false
            const account = accounts.find((acc: any) => acc.id === t.accountId)
            return account?.type === "credit_card"
          })
          
          const creditCardDebt = allCreditCardTransactions.reduce((sum: number, t: Transaction) => {
            // Expenses on credit card increase debt, payments (income) decrease debt
            return sum + (t.type === "expense" ? t.amount : -t.amount)
          }, 0)
          
          // Calculate debt change: transactions affecting credit cards in current month vs previous month
          const currentMonthDebtChange = currentMonthTransactions
            .filter((t: Transaction) => {
              if (!t.accountId) return false
              const account = accounts.find((acc: any) => acc.id === t.accountId)
              return account?.type === "credit_card"
            })
            .reduce((sum: number, t: Transaction) => {
              // Expenses increase debt, payments (income) decrease debt
              return sum + (t.type === "expense" ? t.amount : -t.amount)
            }, 0)
          
          const previousMonthDebtChange = previousMonthTransactions
            .filter((t: Transaction) => {
              if (!t.accountId) return false
              const account = accounts.find((acc: any) => acc.id === t.accountId)
              return account?.type === "credit_card"
            })
            .reduce((sum: number, t: Transaction) => {
              // Expenses increase debt, payments (income) decrease debt
              return sum + (t.type === "expense" ? t.amount : -t.amount)
            }, 0)
          
          // Calculate percentage change for debt (positive change = debt increased, negative = debt decreased)
          const debtChangePercent = previousMonthDebtChange !== 0
            ? ((currentMonthDebtChange - previousMonthDebtChange) / Math.abs(previousMonthDebtChange)) * 100
            : (currentMonthDebtChange !== 0 ? (currentMonthDebtChange > 0 ? 100 : -100) : 0)
          
          // Helper function to format percentage change
          const formatChange = (percent: number): string => {
            const rounded = Math.round(percent * 10) / 10
            return rounded >= 0 ? `+${rounded}%` : `${rounded}%`
          }
          
          // Helper function to determine change color
          // Green = increase in balance/spending progress OR decrease in spending/debt, Red = otherwise
          const getChangeType = (changePercent: number, metricType: "balance" | "spending" | "savings" | "debt"): "positive" | "negative" => {
            if (metricType === "balance" || metricType === "savings") {
              // For balance and savings: increase (positive change) = green, decrease (negative change) = red
              return changePercent >= 0 ? "positive" : "negative"
            } else if (metricType === "spending" || metricType === "debt") {
              // For spending and debt: decrease (negative change) = green, increase (positive change) = red
              return changePercent <= 0 ? "positive" : "negative"
            }
            return "positive"
          }
          
          // Update metrics with calculated values
          const balanceChange = formatChange(balanceChangePercent)
          const spendingChange = formatChange(spendingChangePercent)
          const savingsChange = formatChange(savingsChangePercent)
          const debtChange = formatChange(debtChangePercent)
          
          setDashboardMetrics([
            {
              title: "Total Balance",
              value: formatCurrencyFromCents(totalBalance),
              change: balanceChange,
              changeType: getChangeType(balanceChangePercent, "balance"),
              subtitle: "Compared to last month",
            },
            {
              title: "Monthly Spending",
              value: formatCurrencyFromCents(currentMonthExpenses),
              change: spendingChange,
              changeType: getChangeType(spendingChangePercent, "spending"),
              subtitle: "Compared to last month",
            },
            {
              title: "Savings Progress",
              value: formatCurrencyFromCents(totalSavings),
              change: savingsChange,
              changeType: getChangeType(savingsChangePercent, "savings"),
              subtitle: `${savingsProgressPercent}% of goal`,
            },
            {
              title: "Credit Card Debt",
              value: formatCurrencyFromCents(creditCardDebt),
              change: debtChange,
              changeType: getChangeType(debtChangePercent, "debt"),
              subtitle: "Compared to last month",
            },
          ])
        } else {
          // If API fails, reset to 0
          setTransactions([])
          setDashboardMetrics([
            { title: "Total Balance", value: "C$0.00", change: "+0%", changeType: "positive" as const, subtitle: "Across all accounts" },
            { title: "Monthly Spending", value: "C$0.00", change: "+0%", changeType: "negative" as const, subtitle: "Compared to last month" },
            { title: "Savings Progress", value: "C$0.00", change: "+0%", changeType: "positive" as const, subtitle: "0% of goal" },
            { title: "Credit Card Debt", value: "C$0.00", change: "+0%", changeType: "positive" as const, subtitle: "Compared to last month" },
          ])
        }
      } catch (error) {
        console.error("Error fetching transactions:", error)
      }
    }

    fetchDashboardData()
  }, [user, isViewingAsUser])

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login")
    }
  }, [isLoading, user, router])

  // Redirect admin/dev to management dashboard unless viewing as a user
  useEffect(() => {
    if (!isLoading && user && (isAdmin || isDev) && !isViewingAsUser) {
      router.push("/admin")
    }
  }, [user, isAdmin, isDev, isViewingAsUser, isLoading, router])

  // Show loading or nothing while redirecting
  if (isLoading || !user || (user && (isAdmin || isDev) && !isViewingAsUser)) {
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
