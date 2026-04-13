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

interface ProductGeneratorProps {
  onGenerated?: (products: GeneratedProduct[]) => void;
}

export function ProductGenerator({ onGenerated }: ProductGeneratorProps) {
  const [category, setCategory] = useState("");
  const [keywords, setKeywords] = useState("");
  const [count, setCount] = useState(3);
  const [style, setStyle] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleGenerate() {
    if (!category.trim()) {
      setError("Enter a product category");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: category.trim(),
          keywords: keywords
            .split(",")
            .map((k) => k.trim())
            .filter(Boolean),
          count,
          style: style || undefined,
          includeVariants: true,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Generation failed");
        return;
      }

      onGenerated?.(data.products);
    } catch {
      setError("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <h3 className="font-semibold text-gray-900 mb-4">Generate Product Samples</h3>

      <div className="space-y-4">
        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Product Category *
          </label>
          <input
            type="text"
            placeholder='e.g., "Mens Sneakers", "Vintage Dresses", "Electronics"'
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setError("");
            }}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Keywords */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Keywords (comma-separated)
          </label>
          <input
            type="text"
            placeholder='e.g., "leather, premium, handmade"'
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Count + Style row */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Number of Samples
            </label>
            <select
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            >
              {[1, 3, 5, 10].map((n) => (
                <option key={n} value={n}>
                  {n} product{n > 1 ? "s" : ""}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Style / Aesthetic
            </label>
            <select
              value={style}
              onChange={(e) => setStyle(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            >
              <option value="">Any</option>
              <option value="luxury">Luxury</option>
              <option value="budget">Budget-friendly</option>
              <option value="vintage">Vintage</option>
              <option value="modern">Modern / Minimal</option>
              <option value="streetwear">Streetwear</option>
              <option value="sustainable">Sustainable / Eco</option>
            </select>
          </div>
        </div>

        {/* Generate button */}
        <Button
          onClick={handleGenerate}
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Generating with Claude AI...
            </span>
          ) : (
            `Generate ${count} Sample${count > 1 ? "s" : ""}`
          )}
        </Button>

        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    </div>
  );
}
