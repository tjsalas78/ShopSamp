import { NextRequest, NextResponse } from "next/server";

/**
 * Middleware for ShopSamp (Shopify Embedded App).
 *
 * The /app/* routes are served inside the Shopify Admin iframe.
 * Session validation happens inside each API route via sessionStorage.loadSession().
 * Middleware here only handles:
 * - CSP frame-ancestors header (belt-and-suspenders, also set in next.config.ts)
 * - Redirecting bare /app loads (no host param) to the install prompt
 */
export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  // Ensure the Content-Security-Policy allows Shopify to embed us
  const response = NextResponse.next();
  response.headers.set(
    "Content-Security-Policy",
    "frame-ancestors https://*.shopify.com https://*.myshopify.com;"
  );

  // If someone hits /app without a host param, redirect to install flow
  if (pathname.startsWith("/app")) {
    const host = searchParams.get("host");
    const shop = searchParams.get("shop");
    if (!host && !shop) {
      return NextResponse.redirect(new URL("/install", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: ["/app/:path*"],
};
