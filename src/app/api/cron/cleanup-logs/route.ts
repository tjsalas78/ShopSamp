import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    // Delete logs older than 90 days
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

    const result = await prisma.log.deleteMany({
      where: {
        createdAt: { lt: ninetyDaysAgo },
      },
    });

    console.log(`[cron/cleanup-logs] Deleted ${result.count} old logs`);

    return NextResponse.json({
      success: true,
      deletedCount: result.count,
      message: `Deleted ${result.count} logs older than 90 days`,
    });
  } catch (err: any) {
    console.error("[cron/cleanup-logs]", err);
    return NextResponse.json({ error: err.message ?? "Failed to cleanup logs" }, { status: 500 });
  }
}
