// Worker is initialized in PDFWorkerInit component
// This ensures it's set before any PDF operations

/**
 * Extract text from PDF file
 */
export async function extractTextFromPDF(file: File): Promise<string> {
  try {
    // Dynamically import pdfjs-dist to avoid SSR issues
    const pdfjsLib = await import("pdfjs-dist")
    
    // Ensure worker source is set (fallback in case initialization didn't run)
    if (typeof window !== "undefined") {
      pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs"
    }
    
    const arrayBuffer = await file.arrayBuffer()
    
    // Configure PDF.js for text extraction
    const pdf = await pdfjsLib.getDocument({ 
      data: arrayBuffer,
      verbosity: 0,
      useWorkerFetch: false,
    }).promise
    
    let fullText = ""
    
    // Extract text from all pages
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i)
      const textContent = await page.getTextContent()
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(" ")
      
      // Check if page has meaningful content (more than just whitespace)
      const trimmedPageText = pageText.trim()
      if (trimmedPageText.length > 10) {
        fullText += pageText + "\n"
      }
    }
    
    return fullText
  } catch (error: any) {
    
    // Provide more helpful error messages
    if (error?.message?.includes("worker")) {
      throw new Error("PDF worker failed to load. Please refresh the page and try again.")
    }
    
    if (error?.message?.includes("Invalid PDF")) {
      throw new Error("Invalid PDF file. Please ensure the file is a valid PDF document.")
    }
    
    throw new Error("Failed to extract text from PDF. Please ensure the PDF contains readable text and try again.")
  }
}

/**
 * Extract transactions from PDF text
 * This is a basic parser - in production, you'd want more sophisticated parsing
 */
export interface ExtractedTransaction {
  name: string
  date: string
  amount: number
  type: "income" | "expense"
  category?: string
  time?: string
  status?: "completed" | "pending" | "failed"
  accountId?: number | null
  budgetCategoryId?: number | null
  savingsGoalId?: number | null
  savingsAmount?: number
  recurringBillId?: number | null
  rawText?: string
}

