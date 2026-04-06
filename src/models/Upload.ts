import mongoose, { Schema, Document } from "mongoose";

export interface FlaggedRow {
  row: number;
  reason: string;
  data: Record<string, unknown>;
}

export interface IUpload extends Document {
  fileName: string;
  fileType: "pdf" | "xlsx";
  status: "pending" | "parsed" | "validated" | "committed" | "failed";
  totalRows: number;
  validRows: number;
  flaggedRows: FlaggedRow[];
  parsedData: Record<string, unknown>[];
  tenantId: string;
  uploadedBy: string;
  committedAt?: Date;
  createdAt: Date;
}

const UploadSchema = new Schema<IUpload>(
  {
    fileName: { type: String, required: true },
    fileType: { type: String, enum: ["pdf", "xlsx"], required: true },
    status: {
      type: String,
      enum: ["pending", "parsed", "validated", "committed", "failed"],
      default: "pending",
    },
    totalRows: { type: Number, default: 0 },
    validRows: { type: Number, default: 0 },
    flaggedRows: [
      {
        row: Number,
        reason: String,
        data: Schema.Types.Mixed,
      },
    ],
    parsedData: [Schema.Types.Mixed],
    tenantId: { type: String, required: true, index: true },
    uploadedBy: { type: String, required: true },
    committedAt: { type: Date },
  },
  { timestamps: true }
);

export const Upload = mongoose.models.Upload || mongoose.model<IUpload>("Upload", UploadSchema);
