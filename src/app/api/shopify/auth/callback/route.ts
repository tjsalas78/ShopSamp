/**
 * GET /api/shopify/auth/callback
 * Shopify OAuth callback handler.
 * Exchanges the authorization code for a permanent access token,
 * encrypts it, and stores in ShopifyStore.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PSX_SHOPIFY_CONFIG, buildTokenUrl, sanitizeShopDomain, validateHmac } from '@/lib/shopify/psx-config';
import { getSessionManager } from '@/lib/services/session-manager';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Verify user is authenticated
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const shop = searchParams.get('shop');
    const hmac = searchParams.get('hmac');

    // Validate required params
    if (!code || !shop) {
      return NextResponse.redirect(
        new URL('/dashboard?error=missing_params', request.url)
      );
    }

    // Validate HMAC if present
    if (hmac) {
      const queryObj: Record<string, string> = {};
      searchParams.forEach((value, key) => {
        queryObj[key] = value;
      });
      if (!validateHmac(queryObj)) {
        return NextResponse.redirect(
          new URL('/dashboard?error=invalid_hmac', request.url)
        );
      }
    }

    // Exchange code for access token
    const cleanShop = sanitizeShopDomain(shop);
    const tokenUrl = buildTokenUrl(cleanShop);

    const tokenResponse = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: PSX_SHOPIFY_CONFIG.apiKey,
        client_secret: PSX_SHOPIFY_CONFIG.apiSecret,
        code,
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('[Shopify Callback] Token exchange failed:', errorText);
      return NextResponse.redirect(
        new URL('/dashboard?error=token_exchange_failed', request.url)
      );
    }

    const tokenData = await tokenResponse.json();
    const { access_token, scope } = tokenData;

    if (!access_token) {
      return NextResponse.redirect(
        new URL('/dashboard?error=no_access_token', request.url)
      );
    }

    // Encrypt the access token
    const sm = getSessionManager();
    const encryptedToken = sm.encrypt(access_token);

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.redirect(
        new URL('/dashboard?error=user_not_found', request.url)
      );
    }

    // Extract shop name from domain
    const shopName = cleanShop.replace('.myshopify.com', '');

    // Upsert store connection (handles reconnections)
    await prisma.shopifyStore.upsert({
      where: { shopDomain: cleanShop },
      create: {
        userId: user.id,
        shopName,
        shopDomain: cleanShop,
        accessToken: JSON.stringify(encryptedToken),
        scope: scope || PSX_SHOPIFY_CONFIG.scopes,
        isActive: true,
      },
      update: {
        accessToken: JSON.stringify(encryptedToken),
        scope: scope || PSX_SHOPIFY_CONFIG.scopes,
        isActive: true,
        userId: user.id,
      },
    });

    // Redirect back to dashboard with success
    return NextResponse.redirect(
      new URL('/dashboard?shopify=connected', request.url)
    );
  } catch (error) {
    console.error('[Shopify Callback] Error:', error);
    return NextResponse.redirect(
      new URL('/dashboard?error=oauth_failed', request.url)
    );
  }
}
