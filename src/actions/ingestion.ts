"use server";

import { connectDB } from "@/lib/db";
import { Upload } from "@/models/Upload";
import { Crop } from "@/models/Crop";
import { Region } from "@/models/Region";
import { CropCalendar } from "@/models/CropCalendar";
import { requireAdmin } from "@/lib/auth";
import * as XLSX from "xlsx";

interface ParsedRow {
  cropName: string;
  country: string;
  state: string;
  district: string;
  season: string;
  sowingMonths: number[];
  growingMonths: number[];
  harvestingMonths: number[];
  durationDays?: number;
  soilType?: string;
  waterRequirement?: "low" | "medium" | "high";
  temperatureRange?: { min?: number; max?: number };
  rainfallRequirement?: string;
  fertilizerRecommendation?: string;
  pests?: string[];
  yieldInfo?: string;
  profitEstimate?: string;
  cropImage?: string;
  description?: string;
}

// Normalize a column name: lowercase, strip spaces/underscores/dashes
function normalizeKey(key: string): string {
  return key.toLowerCase().replace(/[\s_\-]+/g, "");
}

// Look up a value from `raw` by trying each candidate column name,
// matching case-insensitively and ignoring spaces/underscores/dashes.
function getCell(raw: Record<string, string>, candidates: string[]): string {
  const normalizedCandidates = candidates.map(normalizeKey);
  for (const key of Object.keys(raw)) {
    if (normalizedCandidates.includes(normalizeKey(key))) {
      const val = raw[key];
      if (val === undefined || val === null) continue;
      const str = String(val).trim();
      if (str !== "") return str;
    }
  }
  return "";
}

function parseOptionalNumber(val: string): number | undefined {
  if (!val) return undefined;
  const n = Number(val);
  return Number.isFinite(n) ? n : undefined;
}

function parseWaterRequirement(val: string): "low" | "medium" | "high" | undefined {
  if (!val) return undefined;
  const v = val.toLowerCase().trim();
  if (v === "low" || v === "medium" || v === "high") return v;
  return undefined;
}

function parsePestsList(val: string): string[] | undefined {
  if (!val) return undefined;
  const list = val
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  return list.length > 0 ? list : undefined;
}

// ── Month parsing from text like "15th June - 15th Aug" ──

const MONTH_MAP: Record<string, number> = {
  jan: 1, january: 1, feb: 2, february: 2, mar: 3, march: 3, apr: 4, april: 4,
  may: 5, jun: 6, june: 6, jul: 7, july: 7, aug: 8, august: 8,
  sep: 9, sept: 9, september: 9, oct: 10, october: 10, nov: 11, november: 11,
  dec: 12, december: 12,
};

function extractMonthsFromText(text: string): number[] {
  if (!text || text.includes("From") && text.includes("To")) return [];
  const cleaned = text.toLowerCase().replace(/\./g, "").replace(/\n/g, " ");
  const found: number[] = [];
  for (const [name, num] of Object.entries(MONTH_MAP)) {
    if (cleaned.includes(name) && !found.includes(num)) {
      found.push(num);
    }
  }
  return found.sort((a, b) => a - b);
}

function expandMonthRange(fromMonths: number[], toMonths: number[]): number[] {
  if (fromMonths.length === 0 && toMonths.length === 0) return [];
  const start = fromMonths.length > 0 ? Math.min(...fromMonths) : Math.min(...toMonths);
  const end = toMonths.length > 0 ? Math.max(...toMonths) : Math.max(...fromMonths);
  const months: number[] = [];
  if (start <= end) {
    for (let m = start; m <= end; m++) months.push(m);
  } else {
    for (let m = start; m <= 12; m++) months.push(m);
    for (let m = 1; m <= end; m++) months.push(m);
  }
  return months;
}

function parsePeriodText(periodText: string): number[] {
  if (!periodText || (periodText.includes("From") && periodText.includes("To"))) return [];
  const parts = periodText.split(/\s*[-–—]\s*|\s+to\s+/i);
  if (parts.length >= 2) {
    const fromMonths = extractMonthsFromText(parts[0]);
    const toMonths = extractMonthsFromText(parts[parts.length - 1]);
    return expandMonthRange(fromMonths, toMonths);
  }
  return extractMonthsFromText(periodText);
}

