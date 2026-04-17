"use server";

import { revalidatePath } from "next/cache";
import { connectDB } from "@/lib/db";
import { CropCalendar } from "@/models/CropCalendar";
import { Crop } from "@/models/Crop";
import { Region } from "@/models/Region";
import { requireAdmin } from "@/lib/auth";

export interface CropCalendarInput {
  cropName: string;
  country: string;
  state: string;
  region: string;
  season: string;
  sowingMonths: number[];
  growingMonths: number[];
  harvestingMonths: number[];
  durationDays?: number;
  soilType?: string;
  waterRequirement?: "low" | "medium" | "high" | "";
  temperatureRange?: { min?: number; max?: number };
  rainfallRequirement?: string;
  fertilizerRecommendation?: string;
  pests?: string[];
  yieldInfo?: string;
  profitEstimate?: string;
  cropImage?: string;
  description?: string;
}

export interface CropCalendarListItem {
  _id: string;
  cropName: string;
  country: string;
  state: string;
  region: string;
  season: string;
  durationDays?: number;
}

export interface CropCalendarDoc extends CropCalendarInput {
  _id: string;
  phases: { month: number; phase: "sowing" | "growing" | "harvesting" | "idle" }[];
  tenantId: string;
  cropId: string;
  regionId: string;
  createdAt?: string;
  updatedAt?: string;
}

interface ListFilters {
  search?: string;
  country?: string;
  page?: number;
}

