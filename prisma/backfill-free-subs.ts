/**
 * One-shot backfill: every existing user without a Subscription row gets
 * placed on the default (free) plan. Idempotent — re-running is a no-op.
 *
 * Run with:
 *   npx tsx prisma/backfill-free-subs.ts
 */

import { prisma } from "../src/lib/prisma";

async function main() {
  const defaultPlan = await prisma.plan.findFirst({
    where: { isDefault: true },
  });
  if (!defaultPlan) {
    console.error("No default plan found. Run `npx tsx prisma/seed-plans.ts` first.");
    process.exit(1);
  }

  const usersWithoutSub = await prisma.user.findMany({
    where: { subscription: null },
    select: { id: true, email: true },
  });

  if (usersWithoutSub.length === 0) {
    console.log("✔ Every user already has a subscription. Nothing to do.");
    return;
  }

  console.log(`Backfilling ${usersWithoutSub.length} user(s) onto plan "${defaultPlan.slug}"…`);

  for (const u of usersWithoutSub) {
    await prisma.subscription.create({
      data: {
        userId: u.id,
        planId: defaultPlan.id,
        status: "active",
        interval: "monthly",
      },
    });
    console.log(`  ✔ ${u.email}`);
  }

  console.log(`Done. Created ${usersWithoutSub.length} subscription(s).`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