function parseMonthList(val: string): number[] {
  if (!val) return [];
  return val
    .split(",")
    .map((s) => parseInt(s.trim(), 10))
    .filter((n) => !isNaN(n) && n >= 1 && n <= 12);
}

function normalizeSeason(raw: string): string {
  const s = raw.trim().replace(/[:\n]/g, " ").replace(/\s+/g, " ").trim();
  const lower = s.toLowerCase();
  if (lower.includes("kharif")) return "Kharif";
  if (lower.includes("rabi") && lower.includes("boro")) return "Rabi (Boro)";
  if (lower.includes("rabi") && lower.includes("lotni")) return "Rabi (Lotni)";
  if (lower.includes("rabi")) return "Rabi";
  if (lower.includes("summer") || lower.includes("zaid")) return "Summer";
  if (lower.includes("autumn")) return "Autumn";
  if (lower.includes("spring")) return "Spring";
  return s || "Kharif";
}

// ── Validation ──

function validateRow(row: ParsedRow, index: number): { valid: boolean; reason?: string } {
  if (!row.cropName) return { valid: false, reason: `Row ${index}: Missing crop name` };
  if (!row.country) return { valid: false, reason: `Row ${index}: Missing country` };
  if (!row.state) return { valid: false, reason: `Row ${index}: Missing state` };
  if (!row.season) return { valid: false, reason: `Row ${index}: Missing season` };
  if (row.sowingMonths.length === 0 && row.growingMonths.length === 0 && row.harvestingMonths.length === 0)
    return { valid: false, reason: `Row ${index}: No phase months specified` };
  return { valid: true };
}

// ── Normalization — handles both your XLSX columns and generic column names ──

function normalizeState(raw: string): string {
  const map: Record<string, string> = {
    "HP": "Himachal Pradesh",
    "UP": "Uttar Pradesh",
    "Rajashthan": "Rajasthan",
    "Orissa": "Odisha",
  };
  return map[raw] || raw;
}

