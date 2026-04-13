import { NextRequest, NextResponse } from "next/server";
import { shopify } from "@/lib/shopify/shopify";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/shopify/webhooks
 * Handles all Shopify webhook topics. HMAC-verified.
 */
export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const hmac = req.headers.get("x-shopify-hmac-sha256") ?? "";
  const topic = req.headers.get("x-shopify-topic") ?? "";
  const shop = req.headers.get("x-shopify-shop-domain") ?? "";

  // Verify HMAC signature
  const valid = await shopify.webhooks.validate({
    rawBody,
    rawRequest: req,
  });

  if (!valid) {
    console.warn(`[ShopSamp Webhooks] Invalid HMAC for topic: ${topic} from ${shop}`);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = JSON.parse(rawBody);

  switch (topic) {
    case "app/uninstalled":
      await handleUninstall(shop);
      break;

    case "customers/data_request":
      // GDPR: We don't store personal customer data — acknowledge and no-op
      console.info(`[ShopSamp Webhooks] customers/data_request for ${shop} — no customer data stored`);
      break;

    case "customers/redact":
      // GDPR: We don't store personal customer data — acknowledge and no-op
      console.info(`[ShopSamp Webhooks] customers/redact for ${shop} — no customer data stored`);
      break;

    case "shop/redact":
      await handleShopRedact(shop);
      break;

    default:
      console.warn(`[ShopSamp Webhooks] Unhandled topic: ${topic}`);
  }

  return NextResponse.json({ ok: true });
}

async function handleUninstall(shop: string) {
  try {
    // Mark store as inactive
    await prisma.shopifyStore.updateMany({
      where: { shopDomain: shop },
      data: { isActive: false, uninstalledAt: new Date() },
    });

    // Remove the OAuth session so tokens don't accumulate
    const { sessionStorage } = await import("@/lib/shopify/shopify");
    const sessionId = shopify.session.getOfflineId(shop);
    await sessionStorage.deleteSession(sessionId);

    console.info(`[ShopSamp Webhooks] App uninstalled from ${shop}`);
  } catch (err) {
    console.error("[ShopSamp Webhooks] handleUninstall error:", err);
  }
}

async function handleShopRedact(shop: string) {
  // GDPR shop/redact: delete all store data 48h after uninstall
  try {
    await prisma.shopifyStore.deleteMany({ where: { shopDomain: shop } });
    console.info(`[ShopSamp Webhooks] Shop data redacted for ${shop}`);
  } catch (err) {
    console.error("[ShopSamp Webhooks] handleShopRedact error:", err);
  }
}
