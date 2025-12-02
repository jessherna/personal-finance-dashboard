"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { PDFUpload } from "@/components/pdf-upload"
import { TransactionPreviewTable } from "@/components/transaction-preview-table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "sonner"
import type { ExtractedTransaction } from "@/lib/utils/pdf-parser"
import { FileText } from "lucide-react"

export default function ImportPage() {
  const router = useRouter()
  const { user, isViewingAsUser } = useAuth()
  const [extractedTransactions, setExtractedTransactions] = useState<ExtractedTransaction[]>([])
  const [showPreview, setShowPreview] = useState(false)

  const handleTransactionsExtracted = (transactions: ExtractedTransaction[]) => {
    setExtractedTransactions(transactions)
    setShowPreview(true)
    if (transactions.length > 0) {
      toast.success(`Found ${transactions.length} transaction${transactions.length !== 1 ? "s" : ""} in the PDF`)
    } else {
      toast.warning("No transactions found. The PDF may not contain transaction data or the format is not recognized.")
    }
  }

  const handleError = (error: string) => {
    console.error("PDF Upload Error:", error)
    toast.error(error)
  }

  const handleConfirm = async (selectedTransactions: ExtractedTransaction[], accountId: number | null) => {
    if (!user) {
      toast.error("You must be logged in to import transactions")
      return
    }

    try {
      // Use effective user ID (for admin/dev viewing as user, use mock user ID 2)
      const effectiveUserId = isViewingAsUser ? 2 : user.id
      
      // Convert extracted transactions to the format expected by the API
      // Use accountId from transaction if available, otherwise use the provided accountId
      const transactionsToImport = selectedTransactions.map((t) => ({
        name: t.name,
        category: t.category || "Miscellaneous",
        date: t.date,
        time: t.time,
        amount: t.amount,
        type: t.type,
        status: t.status || "completed",
        accountId: t.accountId ?? accountId,
        budgetCategoryId: t.budgetCategoryId ?? null,
        savingsGoalId: t.savingsGoalId ?? null,
        savingsAmount: t.savingsAmount,
        recurringBillId: t.recurringBillId ?? null,
      }))

      const response = await fetch("/api/transactions/import", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": String(effectiveUserId),
          "x-user-role": user.role || "user",
        },
        body: JSON.stringify({
          transactions: transactionsToImport,
        }),
      })

      if (response.ok) {
        toast.success(`Successfully imported ${selectedTransactions.length} transaction(s)`)
        router.push("/transactions")
      } else {
        const data = await response.json()
        toast.error(data.error || "Failed to import transactions")
      }
    } catch (error) {
      console.error("Error importing transactions:", error)
      toast.error("Failed to import transactions")
    }
  }

  const handleCancel = () => {
    setExtractedTransactions([])
    setShowPreview(false)
  }

  // Redirect if viewing as user (use mock data)
  const effectiveUserId = isViewingAsUser ? 2 : user?.id || 0

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 lg:pl-64">
        <Header title="Import Transactions" />
        <main className="p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-4xl space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle>Import from PDF</CardTitle>
                    <CardDescription>
                      Upload a bank statement or transaction PDF to automatically extract and import transactions
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {!showPreview ? (
                  <PDFUpload
                    onTransactionsExtracted={handleTransactionsExtracted}
                    onError={handleError}
                  />
                ) : (
                  <TransactionPreviewTable
                    transactions={extractedTransactions}
                    onConfirm={handleConfirm}
                    onCancel={handleCancel}
                  />
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>How it works</CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                  <li>Upload a PDF file containing your transaction history</li>
                  <li>The system will automatically extract transaction details</li>
                  <li>Review and select which transactions you want to import</li>
                  <li>Choose an account to associate with the transactions (optional)</li>
                  <li>Confirm to add the selected transactions to your account</li>
                </ol>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
}

