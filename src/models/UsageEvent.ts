import mongoose, { Schema, Document } from "mongoose";

export interface IUsageEvent extends Document {
  eventType: string;
  cropName?: string;
  country?: string;
  filters?: Record<string, string>;
  tenantId: string;
  userId?: string;
  createdAt: Date;
}

const UsageEventSchema = new Schema<IUsageEvent>(
  {
    eventType: { type: String, required: true, index: true },
    cropName: { type: String, index: true },
    country: { type: String },
    filters: { type: Schema.Types.Mixed },
    tenantId: { type: String, required: true, index: true },
    userId: { type: String },
  },
  { timestamps: true }
);

export const UsageEvent =
  mongoose.models.UsageEvent || mongoose.model<IUsageEvent>("UsageEvent", UsageEventSchema);
