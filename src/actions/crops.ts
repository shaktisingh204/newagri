"use server";

import { connectDB } from "@/lib/db";
import { CropCalendar } from "@/models/CropCalendar";
import { Crop } from "@/models/Crop";
import { Region } from "@/models/Region";
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

export async function getFilterOptions(tenantId?: string) {
  await connectDB();
  const user = await getCurrentUser();
  const tid = tenantId || user?.tenantId || "default";

  const [countries, crops, seasons] = await Promise.all([
    Region.distinct("country", { tenantId: tid }),
    Crop.distinct("name", { tenantId: tid }),
    CropCalendar.distinct("season", { tenantId: tid }),
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
  const user = await getCurrentUser();
  const tid = user?.tenantId || "default";
  const states = await Region.distinct("state", { country, tenantId: tid });
  return states.sort();
}

export async function getRegionsForState(country: string, state: string) {
  await connectDB();
  const user = await getCurrentUser();
  const tid = user?.tenantId || "default";
  const regions = await Region.distinct("region", { country, state, tenantId: tid });
  return regions.sort();
}

export async function searchCropCalendars(filters: CalendarFilters) {
  await connectDB();
  const user = await getCurrentUser();
  const tid = user?.tenantId || "default";

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const query: any = { tenantId: tid };

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
  if (filters.crop) {
    await UsageEvent.create({
      eventType: "crop_search",
      cropName: filters.crop,
      country: filters.country,
      filters: filters as Record<string, string>,
      tenantId: tid,
      userId: user?.userId,
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
  const user = await getCurrentUser();
  const tid = user?.tenantId || "default";
  const regions = await Region.find({ tenantId: tid }).lean();
  return JSON.parse(JSON.stringify(regions));
}

export async function getCropComparisonData(cropNames: string[]) {
  await connectDB();
  const user = await getCurrentUser();
  const tid = user?.tenantId || "default";

  const calendars = await CropCalendar.find({
    cropName: { $in: cropNames },
    tenantId: tid,
  }).lean();

  return JSON.parse(JSON.stringify(calendars));
}
