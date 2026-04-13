"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

interface ShopifyConnectProps {
  onConnected?: () => void;
}

export function ShopifyConnect({ onConnected }: ShopifyConnectProps) {
  const [shop, setShop] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleConnect() {
    if (!shop.trim()) {
      setError("Enter your Shopify store name");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/shopify/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shop: shop.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to connect");
        return;
      }

      // Store state for CSRF validation
      sessionStorage.setItem("shopify_oauth_state", data.state);

      // Redirect to Shopify OAuth
      window.location.href = data.authUrl;
    } catch {
      setError("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
          <svg className="h-5 w-5 text-green-600" fill="currentColor" viewBox="0 0 24 24">
            <path d="M15.34 3.27c-.2-.13-.42-.2-.66-.2h-.26l-.46-.53c-.28-.32-.7-.5-1.12-.44-.08-.24-.2-.46-.36-.64A1.55 1.55 0 0011.36 1c-.68.08-1.28.48-1.68 1.12-.52.84-.84 1.9-.94 2.68l-1.76.54c-.36.12-.62.36-.7.68L4 14.18s3.08 5.62 3.08 5.64l9.22-2.84.4-.12c1.58-1.44 3.3-3.98 3.3-7.14 0-2.12-.88-4.52-2.5-5.72l-.02-.02-.02-.02-2.12.31zm-1.2 1.13l-.58 1.76-2.08.64c.14-.68.4-1.46.78-2.04.22-.34.56-.62.94-.68.36-.04.66.12.94.32zM12.12 2c-.22.04-.42.14-.58.3.04.04.06.08.08.12l-.02-.02c.18-.2.34-.32.52-.4z"/>
          </svg>
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">Connect Shopify Store</h3>
          <p className="text-sm text-gray-500">Link your store to push products directly</p>
        </div>
      </div>

      <div className="flex gap-2">
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="your-store"
            value={shop}
            onChange={(e) => {
              setShop(e.target.value);
              setError("");
            }}
            onKeyDown={(e) => e.key === "Enter" && handleConnect()}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 pr-32 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
            .myshopify.com
          </span>
        </div>
        <Button
          onClick={handleConnect}
          disabled={loading}
          className="bg-green-600 hover:bg-green-700 text-white px-4"
        >
          {loading ? "Connecting..." : "Connect"}
        </Button>
      </div>

      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}
