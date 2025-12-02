import mongoose, { Schema, Document } from "mongoose"

export interface IAccount extends Document {
  _id: mongoose.Types.ObjectId
  id: number
  userId: number
  name: string
  type: "checking" | "savings" | "credit_card" | "investment" | "loan" | "other"
  balance: number // in cents (for non-credit cards)
  limit?: number // in cents (for credit cards only - credit limit)
  currency: string
  bankName?: string
  accountNumber?: string
  color?: string
  icon?: string
  isActive: boolean
  notes?: string
  createdAt?: Date
  updatedAt?: Date
}

const AccountSchema = new Schema<IAccount>(
  {
    id: { type: Number, required: true },
    userId: { type: Number, required: true },
    name: { type: String, required: true },
    type: { type: String, enum: ["checking", "savings", "credit_card", "investment", "loan", "other"], required: true },
    balance: { type: Number, required: true, default: 0 },
    limit: { type: Number }, // Credit limit for credit cards (in cents)
    currency: { type: String, required: true, default: "C$" },
    bankName: { type: String },
    accountNumber: { type: String },
    color: { type: String },
    icon: { type: String },
    isActive: { type: Boolean, default: true },
    notes: { type: String },
  },
  {
    timestamps: true,
    collection: "accounts",
  }
)

// Create indexes
AccountSchema.index({ id: 1 })
AccountSchema.index({ userId: 1 })

export function createAccountModel(connection: mongoose.Connection) {
  return connection.models.Account || connection.model<IAccount>("Account", AccountSchema)
}

