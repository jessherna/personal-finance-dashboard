import mongoose, { Schema, Document } from "mongoose"

export interface ICustomCategory extends Document {
  _id: mongoose.Types.ObjectId
  id: number
  userId: number
  name: string
  color: string
  createdAt?: Date
  updatedAt?: Date
}

const CustomCategorySchema = new Schema<ICustomCategory>(
  {
    id: { type: Number, required: true },
    userId: { type: Number, required: true },
    name: { type: String, required: true },
    color: { type: String, required: true },
  },
  {
    timestamps: true,
    collection: "custom_categories",
  }
)

// Create indexes
CustomCategorySchema.index({ id: 1 })
CustomCategorySchema.index({ userId: 1 })
CustomCategorySchema.index({ name: 1, userId: 1 }, { unique: true }) // Ensure unique category names per user

export function createCustomCategoryModel(connection: mongoose.Connection) {
  return connection.models.CustomCategory || connection.model<ICustomCategory>("CustomCategory", CustomCategorySchema)
}

