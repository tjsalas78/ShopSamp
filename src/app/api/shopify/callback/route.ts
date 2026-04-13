import { NextRequest, NextResponse } from "next/server";
import { shopify } from "@/lib/shopify/shopify";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/shopify/callback
 * Handles the OAuth callback from Shopify, stores the session, and upserts ShopifyStore.
 */
export async function GET(req: NextRequest) {
  try {
    const { session } = await shopify.auth.callback({
      rawRequest: req,
    });

    // Upsert the store record — shop domain is identity
    await prisma.shopifyStore.upsert({
      where: { shopDomain: session.shop },
      update: {
        isActive: true,
        uninstalledAt: null,
        updatedAt: new Date(),
      },
      create: {
        shopDomain: session.shop,
        shopName: session.shop.replace(".myshopify.com", ""),
        isActive: true,
      },
    });

    // Register mandatory GDPR + lifecycle webhooks
    await registerWebhooks(session.shop);

    // Redirect into the embedded app
    const host = req.nextUrl.searchParams.get("host") ?? "";
    const appUrl = `${process.env.SHOPIFY_APP_URL}/app?shop=${session.shop}&host=${host}`;
    return NextResponse.redirect(appUrl);
  } catch (err) {
    console.error("[SampShop] OAuth callback error:", err);
    return NextResponse.json({ error: "OAuth callback failed" }, { status: 500 });
  }
}

async function registerWebhooks(shop: string) {
  const sessionId = shopify.session.getOfflineId(shop);
  const { sessionStorage } = await import("@/lib/shopify/shopify");
  const session = await sessionStorage.loadSession(sessionId);
  if (!session) return;

  const client = new shopify.clients.Rest({ session });

  const topics = [
    { topic: "app/uninstalled", address: `${process.env.SHOPIFY_APP_URL}/api/shopify/webhooks` },
    { topic: "customers/data_request", address: `${process.env.SHOPIFY_APP_URL}/api/shopify/webhooks` },
    { topic: "customers/redact", address: `${process.env.SHOPIFY_APP_URL}/api/shopify/webhooks` },
    { topic: "shop/redact", address: `${process.env.SHOPIFY_APP_URL}/api/shopify/webhooks` },
  ];

  for (const webhook of topics) {
    try {
      await client.post({
        path: "webhooks",
        data: { webhook: { topic: webhook.topic, address: webhook.address, format: "json" } },
      });
    } catch {
      // Webhook may already exist — safe to ignore
    }
  }
}
