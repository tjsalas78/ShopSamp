/**
 * Seed initial Plan rows so /admin/plans isn't empty.
 *
 * Idempotent — uses upsert by slug, so re-running won't duplicate. Run with:
 *   npx tsx prisma/seed-plans.ts
 *
 * After seeding, edit plans from the /admin/plans UI. The values here only
 * exist to bootstrap the table; they are not the source of truth at runtime.
 *
 * The shape of each row mirrors the public /pricing page design — name,
 * tagline, credits, overage rate, marketplace count, image cap, team seats,
 * icon, color, CTA, and a structured features list.
 */

import { prisma } from "../src/lib/prisma";

type PlanFeature = { text: string; tip?: string; type?: "normal" | "muted" | "overage" };

interface PlanSeed {
  slug: string;
  name: string;
  description: string;
  priceMonthly: number; // cents
  priceYearly: number; // cents
  creditsPerMonth: number;
  overageCentsPerCredit: number | null; // null = hard stop
  marketplacesAllowed: number | null;
  imagesPerListing: number | null;
  teamMembers: number | null;
  features: PlanFeature[];
  icon: string;
  iconColor: string;
  ctaText: string;
  ctaStyle: "primary" | "secondary";
  isDefault: boolean;
  highlight: boolean;
  sortOrder: number;
  isActive?: boolean;
  isUnlimited?: boolean;
  isInternal?: boolean;
}

const PLANS: PlanSeed[] = [
  {
    slug: "free",
    name: "Free",
    description: "Try it out",
    priceMonthly: 0,
    priceYearly: 0,
    creditsPerMonth: 15,
    overageCentsPerCredit: null, // hard stop
    marketplacesAllowed: 1,
    imagesPerListing: 4,
    teamMembers: null,
    features: [
      { text: "<span class=\"highlight\">15</span> SpareCredits/mo", type: "normal" },
      { text: "Hard stop at limit", tip: "Upgrade when you need more", type: "muted" },
      { text: "1 marketplace", tip: "Connect to eBay, Poshmark, or Depop", type: "normal" },
      { text: "4 images per listing", type: "normal" },
    ],
    icon: "seedling",
    iconColor: "starter",
    ctaText: "Start Free",
    ctaStyle: "secondary",
    isDefault: true,
    highlight: false,
    sortOrder: 0,
  },
  {
    slug: "lite",
    name: "Lite",
    description: "Getting started",
    priceMonthly: 900, // $9
    priceYearly: 9000, // $90
    creditsPerMonth: 75,
    overageCentsPerCredit: 14,
    marketplacesAllowed: 2,
    imagesPerListing: 6,
    teamMembers: null,
    features: [
      { text: "<span class=\"highlight\">75</span> SpareCredits/mo", type: "normal" },
      { text: "Then $0.14/credit", tip: "Pay-as-you-go after included credits", type: "overage" },
      { text: "2 marketplaces", tip: "Connect eBay + Poshmark or Depop", type: "normal" },
      { text: "6 images per listing", type: "normal" },
    ],
    icon: "seedling",
    iconColor: "growth",
    ctaText: "Get Lite",
    ctaStyle: "secondary",
    isDefault: false,
    highlight: false,
    sortOrder: 1,
  },
  {
    slug: "growth",
    name: "Growth",
    description: "Side hustlers",
    priceMonthly: 3900, // $39
    priceYearly: 39000, // $390
    creditsPerMonth: 400,
    overageCentsPerCredit: 10,
    marketplacesAllowed: 3,
    imagesPerListing: null,
    teamMembers: null,
    features: [
      { text: "<span class=\"highlight\">400</span> SpareCredits/mo", type: "normal" },
      { text: "Then $0.10/credit", tip: "Pay-as-you-go after included credits", type: "overage" },
      { text: "3 marketplaces", tip: "Cross-list to eBay, Poshmark, Depop", type: "normal" },
      { text: "Bulk import", tip: "Upload via CSV or photo batch", type: "normal" },
    ],
    icon: "rocket",
    iconColor: "pro",
    ctaText: "Get Growth",
    ctaStyle: "primary",
    isDefault: false,
    highlight: true, // "Best Value"
    sortOrder: 2,
  },
  {
    slug: "pro",
    name: "Pro",
    description: "Full-time resellers",
    priceMonthly: 8900, // $89
    priceYearly: 89000, // $890
    creditsPerMonth: 2000,
    overageCentsPerCredit: 8,
    marketplacesAllowed: null, // unlimited
    imagesPerListing: null,
    teamMembers: null,
    features: [
      { text: "<span class=\"highlight\">2,000</span> SpareCredits/mo", type: "normal" },
      { text: "Then $0.08/credit", tip: "Best overage rate available", type: "overage" },
      { text: "Unlimited marketplaces", tip: "All platforms, current and future", type: "normal" },
      { text: "Inventory sync + analytics", tip: "Real-time sync & dashboards", type: "normal" },
      { text: "Priority support", tip: "Faster response times", type: "normal" },
    ],
    icon: "bolt",
    iconColor: "business",
    ctaText: "Go Pro",
    ctaStyle: "secondary",
    isDefault: false,
    highlight: false,
    sortOrder: 3,
  },
  {
    slug: "business",
    name: "Business",
    description: "Teams & resale shops",
    priceMonthly: 14900, // $149
    priceYearly: 149000, // $1,490
    creditsPerMonth: 6000,
    overageCentsPerCredit: 6,
    marketplacesAllowed: null, // unlimited
    imagesPerListing: null,
    teamMembers: 5,
    features: [
      { text: "<span class=\"highlight\">6,000</span> SpareCredits/mo", type: "normal" },
      { text: "Then $0.06/credit", tip: "Lowest overage rate available", type: "overage" },
      { text: "Unlimited marketplaces", tip: "All platforms, current and future", type: "normal" },
      { text: "5 team members", tip: "Role-based permissions per seat", type: "normal" },
      { text: "Dedicated support + SLA", tip: "Priority response & uptime guarantee", type: "normal" },
    ],
    icon: "building",
    iconColor: "business",
    ctaText: "Get Business",
    ctaStyle: "secondary",
    isDefault: false,
    highlight: false,
    sortOrder: 4,
  },
  {
    // Internal-only "Insider" plan — hidden from /pricing (isActive=false +
    // isInternal=true), bypasses all credit + marketplace enforcement
    // (isUnlimited=true). Admins can assign it from the user detail page
    // for employees, beta testers, or VIP comps.
    slug: "insider",
    name: "Insider",
    description: "Unlimited everything (internal only)",
    priceMonthly: 0,
    priceYearly: 0,
    creditsPerMonth: 999999,
    overageCentsPerCredit: null,
    marketplacesAllowed: null,
    imagesPerListing: null,
    teamMembers: null,
    features: [
      { text: "Unlimited SpareCredits", type: "normal" },
      { text: "Unlimited marketplaces", type: "normal" },
      { text: "Unlimited everything", type: "normal" },
      { text: "Internal use only", type: "muted" },
    ],
    icon: "bolt",
    iconColor: "business",
    ctaText: "Insider",
    ctaStyle: "primary",
    isDefault: false,
    highlight: false,
    sortOrder: 99,
    isActive: false, // hidden from public /pricing
    isUnlimited: true,
    isInternal: true,
  },
];

