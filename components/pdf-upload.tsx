"use client"

import { useState, useCallback } from "react"
import { Upload, FileText, X, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { extractTextFromPDF, extractTransactionsFromText, type ExtractedTransaction } from "@/lib/utils/pdf-parser"

interface PDFUploadProps {
  onTransactionsExtracted: (transactions: ExtractedTransaction[]) => void
  onError?: (error: string) => void
}

export function PDFUpload({ onTransactionsExtracted, onError }: PDFUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [fileName, setFileName] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)

  const handleFile = useCallback(
    async (selectedFile: File) => {
      if (selectedFile.type !== "application/pdf") {
        onError?.("Please upload a PDF file")
        return
      }

      if (selectedFile.size > 10 * 1024 * 1024) {
        // 10MB limit
        onError?.("File size must be less than 10MB")
        return
      }

      setFile(selectedFile)
      setFileName(selectedFile.name)
      setIsProcessing(true)

      try {
        const text = await extractTextFromPDF(selectedFile)
        
        // Extract statement period for context
        const statementPeriodMatch = text.match(/(\w{3})\s+(\d{1,2}),?\s+(\d{4})\s*-\s*(\w{3})\s+(\d{1,2}),?\s+(\d{4})/i)
        const statementPeriod = statementPeriodMatch 
          ? `${statementPeriodMatch[1]} ${statementPeriodMatch[2]}, ${statementPeriodMatch[3]} - ${statementPeriodMatch[4]} ${statementPeriodMatch[5]}, ${statementPeriodMatch[6]}`
          : undefined
        
        // Try LLM parsing first (if available), fallback to regex
        let transactions: ExtractedTransaction[] = []
        
        try {
          const parseResponse = await fetch("/api/transactions/parse", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text, statementPeriod }),
          })
          
          if (parseResponse.ok) {
            const parseData = await parseResponse.json()
            if (parseData.success && parseData.transactions?.length > 0) {
              transactions = parseData.transactions
            } else {
              throw new Error("LLM parsing returned no transactions")
            }
          } else {
            throw new Error(`LLM parsing not available (${parseResponse.status})`)
          }
        } catch (llmError: any) {
          // Fallback to regex parsing
          transactions = extractTransactionsFromText(text)
        }

        if (transactions.length === 0) {
          onError?.("No transactions found in the PDF. Please ensure the PDF contains transaction data.")
          setFile(null)
          setFileName(null)
        } else {
          onTransactionsExtracted(transactions)
        }
      } catch (error: any) {
        const errorMessage = error?.message || "Failed to process PDF. Please try again."
        onError?.(errorMessage)
        setFile(null)
        setFileName(null)
      } finally {
        setIsProcessing(false)
      }
    },
    [onTransactionsExtracted, onError]
  )

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      setIsDragging(false)

      const droppedFile = e.dataTransfer.files[0]
      if (droppedFile) {
        handleFile(droppedFile)
      }
    },
    [handleFile]
  )

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = e.target.files?.[0]
      if (selectedFile) {
        handleFile(selectedFile)
      }
      // Reset input so same file can be selected again
      e.target.value = ""
    },
    [handleFile]
  )

  const handleRemove = useCallback(() => {
    setFile(null)
    setFileName(null)
  }, [])

  return (
    <div
      className={cn(
        "relative border-2 border-dashed rounded-lg p-8 transition-colors",
        isDragging
          ? "border-primary bg-primary/5"
          : "border-border hover:border-primary/50",
        isProcessing && "opacity-50 pointer-events-none"
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input
        type="file"
        accept=".pdf,application/pdf"
        onChange={handleFileInput}
        onClick={(e) => {
          // Reset value to allow selecting the same file again
          const target = e.target as HTMLInputElement
          if (target.value) {
            target.value = ""
          }
        }}
        className="hidden"
        id="pdf-upload"
        disabled={isProcessing}
      />

      {isProcessing ? (
        <div className="flex flex-col items-center justify-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <div className="text-center">
            <p className="font-medium">Processing PDF...</p>
            <p className="text-sm text-muted-foreground">Extracting transactions</p>
          </div>
        </div>
      ) : file && fileName ? (
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{fileName}</p>
              <p className="text-sm text-muted-foreground">
                {(file.size / 1024).toFixed(2)} KB
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={handleRemove}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Upload className="h-8 w-8 text-primary" />
          </div>
          <div className="text-center">
            <label
              htmlFor="pdf-upload"
              className="cursor-pointer font-medium text-primary hover:underline"
            >
              Click to upload
            </label>
            <span className="text-muted-foreground"> or drag and drop</span>
            <p className="text-sm text-muted-foreground mt-2">
              PDF file (max 10MB)
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Make sure the PDF contains readable text (not scanned images)
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

