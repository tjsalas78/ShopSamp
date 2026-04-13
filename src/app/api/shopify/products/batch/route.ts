/**
 * POST /api/shopify/products/batch
 * Batch create multiple products on a connected Shopify store.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PSX_batchCreateProducts, PSX_ProductInput } from '@/lib/shopify/psx-client';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { storeId, products, isDraft = true } = await request.json();

    if (!storeId || !Array.isArray(products) || products.length === 0) {
      return NextResponse.json(
        { error: 'Missing storeId or products array' },
        { status: 400 }
      );
    }

    if (products.length > 50) {
      return NextResponse.json(
        { error: 'Maximum 50 products per batch' },
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

    // Batch create
    const result = await PSX_batchCreateProducts(
      storeId,
      products as PSX_ProductInput[],
      isDraft
    );

    return NextResponse.json({
      success: true,
      created: result.success.length,
      failed: result.errors.length,
      products: result.success.map((p) => ({
        id: p.id,
        title: p.title,
        status: p.status,
      })),
      errors: result.errors,
    });
  } catch (error) {
    console.error('[Shopify Batch Create] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Batch creation failed' },
      { status: 500 }
    );
  }
}
