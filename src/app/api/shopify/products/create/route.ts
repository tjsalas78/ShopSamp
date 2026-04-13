import { NextRequest, NextResponse } from "next/server";
import { shopify, sessionStorage } from "@/lib/shopify/shopify";
import { PSX_createProduct, PSX_ProductInput } from "@/lib/shopify/psx-client";

/**
 * POST /api/shopify/products/create
 * Create a single product on the merchant's Shopify store.
 */
export async function POST(req: NextRequest) {
  try {
    const { shop, productData, isDraft = true } = await req.json();

    if (!shop || !productData) {
      return NextResponse.json({ error: "Missing shop or productData" }, { status: 400 });
    }

    const sessionId = shopify.session.getOfflineId(shop);
    const session = await sessionStorage.loadSession(sessionId);
    if (!session) {
      return NextResponse.json({ error: "Shop not authenticated — reinstall the app" }, { status: 401 });
    }

    const input: PSX_ProductInput = { ...productData, status: isDraft ? "draft" : "active" };
    const product = await PSX_createProduct(shop, input);

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
    console.error("[SampShop Create] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to create product" },
      { status: 500 }
    );
  }
}
