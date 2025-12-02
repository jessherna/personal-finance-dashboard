"use client"

import { useState, useEffect } from "react"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { AccountsList } from "@/components/accounts-list"
import { useAuth } from "@/contexts/auth-context"
import type { Account } from "@/lib/types"

export default function AccountsPage() {
  const { user, isViewingAsUser } = useAuth()
  const [accounts, setAccounts] = useState<Account[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null)

  useEffect(() => {
    const fetchAccounts = async () => {
      if (!user) {
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        const effectiveUserId = isViewingAsUser ? 2 : user.id
        const response = await fetch("/api/accounts", {
          headers: {
            "x-user-id": String(effectiveUserId),
            "x-user-role": user.role || "user",
          },
        })

        if (response.ok) {
          const data = await response.json()
          setAccounts(data)
        } else {
          setAccounts([])
        }
      } catch (error) {
        console.error("Error fetching accounts:", error)
        setAccounts([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchAccounts()
  }, [user, isViewingAsUser])

  if (isLoading) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1 lg:pl-64">
          <Header title="Accounts" />
          <main className="p-4 sm:p-6 lg:p-8">
            <div className="flex items-center justify-center h-64">
              <p className="text-muted-foreground">Loading accounts...</p>
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
        <Header title="Accounts" />
        <main className="p-4 sm:p-6 lg:p-8">
          <AccountsList
            accounts={accounts}
            setAccounts={setAccounts}
            selectedAccountId={selectedAccountId}
            onAccountSelect={setSelectedAccountId}
          />
        </main>
      </div>
    </div>
  )
}

