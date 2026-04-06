"use server";

import { connectDB } from "@/lib/db";
import { Upload } from "@/models/Upload";
import { Crop } from "@/models/Crop";
import { Region } from "@/models/Region";
import { CropCalendar } from "@/models/CropCalendar";
import { requireAdmin } from "@/lib/auth";
import * as XLSX from "xlsx";
import * as pdfParse from "pdf-parse";

interface ParsedRow {
  cropName: string;
  country: string;
  state: string;
  region: string;
  season: string;
  latitude: number;
  longitude: number;
  agroEcologicalZone: string;
  sowingMonths: number[];
  growingMonths: number[];
  harvestingMonths: number[];
}

function parseMonthList(val: string): number[] {
  if (!val) return [];
  return val
    .split(",")
    .map((s) => parseInt(s.trim(), 10))
    .filter((n) => !isNaN(n) && n >= 1 && n <= 12);
}

function validateRow(row: ParsedRow, index: number): { valid: boolean; reason?: string } {
  if (!row.cropName) return { valid: false, reason: `Row ${index}: Missing crop name` };
  if (!row.country) return { valid: false, reason: `Row ${index}: Missing country` };
  if (!row.state) return { valid: false, reason: `Row ${index}: Missing state` };
  if (!row.region) return { valid: false, reason: `Row ${index}: Missing region` };
  if (!row.season) return { valid: false, reason: `Row ${index}: Missing season` };
  if (isNaN(row.latitude) || isNaN(row.longitude))
    return { valid: false, reason: `Row ${index}: Invalid coordinates` };
  if (row.sowingMonths.length === 0 && row.growingMonths.length === 0 && row.harvestingMonths.length === 0)
    return { valid: false, reason: `Row ${index}: No phase months specified` };
  return { valid: true };
}

function normalizeRow(raw: Record<string, string>): ParsedRow {
  return {
    cropName: (raw["crop_name"] || raw["cropName"] || raw["Crop"] || raw["crop"] || "").trim(),
    country: (raw["country"] || raw["Country"] || "").trim(),
    state: (raw["state"] || raw["State"] || raw["province"] || "").trim(),
    region: (raw["region"] || raw["Region"] || raw["district"] || "").trim(),
    season: (raw["season"] || raw["Season"] || "").trim(),
    latitude: parseFloat(raw["latitude"] || raw["lat"] || "0"),
    longitude: parseFloat(raw["longitude"] || raw["lon"] || raw["lng"] || "0"),
    agroEcologicalZone: (raw["aez"] || raw["agro_ecological_zone"] || raw["zone"] || "").trim(),
    sowingMonths: parseMonthList(raw["sowing_months"] || raw["sowing"] || ""),
    growingMonths: parseMonthList(raw["growing_months"] || raw["growing"] || ""),
    harvestingMonths: parseMonthList(raw["harvesting_months"] || raw["harvesting"] || ""),
  };
}

