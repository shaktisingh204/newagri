"use server";

import { connectDB } from "@/lib/db";
import { CropCalendar } from "@/models/CropCalendar";
import { requireAuth } from "@/lib/auth";

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export async function exportCropsCSV(filters: {
  country?: string;
  state?: string;
  crop?: string;
  season?: string;
}) {
  await connectDB();
  await requireAuth();

  const query: Record<string, unknown> = {};
  if (filters.country) query.country = filters.country;
  if (filters.state) query.state = filters.state;
  if (filters.crop) query.cropName = filters.crop;
  if (filters.season) query.season = filters.season;

  const calendars = await CropCalendar.find(query).lean();

  const headers = ["Crop Name", "Country", "State", "Region", "Season", "Sowing Months", "Growing Months", "Harvesting Months"];

  const rows = calendars.map((cal) => {
    const sowing = cal.sowingMonths.map((m: number) => MONTH_NAMES[m - 1]).join("; ");
    const growing = cal.growingMonths.map((m: number) => MONTH_NAMES[m - 1]).join("; ");
    const harvesting = cal.harvestingMonths.map((m: number) => MONTH_NAMES[m - 1]).join("; ");

    return [
      cal.cropName,
      cal.country,
      cal.state,
      cal.region || "",
      cal.season,
      sowing,
      growing,
      harvesting,
    ]
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(",");
  });

  return [headers.join(","), ...rows].join("\n");
}
