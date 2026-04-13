import { NextRequest, NextResponse } from "next/server";
import { shopify, sessionStorage } from "@/lib/shopify/shopify";
import { PSX_batchCreateProducts, PSX_ProductInput } from "@/lib/shopify/psx-client";

/**
 * POST /api/shopify/products/batch
 * Batch create up to 50 products on the merchant's Shopify store.
 * Auth: Shopify offline session keyed by shop domain.
 */
export async function POST(req: NextRequest) {
  try {
    const { shop, products, isDraft = true } = await req.json();

    if (!shop || !Array.isArray(products) || products.length === 0) {
      return NextResponse.json({ error: "Missing shop or products" }, { status: 400 });
    }

    if (products.length > 50) {
      return NextResponse.json({ error: "Maximum 50 products per batch" }, { status: 400 });
    }

    // Verify offline session exists for this shop
    const sessionId = shopify.session.getOfflineId(shop);
    const session = await sessionStorage.loadSession(sessionId);
    if (!session) {
      return NextResponse.json({ error: "Shop not authenticated — reinstall the app" }, { status: 401 });
    }

    const result = await PSX_batchCreateProducts(shop, products as PSX_ProductInput[], isDraft);

    return NextResponse.json({
      success: true,
      created: result.success.length,
      failed: result.errors.length,
      products: result.success.map((p) => ({ id: p.id, title: p.title, status: p.status })),
      errors: result.errors,
    });
  } catch (err) {
    console.error("[SampShop Batch] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Batch creation failed" },
      { status: 500 }
    );
  }
}
