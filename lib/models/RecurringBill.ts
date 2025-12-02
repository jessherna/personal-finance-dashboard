import mongoose, { Schema, Document } from "mongoose"

export interface IRecurringBill extends Document {
  _id: mongoose.Types.ObjectId
  id: number
  userId: number
  name: string
  amount: number // in cents
  frequency: "daily" | "weekly" | "biweekly" | "monthly" | "quarterly" | "yearly"
  nextDueDate: string // ISO date string
  category: string
  icon?: string
  color?: string
  isActive: boolean
  notes?: string
  budgetCategoryId?: number | null
  lastPaidDate?: string // ISO date string
  createdAt?: Date
  updatedAt?: Date
}

const RecurringBillSchema = new Schema<IRecurringBill>(
  {
    id: { type: Number, required: true },
    userId: { type: Number, required: true },
    name: { type: String, required: true },
    amount: { type: Number, required: true },
    frequency: {
      type: String,
      enum: ["daily", "weekly", "biweekly", "monthly", "quarterly", "yearly"],
      required: true,
    },
    nextDueDate: { type: String, required: true },
    category: { type: String, required: true },
    icon: { type: String },
    color: { type: String },
    isActive: { type: Boolean, default: true },
    notes: { type: String },
    budgetCategoryId: { type: Number, default: null },
    lastPaidDate: { type: String },
  },
  {
    timestamps: true,
    collection: "recurring_bills",
  }
)

// Create indexes
RecurringBillSchema.index({ id: 1 })
RecurringBillSchema.index({ userId: 1 })
RecurringBillSchema.index({ isActive: 1 })

export function createRecurringBillModel(connection: mongoose.Connection) {
  return connection.models.RecurringBill || connection.model<IRecurringBill>("RecurringBill", RecurringBillSchema)
}

