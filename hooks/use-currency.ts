"use client"

import { useState } from "react"
import { DEFAULT_CURRENCY } from "@/lib/constants/currency"
import { formatCurrency } from "@/lib/utils"

export function useCurrency() {
  const [currency, setCurrency] = useState(DEFAULT_CURRENCY)

  const format = (amount: number) => formatCurrency(amount, currency)

  return {
    currency,
    setCurrency,
    format,
  }
}
