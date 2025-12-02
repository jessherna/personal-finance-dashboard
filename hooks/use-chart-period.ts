"use client"

import { useState } from "react"

type ChartPeriod = "weekly" | "monthly" | "yearly" | "all"

export function useChartPeriod(defaultPeriod: ChartPeriod = "all") {
  const [period, setPeriod] = useState<ChartPeriod>(defaultPeriod)

  return {
    period,
    setPeriod,
  }
}
