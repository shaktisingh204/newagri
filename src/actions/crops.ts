"use server";

import { connectDB } from "@/lib/db";
import { CropCalendar } from "@/models/CropCalendar";
import { Region } from "@/models/Region";
import { UsageEvent } from "@/models/UsageEvent";
import { getCurrentUser } from "@/lib/auth";

export interface CalendarFilters {
  country?: string;
  state?: string;
  region?: string;
  district?: string;
  crop?: string;
  season?: string;
  month?: string;
  sort?: string;
  soilType?: string;
  waterRequirement?: string;
}

interface CalendarLike {
  cropName?: string;
  season?: string;
  durationDays?: number;
  harvestingMonths?: number[];
}

function applySort<T extends CalendarLike>(calendars: T[], sort?: string): T[] {
  if (!sort) return calendars;
  const copy = [...calendars];
  switch (sort) {
    case "cropName_asc":
      return copy.sort((a, b) => (a.cropName ?? "").localeCompare(b.cropName ?? ""));
    case "cropName_desc":
      return copy.sort((a, b) => (b.cropName ?? "").localeCompare(a.cropName ?? ""));
    case "duration_asc":
      return copy.sort(
        (a, b) =>
          (a.durationDays ?? Number.POSITIVE_INFINITY) -
          (b.durationDays ?? Number.POSITIVE_INFINITY)
      );
    case "duration_desc":
      return copy.sort(
        (a, b) =>
          (b.durationDays ?? Number.NEGATIVE_INFINITY) -
          (a.durationDays ?? Number.NEGATIVE_INFINITY)
      );
    case "season_asc":
      return copy.sort((a, b) => (a.season ?? "").localeCompare(b.season ?? ""));
    case "harvest_asc":
      return copy.sort((a, b) => {
        const am = a.harvestingMonths && a.harvestingMonths.length > 0
          ? Math.min(...a.harvestingMonths)
          : Number.POSITIVE_INFINITY;
        const bm = b.harvestingMonths && b.harvestingMonths.length > 0
          ? Math.min(...b.harvestingMonths)
          : Number.POSITIVE_INFINITY;
        return am - bm;
      });
    default:
      return copy;
  }
}

export async function getFilterOptions() {
  await connectDB();

  const [countries, crops, seasons, soilTypes, waterRequirements] = await Promise.all([
    CropCalendar.distinct("country"),
    CropCalendar.distinct("cropName"),
    CropCalendar.distinct("season"),
    CropCalendar.distinct("soilType"),
    CropCalendar.distinct("waterRequirement"),
  ]);

  return {
    countries: countries.sort(),
    crops: crops.sort(),
    seasons: seasons.sort(),
    soilTypes: soilTypes.filter(Boolean).sort(),
    waterRequirements: waterRequirements.filter(Boolean).sort(),
    months: [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December",
    ],
  };
}

export async function getStatesForCountry(country: string) {
  await connectDB();
  const states = await CropCalendar.distinct("state", { country });
  return states.sort();
}

export async function getRegionsForState(country: string, state: string) {
  await connectDB();
  const regions = await CropCalendar.distinct("region", { country, state });
  return regions.filter(Boolean).sort();
}

export async function getDistrictsForState(country: string, state: string) {
  await connectDB();
  const districts = await CropCalendar.distinct("region", { country, state });
  return districts.filter(Boolean).sort();
}

export async function searchCropCalendars(filters: CalendarFilters) {
  await connectDB();
  const user = await getCurrentUser();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const query: any = {};

  if (filters.country) query.country = filters.country;
  if (filters.state) query.state = filters.state;
  if (filters.district) query.region = filters.district;
  else if (filters.region) query.region = filters.region;
  if (filters.crop) query.cropName = filters.crop;
  if (filters.season) query.season = filters.season;
  if (filters.soilType) query.soilType = filters.soilType;
  if (filters.waterRequirement) query.waterRequirement = filters.waterRequirement;
  if (filters.month) {
    const monthIndex = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December",
    ].indexOf(filters.month) + 1;
    if (monthIndex > 0) {
      query["phases"] = {
        $elemMatch: {
          month: monthIndex,
          phase: { $ne: "idle" },
        },
      };
    }
  }

  const calendars = await CropCalendar.find(query).lean();

  const sorted = applySort(calendars as unknown as CalendarLike[], filters.sort);

  // Track usage
  if (user && filters.crop) {
    await UsageEvent.create({
      eventType: "crop_search",
      cropName: filters.crop,
      country: filters.country,
      filters: filters as Record<string, string>,
      tenantId: user.tenantId,
      userId: user.userId,
    });
  }

  return JSON.parse(JSON.stringify(sorted));
}

