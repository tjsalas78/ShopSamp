import { NextRequest, NextResponse } from "next/server";
import { shopify } from "@/lib/shopify/shopify";
import { sanitizeShopDomain } from "@/lib/shopify/psx-config";

/**
 * GET /api/shopify/auth?shop=my-store.myshopify.com
 * Initiates the Shopify OAuth install flow — redirects merchant to Shopify for approval.
 */
export async function GET(req: NextRequest) {
  const shop = req.nextUrl.searchParams.get("shop");
  if (!shop) {
    return NextResponse.json({ error: "Missing shop parameter" }, { status: 400 });
  }

  const sanitized = sanitizeShopDomain(shop);
  if (!sanitized) {
    return NextResponse.json({ error: "Invalid shop domain" }, { status: 400 });
  }

  const { headers, url } = await shopify.auth.begin({
    shop: sanitized,
    callbackPath: "/api/shopify/callback",
    isOnline: false,
    rawRequest: req,
  });

  const response = NextResponse.redirect(url);
  for (const [key, value] of Object.entries(headers)) {
    response.headers.set(key, value as string);
  }
  return response;
}
