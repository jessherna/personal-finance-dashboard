"use client"

import { useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { RecurringBills } from "@/components/recurring-bills"
import { mockRecurringBills } from "@/lib/data/recurring-bills"
import type { RecurringBill } from "@/lib/types"

export default function BillsPage() {
  const [bills, setBills] = useState<RecurringBill[]>(mockRecurringBills)

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 lg:pl-64">
        <Header title="Recurring Bills" />
        <main className="p-4 sm:p-6 lg:p-8">
          <RecurringBills bills={bills} setBills={setBills} />
        </main>
      </div>
    </div>
  )
}

