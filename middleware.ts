import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

/** True for any admin.* subdomain regardless of port or casing.
 *  Vercel forwards the real public hostname in x-forwarded-host;
 *  the bare `host` header may contain an internal Vercel origin. */
function isAdminHost(req: NextRequest): boolean {
  const raw =
    req.headers.get("x-forwarded-host") ??
    req.headers.get("host") ??
    "";
  return raw.toLowerCase().split(":")[0].startsWith("admin.");
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // ── Canonical domain: always redirect to sparedollar.io ──────────────────
  const host = (req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? "").toLowerCase().replace(/:\d+$/, "");
  const needsRedirect =
    (host.match(/sparedollar\.\w+$/) && !host.endsWith("sparedollar.io")) ||
    host.startsWith("www.sparedollar.");
  if (needsRedirect) {
    const url = req.nextUrl.clone();
    // Strip www and replace any TLD with .io
    url.host = host.replace(/^www\./, "").replace(/sparedollar\.\w+$/, "sparedollar.io");
    url.protocol = "https";
    return NextResponse.redirect(url, 301);
  }

  // ── Admin subdomain ──────────────────────────────────────────────────────
  if (isAdminHost(req)) {
    // Redirect root / and anything not under /admin or /api to login
    if (!pathname.startsWith("/admin") && !pathname.startsWith("/api/")) {
      return NextResponse.redirect(new URL("/admin/login", req.url));
    }
    // Always allow: login page + backadmin API
    if (pathname === "/admin/login" || pathname.startsWith("/api/backadmin/")) {
      return NextResponse.next();
    }
    // All other /admin/* routes require the session cookie
    const cookie = req.cookies.get("backadmin_session");
    if (!cookie?.value) {
      return NextResponse.redirect(new URL("/admin/login", req.url));
    }
    return NextResponse.next();
  }

  // ── Main domain: block /admin, send directly to admin login ─────────────
  // Point at /admin/login specifically to avoid a loop if the host check
  // ever misfires on the admin subdomain.
  if (pathname.startsWith("/admin")) {
    return NextResponse.redirect("https://admin.sparedollar.io/admin/login");
  }

  // ── Main domain: protect user-facing routes via NextAuth JWT ─────────────
  const userProtected = ["/dashboard", "/listings", "/settings"];
  if (userProtected.some((p) => pathname.startsWith(p))) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  // Run on every route except Next.js internals and static assets
  matcher: ["/((?!_next/static|_next/image|favicon\\.ico).*)"],
};
