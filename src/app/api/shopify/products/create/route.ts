/**
 * POST /api/shopify/products/create
 * Create a single product on a connected Shopify store.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PSX_createProduct, PSX_ProductInput } from '@/lib/shopify/psx-client';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { storeId, productData, isDraft = true } = await request.json();

    if (!storeId || !productData) {
      return NextResponse.json(
        { error: 'Missing storeId or productData' },
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

    // Create the product
    const input: PSX_ProductInput = {
      ...productData,
      status: isDraft ? 'draft' : 'active',
    };

    const product = await PSX_createProduct(storeId, input);

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
    console.error('[Shopify Create Product] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create product' },
      { status: 500 }
    );
  }
}
