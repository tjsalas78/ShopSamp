/**
 * GET /api/shopify/stores — List user's connected Shopify stores.
 * POST /api/shopify/stores — Disconnect a store (body: { storeId, action: "disconnect" }).
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      shopifyStores: {
        where: { isActive: true },
        select: {
          id: true,
          shopName: true,
          shopDomain: true,
          scope: true,
          isActive: true,
          lastSyncedAt: true,
          createdAt: true,
          _count: { select: { products: true } },
        },
      },
    },
  });

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  return NextResponse.json({ stores: user.shopifyStores });
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { storeId, action } = await request.json();

  if (action !== 'disconnect' || !storeId) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  // Verify ownership
  const store = await prisma.shopifyStore.findFirst({
    where: { id: storeId, userId: user.id },
  });

  if (!store) {
    return NextResponse.json({ error: 'Store not found' }, { status: 404 });
  }

  // Soft-delete (mark inactive)
  await prisma.shopifyStore.update({
    where: { id: storeId },
    data: { isActive: false },
  });

  return NextResponse.json({ success: true, message: 'Store disconnected' });
}
