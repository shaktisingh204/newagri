"use server";

import { connectDB } from "@/lib/db";
import { UsageEvent } from "@/models/UsageEvent";
import { CropCalendar } from "@/models/CropCalendar";
import { getCurrentUser } from "@/lib/auth";

export async function getPopularCrops() {
  await connectDB();

  const result = await UsageEvent.aggregate([
    { $match: { eventType: "crop_search", cropName: { $exists: true, $ne: null } } },
    { $group: { _id: "$cropName", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 15 },
    { $project: { name: "$_id", count: 1, _id: 0 } },
  ]);

  return result;
}

export async function getDashboardStats() {
  await connectDB();

  const [totalCalendars, totalCrops, totalCountries, totalSearches] = await Promise.all([
    CropCalendar.countDocuments(),
    CropCalendar.distinct("cropName").then((r) => r.length),
    CropCalendar.distinct("country").then((r) => r.length),
    UsageEvent.countDocuments({ eventType: "crop_search" }),
  ]);

  return { totalCalendars, totalCrops, totalCountries, totalSearches };
}

export async function getCropsByCountry() {
  await connectDB();

  const result = await CropCalendar.aggregate([
    { $group: { _id: "$country", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $project: { name: "$_id", count: 1, _id: 0 } },
  ]);

  return result;
}

export async function getRecentActivity() {
  await connectDB();
  const user = await getCurrentUser();
  if (!user) return [];

  const events = await UsageEvent.find({
    userId: user.userId,
    eventType: "crop_search",
    cropName: { $exists: true, $ne: null },
  })
    .sort({ createdAt: -1 })
    .limit(8)
    .lean();

  return JSON.parse(JSON.stringify(events));
}

export async function getCropPhaseDistribution() {
  await connectDB();

  const currentMonth = new Date().getMonth() + 1;

  const result = await CropCalendar.aggregate([
    { $unwind: "$phases" },
    { $match: { "phases.month": currentMonth, "phases.phase": { $ne: "idle" } } },
    { $group: { _id: "$phases.phase", count: { $sum: 1 } } },
    { $project: { name: "$_id", count: 1, _id: 0 } },
  ]);

  return result;
}

export async function getSeasonalDistribution() {
  await connectDB();

  const result = await CropCalendar.aggregate([
    { $group: { _id: "$season", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $project: { name: "$_id", count: 1, _id: 0 } },
  ]);

  return result;
}
