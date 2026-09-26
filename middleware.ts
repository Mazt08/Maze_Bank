/**
 * Next.js Edge Middleware — protects authenticated routes.
 *
 * Strategy:
 * - A Firebase ID token is stored in an HttpOnly cookie named "__session"
 *   after the user signs in (set by the /api/session route).
 * - The middleware checks for the presence of this cookie.
 *   Full token verification happens server-side in each protected page/action.
 * - Edge runtime cannot run firebase-admin, so we do a lightweight cookie check
 *   here and let the server components do the authoritative verify.
 */
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PROTECTED = ["/dashboard", "/transfer", "/transactions"];
const AUTH_ONLY = ["/login", "/register"]; // redirect to dashboard if already authed

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = request.cookies.get("__session")?.value;

  const isProtected = PROTECTED.some((p) => pathname.startsWith(p));
  const isAuthOnly = AUTH_ONLY.some((p) => pathname.startsWith(p));

  if (isProtected && !session) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthOnly && session) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/transfer/:path*", "/transactions/:path*", "/login", "/register"],
};
