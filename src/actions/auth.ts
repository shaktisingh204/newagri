"use server";

import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { signToken } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { v4 as uuidv4 } from "uuid";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function registerAction(previousState: { error: string } | null, formData: FormData) {
  try {
    await connectDB();

    const name = (formData.get("name") as string)?.trim();
    const email = (formData.get("email") as string)?.trim().toLowerCase();
    const password = formData.get("password") as string;
    const role = (formData.get("role") as string) || "user";

    if (!name || !email || !password) {
      return { error: "All fields are required" };
    }

    if (name.length < 2) {
      return { error: "Name must be at least 2 characters" };
    }

    if (!EMAIL_REGEX.test(email)) {
      return { error: "Please enter a valid email address" };
    }

    if (password.length < 6) {
      return { error: "Password must be at least 6 characters" };
    }

    if (!["user", "admin"].includes(role)) {
      return { error: "Invalid role selected" };
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return { error: "Email already registered" };
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const tenantId = uuidv4();

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
      tenantId,
    });

    const token = await signToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
    });

    const cookieStore = await cookies();
    cookieStore.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });
  } catch {
    return { error: "Something went wrong. Please try again." };
  }

  redirect("/dashboard");
}

export async function loginAction(previousState: { error: string } | null, formData: FormData) {
  try {
    await connectDB();

    const email = (formData.get("email") as string)?.trim().toLowerCase();
    const password = formData.get("password") as string;

    if (!email || !password) {
      return { error: "Email and password are required" };
    }

    if (!EMAIL_REGEX.test(email)) {
      return { error: "Please enter a valid email address" };
    }

    const user = await User.findOne({ email });
    if (!user) {
      return { error: "Invalid email or password" };
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return { error: "Invalid email or password" };
    }

    const token = await signToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
    });

    const cookieStore = await cookies();
    cookieStore.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });
  } catch {
    return { error: "Something went wrong. Please try again." };
  }

  redirect("/dashboard");
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete("token");
  redirect("/auth/login");
}