interface ListResult {
  items: CropCalendarListItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

const PAGE_SIZE = 25;

function buildPhases(
  sowingMonths: number[],
  growingMonths: number[],
  harvestingMonths: number[]
): { month: number; phase: "sowing" | "growing" | "harvesting" | "idle" }[] {
  const sow = new Set(sowingMonths);
  const grow = new Set(growingMonths);
  const harvest = new Set(harvestingMonths);
  const phases: { month: number; phase: "sowing" | "growing" | "harvesting" | "idle" }[] = [];
  for (let m = 1; m <= 12; m++) {
    if (sow.has(m)) phases.push({ month: m, phase: "sowing" });
    else if (grow.has(m)) phases.push({ month: m, phase: "growing" });
    else if (harvest.has(m)) phases.push({ month: m, phase: "harvesting" });
    else phases.push({ month: m, phase: "idle" });
  }
  return phases;
}

function normalizeWaterRequirement(
  val: unknown
): "low" | "medium" | "high" | undefined {
  if (val === "low" || val === "medium" || val === "high") return val;
  return undefined;
}

function toNumberArray(val: unknown): number[] {
  if (!Array.isArray(val)) return [];
  return val
    .map((v) => Number(v))
    .filter((n) => Number.isFinite(n) && n >= 1 && n <= 12);
}

function coerceNumber(val: unknown): number | undefined {
  if (val === null || val === undefined || val === "") return undefined;
  const n = Number(val);
  return Number.isFinite(n) ? n : undefined;
}

function parseInput(data: FormData | Partial<CropCalendarInput>): CropCalendarInput {
  if (data instanceof FormData) {
    const getAllNums = (key: string): number[] => {
      const vals = data.getAll(key);
      return vals
        .map((v) => Number(v))
        .filter((n) => Number.isFinite(n) && n >= 1 && n <= 12);
    };
    const pestsRaw = (data.get("pests") as string) || "";
    const pests = pestsRaw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    return {
      cropName: ((data.get("cropName") as string) || "").trim(),
      country: ((data.get("country") as string) || "").trim(),
      state: ((data.get("state") as string) || "").trim(),
      region: ((data.get("region") as string) || "").trim(),
      season: ((data.get("season") as string) || "").trim(),
      sowingMonths: getAllNums("sowingMonths"),
      growingMonths: getAllNums("growingMonths"),
      harvestingMonths: getAllNums("harvestingMonths"),
      durationDays: coerceNumber(data.get("durationDays")),
      soilType: ((data.get("soilType") as string) || "").trim() || undefined,
      waterRequirement: normalizeWaterRequirement(data.get("waterRequirement")),
      temperatureRange: {
        min: coerceNumber(data.get("temperatureRangeMin")),
        max: coerceNumber(data.get("temperatureRangeMax")),
      },
      rainfallRequirement: ((data.get("rainfallRequirement") as string) || "").trim() || undefined,
      fertilizerRecommendation:
        ((data.get("fertilizerRecommendation") as string) || "").trim() || undefined,
      pests,
      yieldInfo: ((data.get("yieldInfo") as string) || "").trim() || undefined,
      profitEstimate: ((data.get("profitEstimate") as string) || "").trim() || undefined,
      cropImage: ((data.get("cropImage") as string) || "").trim() || undefined,
      description: ((data.get("description") as string) || "").trim() || undefined,
    };
  }

  return {
    cropName: (data.cropName || "").trim(),
    country: (data.country || "").trim(),
    state: (data.state || "").trim(),
    region: (data.region || "").trim(),
    season: (data.season || "").trim(),
    sowingMonths: toNumberArray(data.sowingMonths),
    growingMonths: toNumberArray(data.growingMonths),
    harvestingMonths: toNumberArray(data.harvestingMonths),
    durationDays: coerceNumber(data.durationDays),
    soilType: data.soilType?.trim() || undefined,
    waterRequirement: normalizeWaterRequirement(data.waterRequirement),
    temperatureRange: {
      min: coerceNumber(data.temperatureRange?.min),
      max: coerceNumber(data.temperatureRange?.max),
    },
    rainfallRequirement: data.rainfallRequirement?.trim() || undefined,
    fertilizerRecommendation: data.fertilizerRecommendation?.trim() || undefined,
    pests: Array.isArray(data.pests)
      ? data.pests.map((p) => String(p).trim()).filter(Boolean)
      : [],
    yieldInfo: data.yieldInfo?.trim() || undefined,
    profitEstimate: data.profitEstimate?.trim() || undefined,
    cropImage: data.cropImage?.trim() || undefined,
    description: data.description?.trim() || undefined,
  };
}

function validate(input: CropCalendarInput): string | null {
  if (!input.cropName) return "Crop name is required";
  if (!input.country) return "Country is required";
  if (!input.state) return "State is required";
  if (!input.region) return "District / region is required";
  if (!input.season) return "Season is required";
  if (
    input.sowingMonths.length === 0 &&
    input.growingMonths.length === 0 &&
    input.harvestingMonths.length === 0
  ) {
    return "At least one phase month (sowing, growing, or harvesting) is required";
  }
  return null;
}

export async function listCropCalendars(
  filters: ListFilters = {}
): Promise<ListResult> {
  const user = await requireAdmin();
  await connectDB();

  const page = Math.max(1, filters.page ?? 1);
  const pageSize = PAGE_SIZE;

  const query: Record<string, unknown> = { tenantId: user.tenantId };
  if (filters.country) query.country = filters.country;
  if (filters.search && filters.search.trim()) {
    const rx = new RegExp(filters.search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    query.$or = [
      { cropName: rx },
      { state: rx },
      { region: rx },
      { season: rx },
    ];
  }

  const [rawItems, total] = await Promise.all([
    CropCalendar.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .select("cropName country state region season durationDays")
      .lean(),
    CropCalendar.countDocuments(query),
  ]);

  const items: CropCalendarListItem[] = JSON.parse(JSON.stringify(rawItems));

  return {
    items,
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function getCropCalendar(id: string): Promise<CropCalendarDoc | null> {
  const user = await requireAdmin();
  await connectDB();

  const doc = await CropCalendar.findOne({ _id: id, tenantId: user.tenantId }).lean();
  if (!doc) return null;
  return JSON.parse(JSON.stringify(doc));
}

async function findOrCreateCrop(cropName: string, tenantId: string) {
  return Crop.findOneAndUpdate(
    { name: cropName, tenantId },
    { name: cropName, tenantId },
    { upsert: true, returnDocument: "after" }
  );
}

async function findOrCreateRegion(
  country: string,
  state: string,
  region: string,
  tenantId: string
) {
  return Region.findOneAndUpdate(
    { country, state, region, tenantId },
    {
      country,
      state,
      region,
      tenantId,
      agroEcologicalZone: "",
      latitude: 20.59,
      longitude: 78.96,
    },
    { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
  );
}

export async function createCropCalendar(
  data: FormData | Partial<CropCalendarInput>
): Promise<{ success?: true; id?: string; error?: string }> {
  const user = await requireAdmin();
  await connectDB();

  const input = parseInput(data);
  const err = validate(input);
  if (err) return { error: err };

  const crop = await findOrCreateCrop(input.cropName, user.tenantId);
  const region = await findOrCreateRegion(
    input.country,
    input.state,
    input.region,
    user.tenantId
  );

  const phases = buildPhases(input.sowingMonths, input.growingMonths, input.harvestingMonths);

  const temperatureRange =
    input.temperatureRange &&
    (input.temperatureRange.min !== undefined || input.temperatureRange.max !== undefined)
      ? input.temperatureRange
      : undefined;

  const created = await CropCalendar.create({
    cropId: crop._id,
    regionId: region._id,
    cropName: input.cropName,
    country: input.country,
    state: input.state,
    region: input.region,
    season: input.season,
    phases,
    sowingMonths: input.sowingMonths,
    growingMonths: input.growingMonths,
    harvestingMonths: input.harvestingMonths,
    durationDays: input.durationDays,
    soilType: input.soilType,
    waterRequirement: input.waterRequirement || undefined,
    temperatureRange,
    rainfallRequirement: input.rainfallRequirement,
    fertilizerRecommendation: input.fertilizerRecommendation,
    pests: input.pests && input.pests.length > 0 ? input.pests : undefined,
    yieldInfo: input.yieldInfo,
    profitEstimate: input.profitEstimate,
    cropImage: input.cropImage,
    description: input.description,
    tenantId: user.tenantId,
  });

  revalidatePath("/admin/crops");
  return { success: true, id: created._id.toString() };
}

export async function updateCropCalendar(
  id: string,
  data: FormData | Partial<CropCalendarInput>
): Promise<{ success?: true; error?: string }> {
  const user = await requireAdmin();
  await connectDB();

  const existing = await CropCalendar.findOne({ _id: id, tenantId: user.tenantId });
  if (!existing) return { error: "Record not found" };

  const input = parseInput(data);
  const err = validate(input);
  if (err) return { error: err };

  const crop = await findOrCreateCrop(input.cropName, user.tenantId);
  const region = await findOrCreateRegion(
    input.country,
    input.state,
    input.region,
    user.tenantId
  );

  const phases = buildPhases(input.sowingMonths, input.growingMonths, input.harvestingMonths);

  const temperatureRange =
    input.temperatureRange &&
    (input.temperatureRange.min !== undefined || input.temperatureRange.max !== undefined)
      ? input.temperatureRange
      : undefined;

  existing.cropId = crop._id;
  existing.regionId = region._id;
  existing.cropName = input.cropName;
  existing.country = input.country;
  existing.state = input.state;
  existing.region = input.region;
  existing.season = input.season;
  existing.phases = phases;
  existing.sowingMonths = input.sowingMonths;
  existing.growingMonths = input.growingMonths;
  existing.harvestingMonths = input.harvestingMonths;
  existing.durationDays = input.durationDays;
  existing.soilType = input.soilType;
  existing.waterRequirement = input.waterRequirement || undefined;
  existing.temperatureRange = temperatureRange;
  existing.rainfallRequirement = input.rainfallRequirement;
  existing.fertilizerRecommendation = input.fertilizerRecommendation;
  existing.pests = input.pests && input.pests.length > 0 ? input.pests : undefined;
  existing.yieldInfo = input.yieldInfo;
  existing.profitEstimate = input.profitEstimate;
  existing.cropImage = input.cropImage;
  existing.description = input.description;

  await existing.save();

  revalidatePath("/admin/crops");
  revalidatePath(`/admin/crops/${id}/edit`);
  return { success: true };
}

export async function deleteCropCalendar(
  id: string
): Promise<{ success?: true; error?: string }> {
  const user = await requireAdmin();
  await connectDB();

  const result = await CropCalendar.deleteOne({ _id: id, tenantId: user.tenantId });
  if (result.deletedCount === 0) return { error: "Record not found" };

  revalidatePath("/admin/crops");
  return { success: true };
}