export function extractTransactionsFromText(text: string): ExtractedTransaction[] {
  const transactions: ExtractedTransaction[] = []
  
  // Split by newlines, but also handle cases where text might be on single lines
  // Try multiple splitting strategies
  let lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0)
  
  // If we have very few lines but lots of text, try splitting by common patterns
  if (lines.length < 10 && text.length > 1000) {
    // Try splitting by date patterns or transaction-like patterns
    const alternativeSplits = text.split(/(?=\w{3}\s+\d{1,2}\s+)/i) // Split before dates like "Dec 18"
    if (alternativeSplits.length > lines.length) {
      lines = alternativeSplits.filter((line) => line.trim().length > 0)
    }
  }
  
  // Extract statement period to use as context for dates without year
  // Default to current year, but will be updated from statement period
  let statementYear = new Date().getFullYear()
  let statementStartDate: Date | null = null
  let statementEndDate: Date | null = null
  
  // Try multiple patterns for statement period
  const statementPeriodPatterns = [
    /(\w{3})\s+(\d{1,2}),?\s+(\d{4})\s*-\s*(\w{3})\s+(\d{1,2}),?\s+(\d{4})/i, // Dec 8, 2024 - Jan 7, 2025
    /Statement Period\s+(\w{3})\s+(\d{1,2}),?\s+(\d{4})\s*-\s*(\w{3})\s+(\d{1,2}),?\s+(\d{4})/i,
  ]
  
  for (const pattern of statementPeriodPatterns) {
    const match = text.match(pattern)
    if (match) {
      statementYear = parseInt(match[6]) // Use end year
      // Parse dates for context
      try {
        statementStartDate = new Date(match[1] + " " + match[2] + ", " + match[3])
        statementEndDate = new Date(match[4] + " " + match[5] + ", " + match[6])
      } catch (e) {
        // Ignore date parsing errors
      }
      break
    }
  }
  
  // If we have very few lines, the text might not be properly split
  // Try to find transaction patterns in the raw text
  if (lines.length < 20) {
    // Look for transaction patterns directly in the text
    const transactionPattern = /(\w{3}\s+\d{1,2})\s+([A-Z][^0-9]+?)\s+([\d,]+\.\d{2})?\s+([\d,]+\.\d{2})?\s+([\d,]+\.\d{2})/gi
    const matches = [...text.matchAll(transactionPattern)]
    
    for (const match of matches) {
      const datePart = match[1]
      const description = match[2]?.trim()
      const withdrawal = match[3]?.replace(/,/g, "") || null
      const deposit = match[4]?.replace(/,/g, "") || null
      
      if (description && description.length > 3 && !description.toLowerCase().includes("opening") && !description.toLowerCase().includes("closing")) {
        let amount: number | null = null
        let isExpense = true
        
        if (withdrawal) {
          amount = parseFloat(withdrawal)
          isExpense = true
        } else if (deposit) {
          amount = parseFloat(deposit)
          isExpense = false
        }
        
        if (amount && amount > 0.01) {
          let fullDate = datePart
          if (!fullDate.match(/\d{4}/)) {
            if (fullDate.match(/^(Dec|Nov|Oct)/i)) {
              fullDate = `${fullDate}, ${statementYear - 1}`
            } else {
              fullDate = `${fullDate}, ${statementYear}`
            }
          }
          
          transactions.push({
            name: description.substring(0, 200), // Limit length
            date: normalizeDate(fullDate, statementYear),
            amount: Math.round(amount * 100),
            type: isExpense ? "expense" : "income",
            rawText: match[0],
          })
        }
      }
    }
    
    if (transactions.length > 0) {
      return transactions.sort((a, b) => {
        const dateA = new Date(a.date).getTime()
        const dateB = new Date(b.date).getTime()
        return dateB - dateA
      })
    }
  }
  
  // Common patterns for transaction extraction
  // Pattern 1: Date, Description, Amount (various formats)
  const datePatterns = [
    /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/, // MM/DD/YYYY or DD/MM/YYYY
    /(\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2})/, // YYYY/MM/DD
    /([A-Z][a-z]{2}\s+\d{1,2},?\s+\d{4})/, // Jan 15, 2024
    /([A-Z][a-z]{2}\s+\d{1,2})/, // Jan 15 (no year, use statement year)
    /(\d{1,2}[\/\-]\d{1,2})/, // MM/DD or DD/MM (no year, use statement year)
  ]
  
  // Amount patterns (currency symbols, negative/positive, with CR/DR indicators)
  const amountPatterns = [
    /([+-]?[\$€£¥]?\s*\d{1,3}(?:[,\s]\d{3})*(?:\.\d{2})?)\s*(CR|DR)?/i, // $1,234.56 CR or -1234.56
    /([+-]?\d{1,3}(?:[,\s]\d{3})*(?:\.\d{2})?)\s*(CR|DR)?/i, // 1234.56 or -1234.56
    /([+-]?\d+\.\d{2})\s*(CR|DR)?/i, // 1234.56
  ]
  
  // Look for transaction-like lines
  // Also check for table format with multiple columns (Date | Description | Withdrawal | Deposit | Balance)
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    
    // Skip headers and footers - but be more selective
    const lowerLine = line.toLowerCase()
    if (
      (lowerLine.includes("statement") && (lowerLine.includes("period") || lowerLine.includes("date"))) ||
      (lowerLine.includes("page") && /\d+/.test(line)) ||
      lowerLine.includes("account #") ||
      lowerLine.includes("account number") ||
      lowerLine.includes("borrowers on this account") ||
      (lowerLine.includes("scotiabank") && !lowerLine.match(/\d/)) || // Skip if it's just the bank name without numbers
      (lowerLine.includes("visa") && lowerLine.includes("card") && !lowerLine.match(/\d/)) ||
      (lowerLine.includes("total") && (lowerLine.includes("balance") || lowerLine.includes("amount"))) ||
      lowerLine.includes("previous balance") ||
      lowerLine.includes("new balance") ||
      lowerLine.includes("minimum payment") ||
      lowerLine.includes("payment due") ||
      (lowerLine.includes("opening balance") && !lowerLine.includes("transaction")) || // Skip opening balance line
      (lowerLine.includes("closing balance") && !lowerLine.includes("transaction")) || // Skip closing balance line
      lowerLine.includes("continued on next page") ||
      lowerLine.includes("here's what happened") || // Skip table header
      line.length < 3 ||
      /^[\s\-\*]+$/.test(line) // Just dashes or asterisks
    ) {
      continue
    }
    
    // Check if this looks like a table row with multiple columns
    // Pattern: Date | Description | Withdrawal | Deposit | Balance
    // Examples: "Dec 18 MB-Transfer to Credit Card 313.10 6,977.93"
    //           "Jan 3 GST Canada 129.75 5,263.45"
    
    // More flexible pattern to handle table rows
    const tableRowPattern = /^(\w{3})\s+(\d{1,2})\s+(.+?)\s+([\d,]+\.\d{2})?\s+([\d,]+\.\d{2})?\s+([\d,]+\.\d{2})?$/i
    const tableMatch = line.match(tableRowPattern)
    
    if (tableMatch) {
      const month = tableMatch[1]
      const day = tableMatch[2]
      const restOfLine = tableMatch[3]?.trim() || ""
      const withdrawal = tableMatch[4]?.replace(/,/g, "") || null
      const deposit = tableMatch[5]?.replace(/,/g, "") || null
      const balance = tableMatch[6]?.replace(/,/g, "") || null
      
      // Extract description - it's everything before the amounts
      // The description might be in the "restOfLine" or we need to parse it differently
      // Try to find where the amounts start
      const amountPattern = /([\d,]+\.\d{2})/g
      const amounts = [...restOfLine.matchAll(amountPattern)]
      
      let description = restOfLine
      let withdrawalAmount: number | null = null
      let depositAmount: number | null = null
      
      // If we found amounts in the description, extract them
      if (amounts.length > 0) {
        // The last amount in the description is likely the balance
        // The second-to-last might be withdrawal or deposit
        // Remove amounts from description
        description = restOfLine.replace(/[\d,]+\.\d{2}/g, "").trim()
        
        // Check if withdrawal column has a value
        if (withdrawal) {
          withdrawalAmount = parseFloat(withdrawal)
        }
        
        // Check if deposit column has a value
        if (deposit) {
          depositAmount = parseFloat(deposit)
        }
      } else {
        // No amounts in description, use the separate columns
        if (withdrawal) {
          withdrawalAmount = parseFloat(withdrawal)
        }
        if (deposit) {
          depositAmount = parseFloat(deposit)
        }
      }
      
      // Skip if it's opening/closing balance
      if (description.toLowerCase().includes("opening balance") || 
          description.toLowerCase().includes("closing balance")) {
        continue
      }
      
      // Create transactions for both withdrawal and deposit if both exist
      if (withdrawalAmount && withdrawalAmount > 0.01 && description.length > 0) {
        let fullDate = `${month} ${day}`
        if (!fullDate.match(/\d{4}/)) {
          // Add year based on statement period
          if (month.match(/^(Dec|Nov|Oct)/i)) {
            fullDate = `${fullDate}, ${statementYear - 1}`
          } else {
            fullDate = `${fullDate}, ${statementYear}`
          }
        }
        
        transactions.push({
          name: description,
          date: normalizeDate(fullDate, statementYear),
          amount: Math.round(withdrawalAmount * 100), // Convert to cents
          type: "expense",
          rawText: line,
        })
      }
      
      if (depositAmount && depositAmount > 0.01 && description.length > 0) {
        let fullDate = `${month} ${day}`
        if (!fullDate.match(/\d{4}/)) {
          // Add year based on statement period
          if (month.match(/^(Dec|Nov|Oct)/i)) {
            fullDate = `${fullDate}, ${statementYear - 1}`
          } else {
            fullDate = `${fullDate}, ${statementYear}`
          }
        }
        
        transactions.push({
          name: description,
          date: normalizeDate(fullDate, statementYear),
          amount: Math.round(depositAmount * 100), // Convert to cents
          type: "income",
          rawText: line,
        })
      }
      
      if (withdrawalAmount || depositAmount) {
        continue // Skip regular parsing for this line
      }
    }
    
    // Try to find date and amount in the line
    let foundDate: string | null = null
    let foundAmount: number | null = null
    let isCredit = false
    
    // Find date
    for (let idx = 0; idx < datePatterns.length; idx++) {
      const pattern = datePatterns[idx]
      const dateMatch = line.match(pattern)
      if (dateMatch) {
        foundDate = dateMatch[1]
        // If date doesn't have year (patterns 4 or 5), add statement year
        if (idx >= 3 && !foundDate.match(/\d{4}/)) {
          // Add year to date
          if (foundDate.match(/^[A-Z][a-z]{2}\s+\d{1,2}$/)) {
            foundDate = `${foundDate}, ${statementYear}`
          } else if (foundDate.match(/^\d{1,2}[\/\-]\d{1,2}$/)) {
            foundDate = `${foundDate}/${statementYear}`
          }
        }
        break
      }
    }
    
    // Find amount (look for the last amount in the line, which is usually the transaction amount)
    let allAmountMatches: Array<{match: RegExpMatchArray, index: number}> = []
    for (const pattern of amountPatterns) {
      const matches = [...line.matchAll(new RegExp(pattern.source, 'g'))]
      matches.forEach(match => {
        if (match.index !== undefined) {
          allAmountMatches.push({match, index: match.index})
        }
      })
    }
    
    // Sort by position (rightmost is usually the transaction amount)
    allAmountMatches.sort((a, b) => b.index - a.index)
    
    for (const {match} of allAmountMatches) {
      const amountStr = match[1].replace(/[\$€£¥,\s]/g, "")
      const amount = parseFloat(amountStr)
      if (!isNaN(amount) && Math.abs(amount) > 0.01 && amount < 1000000) { // Reasonable transaction limit
        foundAmount = amount
        // Check for CR (credit) indicator
        isCredit = match[2]?.toUpperCase() === "CR" || amount < 0
        break
      }
    }
    
    // If we found both date and amount, it's likely a transaction
    if (foundDate && foundAmount !== null) {
      // Extract description (everything except date and amount patterns)
      let description = line
      
      // Remove date
      for (const pattern of datePatterns) {
        description = description.replace(pattern, "").trim()
      }
      
      // Remove amount patterns
      for (const pattern of amountPatterns) {
        description = description.replace(new RegExp(pattern.source, 'gi'), "").trim()
      }
      
      // Remove common prefixes/suffixes
      description = description
        .replace(/^(CR|DR)\s*/i, "")
        .replace(/\s*(CR|DR)$/i, "")
        .replace(/\s+/g, " ")
        .trim()
      
      // If description is too short or looks like a number, try to get it from next line
      if (description.length < 3 || /^\d+$/.test(description)) {
        if (i + 1 < lines.length) {
          const nextLine = lines[i + 1].trim()
          if (nextLine.length > 3 && !nextLine.match(/^\d+[\/\-\.]/)) {
            description = nextLine.substring(0, 100).trim() // Limit length
          }
        }
      }
      
      if (description.length > 0 && description.length < 200) { // Reasonable description length
        transactions.push({
          name: description || "Unknown Transaction",
          date: normalizeDate(foundDate, statementYear),
          amount: Math.round(Math.abs(foundAmount) * 100), // Convert to cents
          type: isCredit || foundAmount < 0 ? "income" : "expense", // CR or negative = income (refund/credit)
          rawText: line,
        })
      }
    } else if (foundAmount !== null) {
      // If we only found amount, try to get date from previous/next lines
      let nearbyDate: string | null = null
      
      // Check previous 2 lines
      for (let j = Math.max(0, i - 2); j < i; j++) {
        for (const pattern of datePatterns) {
          const dateMatch = lines[j].match(pattern)
          if (dateMatch) {
            nearbyDate = dateMatch[1]
            break
          }
        }
        if (nearbyDate) break
      }
      
      // Check next 2 lines
      if (!nearbyDate) {
        for (let j = i + 1; j < Math.min(lines.length, i + 3); j++) {
          for (const pattern of datePatterns) {
            const dateMatch = lines[j].match(pattern)
            if (dateMatch) {
              nearbyDate = dateMatch[1]
              break
            }
          }
          if (nearbyDate) break
        }
      }
      
      if (nearbyDate) {
        let description = line.replace(amountPatterns[0], "").replace(amountPatterns[1], "").trim()
        description = description.replace(/\s+/g, " ").trim()
        
        if (description.length > 0) {
          transactions.push({
            name: description || "Unknown Transaction",
            date: normalizeDate(nearbyDate, statementYear),
            amount: Math.round(Math.abs(foundAmount) * 100),
            type: foundAmount < 0 ? "expense" : "income",
            rawText: line,
          })
        }
      }
    }
  }
  
  // Remove duplicates and sort by date
  const uniqueTransactions = transactions.filter(
    (t, index, self) =>
      index ===
      self.findIndex(
        (tr) =>
          tr.name === t.name &&
          tr.date === t.date &&
          tr.amount === t.amount
      )
  )
  
  return uniqueTransactions.sort((a, b) => {
    const dateA = new Date(a.date).getTime()
    const dateB = new Date(b.date).getTime()
    return dateB - dateA // Newest first
  })
}

