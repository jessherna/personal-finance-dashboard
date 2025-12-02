import mongoose, { Schema, Document } from "mongoose"

export interface IBudgetCategory extends Document {
  _id: mongoose.Types.ObjectId
  id: number
  userId: number
  name: string
  budget: number // in cents
  spent: number // in cents
  icon: string
  color: string
  createdAt?: Date
  updatedAt?: Date
}

const BudgetCategorySchema = new Schema<IBudgetCategory>(
  {
    id: { type: Number, required: true },
    userId: { type: Number, required: true },
    name: { type: String, required: true },
    budget: { type: Number, required: true, default: 0 },
    spent: { type: Number, required: true, default: 0 },
    icon: { type: String, required: true },
    color: { type: String, required: true },
  },
  {
    timestamps: true,
    collection: "budget_categories",
  }
)

// Create indexes
BudgetCategorySchema.index({ id: 1 })
BudgetCategorySchema.index({ userId: 1 })

export function createBudgetCategoryModel(connection: mongoose.Connection) {
  return connection.models.BudgetCategory || connection.model<IBudgetCategory>("BudgetCategory", BudgetCategorySchema)
}

