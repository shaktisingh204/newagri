"use server";

import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { requireAuth } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function getProfile() {
  await connectDB();
  const token = await requireAuth();

  const user = await User.findById(token.userId).select("-password").lean();
  if (!user) return null;

  return JSON.parse(JSON.stringify(user));
}

export async function updatePassword(
  previousState: { error?: string; success?: string } | null,
  formData: FormData
) {
  try {
    await connectDB();
    const token = await requireAuth();

    const currentPassword = formData.get("currentPassword") as string;
    const newPassword = formData.get("newPassword") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return { error: "All fields are required" };
    }

    if (newPassword.length < 6) {
      return { error: "New password must be at least 6 characters" };
    }

    if (newPassword !== confirmPassword) {
      return { error: "New passwords do not match" };
    }

    const user = await User.findById(token.userId);
    if (!user) {
      return { error: "User not found" };
    }

    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      return { error: "Current password is incorrect" };
    }

    user.password = await bcrypt.hash(newPassword, 12);
    await user.save();

    return { success: "Password updated successfully" };
  } catch {
    return { error: "Something went wrong. Please try again." };
  }
}
