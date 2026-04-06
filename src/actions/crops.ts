"use server";

import { connectDB } from "@/lib/db";
import { CropCalendar } from "@/models/CropCalendar";
import { UsageEvent } from "@/models/UsageEvent";
import { getCurrentUser } from "@/lib/auth";

export interface CalendarFilters {
  country?: string;
  state?: string;
  region?: string;
  crop?: string;
  season?: string;
  month?: string;
}

export async function getFilterOptions() {
  await connectDB();

  const [countries, crops, seasons] = await Promise.all([
    CropCalendar.distinct("country"),
    CropCalendar.distinct("cropName"),
    CropCalendar.distinct("season"),
  ]);

  return {
    countries: countries.sort(),
    crops: crops.sort(),
    seasons: seasons.sort(),
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

export async function searchCropCalendars(filters: CalendarFilters) {
  await connectDB();
  const user = await getCurrentUser();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const query: any = {};

  if (filters.country) query.country = filters.country;
  if (filters.state) query.state = filters.state;
  if (filters.region) query.region = filters.region;
  if (filters.crop) query.cropName = filters.crop;
  if (filters.season) query.season = filters.season;
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

  return JSON.parse(JSON.stringify(calendars));
}

export async function getCropCalendarById(id: string) {
  await connectDB();
  const calendar = await CropCalendar.findById(id).lean();
  return calendar ? JSON.parse(JSON.stringify(calendar)) : null;
}

export async function getRegionsWithCoordinates() {
  await connectDB();

  // Get unique country/state combinations from CropCalendar for map display
  const regions = await CropCalendar.aggregate([
    { $group: { _id: { country: "$country", state: "$state" }, count: { $sum: 1 } } },
    { $project: { country: "$_id.country", state: "$_id.state", count: 1, _id: 0 } },
  ]);

  return regions;
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
