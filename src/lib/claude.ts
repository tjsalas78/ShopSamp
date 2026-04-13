/**
 * PSX_Claude — Claude AI integration for ProdSamp.
 * Generates synthetic product samples ready for Shopify.
 */

import Anthropic from '@anthropic-ai/sdk';

// Lazy-init to ensure env vars are loaded at call time
let _claude: Anthropic | null = null;
function getClient(): Anthropic {
  if (!_claude) {
    let key = process.env.ANTHROPIC_API_KEY;
    if (!key) {
      try {
        const fs = require('fs');
        const path = require('path');
        const envPath = path.resolve(process.cwd(), '.env');
        const envContent = fs.readFileSync(envPath, 'utf-8');
        const match = envContent.match(/^ANTHROPIC_API_KEY="?([^"\n]+)"?/m);
        if (match) key = match[1];
      } catch {
        /* ignore */
      }
    }
    if (!key) throw new Error('ANTHROPIC_API_KEY is not set.');
    _claude = new Anthropic({ apiKey: key });
  }
  return _claude;
}

async function withRetry<T>(fn: () => Promise<T>, retries = 2, delay = 800): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (e: unknown) {
      const status = (e as { status?: number }).status;
      if ((status === 529 || status === 503) && i < retries - 1) {
        await new Promise((r) => setTimeout(r, delay * (i + 1)));
        continue;
      }
      throw e;
    }
  }
  throw new Error('Max retries exceeded');
}

