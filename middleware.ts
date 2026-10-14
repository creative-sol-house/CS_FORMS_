import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 🔒 Block anyone trying the obvious /admin path
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    return new NextResponse("Not Found", { status: 404 });
  }

  // 🔒 Block common variants people guess
  const blocked = [
    "/dashboard",
    "/administrator",
    "/wp-admin",
    "/login",
    "/signin",
  ];
  if (blocked.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    return new NextResponse("Not Found", { status: 404 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/admin",
    "/dashboard/:path*",
    "/administrator/:path*",
    "/wp-admin/:path*",
    "/login",
    "/signin",
  ],
};