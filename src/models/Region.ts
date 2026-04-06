import mongoose, { Schema, Document } from "mongoose";

export interface IRegion extends Document {
  country: string;
  state: string;
  region: string;
  agroEcologicalZone: string;
  latitude: number;
  longitude: number;
  tenantId: string;
}

const RegionSchema = new Schema<IRegion>(
  {
    country: { type: String, required: true, index: true },
    state: { type: String, required: true, index: true },
    region: { type: String, required: true },
    agroEcologicalZone: { type: String, default: "" },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    tenantId: { type: String, required: true, index: true },
  },
  { timestamps: true }
);

RegionSchema.index({ country: 1, state: 1, region: 1, tenantId: 1 }, { unique: true });

export const Region = mongoose.models.Region || mongoose.model<IRegion>("Region", RegionSchema);
