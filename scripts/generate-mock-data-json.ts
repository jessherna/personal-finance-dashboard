/**
 * Script to generate JSON files from mock data for MongoDB import
 * Run with: npx tsx scripts/generate-mock-data-json.ts
 */

import * as fs from "fs"
import * as path from "path"
import { mockUsers } from "../lib/data/users"
import { mockAllTransactions } from "../lib/data/transactions"
import { mockAccounts } from "../lib/data/accounts"
import { mockBudgetCategories } from "../lib/data/budget"
import { mockSavingsGoals } from "../lib/data/savings"
import { mockRecurringBills } from "../lib/data/recurring-bills"
import { mockNotifications } from "../lib/data/notifications"
import { defaultPageLayouts } from "../lib/data/page-layouts"
import { restorePoints } from "../lib/data/restore-points"
import { mockPasswords } from "../lib/data/users"

// Output directory
const OUTPUT_DIR = path.join(process.cwd(), "mongodb-seed-data")

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true })
}

// Helper to convert data to MongoDB-compatible format
function toMongoFormat(data: any[]): any[] {
  return data.map((item) => {
    const { id, ...rest } = item
    return {
      _id: id, // Use id as _id for easier reference
      ...rest,
      // Convert date strings to Date objects if they exist
      createdAt: rest.createdAt ? new Date(rest.createdAt) : new Date(),
      updatedAt: rest.updatedAt ? new Date(rest.updatedAt) : new Date(),
    }
  })
}

// Generate users JSON (with passwords)
const usersWithPasswords = mockUsers.map((user) => ({
  ...user,
  password: mockPasswords[user.id] || "password123", // Default password
}))

fs.writeFileSync(
  path.join(OUTPUT_DIR, "users.json"),
  JSON.stringify(toMongoFormat(usersWithPasswords), null, 2)
)

// Generate transactions JSON (add userId - using user id 2 as default)
const transactionsWithUserId = mockAllTransactions.map((t) => ({
  ...t,
  userId: 2, // Default to John Doe
}))

fs.writeFileSync(
  path.join(OUTPUT_DIR, "transactions.json"),
  JSON.stringify(toMongoFormat(transactionsWithUserId), null, 2)
)

// Generate accounts JSON (add userId)
const accountsWithUserId = mockAccounts.map((a) => ({
  ...a,
  userId: 2, // Default to John Doe
}))

fs.writeFileSync(
  path.join(OUTPUT_DIR, "accounts.json"),
  JSON.stringify(toMongoFormat(accountsWithUserId), null, 2)
)

// Generate budget categories JSON (add userId)
const budgetCategoriesWithUserId = mockBudgetCategories.map((b) => ({
  ...b,
  userId: 2, // Default to John Doe
}))

fs.writeFileSync(
  path.join(OUTPUT_DIR, "budget_categories.json"),
  JSON.stringify(toMongoFormat(budgetCategoriesWithUserId), null, 2)
)

// Generate savings goals JSON (add userId, convert icon component to string)
// Map icon components to emoji strings based on the savings goals data
const savingsGoalsWithUserId = mockSavingsGoals.map((s, index) => {
  // Map icons based on goal name/index (since we know the structure)
  const iconMap: Record<number, string> = {
    0: "💻", // New Laptop
    1: "🛡️", // Emergency Fund
    2: "✈️", // Vacation Trip
    3: "🏠", // House Down Payment
  }
  
  const iconValue = iconMap[index] || "💰"
  
  return {
    ...s,
    userId: 2, // Default to John Doe
    icon: iconValue,
  }
})

fs.writeFileSync(
  path.join(OUTPUT_DIR, "savings_goals.json"),
  JSON.stringify(toMongoFormat(savingsGoalsWithUserId), null, 2)
)

// Generate recurring bills JSON (add userId)
const recurringBillsWithUserId = mockRecurringBills.map((b) => ({
  ...b,
  userId: 2, // Default to John Doe
}))

fs.writeFileSync(
  path.join(OUTPUT_DIR, "recurring_bills.json"),
  JSON.stringify(toMongoFormat(recurringBillsWithUserId), null, 2)
)

// Generate notifications JSON
fs.writeFileSync(
  path.join(OUTPUT_DIR, "notifications.json"),
  JSON.stringify(
    toMongoFormat(mockNotifications).map((n) => ({
      ...n,
      createdAt: new Date(n.createdAt),
    })),
    null,
    2
  )
)

// Generate page layouts JSON
const pageLayoutsArray = Object.values(defaultPageLayouts).map((layout) => ({
  ...layout,
  createdAt: new Date(layout.createdAt),
  updatedAt: new Date(layout.updatedAt),
}))

fs.writeFileSync(
  path.join(OUTPUT_DIR, "page_layouts.json"),
  JSON.stringify(toMongoFormat(pageLayoutsArray), null, 2)
)

// Generate restore points JSON
const restorePointsFormatted = restorePoints.map((rp) => ({
  ...rp,
  createdAt: new Date(rp.createdAt),
}))

fs.writeFileSync(
  path.join(OUTPUT_DIR, "restore_points.json"),
  JSON.stringify(toMongoFormat(restorePointsFormatted), null, 2)
)

console.log("✅ Generated JSON files in:", OUTPUT_DIR)
console.log("\nFiles created:")
console.log("  - users.json")
console.log("  - transactions.json")
console.log("  - accounts.json")
console.log("  - budget_categories.json")
console.log("  - savings_goals.json")
console.log("  - recurring_bills.json")
console.log("  - notifications.json")
console.log("  - page_layouts.json")
console.log("  - restore_points.json")
console.log("\n📝 To import to MongoDB, use:")
console.log("   mongoimport --db personal-finance-mock --collection users --file mongodb-seed-data/users.json --jsonArray")
console.log("   (Repeat for each collection)")

