"use client"

import { useState, useEffect } from "react"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { RecurringBills } from "@/components/recurring-bills"
import { useAuth } from "@/contexts/auth-context"
import type { RecurringBill } from "@/lib/types"

export default function BillsPage() {
  const { user, isViewingAsUser } = useAuth()
  const [bills, setBills] = useState<RecurringBill[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchBills = async () => {
      if (!user) {
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        const effectiveUserId = isViewingAsUser ? 2 : user.id
        const response = await fetch("/api/recurring-bills", {
          headers: {
            "x-user-id": String(effectiveUserId),
            "x-user-role": user.role || "user",
          },
        })

        if (response.ok) {
          const data = await response.json()
          setBills(data)
        } else {
          setBills([])
        }
      } catch (error) {
        console.error("Error fetching bills:", error)
        setBills([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchBills()
  }, [user, isViewingAsUser])

  if (isLoading) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1 lg:pl-64">
          <Header title="Recurring Bills" />
          <main className="p-4 sm:p-6 lg:p-8">
            <div className="flex items-center justify-center h-64">
              <p className="text-muted-foreground">Loading bills...</p>
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
        <Header title="Recurring Bills" />
        <main className="p-4 sm:p-6 lg:p-8">
          <RecurringBills bills={bills} setBills={setBills} />
        </main>
      </div>
    </div>
  )
}

