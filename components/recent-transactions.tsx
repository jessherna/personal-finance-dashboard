"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowUpRight, ArrowDownRight, MoreHorizontal } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/contexts/auth-context"
import { formatCurrencyFromCents } from "@/lib/utils/format"
import { CATEGORY_COLORS } from "@/lib/constants/categories"
import type { Transaction } from "@/lib/types"

export function RecentTransactions() {
  const { user, isViewingAsUser } = useAuth()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchTransactions = async () => {
      if (!user) {
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        const effectiveUserId = isViewingAsUser ? 2 : user.id
        const response = await fetch("/api/transactions", {
          headers: {
            "x-user-id": String(effectiveUserId),
            "x-user-role": user.role || "user",
          },
        })

        if (response.ok) {
          const data = await response.json()
          // Sort by date (newest first) and take top 5
          const sorted = data.sort((a: Transaction, b: Transaction) => 
            new Date(b.date).getTime() - new Date(a.date).getTime()
          )
          setTransactions(sorted.slice(0, 5))
        } else {
          setTransactions([])
        }
      } catch (error) {
        console.error("Error fetching transactions:", error)
        setTransactions([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchTransactions()
  }, [user, isViewingAsUser])

  return (
    <Card>
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle>Recent Transactions</CardTitle>
        <Button variant="link" className="text-primary w-fit" aria-label="View all transactions" asChild>
          <Link href="/transactions">View All</Link>
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Loading transactions...</div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">No recent transactions</div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {transactions.map((transaction) => (
            <div
              key={transaction.id}
              className="flex flex-col gap-3 rounded-lg border border-border p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4"
            >
              <div className="flex items-center gap-4">
                <div className="flex flex-col">
                  <span className="font-medium text-foreground">{transaction.name}</span>
                  <span className="text-sm text-muted-foreground">{transaction.date}</span>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 sm:gap-4">
                <Badge
                  variant="secondary"
                  style={{
                    backgroundColor: CATEGORY_COLORS[transaction.category] + "20",
                    color: CATEGORY_COLORS[transaction.category],
                  }}
                  className="border-0"
                  aria-label={`Category: ${transaction.category}`}
                >
                  {transaction.category}
                </Badge>

                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "flex items-center gap-1 font-semibold text-sm sm:text-base",
                      transaction.type === "income" ? "text-success" : "text-foreground",
                    )}
                    aria-label={`${transaction.type === "income" ? "Income" : "Expense"}: ${formatCurrencyFromCents(transaction.amount)}`}
                  >
                    {transaction.type === "income" ? (
                      <ArrowDownRight className="h-4 w-4 text-success" aria-hidden="true" />
                    ) : (
                      <ArrowUpRight className="h-4 w-4 text-destructive" aria-hidden="true" />
                    )}
                    {formatCurrencyFromCents(transaction.amount)}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 focus-visible:ring-2 focus-visible:ring-ring"
                    aria-label={`More options for ${transaction.name}`}
                  >
                    <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </div>
              </div>
            </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
