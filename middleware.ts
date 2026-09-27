/**
 * Next.js Middleware — route protection + RBAC.
 *
 * Runtime: nodejs (not edge) so we can use the Firebase Admin SDK to
 * cryptographically verify session cookies and read Firestore role data.
 *
 * Strategy (defense-in-depth):
 *  1. All protected routes: check __session cookie exists (fast path).
 *  2. /admin routes: additionally verify the session cookie and confirm
 *     the user's Firestore role === "admin". Any other value → /dashboard.
 *  3. Server components and server actions re-verify independently —
 *     middleware is a first line of defense, not the only one.
 */
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAdminAuth, getAdminDb } from "@/lib/firebase-admin";

const PROTECTED = ["/dashboard", "/transfer", "/transactions", "/analytics", "/profile"];
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

    // Step 2: cryptographically verify the cookie and read role from Firestore
    try {
      const decoded = await getAdminAuth().verifySessionCookie(sessionCookie, true);
      const userSnap = await getAdminDb()
        .collection("users")
        .doc(decoded.uid)
        .get();

      const role = userSnap.exists ? userSnap.data()?.role : undefined;

      if (role !== "admin") {
        // Silent redirect — never expose a 403 that confirms the route exists
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
    } catch {
      // Invalid/expired cookie → send to login
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // ── Already-authed users hitting login/register ────────────────────────────
  if (isAuthOnly && sessionCookie) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
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
