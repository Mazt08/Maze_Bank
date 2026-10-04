/**
 * Next.js Middleware — route protection.
 */
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Create a new ratelimiter, that allows 5 requests per 1 minute
const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(5, "1 m"),
  analytics: true,
});

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
  const ip = request.ip ?? "127.0.0.1";

  // Apply rate limiting to login and register routes
  if (AUTH_ONLY.some((p) => pathname.startsWith(p))) {
    try {
      const { success, pending, limit, reset, remaining } = await ratelimit.limit(
        `ratelimit_${ip}`
      );
      if (!success) {
        // Return 429 Too Many Requests if rate limit exceeded
        return new NextResponse("Too Many Requests", {
          status: 429,
          headers: {
            "X-RateLimit-Limit": limit.toString(),
            "X-RateLimit-Remaining": remaining.toString(),
            "X-RateLimit-Reset": reset.toString(),
          },
        });
      }
    } catch (error) {
      // If Upstash isn't configured or fails, we fail open (allow the request)
      console.error("Rate limiting error:", error);
    }
  }

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
    if (!sessionCookie) {
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
