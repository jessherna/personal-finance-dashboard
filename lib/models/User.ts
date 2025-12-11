import mongoose, { Schema, Document } from "mongoose"

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId
  id: number
  email: string
  name: string
  role: "user" | "dev" | "admin"
  createdAt: Date
  updatedAt: Date
  isActive: boolean
  avatar?: string
  password?: string // Hashed password
  hasCompletedOnboarding?: boolean
  resetToken?: string
  resetTokenExpires?: Date
}

const UserSchema = new Schema<IUser>(
  {
    id: { type: Number, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    role: { type: String, enum: ["user", "dev", "admin"], required: true, default: "user" },
    isActive: { type: Boolean, default: true },
    avatar: { type: String },
    password: { type: String }, // Hashed password
    hasCompletedOnboarding: { type: Boolean, default: false },
    resetToken: { type: String },
    resetTokenExpires: { type: Date },
  },
  {
    timestamps: true,
    collection: "users",
  }
)

// Create indexes
UserSchema.index({ id: 1 })
UserSchema.index({ email: 1 })

export function createUserModel(connection: mongoose.Connection) {
  return connection.models.User || connection.model<IUser>("User", UserSchema)
}

