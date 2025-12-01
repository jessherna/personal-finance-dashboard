"use client"

import { useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { AccountsList } from "@/components/accounts-list"
import { mockAccounts } from "@/lib/data/accounts"
import type { Account } from "@/lib/types"

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>(mockAccounts)
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null)

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

