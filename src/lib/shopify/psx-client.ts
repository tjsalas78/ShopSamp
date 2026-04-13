/**
 * PSX_ShopifyClient — Shopify Admin API client for SampShop.
 * Uses @shopify/shopify-api session storage for access tokens.
 */

import { shopify, sessionStorage } from "./shopify";
import { buildApiUrl } from "./psx-config";
import { prisma } from "../prisma";

// ─── Types ─────────────────────────────────────────────────────────────────

export interface PSX_ProductInput {
  title: string;
  body_html: string;
  vendor?: string;
  product_type?: string;
  tags?: string[];
  price?: string;
  compare_at_price?: string;
  images?: { src: string; alt?: string }[];
  variants?: PSX_VariantInput[];
  status?: "active" | "draft" | "archived";
  seo_title?: string;
  seo_description?: string;
}

export interface PSX_VariantInput {
  option1?: string; // e.g., "Red" (Color)
  option2?: string; // e.g., "Large" (Size)
  option3?: string; // e.g., "New" (Condition)
  price: string;
  compare_at_price?: string;
  sku?: string;
  inventory_quantity?: number;
  weight?: number;
  weight_unit?: "lb" | "oz" | "kg" | "g";
}

export interface PSX_ShopifyProduct {
  id: number;
  title: string;
  body_html: string;
  vendor: string;
  product_type: string;
  status: string;
  tags: string;
  variants: { id: number; title: string; price: string; sku: string }[];
  images: { id: number; src: string; alt: string }[];
  created_at: string;
  updated_at: string;
}

// ─── Auth Helpers ───────────────────────────────────────────────────────────

/**
 * Get the offline access token for a shop from the Shopify SDK session storage.
 */
async function getShopToken(shopDomain: string): Promise<string> {
  const sessionId = shopify.session.getOfflineId(shopDomain);
  const session = await sessionStorage.loadSession(sessionId);
  if (!session?.accessToken) {
    throw new Error(`No active session for ${shopDomain} — merchant needs to reinstall the app`);
  }
  return session.accessToken;
}

/**
 * Make an authenticated request to the Shopify Admin REST API.
 */
async function shopifyFetch<T>(
  shopDomain: string,
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getShopToken(shopDomain);
  const url = buildApiUrl(shopDomain, endpoint);

  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": token,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Shopify API error (${response.status}): ${errorBody}`);
  }

  return response.json() as Promise<T>;
}

// ─── Product Operations ────────────────────────────────────────────────────

export async function PSX_createProduct(
  shopDomain: string,
  input: PSX_ProductInput
): Promise<PSX_ShopifyProduct> {
  const product: Record<string, unknown> = {
    title: input.title,
    body_html: input.body_html,
    vendor: input.vendor ?? "",
    product_type: input.product_type ?? "",
    tags: input.tags?.join(", ") ?? "",
    status: input.status ?? "draft",
    images: input.images ?? [],
  };

  if (input.variants && input.variants.length > 0) {
    const options: { name: string }[] = [];
    if (input.variants.some((v) => v.option1)) options.push({ name: "Color" });
    if (input.variants.some((v) => v.option2)) options.push({ name: "Size" });
    if (input.variants.some((v) => v.option3)) options.push({ name: "Condition" });
    product.options = options;
    product.variants = input.variants;
  } else if (input.price) {
    product.variants = [{ price: input.price, compare_at_price: input.compare_at_price }];
  }

  const result = await shopifyFetch<{ product: PSX_ShopifyProduct }>(
    shopDomain,
    "products.json",
    { method: "POST", body: JSON.stringify({ product }) }
  );

  // Track in ShopifyProduct table
  await prisma.shopifyProduct.upsert({
    where: {
      shopDomain_shopifyProductId: {
        shopDomain,
        shopifyProductId: String(result.product.id),
      },
    },
    update: { title: result.product.title, isDraft: input.status === "draft" },
    create: {
      shopDomain,
      shopifyProductId: String(result.product.id),
      title: result.product.title,
      isDraft: input.status !== "active",
      sourceData: input as object,
    },
  });

  return result.product;
}

export async function PSX_createDraftProduct(
  shopDomain: string,
  input: PSX_ProductInput
): Promise<PSX_ShopifyProduct> {
  return PSX_createProduct(shopDomain, { ...input, status: "draft" });
}

export async function PSX_publishProduct(
  shopDomain: string,
  shopifyProductId: string
): Promise<PSX_ShopifyProduct> {
  const result = await shopifyFetch<{ product: PSX_ShopifyProduct }>(
    shopDomain,
    `products/${shopifyProductId}.json`,
    { method: "PUT", body: JSON.stringify({ product: { status: "active" } }) }
  );

  await prisma.shopifyProduct.updateMany({
    where: { shopDomain, shopifyProductId },
    data: { isDraft: false },
  });

  return result.product;
}

export async function PSX_updateProduct(
  shopDomain: string,
  shopifyProductId: string,
  updates: Partial<PSX_ProductInput>
): Promise<PSX_ShopifyProduct> {
  const product: Record<string, unknown> = {};
  if (updates.title) product.title = updates.title;
  if (updates.body_html) product.body_html = updates.body_html;
  if (updates.vendor) product.vendor = updates.vendor;
  if (updates.product_type) product.product_type = updates.product_type;
  if (updates.tags) product.tags = updates.tags.join(", ");
  if (updates.status) product.status = updates.status;

  const result = await shopifyFetch<{ product: PSX_ShopifyProduct }>(
    shopDomain,
    `products/${shopifyProductId}.json`,
    { method: "PUT", body: JSON.stringify({ product }) }
  );

  return result.product;
}

export async function PSX_deleteProduct(
  shopDomain: string,
  shopifyProductId: string
): Promise<void> {
  await shopifyFetch(shopDomain, `products/${shopifyProductId}.json`, { method: "DELETE" });
  await prisma.shopifyProduct.deleteMany({ where: { shopDomain, shopifyProductId } });
}

/**
 * Batch create products. Respects Shopify REST rate limit (~2 req/sec).
 */
export async function PSX_batchCreateProducts(
  shopDomain: string,
  products: PSX_ProductInput[],
  isDraft = true
): Promise<{ success: PSX_ShopifyProduct[]; errors: { index: number; error: string }[] }> {
  const success: PSX_ShopifyProduct[] = [];
  const errors: { index: number; error: string }[] = [];

  for (let i = 0; i < products.length; i++) {
    try {
      const product = await PSX_createProduct(shopDomain, {
        ...products[i],
        status: isDraft ? "draft" : "active",
      });
      success.push(product);
      if (i < products.length - 1) {
        await new Promise((r) => setTimeout(r, 550)); // ~2 req/s
      }
    } catch (err) {
      errors.push({ index: i, error: err instanceof Error ? err.message : String(err) });
    }
  }

  return { success, errors };
}
