import "@shopify/shopify-api/adapters/node";
import { shopifyApi, ApiVersion, LogSeverity } from "@shopify/shopify-api";
import { PrismaSessionStorage } from "@shopify/shopify-app-session-storage-prisma";
import { prisma } from "@/lib/prisma";

const isDev = process.env.NODE_ENV !== "production";

export const sessionStorage = new PrismaSessionStorage(prisma);

export const shopify = shopifyApi({
  apiKey: process.env.SHOPIFY_API_KEY!,
  apiSecretKey: process.env.SHOPIFY_API_SECRET!,
  scopes: (process.env.SHOPIFY_SCOPES ?? "write_products,read_products,write_inventory,read_inventory").split(","),
  hostName: (process.env.SHOPIFY_APP_URL ?? "").replace(/^https?:\/\//, ""),
  hostScheme: "https",
  apiVersion: ApiVersion.January25,
  isEmbeddedApp: true,
  sessionStorage,
  logger: {
    level: isDev ? LogSeverity.Debug : LogSeverity.Warning,
  },
});

export type ShopifyClient = ReturnType<typeof shopify.clients.graphql>;

/**
 * Get an authenticated GraphQL client for a given shop.
 * Throws if no offline session exists (merchant hasn't installed the app).
 */
export async function getShopClient(shop: string) {
  const sessionId = shopify.session.getOfflineId(shop);
  const session = await sessionStorage.loadSession(sessionId);
  if (!session) {
    throw new Error(`No session found for shop: ${shop}`);
  }
  return new shopify.clients.Graphql({ session });
}

/**
 * Verify that a request comes from Shopify (HMAC check on query params).
 */
export function verifyShopifyRequest(query: URLSearchParams): boolean {
  try {
    return shopify.utils.validateHmac(
      Object.fromEntries(query.entries())
    );
  } catch {
    return false;
  }
}