async function main() {
  // Ensure exactly one default plan: clear any prior default first if the seed
  // is going to set a different one.
  const seedDefaultSlug = PLANS.find((p) => p.isDefault)?.slug;
  if (seedDefaultSlug) {
    await prisma.plan.updateMany({
      where: { isDefault: true, NOT: { slug: seedDefaultSlug } },
      data: { isDefault: false },
    });
  }

  for (const plan of PLANS) {
    const result = await prisma.plan.upsert({
      where: { slug: plan.slug },
      create: { ...plan, features: plan.features as any },
      update: {
        // Overwrite display + limits on re-seed (skip Stripe IDs since
        // those are populated by the admin "Sync to Stripe" button).
        name: plan.name,
        description: plan.description,
        priceMonthly: plan.priceMonthly,
        priceYearly: plan.priceYearly,
        creditsPerMonth: plan.creditsPerMonth,
        overageCentsPerCredit: plan.overageCentsPerCredit,
        marketplacesAllowed: plan.marketplacesAllowed,
        imagesPerListing: plan.imagesPerListing,
        teamMembers: plan.teamMembers,
        features: plan.features as any,
        icon: plan.icon,
        iconColor: plan.iconColor,
        ctaText: plan.ctaText,
        ctaStyle: plan.ctaStyle,
        sortOrder: plan.sortOrder,
        highlight: plan.highlight,
        isDefault: plan.isDefault,
        ...(plan.isActive !== undefined ? { isActive: plan.isActive } : {}),
        ...(plan.isUnlimited !== undefined ? { isUnlimited: plan.isUnlimited } : {}),
        ...(plan.isInternal !== undefined ? { isInternal: plan.isInternal } : {}),
      },
    });
    const overage = result.overageCentsPerCredit
      ? ` + $${(result.overageCentsPerCredit / 100).toFixed(2)}/credit`
      : " (hard stop)";
    console.log(
      `✔ ${result.slug.padEnd(10)} — $${(result.priceMonthly / 100).toFixed(2)}/mo · ${result.creditsPerMonth} credits${overage}`,
    );
  }

  // Final safety: if seeding somehow left zero default plans, mark "free".
  const defaults = await prisma.plan.count({ where: { isDefault: true } });
  if (defaults === 0) {
    await prisma.plan.update({ where: { slug: "free" }, data: { isDefault: true } });
    console.log("✔ Set 'free' as default plan");
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
