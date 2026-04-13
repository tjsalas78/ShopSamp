/**
 * Google Product Taxonomy parser.
 * Source: https://www.google.com/basepages/producttype/taxonomy-with-ids.en-US.txt
 *
 * Format: "ID - Full > Path > String"
 * We parse this into a two-level tree for the wizard UI:
 *   top-level → children[]
 */

const TAXONOMY_URL =
  "https://www.google.com/basepages/producttype/taxonomy-with-ids.en-US.txt";

export interface TaxonomyNode {
  id: string;
  label: string;       // last segment only, e.g. "Bird Supplies"
  fullPath: string;    // full path, e.g. "Animals & Pet Supplies > Pet Supplies > Bird Supplies"
  depth: number;       // 0 = top-level, 1 = second-level, etc.
}

export interface TaxonomyTop {
  label: string;
  children: TaxonomyNode[];
}

let _cache: TaxonomyTop[] | null = null;

export async function getGoogleTaxonomy(): Promise<TaxonomyTop[]> {
  if (_cache) return _cache;

  const res = await fetch(TAXONOMY_URL, { next: { revalidate: 86400 } });
  const text = await res.text();

  const lines = text.split("\n").filter((l) => l.trim() && !l.startsWith("#"));

  const topMap = new Map<string, TaxonomyNode[]>();

  for (const line of lines) {
    // Format: "123 - Animals & Pet Supplies > Pet Supplies > Bird Supplies"
    const dashIdx = line.indexOf(" - ");
    if (dashIdx === -1) continue;
    const id = line.slice(0, dashIdx).trim();
    const fullPath = line.slice(dashIdx + 3).trim();

    const parts = fullPath.split(" > ");
    const depth = parts.length - 1;
    const top = parts[0];
    const label = parts[parts.length - 1];

    if (!topMap.has(top)) topMap.set(top, []);

    // Only keep depth 1 (direct children of top-level) for the picker
    // Deeper nodes would make the UI unwieldy — we can expand later
    if (depth === 1) {
      topMap.get(top)!.push({ id, label, fullPath, depth });
    } else if (depth === 0) {
      // Ensure top-level entry exists even if no children yet
      if (!topMap.has(top)) topMap.set(top, []);
    }
  }

  _cache = Array.from(topMap.entries())
    .map(([label, children]) => ({ label, children }))
    .sort((a, b) => a.label.localeCompare(b.label));

  return _cache;
}
