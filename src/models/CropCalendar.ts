import mongoose, { Schema, Document } from "mongoose";

export interface MonthPhase {
  month: number; // 1-12
  phase: "sowing" | "growing" | "harvesting" | "idle";
}

export interface ICropCalendar extends Document {
  cropId: mongoose.Types.ObjectId;
  regionId: mongoose.Types.ObjectId;
  cropName: string;
  country: string;
  state: string;
  region: string;
  season: string;
  phases: MonthPhase[];
  sowingMonths: number[];
  growingMonths: number[];
  harvestingMonths: number[];
  tenantId: string;
  createdAt: Date;
}

const CropCalendarSchema = new Schema<ICropCalendar>(
  {
    cropId: { type: Schema.Types.ObjectId, ref: "Crop", required: true },
    regionId: { type: Schema.Types.ObjectId, ref: "Region", required: true },
    cropName: { type: String, required: true, index: true },
    country: { type: String, required: true, index: true },
    state: { type: String, required: true, index: true },
    region: { type: String, required: true },
    season: { type: String, required: true, index: true },
    phases: [
      {
        month: { type: Number, min: 1, max: 12 },
        phase: { type: String, enum: ["sowing", "growing", "harvesting", "idle"] },
      },
    ],
    sowingMonths: [{ type: Number }],
    growingMonths: [{ type: Number }],
    harvestingMonths: [{ type: Number }],
    tenantId: { type: String, required: true, index: true },
  },
  { timestamps: true }
);

CropCalendarSchema.index({ cropName: 1, country: 1, state: 1, season: 1, tenantId: 1 });

export const CropCalendar =
  mongoose.models.CropCalendar || mongoose.model<ICropCalendar>("CropCalendar", CropCalendarSchema);
