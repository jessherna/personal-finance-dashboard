"use client"

import { useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { TransactionList } from "@/components/transaction-list"
import { TransactionFilters } from "@/components/transaction-filters"
import { TransactionStats } from "@/components/transaction-stats"
import { mockAllTransactions } from "@/lib/data/transactions"
import { mockSavingsGoals } from "@/lib/data/savings"
import { mockAccounts } from "@/lib/data/accounts"
import { mockRecurringBills } from "@/lib/data/recurring-bills"
import type { Transaction } from "@/lib/types"
import type { SavingsGoal } from "@/lib/types"
import type { Account } from "@/lib/types"
import type { RecurringBill } from "@/lib/types"

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>(mockAllTransactions)
  const [customCategories, setCustomCategories] = useState<Record<string, string>>({})
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>(mockSavingsGoals)
  const [accounts, setAccounts] = useState<Account[]>(mockAccounts)
  const [bills, setBills] = useState<RecurringBill[]>(mockRecurringBills)
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
