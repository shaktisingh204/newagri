import mongoose, { Schema, Document, Types } from "mongoose";

export interface IFavorite extends Document {
  userId: string;
  cropCalendarId: Types.ObjectId;
  tenantId: string;
  createdAt: Date;
}

const FavoriteSchema = new Schema<IFavorite>(
  {
    userId: { type: String, required: true, index: true },
    cropCalendarId: { type: Schema.Types.ObjectId, ref: "CropCalendar", required: true },
    tenantId: { type: String, required: true },
  },
  { timestamps: true }
);

FavoriteSchema.index({ userId: 1, cropCalendarId: 1 }, { unique: true });

export const Favorite =
  (mongoose.models.Favorite as mongoose.Model<IFavorite>) ||
  mongoose.model<IFavorite>("Favorite", FavoriteSchema);
