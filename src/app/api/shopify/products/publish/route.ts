import { NextRequest, NextResponse } from "next/server";
import { shopify, sessionStorage } from "@/lib/shopify/shopify";
import { PSX_publishProduct } from "@/lib/shopify/psx-client";

/**
 * POST /api/shopify/products/publish
 * Publish a draft product (set status to active).
 */
export async function POST(req: NextRequest) {
  try {
    const { shop, shopifyProductId } = await req.json();

    if (!shop || !shopifyProductId) {
      return NextResponse.json({ error: "Missing shop or shopifyProductId" }, { status: 400 });
    }

    const sessionId = shopify.session.getOfflineId(shop);
    const session = await sessionStorage.loadSession(sessionId);
    if (!session) {
      return NextResponse.json({ error: "Shop not authenticated — reinstall the app" }, { status: 401 });
    }

    const product = await PSX_publishProduct(shop, shopifyProductId);

    return NextResponse.json({
      success: true,
      product: {
        id: product.id,
        title: product.title,
        status: product.status,
        url: `https://${shop}/admin/products/${product.id}`,
      },
    });
  } catch (err) {
    console.error("[ShopSamp Publish] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to publish product" },
      { status: 500 }
    );
  }
}
