import mongoose, { Schema, Document } from "mongoose";

export interface ICrop extends Document {
  name: string;
  category: string;
  description: string;
  tenantId: string;
  createdAt: Date;
}

const CropSchema = new Schema<ICrop>(
  {
    name: { type: String, required: true, index: true },
    category: { type: String, default: "General" },
    description: { type: String, default: "" },
    tenantId: { type: String, required: true, index: true },
  },
  { timestamps: true }
);

CropSchema.index({ name: 1, tenantId: 1 }, { unique: true });

export const Crop = mongoose.models.Crop || mongoose.model<ICrop>("Crop", CropSchema);
