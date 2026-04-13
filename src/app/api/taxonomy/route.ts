import { NextResponse } from "next/server";
import { getGoogleTaxonomy } from "@/lib/taxonomy/google";

/**
 * GET /api/taxonomy
 * Returns the Google Product Taxonomy as a two-level tree.
 * Cached on the server for 24h.
 */
export async function GET() {
  const taxonomy = await getGoogleTaxonomy();
  return NextResponse.json({ taxonomy });
}
