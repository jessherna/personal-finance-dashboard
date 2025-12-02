import mongoose, { Schema, Document } from "mongoose"

export interface ISavingsGoal extends Document {
  _id: mongoose.Types.ObjectId
  id: number
  userId: number
  name: string
  icon: string // Icon component name or emoji
  current: number // in cents
  target: number // in cents
  dueDate: string
  color: string
  monthlyContribution: number // in cents
  createdAt?: Date
  updatedAt?: Date
}

const SavingsGoalSchema = new Schema<ISavingsGoal>(
  {
    id: { type: Number, required: true },
    userId: { type: Number, required: true },
    name: { type: String, required: true },
    icon: { type: String, required: true },
    current: { type: Number, required: true, default: 0 },
    target: { type: Number, required: true },
    dueDate: { type: String, required: true },
    color: { type: String, required: true },
    monthlyContribution: { type: Number, required: true, default: 0 },
  },
  {
    timestamps: true,
    collection: "savings_goals",
  }
)

// Create indexes
SavingsGoalSchema.index({ id: 1 })
SavingsGoalSchema.index({ userId: 1 })

export function createSavingsGoalModel(connection: mongoose.Connection) {
  return connection.models.SavingsGoal || connection.model<ISavingsGoal>("SavingsGoal", SavingsGoalSchema)
}