export async function getBestCropsForCurrentMonth(filters: {
  country?: string;
  state?: string;
  district?: string;
}): Promise<Array<{ cropName: string; season: string; reason: string }>> {
  await connectDB();

  const currentMonth = new Date().getMonth() + 1;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const query: any = {
    phases: {
      $elemMatch: { month: currentMonth, phase: { $ne: "idle" } },
    },
  };
  if (filters.country) query.country = filters.country;
  if (filters.state) query.state = filters.state;
  if (filters.district) query.region = filters.district;

  const calendars = await CropCalendar.find(query)
    .select("cropName season phases")
    .lean();

  const phaseRank: Record<string, number> = {
    sowing: 0,
    harvesting: 1,
    growing: 2,
    idle: 3,
  };
  const phaseReason: Record<string, string> = {
    sowing: "Best time to sow",
    harvesting: "Ready for harvest",
    growing: "Actively growing",
  };

  interface Ranked {
    cropName: string;
    season: string;
    phase: string;
    rank: number;
  }

  const ranked: Ranked[] = [];
  for (const cal of calendars as Array<{
    cropName?: string;
    season?: string;
    phases?: Array<{ month: number; phase: string }>;
  }>) {
    const entry = cal.phases?.find((p) => p.month === currentMonth && p.phase !== "idle");
    if (!entry || !cal.cropName) continue;
    ranked.push({
      cropName: cal.cropName,
      season: cal.season ?? "",
      phase: entry.phase,
      rank: phaseRank[entry.phase] ?? 99,
    });
  }

  ranked.sort((a, b) => a.rank - b.rank || a.cropName.localeCompare(b.cropName));

  const seen = new Set<string>();
  const result: Array<{ cropName: string; season: string; reason: string }> = [];
  for (const r of ranked) {
    if (seen.has(r.cropName)) continue;
    seen.add(r.cropName);
    result.push({
      cropName: r.cropName,
      season: r.season,
      reason: phaseReason[r.phase] ?? "In season",
    });
    if (result.length >= 5) break;
  }

  return result;
}

export async function getCropCalendarById(id: string) {
  await connectDB();
  const calendar = await CropCalendar.findById(id).lean();
  return calendar ? JSON.parse(JSON.stringify(calendar)) : null;
}

export async function getRegionsWithCoordinates() {
  await connectDB();

  const regions = await Region.find({}, {
    country: 1,
    state: 1,
    region: 1,
    latitude: 1,
    longitude: 1,
    agroEcologicalZone: 1,
  }).lean();

  return JSON.parse(JSON.stringify(regions));
}

export async function getInSeasonCrops(month: number) {
  await connectDB();

  const calendars = await CropCalendar.find({
    phases: { $elemMatch: { month, phase: { $ne: "idle" } } },
  }).lean();

  return JSON.parse(
    JSON.stringify(
      calendars.map((cal) => {
        const phase = cal.phases.find((p: { month: number; phase: string }) => p.month === month);
        return {
          _id: cal._id,
          cropName: cal.cropName,
          country: cal.country,
          state: cal.state,
          season: cal.season,
          currentPhase: phase?.phase || "idle",
        };
      })
    )
  );
}

export async function searchCropsAutocomplete(query: string) {
  await connectDB();

  if (!query || query.length < 2) return [];

  const calendars = await CropCalendar.find({
    cropName: { $regex: query, $options: "i" },
  })
    .select("cropName country state season _id")
    .limit(10)
    .lean();

  return JSON.parse(JSON.stringify(calendars));
}

export async function getCropComparisonData(cropNames: string[]) {
  await connectDB();

  const calendars = await CropCalendar.find({
    cropName: { $in: cropNames },
  }).lean();

  return JSON.parse(JSON.stringify(calendars));
}
