# ProdSamp Project Notes

## Local Mac Environment
- **Mac project path:** `~/Documents/ProdSamp`
- **GitHub repo:** `tjsalas78/ProdSamp`
- **Active branch:** `main`
- **Mac username:** `tsalas`

## Stack
- Next.js 15 (App Router)
- Prisma + Neon (PostgreSQL)
- NextAuth v4 (Google OAuth + Credentials)
- Anthropic Claude SDK (product generation)
- Vercel Blob (image storage)
- Resend (email)
- Tailwind CSS

## What is ProdSamp?
Standalone app for generating synthetic product samples and pushing them to Shopify stores.
- Separate from SpareDollar (can READ each other, cannot WRITE)
- PSX_ prefix for reused resources from SpareDollar

## Shopify Integration
- OAuth-first: Users connect stores via Shopify OAuth
- Draft workflow: Create as drafts → publish when ready
- Batch support: Up to 50 products per batch
- Multi-tenant: Multiple stores per user

## Key Files
- `src/lib/shopify/psx-config.ts` — OAuth config, URL builders, HMAC validation
- `src/lib/shopify/psx-client.ts` — Shopify Admin API client (CRUD + batch)
- `src/lib/claude.ts` — Claude AI product generation
- `src/lib/services/session-manager.ts` — AES-256-CBC token encryption
- `src/app/api/shopify/` — All Shopify API routes
- `src/components/shopify/` — Shopify UI components

## Dev Server
```bash
npm run dev
```

## Environment Variables
See `.env.example` for required variables.
