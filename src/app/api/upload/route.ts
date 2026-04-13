/**
 * POST /api/upload — Upload image to Vercel Blob
 * DELETE /api/upload — Delete images from Vercel Blob
 */

import { NextRequest, NextResponse } from "next/server";
import { put, del } from "@vercel/blob";

const ALLOWED_MIME = new Set([
  "image/jpeg", "image/jpg", "image/png", "image/webp",
]);

function isAllowedFile(file: File): boolean {
  return ALLOWED_MIME.has(file.type);
}

function sanitizeFilename(name: string): string {
  const base = name.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9._-]/g, "");
  return `${Date.now()}-${base}`;
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided." }, { status: 400 });
    }

    if (!isAllowedFile(file)) {
      return NextResponse.json(
        { error: "Please upload a JPG, PNG, or WebP image." },
        { status: 400 }
      );
    }

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json({ error: "Image must be under 10 MB." }, { status: 400 });
    }

    const safeName = sanitizeFilename(file.name);
    const ext = (file.name.split(".").pop() ?? "jpg").toLowerCase();
    const pathname = `prodsamp/${safeName}.${ext}`;

    const blob = await put(pathname, file, {
      access: "public",
      contentType: file.type,
      addRandomSuffix: true,
    });

    return NextResponse.json({ url: blob.url });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[upload] failed:", msg);
    return NextResponse.json({ error: `Upload failed: ${msg}` }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { urls } = await req.json() as { urls: string[] };
    if (!Array.isArray(urls) || urls.length === 0) {
      return NextResponse.json({ ok: true });
    }

    const blobUrls = urls.filter(url => url.includes("blob.vercel-storage.com"));
    if (blobUrls.length > 0) {
      await del(blobUrls);
    }

    return NextResponse.json({ ok: true, deleted: blobUrls.length });
  } catch (err: unknown) {
    console.error("[upload] delete failed:", err);
    return NextResponse.json({ error: "Delete failed." }, { status: 500 });
  }
}
