/**
 * Image fetcher for product samples.
 * Uses Unsplash API if UNSPLASH_ACCESS_KEY is set,
 * otherwise falls back to source.unsplash.com (no-auth, redirect-based).
 */

export interface ProductImage {
  url: string;
  alt: string;
}

export async function fetchProductImages(
  query: string,
  count: number
): Promise<ProductImage[]> {
  const key = process.env.UNSPLASH_ACCESS_KEY;

  if (key) {
    return fetchViaApi(query, count, key);
  }
  return fetchViaSource(query, count);
}

async function fetchViaApi(
  query: string,
  count: number,
  key: string
): Promise<ProductImage[]> {
  const perPage = Math.min(count, 30);
  const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=${perPage}&orientation=squarish`;

  const res = await fetch(url, {
    headers: { Authorization: `Client-ID ${key}` },
    next: { revalidate: 3600 },
  });

  if (!res.ok) return fetchViaSource(query, count);

  const data = await res.json();
  return (data.results ?? []).slice(0, count).map((photo: { urls: { regular: string }; alt_description: string; description: string }) => ({
    url: photo.urls.regular,
    alt: photo.alt_description ?? photo.description ?? query,
  }));
}

function fetchViaSource(query: string, count: number): ProductImage[] {
  // source.unsplash.com doesn't support bulk — generate unique seed URLs
  const encoded = encodeURIComponent(query.replace(/\s+/g, ","));
  return Array.from({ length: count }, (_, i) => ({
    url: `https://source.unsplash.com/800x800/?${encoded}&sig=${i}`,
    alt: query,
  }));
}
