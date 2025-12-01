import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Export calculation functions
export { 
  calculateSavingsProgress,
  calculatePercentage,
  isBudgetExceeded,
  sum,
  average
} from './utils/calculations'

// Export format functions
export { formatCurrency } from './utils/format'

// Export filter functions
export {
  filterByType,
  filterByCategory,
  filterBySearch,
  sortByDate
} from './utils/filters'
