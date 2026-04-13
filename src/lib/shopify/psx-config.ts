/**
 * PSX_Config — Shopify OAuth configuration for ProdSamp.
 * Centralizes all Shopify API credentials, scopes, and URLs.
 */

export const PSX_SHOPIFY_CONFIG = {
  apiKey: process.env.SHOPIFY_API_KEY || '',
  apiSecret: process.env.SHOPIFY_API_SECRET || '',
  scopes: 'write_products,read_products,write_inventory,read_inventory',
  redirectUri: process.env.SHOPIFY_REDIRECT_URI || 'http://localhost:3000/api/shopify/auth/callback',
  apiVersion: '2024-10', // Stable Shopify API version
} as const;

/**
 * Build the Shopify OAuth authorization URL.
 * User is redirected here to grant access to their store.
 */
export function buildAuthUrl(shop: string, state: string): string {
  const { apiKey, scopes, redirectUri } = PSX_SHOPIFY_CONFIG;
  const cleanShop = sanitizeShopDomain(shop);

  return (
    `https://${cleanShop}/admin/oauth/authorize` +
    `?client_id=${apiKey}` +
    `&scope=${scopes}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&state=${state}`
  );
}

/**
 * Build the Shopify token exchange URL.
 * Called after OAuth callback to exchange code for access token.
 */
export function buildTokenUrl(shop: string): string {
  const cleanShop = sanitizeShopDomain(shop);
  return `https://${cleanShop}/admin/oauth/access_token`;
}

/**
 * Build the Shopify Admin API URL for a given store.
 */
export function buildApiUrl(shop: string, endpoint: string): string {
  const cleanShop = sanitizeShopDomain(shop);
  const { apiVersion } = PSX_SHOPIFY_CONFIG;
  return `https://${cleanShop}/admin/api/${apiVersion}/${endpoint}`;
}

/**
 * Sanitize and validate a Shopify shop domain.
 * Accepts: "my-store", "my-store.myshopify.com", "https://my-store.myshopify.com"
 * Returns: "my-store.myshopify.com"
 */
export function sanitizeShopDomain(shop: string): string {
  let domain = shop.trim().toLowerCase();

  // Strip protocol
  domain = domain.replace(/^https?:\/\//, '');
  // Strip trailing slash
  domain = domain.replace(/\/$/, '');
  // Add .myshopify.com if not present
  if (!domain.includes('.myshopify.com')) {
    domain = `${domain}.myshopify.com`;
  }

  // Validate format
  if (!/^[a-z0-9][a-z0-9-]*\.myshopify\.com$/.test(domain)) {
    throw new Error(`Invalid Shopify domain: ${shop}`);
  }

  return domain;
}

/**
 * Validate that the HMAC from Shopify callback is authentic.
 */
export function validateHmac(query: Record<string, string>): boolean {
  const crypto = require('crypto');
  const { apiSecret } = PSX_SHOPIFY_CONFIG;

  const hmac = query.hmac;
  if (!hmac) return false;

  // Build the message from all params except hmac
  const params = Object.entries(query)
    .filter(([key]) => key !== 'hmac')
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('&');

  const digest = crypto
    .createHmac('sha256', apiSecret)
    .update(params)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(digest, 'hex'),
    Buffer.from(hmac, 'hex')
  );
}
