import mongoose, { Schema, Document } from "mongoose"

export interface INotification extends Document {
  _id: mongoose.Types.ObjectId
  id: string
  userId: number
  type: "info" | "warning" | "success" | "error" | "budget" | "savings" | "transaction"
  title: string
  message: string
  isRead: boolean
  createdAt: Date
  link?: string
  metadata?: Record<string, any>
}

const NotificationSchema = new Schema<INotification>(
  {
    id: { type: String, required: true, unique: true },
    userId: { type: Number, required: true },
    type: {
      type: String,
      enum: ["info", "warning", "success", "error", "budget", "savings", "transaction"],
      required: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    isRead: { type: Boolean, default: false },
    link: { type: String },
    metadata: { type: Schema.Types.Mixed },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    collection: "notifications",
  }
)

// Create indexes
NotificationSchema.index({ id: 1 })
NotificationSchema.index({ userId: 1 })
NotificationSchema.index({ isRead: 1 })
NotificationSchema.index({ createdAt: -1 })

export function createNotificationModel(connection: mongoose.Connection) {
  return connection.models.Notification || connection.model<INotification>("Notification", NotificationSchema)
}

