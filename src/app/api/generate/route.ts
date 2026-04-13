import { NextRequest, NextResponse } from "next/server";
import { PSX_generateProducts, PSX_generateFromImage, PSX_GenerateInput } from "@/lib/claude";
import { fetchProductImages } from "@/lib/images/unsplash";

/**
 * POST /api/generate
 * Generates product samples via Claude + attaches relevant images per product.
 *
 * Body: {
 *   shop: string
 *   category: string          — Google taxonomy full path
 *   keywords?: string
 *   quantity?: number         — 1-50
 *   variantPreset?: string
 *   priceMin?: number
 *   priceMax?: number
 *   brand?: string
 *   imagesPerProduct?: number — 0-5 (default 2)
 *   imageUrl?: string         — vision-based generation
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
      imagesPerProduct = 2,
      imageUrl,
    } = body;

    if (!shop) return NextResponse.json({ error: "Missing shop" }, { status: 400 });

    // Vision-based generation
    if (imageUrl) {
      const products = await PSX_generateFromImage(imageUrl as string, { category, style: keywords });
      return NextResponse.json({ products });
    }

    if (!category) return NextResponse.json({ error: "Missing category" }, { status: 400 });

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

    // Fetch relevant images for each product in parallel
    const imagesCount = Math.min(Math.max(imagesPerProduct ?? 0, 0), 5);
    if (imagesCount > 0) {
      await Promise.all(
        products.map(async (product) => {
          const query = `${product.title} ${product.product_type}`.slice(0, 80);
          const imgs = await fetchProductImages(query, imagesCount);
          (product as Record<string, unknown>).images = imgs.map((img) => ({
            src: img.url,
            alt: img.alt,
          }));
        })
      );
    }

    return NextResponse.json({ products });
  } catch (err) {
    console.error("[ShopSamp Generate] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Generation failed" },
      { status: 500 }
    );
  }
}
