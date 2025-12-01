"use client"

import { useState } from "react"

type ChartPeriod = "weekly" | "monthly" | "yearly"

export function useChartPeriod(defaultPeriod: ChartPeriod = "monthly") {
  const [period, setPeriod] = useState<ChartPeriod>(defaultPeriod)

  return {
    period,
    setPeriod,
  }
}
