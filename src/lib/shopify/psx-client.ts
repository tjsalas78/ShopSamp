/**
 * PSX_ShopifyClient — Shopify Admin API client for ProdSamp.
 * Handles all product CRUD operations via Shopify REST Admin API.
 */

import { buildApiUrl } from './psx-config';
import { getSessionManager } from '../services/session-manager';
import prisma from '../prisma';

// ─── Types ─────────────────────────────────────────────────────────────────

export interface PSX_ProductInput {
  title: string;
  body_html: string;
  vendor?: string;
  product_type?: string;
  tags?: string[];
  images?: { src: string; alt?: string }[];
  variants?: PSX_VariantInput[];
  status?: 'active' | 'draft' | 'archived';
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
  weight_unit?: 'lb' | 'oz' | 'kg' | 'g';
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

// ─── Client ────────────────────────────────────────────────────────────────

/**
 * Get the decrypted access token for a store.
 */
async function getStoreToken(storeId: string): Promise<{ token: string; shopDomain: string }> {
  const store = await prisma.shopifyStore.findUnique({
    where: { id: storeId },
  });

  if (!store || !store.isActive) {
    throw new Error('Store not found or inactive');
  }

  const sm = getSessionManager();
  const encryptedData = JSON.parse(store.accessToken);
  const token = sm.decrypt(encryptedData);

  return { token, shopDomain: store.shopDomain };
}

/**
 * Make an authenticated request to the Shopify Admin API.
 */
async function shopifyFetch<T>(
  shopDomain: string,
  token: string,
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = buildApiUrl(shopDomain, endpoint);

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': token,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `Shopify API error (${response.status}): ${errorBody}`
    );
  }

  return response.json() as Promise<T>;
}

// ─── Product Operations ────────────────────────────────────────────────────

/**
 * Create a product on Shopify (published or draft).
 */
export async function PSX_createProduct(
  storeId: string,
  input: PSX_ProductInput
): Promise<PSX_ShopifyProduct> {
  const { token, shopDomain } = await getStoreToken(storeId);

  // Build product payload with options if variants exist
  const product: Record<string, unknown> = {
    title: input.title,
    body_html: input.body_html,
    vendor: input.vendor || '',
    product_type: input.product_type || '',
    tags: input.tags?.join(', ') || '',
    status: input.status || 'draft',
    images: input.images || [],
  };

  // Add variant options
  if (input.variants && input.variants.length > 0) {
    const options: { name: string }[] = [];
    if (input.variants.some((v) => v.option1)) options.push({ name: 'Color' });
    if (input.variants.some((v) => v.option2)) options.push({ name: 'Size' });
    if (input.variants.some((v) => v.option3)) options.push({ name: 'Condition' });
    product.options = options;
    product.variants = input.variants;
  }

  const result = await shopifyFetch<{ product: PSX_ShopifyProduct }>(
    shopDomain,
    token,
    'products.json',
    {
      method: 'POST',
      body: JSON.stringify({ product }),
    }
  );

  // Track in our database
  await prisma.shopifyProduct.create({
    data: {
      storeId,
      shopifyProductId: String(result.product.id),
      title: result.product.title,
      isDraft: input.status === 'draft',
      sourceData: input as object,
    },
  });

  return result.product;
}

/**
 * Create a draft product on Shopify.
 */
export async function PSX_createDraftProduct(
  storeId: string,
  input: PSX_ProductInput
): Promise<PSX_ShopifyProduct> {
  return PSX_createProduct(storeId, { ...input, status: 'draft' });
}

/**
 * Publish a draft product (set status to active).
 */
export async function PSX_publishProduct(
  storeId: string,
  shopifyProductId: string
): Promise<PSX_ShopifyProduct> {
  const { token, shopDomain } = await getStoreToken(storeId);

  const result = await shopifyFetch<{ product: PSX_ShopifyProduct }>(
    shopDomain,
    token,
    `products/${shopifyProductId}.json`,
    {
      method: 'PUT',
      body: JSON.stringify({ product: { status: 'active' } }),
    }
  );

  // Update tracking record
  await prisma.shopifyProduct.updateMany({
    where: { storeId, shopifyProductId },
    data: { isDraft: false },
  });

  return result.product;
}

/**
 * Update an existing product on Shopify.
 */
export async function PSX_updateProduct(
  storeId: string,
  shopifyProductId: string,
  updates: Partial<PSX_ProductInput>
): Promise<PSX_ShopifyProduct> {
  const { token, shopDomain } = await getStoreToken(storeId);

  const product: Record<string, unknown> = {};
  if (updates.title) product.title = updates.title;
  if (updates.body_html) product.body_html = updates.body_html;
  if (updates.vendor) product.vendor = updates.vendor;
  if (updates.product_type) product.product_type = updates.product_type;
  if (updates.tags) product.tags = updates.tags.join(', ');
  if (updates.status) product.status = updates.status;

  const result = await shopifyFetch<{ product: PSX_ShopifyProduct }>(
    shopDomain,
    token,
    `products/${shopifyProductId}.json`,
    {
      method: 'PUT',
      body: JSON.stringify({ product }),
    }
  );

  return result.product;
}

/**
 * Delete a product from Shopify.
 */
export async function PSX_deleteProduct(
  storeId: string,
  shopifyProductId: string
): Promise<void> {
  const { token, shopDomain } = await getStoreToken(storeId);

  await shopifyFetch(
    shopDomain,
    token,
    `products/${shopifyProductId}.json`,
    { method: 'DELETE' }
  );

  // Remove tracking record
  await prisma.shopifyProduct.deleteMany({
    where: { storeId, shopifyProductId },
  });
}

/**
 * Batch create multiple products on Shopify.
 * Respects Shopify's rate limits (2 calls/sec for REST API).
 */
export async function PSX_batchCreateProducts(
  storeId: string,
  products: PSX_ProductInput[],
  isDraft: boolean = true
): Promise<{ success: PSX_ShopifyProduct[]; errors: { index: number; error: string }[] }> {
  const results: PSX_ShopifyProduct[] = [];
  const errors: { index: number; error: string }[] = [];

  for (let i = 0; i < products.length; i++) {
    try {
      const product = await PSX_createProduct(storeId, {
        ...products[i],
        status: isDraft ? 'draft' : 'active',
      });
      results.push(product);

      // Rate limit: ~2 requests/second for Shopify REST API
      if (i < products.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 550));
      }
    } catch (error) {
      errors.push({
        index: i,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return { success: results, errors };
}
