/**
 * POST /api/shopify/products/publish
 * Publish a draft product on Shopify (set status to active).
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PSX_publishProduct } from '@/lib/shopify/psx-client';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { storeId, shopifyProductId } = await request.json();

    if (!storeId || !shopifyProductId) {
      return NextResponse.json(
        { error: 'Missing storeId or shopifyProductId' },
        { status: 400 }
      );
    }

    // Verify user owns the store
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    const store = await prisma.shopifyStore.findFirst({
      where: { id: storeId, userId: user?.id, isActive: true },
    });

    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    const product = await PSX_publishProduct(storeId, shopifyProductId);

    return NextResponse.json({
      success: true,
      product: {
        id: product.id,
        title: product.title,
        status: product.status,
        url: `https://${store.shopDomain}/admin/products/${product.id}`,
      },
    });
  } catch (error) {
    console.error('[Shopify Publish] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to publish product' },
      { status: 500 }
    );
  }
}
