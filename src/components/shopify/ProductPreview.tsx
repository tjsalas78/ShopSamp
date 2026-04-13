"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

interface GeneratedProduct {
  title: string;
  body_html: string;
  vendor: string;
  product_type: string;
  tags: string[];
  price: string;
  compare_at_price?: string;
  variants: {
    option1?: string;
    option2?: string;
    option3?: string;
    price: string;
    sku?: string;
  }[];
}

interface ProductPreviewProps {
  products: GeneratedProduct[];
  selectedStoreId?: string;
  onPushToShopify?: (products: GeneratedProduct[], isDraft: boolean) => void;
  pushing?: boolean;
}

export function ProductPreview({
  products,
  selectedStoreId,
  onPushToShopify,
  pushing,
}: ProductPreviewProps) {
  const [isDraft, setIsDraft] = useState(true);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);

  if (products.length === 0) return null;

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-100 p-4">
        <div>
          <h3 className="font-semibold text-gray-900">
            Generated Products ({products.length})
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Review and push to your Shopify store
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Draft toggle */}
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={isDraft}
              onChange={(e) => setIsDraft(e.target.checked)}
              className="rounded border-gray-300"
            />
            <span className="text-gray-600">Create as drafts</span>
          </label>

          {/* Push button */}
          <Button
            onClick={() => onPushToShopify?.(products, isDraft)}
            disabled={!selectedStoreId || pushing}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {pushing ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Pushing...
              </span>
            ) : (
              `Push ${products.length} to Shopify`
            )}
          </Button>
        </div>
      </div>

      {/* Product list */}
      <div className="divide-y divide-gray-100">
        {products.map((product, index) => (
          <div key={index} className="p-4">
            <div
              className="flex items-center justify-between cursor-pointer"
              onClick={() =>
                setExpandedIndex(expandedIndex === index ? null : index)
              }
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-gray-400 bg-gray-100 rounded px-1.5 py-0.5">
                    #{index + 1}
                  </span>
                  <h4 className="font-medium text-gray-900 text-sm">
                    {product.title}
                  </h4>
                </div>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-sm font-semibold text-green-600">
                    ${product.price}
                  </span>
                  {product.compare_at_price && (
                    <span className="text-xs text-gray-400 line-through">
                      ${product.compare_at_price}
                    </span>
                  )}
                  <span className="text-xs text-gray-500">
                    {product.vendor}
                  </span>
                  <span className="text-xs text-gray-400">
                    {product.variants?.length || 0} variant
                    {(product.variants?.length || 0) !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>
              <svg
                className={`h-4 w-4 text-gray-400 transition-transform ${
                  expandedIndex === index ? "rotate-180" : ""
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>

            {/* Expanded details */}
            {expandedIndex === index && (
              <div className="mt-3 space-y-3 pl-8">
                <div>
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Type
                  </span>
                  <p className="text-sm text-gray-700">{product.product_type}</p>
                </div>

                <div>
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Description
                  </span>
                  <div
                    className="text-sm text-gray-700 mt-1 prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: product.body_html }}
                  />
                </div>

                {product.tags?.length > 0 && (
                  <div>
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Tags
                    </span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {product.tags.map((tag, i) => (
                        <span
                          key={i}
                          className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {product.variants?.length > 0 && (
                  <div>
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Variants
                    </span>
                    <div className="mt-1 space-y-1">
                      {product.variants.map((v, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-3 text-xs text-gray-600 bg-gray-50 rounded px-2 py-1"
                        >
                          {v.option1 && <span>{v.option1}</span>}
                          {v.option2 && <span>/ {v.option2}</span>}
                          {v.option3 && <span>/ {v.option3}</span>}
                          <span className="ml-auto font-medium">${v.price}</span>
                          {v.sku && (
                            <span className="font-mono text-gray-400">
                              {v.sku}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
