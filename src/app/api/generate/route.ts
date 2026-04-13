/**
 * POST /api/generate
 * Generate synthetic product samples using Claude AI.
 *
 * Body: {
 *   category: string,          // Required: product category
 *   keywords?: string[],       // Optional: style/theme keywords
 *   count?: number,            // Optional: number of samples (default: 1, max: 10)
 *   priceRange?: { min, max }, // Optional: price constraints
 *   style?: string,            // Optional: aesthetic (luxury, budget, vintage)
 *   includeVariants?: boolean, // Optional: generate variants (default: true)
 *   imageUrl?: string,         // Optional: generate from image instead of text
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {
  PSX_generateProducts,
  PSX_generateFromImage,
  PSX_GenerateInput,
} from '@/lib/claude';

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { category, keywords, count, priceRange, style, includeVariants, imageUrl } = body;

    // Image-based generation
    if (imageUrl) {
      const products = await PSX_generateFromImage(imageUrl, { category, style });
      return NextResponse.json({ products });
    }

    // Text-based generation
    if (!category) {
      return NextResponse.json(
        { error: 'Missing "category" field' },
        { status: 400 }
      );
    }

    const clampedCount = Math.min(Math.max(count || 1, 1), 10);

    const input: PSX_GenerateInput = {
      category,
      keywords,
      count: clampedCount,
      priceRange,
      style,
      includeVariants: includeVariants !== false,
    };

    const products = await PSX_generateProducts(input);

    return NextResponse.json({ products });
  } catch (error) {
    console.error('[Generate] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Generation failed' },
      { status: 500 }
    );
  }
}
