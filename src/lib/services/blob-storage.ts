import { put } from '@vercel/blob';
import { ScrapedProduct } from './ebay-scraper';

export interface BlobUploadResult {
  url: string;
  pathname: string;
  size: number;
}

/**
 * Upload scrape results to Vercel Blob
 */
export async function uploadResultsToBlob(
  products: ScrapedProduct[],
  categoryId: string,
  pageCount: number
): Promise<BlobUploadResult> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `SCRAPAGE/ebay-scrape-${categoryId}-${pageCount}pages-${timestamp}.json`;

  const data = {
    metadata: {
      categoryId,
      pageCount,
      timestamp: new Date().toISOString(),
      totalProducts: products.length,
      totalImages: products.reduce((sum, p) => sum + p.imageUrls.length, 0),
    },
    products,
  };

  const jsonContent = JSON.stringify(data, null, 2);

  try {
    const blob = await put(filename, jsonContent, {
      access: 'public',
      contentType: 'application/json',
    });

    return {
      url: blob.url,
      pathname: blob.pathname,
      size: jsonContent.length,
    };
  } catch (error) {
    console.error('Failed to upload to Vercel Blob:', error);
    throw new Error(
      `Blob upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Format bytes to human-readable size
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}