export async function uploadAndParseFile(formData: FormData) {
  const user = await requireAdmin();
  await connectDB();

  const file = formData.get("file") as File;
  if (!file) return { error: "No file provided" };

  const fileName = file.name;
  const ext = fileName.split(".").pop()?.toLowerCase();
  if (ext !== "xlsx" && ext !== "pdf") {
    return { error: "Only XLSX and PDF files are supported" };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  let parsedRows: ParsedRow[] = [];

  if (ext === "xlsx") {
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rawData = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, { defval: "" });
    parsedRows = rawData.map((row) => normalizeRow(row));
  } else {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pdf = (pdfParse as any).default || pdfParse;
    const pdfData = await pdf(buffer);
    const lines = pdfData.text.split("\n").filter((l) => l.trim());
    // Assume CSV-like lines in PDF: crop,country,state,region,season,lat,lon,aez,sowing,growing,harvesting
    for (const line of lines) {
      const parts = line.split(",").map((s) => s.trim());
      if (parts.length >= 11) {
        parsedRows.push({
          cropName: parts[0],
          country: parts[1],
          state: parts[2],
          region: parts[3],
          season: parts[4],
          latitude: parseFloat(parts[5]),
          longitude: parseFloat(parts[6]),
          agroEcologicalZone: parts[7],
          sowingMonths: parseMonthList(parts[8]),
          growingMonths: parseMonthList(parts[9]),
          harvestingMonths: parseMonthList(parts[10]),
        });
      }
    }
  }

  const flaggedRows: { row: number; reason: string; data: Record<string, unknown> }[] = [];
  const validData: ParsedRow[] = [];

  parsedRows.forEach((row, i) => {
    const validation = validateRow(row, i + 1);
    if (validation.valid) {
      validData.push(row);
    } else {
      flaggedRows.push({ row: i + 1, reason: validation.reason!, data: row as unknown as Record<string, unknown> });
    }
  });

  const upload = await Upload.create({
    fileName,
    fileType: ext as "pdf" | "xlsx",
    status: "validated",
    totalRows: parsedRows.length,
    validRows: validData.length,
    flaggedRows,
    parsedData: validData,
    tenantId: user.tenantId,
    uploadedBy: user.userId,
  });

  return {
    success: true,
    uploadId: upload._id.toString(),
    totalRows: parsedRows.length,
    validRows: validData.length,
    flaggedCount: flaggedRows.length,
  };
}

export async function getUploadPreview(uploadId: string) {
  await requireAdmin();
  await connectDB();

  const upload = await Upload.findById(uploadId).lean();
  if (!upload) return null;
  return JSON.parse(JSON.stringify(upload));
}

export async function getUploads() {
  const user = await requireAdmin();
  await connectDB();

  const uploads = await Upload.find({ tenantId: user.tenantId })
    .sort({ createdAt: -1 })
    .select("-parsedData")
    .lean();

  return JSON.parse(JSON.stringify(uploads));
}

export async function commitUpload(uploadId: string) {
  const user = await requireAdmin();
  await connectDB();

  const upload = await Upload.findById(uploadId);
  if (!upload) return { error: "Upload not found" };
  if (upload.tenantId !== user.tenantId) return { error: "Unauthorized" };
  if (upload.status === "committed") return { error: "Already committed" };

  const rows = upload.parsedData as unknown as ParsedRow[];
  let committed = 0;

  for (const row of rows) {
    // Upsert crop
    const crop = await Crop.findOneAndUpdate(
      { name: row.cropName, tenantId: user.tenantId },
      { name: row.cropName, tenantId: user.tenantId },
      { upsert: true, new: true }
    );

    // Upsert region
    const region = await Region.findOneAndUpdate(
      { country: row.country, state: row.state, region: row.region, tenantId: user.tenantId },
      {
        country: row.country,
        state: row.state,
        region: row.region,
        latitude: row.latitude,
        longitude: row.longitude,
        agroEcologicalZone: row.agroEcologicalZone,
        tenantId: user.tenantId,
      },
      { upsert: true, new: true }
    );

    // Build phases array
    const phases = [];
    for (let m = 1; m <= 12; m++) {
      if (row.sowingMonths.includes(m)) phases.push({ month: m, phase: "sowing" as const });
      else if (row.growingMonths.includes(m)) phases.push({ month: m, phase: "growing" as const });
      else if (row.harvestingMonths.includes(m)) phases.push({ month: m, phase: "harvesting" as const });
      else phases.push({ month: m, phase: "idle" as const });
    }

    await CropCalendar.findOneAndUpdate(
      {
        cropId: crop._id,
        regionId: region._id,
        season: row.season,
        tenantId: user.tenantId,
      },
      {
        cropId: crop._id,
        regionId: region._id,
        cropName: row.cropName,
        country: row.country,
        state: row.state,
        region: row.region,
        season: row.season,
        phases,
        sowingMonths: row.sowingMonths,
        growingMonths: row.growingMonths,
        harvestingMonths: row.harvestingMonths,
        tenantId: user.tenantId,
      },
      { upsert: true, new: true }
    );

    committed++;
  }

  upload.status = "committed";
  upload.committedAt = new Date();
  await upload.save();

  return { success: true, committed };
}
