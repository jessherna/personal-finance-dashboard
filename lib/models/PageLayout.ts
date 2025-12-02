import mongoose, { Schema, Document } from "mongoose"

export interface IPageElement {
  id: string
  type: "metric" | "chart" | "list" | "card"
  component: string
  position: number
  isVisible: boolean
}

export interface IPageLayout extends Document {
  _id: mongoose.Types.ObjectId
  id: string
  pagePath: string
  elements: IPageElement[]
  version: number
  createdAt: Date
  updatedAt: Date
  createdBy: number
  updatedBy: number
}

const PageElementSchema = new Schema<IPageElement>(
  {
    id: { type: String, required: true },
    type: { type: String, enum: ["metric", "chart", "list", "card"], required: true },
    component: { type: String, required: true },
    position: { type: Number, required: true },
    isVisible: { type: Boolean, default: true },
  },
  { _id: false }
)

const PageLayoutSchema = new Schema<IPageLayout>(
  {
    id: { type: String, required: true, unique: true },
    pagePath: { type: String, required: true },
    elements: { type: [PageElementSchema], required: true },
    version: { type: Number, required: true, default: 1 },
    createdBy: { type: Number, required: true },
    updatedBy: { type: Number, required: true },
  },
  {
    timestamps: true,
    collection: "page_layouts",
  }
)

// Create indexes
PageLayoutSchema.index({ id: 1 })
PageLayoutSchema.index({ pagePath: 1 })

export function createPageLayoutModel(connection: mongoose.Connection) {
  return connection.models.PageLayout || connection.model<IPageLayout>("PageLayout", PageLayoutSchema)
}

