import { jwtVerify } from "jose";
import { NextResponse, type NextRequest } from "next/server";

import { SIMPLE_ADMIN_PATHS } from "@/lib/admin/nav";
import { SESSION_COOKIE } from "@/lib/auth/cookie";

/**
 * Fast, first-pass guard for the admin area (PRD 11 Phase 1).
 *
 * This proxy runs before the page renders and bounces anonymous visitors to the
 * login screen. It is intentionally *not* the security boundary: it only checks
 * that the session cookie is a validly-signed, unexpired token. Every admin page
 * and server action independently re-checks the user and permission via
 * `requireUser` / `requirePermission` / `assertPermission` (see
 * src/lib/auth/server.ts). Next.js itself recommends never relying on Proxy for
 * authorization — moving a server action to another route would silently drop
 * this coverage.
 */

/** Auth screens that must stay reachable while signed out. */
const PUBLIC_ADMIN_PATHS = new Set([
  "/admin/login",
  "/admin/forgot-password",
  "/admin/reset-password",
]);

async function hasValidSession(request: NextRequest): Promise<boolean> {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const secret = process.env.AUTH_SECRET;
  if (!token || !secret) return false;

  try {
    await jwtVerify(token, new TextEncoder().encode(secret));
    return true;
  } catch {
    return false;
  }
}

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // Admin area: fast first-pass sign-in guard (real enforcement happens in
  // pages and server actions).
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    const isPublic = PUBLIC_ADMIN_PATHS.has(pathname);
    const signedIn = await hasValidSession(request);

    // Signed out and asking for a protected screen -> send to login first.
    if (!signedIn && !isPublic) {
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("next", `${pathname}${search}`);
      return NextResponse.redirect(loginUrl);
    }

    // Already signed in but sitting on a login screen -> back to the dashboard.
    if (signedIn && isPublic) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }

    // The simple admin only has testimonials and the blog; other sections are
    // hidden, so their addresses lead back to the admin home.
    const allowed = SIMPLE_ADMIN_PATHS.some((p) => pathname === p || (p !== "/admin" && pathname.startsWith(`${p}/`)));
    if (signedIn && !isPublic && !allowed) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
  }

  // Public routes: server components cannot see the request URL, so stamp the
  // pathname on a request header for src/app/layout.tsx, which applies
  // maintenance mode and 301 redirects (including to otherwise-404 URLs).
  const headers = new Headers(request.headers);
  headers.set("x-pathname", pathname);

  return NextResponse.next({ request: { headers } });
}

export const config = {
  // Everything except Next's static assets and served media files.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|uploads/|robots\\.txt|sitemap\\.xml).*)",
  ],
};