function normalizeRow(raw: Record<string, string>): ParsedRow {
  const cropName = (raw["Crop"] || raw["crop"] || raw["crop_name"] || raw["cropName"] || "").trim();
  const country = (raw["Country"] || raw["country"] || "India").trim();
  const stateRaw = (raw["State"] || raw["state"] || raw["province"] || "").trim();
  const state = normalizeState(stateRaw);
  const district = (raw["Name of the district (All districts)"] || raw["District"] || raw["district"] || "").trim();
  const seasonRaw = (raw["Season"] || raw["season"] || "").trim();

  // Your XLSX uses "Sowing Period" and "Harvesting period" with text dates
  const sowingPeriod = raw["Sowing Period"] || raw["sowing_period"] || "";
  const harvestingPeriod = raw["Harvesting period"] || raw["harvesting_period"] || "";

  let sowingMonths: number[];
  let harvestingMonths: number[];

  if (sowingPeriod) {
    // Text-based period like "15th June - 15th Aug"
    sowingMonths = parsePeriodText(String(sowingPeriod));
  } else {
    // Fallback: comma-separated month numbers
    sowingMonths = parseMonthList(raw["sowing_months"] || raw["sowing"] || "");
  }

  if (harvestingPeriod) {
    harvestingMonths = parsePeriodText(String(harvestingPeriod));
  } else {
    harvestingMonths = parseMonthList(raw["harvesting_months"] || raw["harvesting"] || "");
  }

  // Compute growing months between sowing and harvesting
  const growingMonths: number[] = [];
  if (sowingMonths.length > 0 && harvestingMonths.length > 0) {
    const sowEnd = Math.max(...sowingMonths);
    const harvestStart = Math.min(...harvestingMonths);
    const sowSet = new Set(sowingMonths);
    const harvestSet = new Set(harvestingMonths);
    if (sowEnd < harvestStart) {
      for (let m = sowEnd + 1; m < harvestStart; m++) {
        if (!sowSet.has(m) && !harvestSet.has(m)) growingMonths.push(m);
      }
    } else if (sowEnd > harvestStart) {
      for (let m = sowEnd + 1; m <= 12; m++) {
        if (!sowSet.has(m) && !harvestSet.has(m)) growingMonths.push(m);
      }
      for (let m = 1; m < harvestStart; m++) {
        if (!sowSet.has(m) && !harvestSet.has(m)) growingMonths.push(m);
      }
    }
  }

  // Optional enrichment columns — case/space/underscore-insensitive
  const durationDays = parseOptionalNumber(getCell(raw, ["Duration Days"]));
  const soilType = getCell(raw, ["Soil Type"]) || undefined;
  const waterRequirement = parseWaterRequirement(getCell(raw, ["Water Requirement"]));
  const tempMin = parseOptionalNumber(getCell(raw, ["Temperature Min"]));
  const tempMax = parseOptionalNumber(getCell(raw, ["Temperature Max"]));
  const temperatureRange =
    tempMin !== undefined || tempMax !== undefined
      ? { ...(tempMin !== undefined ? { min: tempMin } : {}), ...(tempMax !== undefined ? { max: tempMax } : {}) }
      : undefined;
  const rainfallRequirement = getCell(raw, ["Rainfall"]) || undefined;
  const fertilizerRecommendation = getCell(raw, ["Fertilizer"]) || undefined;
  const pests = parsePestsList(getCell(raw, ["Pests"]));
  const yieldInfo = getCell(raw, ["Yield"]) || undefined;
  const profitEstimate = getCell(raw, ["Profit"]) || undefined;
  const cropImage = getCell(raw, ["Image"]) || undefined;
  const description = getCell(raw, ["Description"]) || undefined;

  return {
    cropName,
    country,
    state,
    district,
    season: normalizeSeason(seasonRaw),
    sowingMonths,
    growingMonths,
    harvestingMonths,
    ...(durationDays !== undefined ? { durationDays } : {}),
    ...(soilType ? { soilType } : {}),
    ...(waterRequirement ? { waterRequirement } : {}),
    ...(temperatureRange ? { temperatureRange } : {}),
    ...(rainfallRequirement ? { rainfallRequirement } : {}),
    ...(fertilizerRecommendation ? { fertilizerRecommendation } : {}),
    ...(pests ? { pests } : {}),
    ...(yieldInfo ? { yieldInfo } : {}),
    ...(profitEstimate ? { profitEstimate } : {}),
    ...(cropImage ? { cropImage } : {}),
    ...(description ? { description } : {}),
  };
}

