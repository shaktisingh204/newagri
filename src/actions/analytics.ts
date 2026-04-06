"use server";

import { connectDB } from "@/lib/db";
import { UsageEvent } from "@/models/UsageEvent";
import { CropCalendar } from "@/models/CropCalendar";
import { getCurrentUser } from "@/lib/auth";

export async function getPopularCrops() {
  await connectDB();
  const user = await getCurrentUser();
  const tid = user?.tenantId || "default";

  const result = await UsageEvent.aggregate([
    { $match: { tenantId: tid, eventType: "crop_search", cropName: { $exists: true, $ne: null } } },
    { $group: { _id: "$cropName", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 15 },
    { $project: { name: "$_id", count: 1, _id: 0 } },
  ]);

  return result;
}

export async function getDashboardStats() {
  await connectDB();
  const user = await getCurrentUser();
  const tid = user?.tenantId || "default";

  const [totalCalendars, totalCrops, totalCountries, totalSearches] = await Promise.all([
    CropCalendar.countDocuments({ tenantId: tid }),
    CropCalendar.distinct("cropName", { tenantId: tid }).then((r) => r.length),
    CropCalendar.distinct("country", { tenantId: tid }).then((r) => r.length),
    UsageEvent.countDocuments({ tenantId: tid, eventType: "crop_search" }),
  ]);

  return { totalCalendars, totalCrops, totalCountries, totalSearches };
}

export async function getCropsByCountry() {
  await connectDB();
  const user = await getCurrentUser();
  const tid = user?.tenantId || "default";

  const result = await CropCalendar.aggregate([
    { $match: { tenantId: tid } },
    { $group: { _id: "$country", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $project: { name: "$_id", count: 1, _id: 0 } },
  ]);

  return result;
}

export async function getSeasonalDistribution() {
  await connectDB();
  const user = await getCurrentUser();
  const tid = user?.tenantId || "default";

  const result = await CropCalendar.aggregate([
    { $match: { tenantId: tid } },
    { $group: { _id: "$season", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $project: { name: "$_id", count: 1, _id: 0 } },
  ]);

  return result;
}
