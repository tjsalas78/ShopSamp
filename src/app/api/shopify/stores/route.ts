import { NextRequest, NextResponse } from "next/server";
import { shopify, sessionStorage } from "@/lib/shopify/shopify";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/shopify/stores?shop=my-store.myshopify.com
 * Returns store info for the given shop.
 */
export async function GET(req: NextRequest) {
  const shop = req.nextUrl.searchParams.get("shop");
  if (!shop) return NextResponse.json({ error: "Missing shop" }, { status: 400 });

  const sessionId = shopify.session.getOfflineId(shop);
  const session = await sessionStorage.loadSession(sessionId);
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const store = await prisma.shopifyStore.findUnique({
    where: { shopDomain: shop },
    include: { _count: { select: { products: true } } },
  });

  return NextResponse.json({ store });
}