export async function uploadAndParseFile(formData: FormData) {
  try {
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
    const parsedRows: ParsedRow[] = [];

    if (ext === "xlsx") {
      const workbook = XLSX.read(buffer, { type: "buffer" });
      for (const sheetName of workbook.SheetNames) {
        const sheet = workbook.Sheets[sheetName];
        const rawData = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, { defval: "" });
        for (const row of rawData) {
          const slNo = row["Sl. No."];
          if (slNo === "" || slNo === "Sl. No." || isNaN(Number(slNo))) continue;
          const crop = (row["Crop"] || row["crop"] || "").trim();
          if (crop.endsWith(":") || (crop === crop.toUpperCase() && crop.length > 3)) continue;

          parsedRows.push(normalizeRow(row));
        }
      }
    } else {
      const { PDFParse } = await import("pdf-parse");
      const parser = new PDFParse({ data: new Uint8Array(buffer) });
      const pdfData = await parser.getText();
      await parser.destroy();
      const lines: string[] = pdfData.text.split("\n").filter((l: string) => l.trim());
      for (const line of lines) {
        const parts = line.split(",").map((s: string) => s.trim());
        if (parts.length >= 7) {
          parsedRows.push({
            cropName: parts[0],
            country: parts[1],
            state: parts[2],
            district: parts.length >= 8 ? parts[3] : "",
            season: parts.length >= 8 ? parts[4] : parts[3],
            sowingMonths: parseMonthList(parts.length >= 8 ? parts[5] : parts[4]),
            growingMonths: parseMonthList(parts.length >= 8 ? parts[6] : parts[5]),
            harvestingMonths: parseMonthList(parts.length >= 8 ? parts[7] : parts[6]),
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
  } catch (err) {
    console.error("uploadAndParseFile failed:", err);
    const message = err instanceof Error ? err.message : "Upload failed";
    return { error: message };
  }
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
    const crop = await Crop.findOneAndUpdate(
      { name: row.cropName, tenantId: user.tenantId },
      { name: row.cropName, tenantId: user.tenantId },
      { upsert: true, returnDocument: "after" }
    );

    // Create or find region record for the district
    const region = await Region.findOneAndUpdate(
      { country: row.country, state: row.state, region: row.district, tenantId: user.tenantId },
      { country: row.country, state: row.state, region: row.district, agroEcologicalZone: "", latitude: 20.59, longitude: 78.96, tenantId: user.tenantId },
      { upsert: true, returnDocument: "after" }
    );

    const phases = [];
    for (let m = 1; m <= 12; m++) {
      if (row.sowingMonths.includes(m)) phases.push({ month: m, phase: "sowing" as const });
      else if (row.growingMonths.includes(m)) phases.push({ month: m, phase: "growing" as const });
      else if (row.harvestingMonths.includes(m)) phases.push({ month: m, phase: "harvesting" as const });
      else phases.push({ month: m, phase: "idle" as const });
    }

    const calendarUpdate: Partial<Omit<ParsedRow, "cropName" | "country" | "state" | "district" | "season" | "sowingMonths" | "growingMonths" | "harvestingMonths">> & Record<string, unknown> = {
      cropId: crop._id,
      regionId: region._id,
      cropName: row.cropName,
      country: row.country,
      state: row.state,
      region: row.district,
      season: row.season,
      phases,
      sowingMonths: row.sowingMonths,
      growingMonths: row.growingMonths,
      harvestingMonths: row.harvestingMonths,
      tenantId: user.tenantId,
    };

    if (row.durationDays !== undefined) calendarUpdate.durationDays = row.durationDays;
    if (row.soilType) calendarUpdate.soilType = row.soilType;
    if (row.waterRequirement) calendarUpdate.waterRequirement = row.waterRequirement;
    if (row.temperatureRange) calendarUpdate.temperatureRange = row.temperatureRange;
    if (row.rainfallRequirement) calendarUpdate.rainfallRequirement = row.rainfallRequirement;
    if (row.fertilizerRecommendation) calendarUpdate.fertilizerRecommendation = row.fertilizerRecommendation;
    if (row.pests && row.pests.length > 0) calendarUpdate.pests = row.pests;
    if (row.yieldInfo) calendarUpdate.yieldInfo = row.yieldInfo;
    if (row.profitEstimate) calendarUpdate.profitEstimate = row.profitEstimate;
    if (row.cropImage) calendarUpdate.cropImage = row.cropImage;
    if (row.description) calendarUpdate.description = row.description;

    await CropCalendar.findOneAndUpdate(
      {
        cropId: crop._id,
        country: row.country,
        state: row.state,
        region: row.district,
        season: row.season,
        tenantId: user.tenantId,
      },
      calendarUpdate,
      { upsert: true, returnDocument: "after" }
    );

    committed++;
  }

  upload.status = "committed";
  upload.committedAt = new Date();
  await upload.save();

  return { success: true, committed };
}

export async function clearAllData() {
  const user = await requireAdmin();
  await connectDB();

  await Promise.all([
    Crop.deleteMany({ tenantId: user.tenantId }),
    Region.deleteMany({ tenantId: user.tenantId }),
    CropCalendar.deleteMany({ tenantId: user.tenantId }),
    Upload.deleteMany({ tenantId: user.tenantId }),
  ]);

  return { success: true };
}

export async function deleteUpload(uploadId: string) {
  const user = await requireAdmin();
  await connectDB();

  const upload = await Upload.findById(uploadId);
  if (!upload) return { error: "Upload not found" };
  if (upload.tenantId !== user.tenantId) return { error: "Unauthorized" };
  if (upload.status === "committed") return { error: "Cannot delete a committed upload" };

  await Upload.deleteOne({ _id: uploadId });
  return { success: true };
}
