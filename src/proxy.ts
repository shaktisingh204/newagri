import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const secret = new TextEncoder().encode(process.env.JWT_SECRET || "fallback-secret");

const protectedPaths = ["/dashboard", "/compare", "/analytics", "/profile", "/seasonal", "/favorites", "/crops"];
const adminPaths = ["/admin"];

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = protectedPaths.some((p) => pathname.startsWith(p));
  const isAdmin = adminPaths.some((p) => pathname.startsWith(p));

  if (!isProtected && !isAdmin) return NextResponse.next();

  const token = request.cookies.get("token")?.value;

  if (!token) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  try {
    const { payload } = await jwtVerify(token, secret);

    if (isAdmin && payload.role !== "admin") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }
}

export const config = {
  matcher: ["/dashboard/:path*", "/compare/:path*", "/analytics/:path*", "/admin/:path*", "/profile/:path*", "/seasonal/:path*", "/favorites/:path*", "/crops/:path*"],
};
