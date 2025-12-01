export type ChangeType = "positive" | "negative"

export interface MetricCardData {
  title: string
  value: string
  change: string
  changeType: ChangeType
  subtitle: string
}

export interface SpendingData {
  name: string
  value: number
  color: string
}

export interface TransactionStatData {
  label: string
  value: string
  change: string
  icon: any
  iconColor: string
  bgColor: string
}
