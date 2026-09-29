/**
 * Next.js Middleware — route protection.
 *
 * Strategy (defense-in-depth):
 *  1. All protected routes: check __session cookie exists (fast path).
 *  2. Server components and server actions re-verify independently —
 *     middleware is a first line of defense, not the only one.
 */
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PROTECTED = [
  "/dashboard",
  "/transfer",
  "/transactions",
  "/analytics",
  "/profile",
];
const ADMIN_PREFIX = "/admin";
const AUTH_ONLY = ["/login", "/register"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get("__session")?.value;

  const isProtected = PROTECTED.some((p) => pathname.startsWith(p));
  const isAdmin = pathname.startsWith(ADMIN_PREFIX);
  const isAuthOnly = AUTH_ONLY.some((p) => pathname.startsWith(p));

  // ── Non-admin protected routes ─────────────────────────────────────────────
  if (isProtected && !sessionCookie) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // ── Admin routes ───────────────────────────────────────────────────────────
  if (isAdmin) {
    // Step 1: must have a session cookie at all
    if (!sessionCookie) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Admin authentication and role checks run in app/admin/page.tsx, where
    // the Node.js-only Firebase Admin SDK is available.
  }

  // ── Already-authed users hitting login/register ────────────────────────────
  if (isAuthOnly && sessionCookie) {
    return NextResponse.redirect(new URL("/dashboard", request.url));a
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/transfer/:path*",
    "/transactions/:path*",
    "/analytics/:path*",
    "/profile/:path*",
    "/admin/:path*",
    "/login",
    "/register",
  ],
};


