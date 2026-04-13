import { NextRequest, NextResponse } from "next/server";
import { del } from "@vercel/blob";
import { v2 as cloudinary } from "cloudinary";
import { prisma } from "@/lib/prisma";

// Legacy Cloudinary config — kept only to clean up records from the pre-Blob era.
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Cleanup orphaned and deleted images:
 * - Pending images older than 6 hours (orphaned uploads)
 * - Deleted images older than 24 hours (soft-deleted images)
 *
 * Deletes from both Vercel Blob (new uploads) and Cloudinary (legacy records)
 * based on the `imageService` field, then removes the DB record.
 */
export async function POST(req: NextRequest) {
  try {
    const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const orphanedImages = await prisma.image.findMany({
      where: {
        status: "pending",
        uploadedAt: { lt: sixHoursAgo },
      },
    });

    const deletedImages = await prisma.image.findMany({
      where: {
        status: "deleted",
        deletedAt: { lt: twentyFourHoursAgo },
      },
    });

    const totalImages = orphanedImages.length + deletedImages.length;
    console.log(
      `[cleanup-images] Found ${orphanedImages.length} orphaned + ${deletedImages.length} deleted images to clean up`
    );

    if (totalImages === 0) {
      return NextResponse.json({ ok: true, cleaned: 0 });
    }

    const allImages = [...orphanedImages, ...deletedImages];

    // Delete from Vercel Blob (new service). imageId holds the full blob URL.
    const blobUrls = allImages
      .filter(img => img.imageService === "blob")
      .map(img => img.imageId)
      .filter(url => url && url.includes("blob.vercel-storage.com"));

    let blobDeleted = 0;
    if (blobUrls.length > 0) {
      try {
        await del(blobUrls);
        blobDeleted = blobUrls.length;
        console.log(`[cleanup-images] Deleted ${blobDeleted} images from Vercel Blob`);
      } catch (err) {
        console.error("[cleanup-images] Failed to delete from Vercel Blob:", err);
        // Continue with DB cleanup even if Blob deletion fails.
      }
    }

    // Delete from Cloudinary (legacy service). imageId holds the Cloudinary public_id.
    const cloudinaryIds = allImages
      .filter(img => img.imageService === "cloudinary")
      .map(img => img.imageId)
      .filter(Boolean);

    let cloudinaryDeleted = 0;
    if (cloudinaryIds.length > 0) {
      try {
        await cloudinary.api.delete_resources(cloudinaryIds);
        cloudinaryDeleted = cloudinaryIds.length;
        console.log(`[cleanup-images] Deleted ${cloudinaryDeleted} legacy images from Cloudinary`);
      } catch (err) {
        console.error("[cleanup-images] Failed to delete from Cloudinary:", err);
      }
    }

    const deleteResult = await prisma.image.deleteMany({
      where: {
        OR: [
          {
            status: "pending",
            uploadedAt: { lt: sixHoursAgo },
          },
          {
            status: "deleted",
            deletedAt: { lt: twentyFourHoursAgo },
          },
        ],
      },
    });

    console.log(`[cleanup-images] Deleted ${deleteResult.count} image records from database`);

    return NextResponse.json({
      ok: true,
      cleaned: deleteResult.count,
      blobDeleted,
      cloudinaryDeleted,
      orphanedCleaned: orphanedImages.length,
      deletedCleaned: deletedImages.length,
    });
  } catch (err: any) {
    const msg = err?.message ?? String(err);
    console.error("[cleanup-images] Cleanup failed:", msg);
    return NextResponse.json(
      { error: `Cleanup failed: ${msg}` },
      { status: 500 }
    );
  }
}
