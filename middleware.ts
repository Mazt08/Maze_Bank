/**
 * Next.js Middleware — route protection & Brute Force Rate Limiting (Blue Team Defend).
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

// RATE LIMIT CONFIGURATION
const MAX_ATTEMPTS = 5;
const COOLDOWN_TIME = 60 * 1000; // 1 minute window in milliseconds

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get("__session")?.value;

  const isProtected = PROTECTED.some((p) => pathname.startsWith(p));
  const isAdmin = pathname.startsWith(ADMIN_PREFIX);
  const isAuthOnly = AUTH_ONLY.some((p) => pathname.startsWith(p));

  // 🛡️ BLUE TEAM DEFENSE: IN-MEMORY COOKIE RATE LIMITER FOR AUTH ROUTES
  if (isAuthOnly && request.method === "POST") {
    const rateCookie = request.cookies.get("__rate_limit")?.value;
    const now = Date.now();

    if (rateCookie) {
      try {
        const { count, expires } = JSON.parse(rateCookie);

        // If the user has exceeded maximum login attempts and cooldown is active
        if (count >= MAX_ATTEMPTS && now < expires) {
          const timeLeft = Math.ceil((expires - now) / 1000);
          return new NextResponse(
            JSON.stringify({
              error: `Too many login attempts. Please try again after ${timeLeft} seconds.`,
            }),
            {
              status: 429,
              headers: { "Content-Type": "application/json" },
            }
          );
        }

        // If cooldown has expired, reset the attempt counter
        if (now > expires) {
          const response = NextResponse.next();
          response.cookies.set("__rate_limit", JSON.stringify({ count: 1, expires: now + COOLDOWN_TIME }), { httpOnly: true });
          return response;
        }

        // Increment the request counter within the active time window
        const response = NextResponse.next();
        response.cookies.set("__rate_limit", JSON.stringify({ count: count + 1, expires }), { httpOnly: true });
        return response;

      } catch (e) {
        // Safe fallback in case of JSON parsing anomalies
      }
    } else {
      // First attempt initialization for tracking request frequency
      const response = NextResponse.next();
      response.cookies.set("__rate_limit", JSON.stringify({ count: 1, expires: now + COOLDOWN_TIME }), { httpOnly: true });
      return response;
    }
  }

  // ── Non-admin protected routes ─────────────────────────────────────────────
  if (isProtected && !sessionCookie) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // ── Admin routes ───────────────────────────────────────────────────────────
  if (isAdmin) {
    if (!sessionCookie) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // ── Already-authenticated users hitting auth routes ────────────────────────
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