/**
 * Normalize date string to ISO format
 */
function normalizeDate(dateStr: string, defaultYear?: number): string {
  try {
    // Try different date formats
    const formats = [
      /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/, // MM/DD/YYYY or DD/MM/YYYY
      /(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/, // YYYY/MM/DD
      /([A-Z][a-z]{2})\s+(\d{1,2}),?\s+(\d{4})/, // Jan 15, 2024
      /([A-Z][a-z]{2})\s+(\d{1,2})/, // Jan 15 (no year)
      /(\d{1,2})[\/\-](\d{1,2})/, // MM/DD or DD/MM (no year)
    ]
    
    for (const format of formats) {
      const match = dateStr.match(format)
      if (match) {
        if (format === formats[0]) {
          // MM/DD/YYYY or DD/MM/YYYY - assume MM/DD/YYYY
          const [, month, day, year] = match
          return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`
        } else if (format === formats[1]) {
          // YYYY/MM/DD
          const [, year, month, day] = match
          return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`
        } else if (format === formats[2]) {
          // Jan 15, 2024
          const monthNames = [
            "Jan",
            "Feb",
            "Mar",
            "Apr",
            "May",
            "Jun",
            "Jul",
            "Aug",
            "Sep",
            "Oct",
            "Nov",
            "Dec",
          ]
          const [, monthName, day, year] = match
          const month = (monthNames.indexOf(monthName) + 1).toString().padStart(2, "0")
          return `${year}-${month}-${day.padStart(2, "0")}`
        } else if (format === formats[3]) {
          // Jan 15 (no year) - use defaultYear (statement year)
          const monthNames = [
            "Jan", "Feb", "Mar", "Apr", "May", "Jun",
            "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
          ]
          const [, monthName, day] = match
          // Use defaultYear (statement year) if provided, otherwise fallback to current year
          const year = defaultYear || new Date().getFullYear()
          const month = (monthNames.indexOf(monthName) + 1).toString().padStart(2, "0")
          return `${year}-${month}-${day.padStart(2, "0")}`
        } else if (format === formats[4]) {
          // MM/DD or DD/MM (no year) - assume MM/DD and use defaultYear (statement year)
          const [, part1, part2] = match
          // Use defaultYear (statement year) if provided, otherwise fallback to current year
          const year = defaultYear || new Date().getFullYear()
          // Try to determine if it's MM/DD or DD/MM (if part1 > 12, it's likely DD/MM)
          if (parseInt(part1) > 12) {
            return `${year}-${part2.padStart(2, "0")}-${part1.padStart(2, "0")}`
          } else {
            return `${year}-${part1.padStart(2, "0")}-${part2.padStart(2, "0")}`
          }
        }
      }
    }
    
    // Fallback: try to parse as-is
    const parsed = new Date(dateStr)
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString().split("T")[0]
    }
    
    // If all else fails, use defaultYear (statement year) if provided, otherwise today's date
    if (defaultYear) {
      return `${defaultYear}-01-01`
    }
    return new Date().toISOString().split("T")[0]
  } catch (error) {
    // Use defaultYear (statement year) if provided, otherwise today's date
    if (defaultYear) {
      return `${defaultYear}-01-01`
    }
    return new Date().toISOString().split("T")[0]
  }
}