function parseJSON(text: string) {
  let candidate: string;
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fenced) {
    candidate = fenced[1];
  } else {
    const openOnly = text.match(/```(?:json)?\s*([\s\S]*)$/i);
    candidate = openOnly ? openOnly[1] : text;
  }
  candidate = candidate.trim();
  try {
    return JSON.parse(candidate);
  } catch {
    const first = candidate.indexOf('{');
    const last = candidate.lastIndexOf('}');
    if (first >= 0 && last > first) {
      return JSON.parse(candidate.slice(first, last + 1));
    }
    throw new Error('Failed to parse JSON from Claude response');
  }
}

// ─── Types ─────────────────────────────────────────────────────────────────

export interface PSX_GeneratedProduct {
  title: string;
  body_html: string;
  vendor: string;
  product_type: string;
  tags: string[];
  price: string;
  compare_at_price?: string;
  variants: {
    option1?: string; // Color
    option2?: string; // Size
    option3?: string; // Condition
    price: string;
    compare_at_price?: string;
    sku?: string;
  }[];
  seo_title?: string;
  seo_description?: string;
}

export interface PSX_GenerateInput {
  category: string;
  keywords?: string | string[];
  count?: number; // How many samples to generate (default: 1)
  priceRange?: { min: number; max: number };
  style?: string;
  brand?: string;
  variantPreset?: string; // "none" | "color" | "size" | "color-size" | "color-size-condition" | "condition"
  includeVariants?: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────

function buildVariantInstruction(preset?: string): string {
  switch (preset) {
    case "color":
      return "Add color variants only (option1 = Color). Use realistic color names. 3-5 colors per product.";
    case "size":
      return "Add size variants only (option1 = Size). Use standard size values. 4-6 sizes per product.";
    case "color-size":
      return "Add color (option1) and size (option2) variants. Create variants for each color × size combination.";
    case "color-size-condition":
      return "Add color (option1), size (option2), and condition (option3: New, Like New, Good, Fair) variants.";
    case "condition":
      return "Add condition variants only (option1 = Condition: New, Like New, Good, Fair). Adjust price by condition.";
    default:
      return "No variants needed — single-option products only. Leave variants array empty.";
  }
}

// ─── Product Generation ────────────────────────────────────────────────────

const PSX_GENERATE_PROMPT = `You are a product data generator for e-commerce stores. Generate realistic, market-ready product samples that could be listed on Shopify.

Given a category and optional keywords, generate product data in this exact JSON format:

{
  "products": [
    {
      "title": "Product Title (max 250 chars, compelling and searchable)",
      "body_html": "<p>Rich HTML product description. Include features, materials, dimensions, care instructions where relevant. 2-4 paragraphs.</p>",
      "vendor": "Realistic brand name",
      "product_type": "Shopify product type/category",
      "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
      "price": "29.99",
      "compare_at_price": "39.99",
      "variants": [
        {
          "option1": "Color value (e.g., Black, Navy Blue)",
          "option2": "Size value (e.g., S, M, L, XL or 6, 8, 10)",
          "option3": "Condition (e.g., New, Like New)",
          "price": "29.99",
          "compare_at_price": "39.99",
          "sku": "VENDOR-CAT-001-BLK-M"
        }
      ],
      "seo_title": "SEO-optimized page title (50-60 chars)",
      "seo_description": "SEO meta description (150-160 chars)"
    }
  ]
}

RULES:
- Generate realistic products that look like they belong in a real store
- Prices should be market-appropriate for the category
- SKUs should follow a logical pattern: BRAND-CATEGORY-NUMBER-VARIANT
- Tags should be a mix of category terms, style descriptors, and trending search terms
- HTML descriptions should be well-formatted with <p>, <ul>, <li> tags
- If variants are requested, generate 2-4 meaningful variants per product
- Brand names should be realistic but not real trademarked brands — invent plausible ones
- Include compare_at_price only if it makes sense (sale items)

Return ONLY the JSON object, no other text.`;

/**
 * Generate synthetic product samples using Claude.
 */
export async function PSX_generateProducts(
  input: PSX_GenerateInput
): Promise<PSX_GeneratedProduct[]> {
  const client = getClient();
  const count = input.count || 1;

  const keywordsStr = Array.isArray(input.keywords)
    ? input.keywords.join(", ")
    : input.keywords;

  const variantInstruction = buildVariantInstruction(input.variantPreset);

  const userPrompt = [
    `Generate ${count} product sample${count > 1 ? "s" : ""} for the category: "${input.category}"`,
    keywordsStr ? `Keywords/themes: ${keywordsStr}` : "",
    input.brand ? `Brand/Vendor: ${input.brand}` : "",
    input.priceRange ? `Price range: $${input.priceRange.min} - $${input.priceRange.max}` : "",
    input.style ? `Style/aesthetic: ${input.style}` : "",
    variantInstruction,
  ]
    .filter(Boolean)
    .join("\n");

  const response = await withRetry(() =>
    client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      system: PSX_GENERATE_PROMPT,
      messages: [{ role: 'user', content: userPrompt }],
    })
  );

  const text =
    response.content[0].type === 'text' ? response.content[0].text : '';
  const parsed = parseJSON(text);

  return parsed.products as PSX_GeneratedProduct[];
}

/**
 * Generate products from an image (Claude Vision).
 * Analyzes an uploaded image and generates matching product data.
 */
export async function PSX_generateFromImage(
  imageUrl: string,
  options?: { category?: string; style?: string }
): Promise<PSX_GeneratedProduct[]> {
  const client = getClient();

  // Fetch the image and convert to base64
  const imageResponse = await fetch(imageUrl);
  const imageBuffer = await imageResponse.arrayBuffer();
  const base64 = Buffer.from(imageBuffer).toString('base64');
  const mediaType = imageResponse.headers.get('content-type') || 'image/jpeg';

  const response = await withRetry(() =>
    client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      system: PSX_GENERATE_PROMPT,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
                data: base64,
              },
            },
            {
              type: 'text',
              text: [
                'Analyze this product image and generate 1 Shopify-ready product sample based on what you see.',
                'Identify the product type, materials, colors, and style from the image.',
                options?.category ? `Category hint: ${options.category}` : '',
                options?.style ? `Style: ${options.style}` : '',
                'Include 2-3 color/size variants. Make the listing compelling and accurate to the image.',
              ]
                .filter(Boolean)
                .join('\n'),
            },
          ],
        },
      ],
    })
  );

  const text =
    response.content[0].type === 'text' ? response.content[0].text : '';
  const parsed = parseJSON(text);

  return parsed.products as PSX_GeneratedProduct[];
}
