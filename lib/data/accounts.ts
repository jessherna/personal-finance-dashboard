import type { Account } from "@/lib/types"

export const mockAccounts: Account[] = [
  {
    id: 1,
    name: "Primary Checking",
    type: "checking",
    balance: 25000000, // C$250,000.00 in cents
    currency: "C$",
    bankName: "TD Bank",
    accountNumber: "****1234",
    color: "#4E79A7",
    icon: "💳",
    isActive: true,
  },
  {
    id: 2,
    name: "Savings Account",
    type: "savings",
    balance: 15000000, // C$150,000.00 in cents
    currency: "C$",
    bankName: "TD Bank",
    accountNumber: "****5678",
    color: "#59A14F",
    icon: "💰",
    isActive: true,
  },
  {
    id: 3,
    name: "Credit Card",
    type: "credit_card",
    balance: 0, // Credit cards start with 0 balance
    limit: 10000000, // C$100,000.00 credit limit in cents
    currency: "C$",
    bankName: "Visa",
    accountNumber: "****9012",
    color: "#E15759",
    icon: "💳",
    isActive: true,
  },
  {
    id: 4,
    name: "Investment Account",
    type: "investment",
    balance: 100000000, // C$1,000,000.00 in cents
    currency: "C$",
    bankName: "Questrade",
    accountNumber: "****3456",
    color: "#AF58BA",
    icon: "📈",
    isActive: true,
  },
]

