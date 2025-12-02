import mongoose, { Schema, Document } from "mongoose"

export interface ITransaction extends Document {
  _id: mongoose.Types.ObjectId
  id: number
  userId: number
  name: string
  category: string
  date: string
  time?: string
  amount: number // in cents
  type: "income" | "expense"
  status?: "completed" | "pending" | "failed"
  accountId?: number | null
  savingsGoalId?: number | null
  savingsAmount?: number
  budgetCategoryId?: number | null
  recurringBillId?: number | null
  createdAt?: Date
  updatedAt?: Date
}

const TransactionSchema = new Schema<ITransaction>(
  {
    id: { type: Number, required: true },
    userId: { type: Number, required: true },
    name: { type: String, required: true },
    category: { type: String, required: true },
    date: { type: String, required: true },
    time: { type: String },
    amount: { type: Number, required: true },
    type: { type: String, enum: ["income", "expense"], required: true },
    status: { type: String, enum: ["completed", "pending", "failed"], default: "completed" },
    accountId: { type: Number, default: null },
    savingsGoalId: { type: Number, default: null },
    savingsAmount: { type: Number },
    budgetCategoryId: { type: Number, default: null },
    recurringBillId: { type: Number, default: null },
  },
  {
    timestamps: true,
    collection: "transactions",
  }
)

// Create indexes
TransactionSchema.index({ id: 1 })
TransactionSchema.index({ userId: 1 })
TransactionSchema.index({ date: 1 })
TransactionSchema.index({ type: 1 })
TransactionSchema.index({ category: 1 })

export function createTransactionModel(connection: mongoose.Connection) {
  return connection.models.Transaction || connection.model<ITransaction>("Transaction", TransactionSchema)
}

