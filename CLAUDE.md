# ShopSamp Project Notes

## Local Mac Environment
- **Mac project path:** `~/Documents/ProdSamp` (folder kept as-is, app renamed ShopSamp)
- **GitHub repo:** `tjsalas78/ShopSamp`
- **Active branch:** `main`
- **Mac username:** `tsalas`

## What is ShopSamp?
A **Shopify embedded app** for developers and designers to generate AI-powered, realistic product samples and push them directly into their Shopify stores — for testing, seeding, and prototyping.

- Target audience: Devs/designers who need realistic test data without doing it manually
- Generates real product titles, descriptions, variants (color/size/condition), and category structures
- Fully embedded in Shopify Admin (no standalone login/dashboard)
- PSX_ prefix for any reused resources from SpareDollar

## Stack
- Next.js 15 (App Router)
- Prisma + Neon (PostgreSQL)
- `@shopify/shopify-api` — OAuth, session management, webhook HMAC
- `@shopify/shopify-app-session-storage-prisma` — Prisma-backed session storage
- `@shopify/app-bridge-react` — Embedded app context (reads `?host=` param)
- `@shopify/polaris` — Shopify design system (required for App Store)
- Anthropic Claude SDK (product generation via claude-sonnet-4-6)
- Vercel Blob (image storage)
- Tailwind CSS (non-Polaris pages only)

## Shopify Integration
- Fully embedded in Shopify Admin iframe
- Merchant install via Shopify OAuth (shop domain = identity, no user accounts)
- GDPR mandatory webhooks: customers/data_request, customers/redact, shop/redact, app/uninstalled
- CSP headers: `frame-ancestors *.shopify.com *.myshopify.com`
- Multi-merchant: each shop has its own Session + ShopifyStore record

## Key Files
- `src/lib/shopify/shopify.ts` — SDK singleton (shopifyApi + PrismaSessionStorage + webhooks)
- `src/lib/shopify/psx-client.ts` — Shopify Admin API client (product CRUD + batch)
- `src/lib/shopify/psx-config.ts` — OAuth config, URL builders, HMAC validation
- `src/lib/claude.ts` — Claude AI product generation (PSX_generateProducts, PSX_generateFromImage)
- `src/lib/services/session-manager.ts` — AES-256-CBC token encryption (PSX_ from SpareDollar)
- `src/app/api/shopify/` — OAuth auth/callback, webhooks, products
- `src/app/app/` — Embedded app pages (Polaris UI)

## Dev Server
```bash
npm run dev
```

## Environment Variables
See `.env.example` for required variables.
- `SHOPIFY_API_KEY` — from Shopify Partner Dashboard
- `SHOPIFY_API_SECRET` — from Shopify Partner Dashboard
- `SHOPIFY_SCOPES` — write_products,read_products,write_inventory,read_inventory
- `SHOPIFY_APP_URL` — e.g. https://shopsamp.vercel.app
- `DATABASE_URL` — Neon PostgreSQL connection string
- `DIRECT_URL` — Neon direct connection (for Prisma migrations)
- `ANTHROPIC_API_KEY` — Claude API key
- `BLOB_READ_WRITE_TOKEN` — Vercel Blob token
- `ENCRYPTION_KEY` — 32-byte hex for AES-256-CBC
