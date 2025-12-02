"use client"

import { useState, useEffect } from "react"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { TransactionList } from "@/components/transaction-list"
import { TransactionFilters } from "@/components/transaction-filters"
import { TransactionStats } from "@/components/transaction-stats"
import { useAuth } from "@/contexts/auth-context"
import type { Transaction } from "@/lib/types"
import type { SavingsGoal } from "@/lib/types"
import type { Account } from "@/lib/types"
import type { RecurringBill } from "@/lib/types"

export default function TransactionsPage() {
  const { user, isViewingAsUser } = useAuth()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [customCategories, setCustomCategories] = useState<Record<string, string>>({})
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [bills, setBills] = useState<RecurringBill[]>([])
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [selectedType, setSelectedType] = useState<string>("all")
  const [selectedPeriod, setSelectedPeriod] = useState<string>("30")
  const [minAmount, setMinAmount] = useState("")
  const [maxAmount, setMaxAmount] = useState("")
  const [selectedStatus, setSelectedStatus] = useState<string>("all")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")

  // Fetch all data from API
  useEffect(() => {
    const fetchData = async () => {
      if (!user) {
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        // Use user ID 2 when viewing as user (mock data), otherwise use actual user ID
        const effectiveUserId = isViewingAsUser ? 2 : user.id
        const headers = {
          "x-user-id": String(effectiveUserId),
          "x-user-role": user.role || "user",
        }
        
        // Fetch all data in parallel
        const [transactionsRes, accountsRes, savingsGoalsRes, billsRes] = await Promise.all([
          fetch("/api/transactions", { headers }),
          fetch("/api/accounts", { headers }),
          fetch("/api/savings-goals", { headers }),
          fetch("/api/recurring-bills", { headers }),
        ])

        if (transactionsRes.ok) {
          const data = await transactionsRes.json()
          setTransactions(data)
        } else {
          setTransactions([])
        }

        if (accountsRes.ok) {
          const data = await accountsRes.json()
          setAccounts(data)
        } else {
          setAccounts([])
        }

        if (savingsGoalsRes.ok) {
          const data = await savingsGoalsRes.json()
          setSavingsGoals(data)
        } else {
          setSavingsGoals([])
        }

        if (billsRes.ok) {
          const data = await billsRes.json()
          setBills(data)
        } else {
          setBills([])
        }
      } catch (error) {
        console.error("Error fetching data:", error)
        setTransactions([])
        setAccounts([])
        setSavingsGoals([])
        setBills([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [user, isViewingAsUser])

  if (isLoading) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1 lg:pl-64">
          <Header 
            title="Transactions" 
            selectedAccountId={selectedAccountId}
            onAccountSelect={setSelectedAccountId}
            accounts={accounts}
          />
          <main className="p-4 sm:p-6 lg:p-8">
            <div className="flex items-center justify-center h-64">
              <p className="text-muted-foreground">Loading transactions...</p>
            </div>
          </main>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 lg:pl-64">
        <Header 
          title="Transactions" 
          selectedAccountId={selectedAccountId}
          onAccountSelect={setSelectedAccountId}
          accounts={accounts}
        />
        <main className="p-4 sm:p-6 lg:p-8">
          <TransactionStats />
          <div className="mt-6 space-y-4 sm:space-y-6 lg:mt-8">
            <TransactionFilters
              transactions={transactions}
              setTransactions={setTransactions}
              customCategories={customCategories}
              setCustomCategories={setCustomCategories}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
              selectedType={selectedType}
              setSelectedType={setSelectedType}
              selectedPeriod={selectedPeriod}
              setSelectedPeriod={setSelectedPeriod}
              minAmount={minAmount}
              setMinAmount={setMinAmount}
              maxAmount={maxAmount}
              setMaxAmount={setMaxAmount}
              selectedStatus={selectedStatus}
              setSelectedStatus={setSelectedStatus}
              dateFrom={dateFrom}
              setDateFrom={setDateFrom}
              dateTo={dateTo}
              setDateTo={setDateTo}
              savingsGoals={savingsGoals}
              setSavingsGoals={setSavingsGoals}
              accounts={accounts}
              selectedAccountId={selectedAccountId}
              recurringBills={bills}
              setBills={setBills}
            />
            <TransactionList
              transactions={transactions}
              setTransactions={setTransactions}
              customCategories={customCategories}
              setCustomCategories={setCustomCategories}
              searchQuery={searchQuery}
              selectedCategory={selectedCategory}
              selectedType={selectedType}
              selectedPeriod={selectedPeriod}
              minAmount={minAmount}
              maxAmount={maxAmount}
              selectedStatus={selectedStatus}
              dateFrom={dateFrom}
              dateTo={dateTo}
              selectedAccountId={selectedAccountId}
              accounts={accounts}
              recurringBills={bills}
              setBills={setBills}
            />
          </div>
        </main>
      </div>
    </div>
  )
}
