import { NextResponse } from "next/server"

/**
 * Parse transactions from PDF text using LLM
 * This provides more accurate extraction than regex patterns
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { text, statementPeriod } = body

    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "Text is required" }, { status: 400 })
    }

    // LLM Provider Priority:
    // 1. Mistral AI (official API) - if MISTRAL_API_KEY is set
    // 2. Hugging Face (free, no API key needed for public models)
    // 3. OpenAI (if PREFER_OPENAI=true or as fallback)
    const mistralApiKey = process.env.MISTRAL_API_KEY
    const hfApiKey = process.env.HUGGINGFACE_API_KEY || process.env.HF_TOKEN
    const openAiApiKey = process.env.OPENAI_API_KEY
    
    // Provider selection logic
    const preferMistral = !!mistralApiKey
    const preferOpenAI = process.env.PREFER_OPENAI === "true"
    const skipHuggingFace = preferMistral || preferOpenAI
    
    // No API key needed for Hugging Face public models (but recommended for higher rate limits)

    // Prepare the prompt for the LLM using the expert financial parser format
    const prompt = `You are an expert financial document parser. Your task is to read raw text extracted from a credit card or bank statement (PDF-to-text conversion) and output all transactions in JSON format.

### Step 1: Text Ingestion

- **CRITICAL: Process ALL pages of the document. Do not stop after the first page.**
- The text may span multiple pages - look for "Page 1", "Page 2", etc. or page breaks
- Treat the input as raw text (headers, footers, disclaimers, tables, metadata).
- Handle irregular spacing, line breaks, and merged cells.
- Continue processing transactions from all pages until you reach the end of the document.

### Step 2: Pattern Recognition

- Identify transaction rows by the presence of:
  - Reference number (REF.#)
  - Transaction date (TRANS DATE) - the first date, when transaction occurred
  - Posting date (POST DATE) - the second date, when transaction was posted to account
  - Merchant/Details - meaningful transaction description
  - Amount (positive for charges, negative for credits/payments)

### Step 3: Extraction Logic

- For each transaction row, extract:
  - \`ref_number\` (string, blank if missing)
  - \`transaction_date\` (string, normalize to \`YYYY-MM-DD\` if possible - first date)
  - \`post_date\` (string, normalize to \`YYYY-MM-DD\` if possible - second date, PREFERRED for date field)
  - \`details\` (string, merchant or description)
  - \`amount\` (number, negative for credits/payments, positive for charges/debits)

**IMPORTANT DATE RULES:**
- Always use POSTING DATE (post_date, the second date) as the primary date for transactions
- Only use transaction_date if post_date is not available
- If both dates are present, post_date takes precedence

**IMPORTANT VALIDATION RULES:**
- Only extract rows that have MEANINGFUL transaction descriptions
- Skip rows with descriptions like:
  - "Opening Balance", "Closing Balance", "Previous Balance", "New Balance"
  - "Total", "Subtotal", "Summary", "Statement Period"
  - Empty or whitespace-only descriptions
  - Descriptions that are just numbers or codes without context
  - Account numbers, statement headers, or metadata
- Valid transaction descriptions should indicate:
  - A merchant name (e.g., "STARBUCKS", "AMAZON", "WALMART")
  - A service or payment type (e.g., "PAYMENT", "TRANSFER", "DEPOSIT")
  - A location or business (e.g., "TORONTO ON", "GAS STATION")
  - A meaningful description of what was purchased or transferred
- If a description doesn't make sense as a transaction, DO NOT include it

### Step 4: Structured Output

- Return a JSON object with two keys:
  - \`"transactions"\`: an array of transaction objects
  - \`"summary"\`: an object containing totals if provided (debits, credits, new_balance, available_credit)

### Step 5: Consistency Rules

- Do not include unrelated text (headers, disclaimers, interest info, balances, totals).
- Ensure all extracted rows are aligned with the specified fields.
- Mark credits/payments with a negative sign.
- For bank statements: withdrawals/debits are positive, deposits/credits are negative.
- **CRITICAL DATE VALIDATION**: 
  - Statement period: ${statementPeriod || "Not specified"}
  - All transaction dates MUST fall within or before the statement period
  - If a date appears to be in the future relative to the statement period, CORRECT IT
  - For example, if statement period is "Dec 8, 2024 - Jan 7, 2025" and you see "Dec 30, 2025", it should be "Dec 30, 2024"
  - If year is missing from dates, infer from statement period (use the appropriate year from the period)
  - Dates cannot be after the statement end date
- **ALWAYS use post_date (posting date) as the primary date** - it's more accurate for when the transaction actually affected the account
- **VALIDATE descriptions**: Only include transactions with meaningful, sensible descriptions that indicate actual financial activity

---

### Input:

${text}

### Output:

Return ONLY valid JSON, no markdown, no explanations. Use this exact format:
{
  "transactions": [
    {
      "ref_number": "001",
      "transaction_date": "2024-12-07",
      "post_date": "2024-12-08",
      "details": "UBER CANADA/UBEREATS TORONTO ON",
      "amount": 40.91
    },
    {
      "ref_number": "002",
      "transaction_date": "2024-12-18",
      "post_date": "2024-12-19",
      "details": "PAYMENT FROM - *****29*8226",
      "amount": -313.10
    }
  ],
  "summary": {}
}`

    // Always try Hugging Face first (unless explicitly skipped via PREFER_OPENAI)
    let response: Response
    let parseResponse: (data: any) => string = (data: any) => {
      // Default parser - should be overridden
      if (typeof data === "string") return data
      if (data.generated_text) return data.generated_text
      return JSON.stringify(data)
    }
    let usedProvider = "huggingface"
    
    // Step 1: Try Mistral AI official API first (if API key is provided)
    if (preferMistral && mistralApiKey) {
      try {
        // Use Mistral AI official API (La Plateforme)
        // Reference: https://github.com/mistralai/mistral-inference
        // API docs: https://docs.mistral.ai/
        const model = "mistral-small-latest" // Fast and efficient for extraction tasks
        
        response = await fetch("https://api.mistral.ai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${mistralApiKey}`,
          },
          body: JSON.stringify({
            model: model,
            messages: [
              {
                role: "user",
                content: prompt,
              },
            ],
            temperature: 0.1,
            max_tokens: 4000, // Increased to handle multi-page documents
          }),
        })
        
        usedProvider = "mistral"
        
        parseResponse = (data: any) => {
          // Mistral API returns OpenAI-compatible format
          if (data.choices && data.choices[0]?.message?.content) {
            return data.choices[0].message.content
          }
          if (typeof data === "string") {
            return data
          }
          return JSON.stringify(data)
        }
      } catch (mistralError: any) {
        console.error("Mistral AI API error:", mistralError)
        // If Mistral fails, create an error response to trigger fallback
        response = {
          ok: false,
          status: 503,
          json: async () => ({ error: mistralError.message || "Mistral AI API error" }),
        } as Response
        
        // Set a dummy parseResponse to avoid undefined errors
        parseResponse = (data: any) => ""
      }
    }
    // Step 2: Try Hugging Face (if Mistral not preferred or failed)
    else if (!skipHuggingFace) {
      // Use Hugging Face Router API
      // The old api-inference.huggingface.co is deprecated, use router.huggingface.co
      const model = "mistralai/Mistral-7B-Instruct-v0.2" // Free, good for extraction
      
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      }
      
      // API key is optional but recommended for higher rate limits
      if (hfApiKey) {
        headers.Authorization = `Bearer ${hfApiKey}`
      }
      
      try {
        // Try the router endpoint first (new recommended endpoint)
        response = await fetch(`https://router.huggingface.co/models/${model}`, {
          method: "POST",
          headers,
          body: JSON.stringify({
            inputs: prompt,
            parameters: {
              temperature: 0.1,
              max_new_tokens: 4000, // Increased to handle multi-page documents
              return_full_text: false,
            },
          }),
        })
        
        // If router endpoint fails, try the inference endpoint as fallback
        if (!response.ok && (response.status === 404 || response.status === 410)) {
          response = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
            method: "POST",
            headers,
            body: JSON.stringify({
              inputs: prompt,
              parameters: {
                temperature: 0.1,
                max_new_tokens: 4000, // Increased to handle multi-page documents
                return_full_text: false,
              },
            }),
          })
        }
        
        parseResponse = (data: any) => {
          // Hugging Face returns array of generated text
          if (Array.isArray(data) && data[0]?.generated_text) {
            return data[0].generated_text
          }
          if (data.generated_text) {
            return data.generated_text
          }
          if (typeof data === "string") {
            return data
          }
          return JSON.stringify(data)
        }
      } catch (hfError: any) {
        console.error("Hugging Face API error:", hfError)
        // If API fails, create an error response to trigger fallback
        response = {
          ok: false,
          status: 503,
          json: async () => ({ error: hfError.message || "Hugging Face API error" }),
        } as Response
        
        // Set a dummy parseResponse to avoid undefined errors
        parseResponse = (data: any) => ""
      }
    } else {
      // Skip Hugging Face and use OpenAI directly (only if PREFER_OPENAI=true)
      if (!openAiApiKey) {
        return NextResponse.json(
          { error: "OpenAI API key required when PREFER_OPENAI is set" },
          { status: 400 }
        )
      }
      
      response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openAiApiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content:
                "You are a financial data extraction expert. Always return valid JSON objects with 'transactions' array, no markdown, no explanations.",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          temperature: 0.1,
          max_tokens: 4000,
        }),
      })
      
      parseResponse = (data: any) => {
        return data.choices?.[0]?.message?.content || ""
      }
      usedProvider = "openai"
    }

    // Step 3: If previous provider failed, try OpenAI as fallback (if available)
    if (!response.ok && usedProvider !== "openai" && openAiApiKey) {
      let errorData: any = {}
      try {
        errorData = await response.json()
      } catch (e) {
        errorData = { message: `HTTP ${response.status}: ${response.statusText}` }
      }
      
      // Don't fail on model loading, rate limits, deprecated endpoints, or 404 - try OpenAI instead
      const shouldTryOpenAI = 
        response.status === 410 || 
        response.status === 404 ||
        response.status === 503 || 
        response.status === 429 ||
        errorData.error?.includes("loading") ||
        errorData.error?.includes("Model") ||
        errorData.error?.includes("rate") ||
        errorData.error?.includes("no longer supported") ||
        errorData.message?.includes("404")
      
      if (shouldTryOpenAI) {
        usedProvider = "openai"
        
        response = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${openAiApiKey}`,
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [
              {
                role: "system",
                content:
                  "You are a financial data extraction expert. Always return valid JSON objects with 'transactions' array, no markdown, no explanations.",
              },
              {
                role: "user",
                content: prompt,
              },
            ],
            temperature: 0.1,
            max_tokens: 4000, // Increased to handle multi-page documents
          }),
        })
        
        parseResponse = (data: any) => {
          return data.choices?.[0]?.message?.content || ""
        }
        
        // Check if OpenAI also failed
        if (!response.ok) {
          const openAiError = await response.json().catch(() => ({}))
          return NextResponse.json(
            { error: "Both Hugging Face and OpenAI failed. Please use regex parsing.", details: openAiError },
            { status: response.status }
          )
        }
      } else {
        // Other errors - return them
        return NextResponse.json(
          { error: "Failed to parse with LLM", details: errorData },
          { status: response.status }
        )
      }
    } else if (!response.ok) {
      // No OpenAI fallback available, return error
      let errorData: any = {}
      try {
        errorData = await response.json()
      } catch (e) {
        errorData = { message: `HTTP ${response.status}: ${response.statusText}` }
      }
      
      // Handle 410 Gone - endpoint deprecated
      if (response.status === 410) {
        if (!openAiApiKey) {
          return NextResponse.json(
            { 
              error: "Hugging Face API endpoint is deprecated. Please add OPENAI_API_KEY or HUGGINGFACE_API_KEY for updated endpoints.",
              details: errorData 
            },
            { status: 503 }
          )
        }
      }
      
      // Handle 404 - endpoint not found
      if (response.status === 404) {
        if (!openAiApiKey) {
          return NextResponse.json(
            { 
              error: "Hugging Face API endpoint not found. Please add OPENAI_API_KEY or check HUGGINGFACE_API_KEY configuration.",
              details: errorData 
            },
            { status: 503 }
          )
        }
      }
      
      // If Hugging Face model is loading, suggest waiting
      if (!skipHuggingFace && (errorData.error?.includes("loading") || errorData.error?.includes("Model"))) {
        return NextResponse.json(
          { 
            error: "Model is loading. Please try again in 10-20 seconds.", 
            details: errorData,
            retryAfter: 15 
          },
          { status: 503 }
        )
      }
      
      // Handle rate limiting (common with free Hugging Face)
      if (!skipHuggingFace && (response.status === 429 || errorData.error?.includes("rate"))) {
        return NextResponse.json(
          { 
            error: "Rate limit reached. Please wait a moment and try again, or add HUGGINGFACE_API_KEY for higher limits.",
            details: errorData 
          },
          { status: 429 }
        )
      }
      
      return NextResponse.json(
        { error: "Failed to parse with LLM", details: errorData },
        { status: response.status }
      )
    }

    const data = await response.json()
    const content = parseResponse(data)

    if (!content) {
      return NextResponse.json({ error: "No content from LLM" }, { status: 500 })
    }

    // Parse the JSON response
    let parsedData: any
    let transactions: any[] = []
    
    try {
      // Clean the content - remove markdown code blocks if present
      let cleanedContent = content.trim()
      
      // Remove markdown code blocks
      cleanedContent = cleanedContent.replace(/```json\n?/g, "").replace(/```\n?/g, "")
      
      // Try to extract JSON object from the response
      const jsonObjectMatch = cleanedContent.match(/\{[\s\S]*\}/)
      if (jsonObjectMatch) {
        parsedData = JSON.parse(jsonObjectMatch[0])
      } else {
        parsedData = JSON.parse(cleanedContent)
      }
      
      // Handle the new format with "transactions" and "summary" keys
      transactions = parsedData.transactions || parsedData.data || parsedData
      
      // If it's not an array, try to extract it
      if (!Array.isArray(transactions)) {
        if (Array.isArray(parsedData)) {
          transactions = parsedData
        } else {
          transactions = []
        }
      }
    } catch (parseError: any) {
      console.error("Failed to parse LLM response:", parseError.message)
      return NextResponse.json(
        { error: "Failed to parse LLM response", details: parseError.message },
        { status: 500 }
      )
    }

    // Validate and normalize transactions from the new format
    const normalizedTransactions = transactions
      .filter((t: any) => {
        // Must have details and amount
        if (!t.details || t.amount === undefined || t.amount === null) {
          return false
        }
        
        // Validate that description makes sense as a transaction
        const details = String(t.details).trim().toLowerCase()
        
        // Skip balance-related entries
        if (details.includes("opening balance") || 
            details.includes("closing balance") ||
            details.includes("previous balance") ||
            details.includes("new balance") ||
            details.includes("available balance")) {
          return false
        }
        
        // Skip summary/total entries
        if (details.includes("total") && (details.includes("amount") || details.includes("balance"))) {
          return false
        }
        
        // Skip if description is just numbers or very short
        if (details.length < 3 || /^\d+$/.test(details)) {
          return false
        }
        
        // Skip if it looks like account metadata
        if (details.includes("account #") || 
            details.includes("account number") ||
            details.includes("statement period") ||
            details.includes("statement date")) {
          return false
        }
        
        return true
      })
      .map((t: any) => {
        // Map from new format to our format
        const amount = parseFloat(t.amount)
        const isNegative = amount < 0
        
        // Prioritize post_date (posting date) over transaction_date
        // Posting date is when the transaction was actually posted to the account (more accurate)
        let dateStr = t.post_date || t.transaction_date || t.date
        if (!dateStr || !dateStr.match(/\d{4}-\d{2}-\d{2}/)) {
          // Extract year from statement period if available
          let fallbackYear = new Date().getFullYear()
          let statementEndDate: Date | null = null
          
          if (statementPeriod) {
            const years = statementPeriod.match(/\d{4}/g)
            if (years && years.length > 0) {
              // Use the later year from the statement period (end date)
              fallbackYear = Math.max(...years.map((y: string) => parseInt(y)))
              
              // Parse statement end date for validation
              const periodMatch = statementPeriod.match(/(\w{3})\s+(\d{1,2}),?\s+(\d{4})\s*-\s*(\w{3})\s+(\d{1,2}),?\s+(\d{4})/i)
              if (periodMatch) {
                try {
                  statementEndDate = new Date(`${periodMatch[4]} ${periodMatch[5]}, ${periodMatch[6]}`)
                } catch (e) {
                  // Ignore parsing errors
                }
              }
            }
          }
          
          // Try to normalize the date using statement year
          if (dateStr && dateStr.match(/\w{3}\s+\d{1,2}/)) {
            // Format like "Jan 15" - add statement year
            dateStr = `${dateStr}, ${fallbackYear}`
          } else if (dateStr && dateStr.match(/\d{1,2}[\/\-]\d{1,2}/)) {
            // Format like "01/15" - add statement year
            dateStr = `${dateStr}/${fallbackYear}`
          } else {
            // Use statement year as fallback
            dateStr = `${fallbackYear}-01-01`
          }
        }
        
        // Validate and fix dates that are in the future relative to statement period
        if (statementPeriod) {
          const transactionDate = new Date(dateStr)
          if (!isNaN(transactionDate.getTime())) {
            // Parse statement end date
            const periodMatch = statementPeriod.match(/(\w{3})\s+(\d{1,2}),?\s+(\d{4})\s*-\s*(\w{3})\s+(\d{1,2}),?\s+(\d{4})/i)
            if (periodMatch) {
              try {
                const statementEndDate = new Date(`${periodMatch[4]} ${periodMatch[5]}, ${periodMatch[6]}`)
                const statementStartDate = new Date(`${periodMatch[1]} ${periodMatch[2]}, ${periodMatch[3]}`)
                
                // If transaction date is after statement end date, it's likely wrong
                if (transactionDate > statementEndDate) {
                  // Check if it's a year off (e.g., 2025 instead of 2024)
                  const yearDiff = transactionDate.getFullYear() - statementEndDate.getFullYear()
                  if (yearDiff >= 1) {
                    // Likely a year off, correct it by subtracting the year difference
                    const correctedYear = transactionDate.getFullYear() - yearDiff
                    dateStr = `${correctedYear}-${String(transactionDate.getMonth() + 1).padStart(2, "0")}-${String(transactionDate.getDate()).padStart(2, "0")}`
                  }
                }
                
                // Also check if date is way before statement start (might be wrong year)
                // But only if it's more than a few months before (to avoid false positives)
                const monthsBefore = (statementStartDate.getTime() - transactionDate.getTime()) / (1000 * 60 * 60 * 24 * 30)
                if (monthsBefore > 3) {
                  const yearsBefore = statementStartDate.getFullYear() - transactionDate.getFullYear()
                  if (yearsBefore === 1) {
                    // Might be off by a year in the past direction
                    const correctedYear = transactionDate.getFullYear() + 1
                    dateStr = `${correctedYear}-${String(transactionDate.getMonth() + 1).padStart(2, "0")}-${String(transactionDate.getDate()).padStart(2, "0")}`
                  }
                }
              } catch (e) {
                // Ignore date parsing errors
              }
            }
          }
        }
        
        // Clean up details (remove excessive whitespace, reference numbers if they're just IDs)
        let details = String(t.details || t.name || "").trim()
        // Remove standalone reference numbers at the start (like "01320206" or "43812079")
        details = details.replace(/^\d{8,}\s+/, "").trim()
        
        return {
          name: details || "Unknown Transaction",
          date: dateStr,
          amount: Math.round(Math.abs(amount) * 100), // Convert to cents, always positive
          type: isNegative ? "income" : "expense", // Negative = credit/payment = income, Positive = charge/debit = expense
          category: t.category || undefined,
        }
      })

    return NextResponse.json({
      success: true,
      transactions: normalizedTransactions,
      method: usedProvider,
    })
  } catch (error: any) {
    console.error("Parse transactions error:", error)
    return NextResponse.json(
      { error: "Internal server error", message: error.message },
      { status: 500 }
    )
  }
}


