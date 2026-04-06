"use server";

import { connectDB } from "@/lib/db";
import { Favorite } from "@/models/Favorite";
import { CropCalendar } from "@/models/CropCalendar";
import { requireAuth } from "@/lib/auth";

export async function toggleFavorite(cropCalendarId: string) {
  await connectDB();
  const user = await requireAuth();

  const existing = await Favorite.findOne({
    userId: user.userId,
    cropCalendarId,
  });

  if (existing) {
    await Favorite.deleteOne({ _id: existing._id });
    return { favorited: false };
  }

  await Favorite.create({
    userId: user.userId,
    cropCalendarId,
    tenantId: user.tenantId,
  });

  return { favorited: true };
}

export async function getFavorites() {
  await connectDB();
  const user = await requireAuth();

  const favorites = await Favorite.find({ userId: user.userId })
    .sort({ createdAt: -1 })
    .lean();

  const calendarIds = favorites.map((f) => f.cropCalendarId);
  const calendars = await CropCalendar.find({ _id: { $in: calendarIds } }).lean();

  return JSON.parse(JSON.stringify(calendars));
}

export async function isFavorited(cropCalendarId: string) {
  await connectDB();
  const user = await requireAuth();

  const existing = await Favorite.findOne({
    userId: user.userId,
    cropCalendarId,
  });

  return !!existing;
}

export async function getFavoriteIds() {
  await connectDB();
  const user = await requireAuth();

  const favorites = await Favorite.find({ userId: user.userId })
    .select("cropCalendarId")
    .lean();

  return favorites.map((f) => f.cropCalendarId.toString());
}
