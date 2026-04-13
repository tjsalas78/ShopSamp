import { NextRequest, NextResponse } from "next/server";
import { shopify, sessionStorage } from "@/lib/shopify/shopify";
import { PSX_generateProducts, PSX_generateFromImage, PSX_GenerateInput } from "@/lib/claude";

/**
 * POST /api/generate
 * Generate synthetic product samples using Claude AI.
 * Auth: Shopify offline session keyed by shop domain.
 *
 * Body: {
 *   shop: string              — merchant's myshopify.com domain
 *   category: string          — product category
 *   keywords?: string         — style/theme keywords
 *   quantity?: number         — how many products (1-50, default 5)
 *   variantPreset?: string    — "none" | "color" | "size" | "color-size" | ...
 *   priceMin?: number
 *   priceMax?: number
 *   brand?: string
 *   imageUrl?: string         — vision-based generation (optional)
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      shop,
      category,
      keywords,
      quantity = 5,
      variantPreset = "none",
      priceMin = 9.99,
      priceMax = 99.99,
      brand,
      imageUrl,
    } = body;

    if (!shop) {
      return NextResponse.json({ error: "Missing shop" }, { status: 400 });
    }

    // Verify offline session exists
    const sessionId = shopify.session.getOfflineId(shop);
    const session = await sessionStorage.loadSession(sessionId);
    if (!session) {
      return NextResponse.json({ error: "Shop not authenticated — reinstall the app" }, { status: 401 });
    }

    // Image-based generation
    if (imageUrl) {
      const products = await PSX_generateFromImage(imageUrl as string, { category, style: keywords });
      return NextResponse.json({ products });
    }

    if (!category) {
      return NextResponse.json({ error: "Missing category" }, { status: 400 });
    }

    const clampedQty = Math.min(Math.max(quantity, 1), 50);

    const input: PSX_GenerateInput = {
      category,
      keywords,
      count: clampedQty,
      priceRange: { min: priceMin, max: priceMax },
      variantPreset,
      brand,
      includeVariants: variantPreset !== "none",
    };

    const products = await PSX_generateProducts(input);
    return NextResponse.json({ products });
  } catch (err) {
    console.error("[SampShop Generate] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Generation failed" },
      { status: 500 }
    );
  }
}
