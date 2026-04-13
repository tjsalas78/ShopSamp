/**
 * POST /api/shopify/auth
 * Initiate Shopify OAuth flow.
 * Accepts { shop: "my-store.myshopify.com" } and returns the authorization URL.
 */

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { buildAuthUrl, sanitizeShopDomain } from '@/lib/shopify/psx-config';

export async function POST(request: NextRequest) {
  try {
    const { shop } = await request.json();

    if (!shop || typeof shop !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid "shop" parameter' },
        { status: 400 }
      );
    }

    // Validate and sanitize the shop domain
    let cleanShop: string;
    try {
      cleanShop = sanitizeShopDomain(shop);
    } catch {
      return NextResponse.json(
        { error: 'Invalid Shopify store domain' },
        { status: 400 }
      );
    }

    // Generate CSRF state token
    const state = crypto.randomBytes(16).toString('hex');

    // Build the OAuth URL
    const authUrl = buildAuthUrl(cleanShop, state);

    // Return the auth URL + state (frontend stores state for validation)
    return NextResponse.json({
      authUrl,
      state,
      shop: cleanShop,
    });
  } catch (error) {
    console.error('[Shopify Auth] Error:', error);
    return NextResponse.json(
      { error: 'Failed to initiate Shopify OAuth' },
      { status: 500 }
    );
  }
}
