"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { ShopifyConnect } from "@/components/shopify/ShopifyConnect";
import { ShopifyStoreList } from "@/components/shopify/ShopifyStoreList";
import { ProductGenerator } from "@/components/shopify/ProductGenerator";
import { ProductPreview } from "@/components/shopify/ProductPreview";

interface Store {
  id: string;
  shopName: string;
  shopDomain: string;
  isActive: boolean;
  createdAt: string;
  _count: { products: number };
}

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

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();

  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);
  const [generatedProducts, setGeneratedProducts] = useState<GeneratedProduct[]>([]);
  const [pushing, setPushing] = useState(false);
  const [pushResult, setPushResult] = useState<{
    created: number;
    failed: number;
  } | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // Load connected stores
  const loadStores = useCallback(async () => {
    try {
      const res = await fetch("/api/shopify/stores");
      const data = await res.json();
      if (data.stores) {
        setStores(data.stores);
        // Auto-select first store
        if (data.stores.length > 0 && !selectedStoreId) {
          setSelectedStoreId(data.stores[0].id);
        }
      }
    } catch {
      console.error("Failed to load stores");
    }
  }, [selectedStoreId]);

  useEffect(() => {
    if (status === "authenticated") {
      loadStores();
    }
  }, [status, loadStores]);

  // Check for OAuth callback
  useEffect(() => {
    const shopifyParam = searchParams.get("shopify");
    if (shopifyParam === "connected") {
      setToast("Shopify store connected successfully!");
      loadStores();
      // Clear the URL param
      window.history.replaceState({}, "", "/dashboard");
    }

    const errorParam = searchParams.get("error");
    if (errorParam) {
      setToast(`Connection error: ${errorParam.replace(/_/g, " ")}`);
      window.history.replaceState({}, "", "/dashboard");
    }
  }, [searchParams, loadStores]);

  // Auto-dismiss toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Push products to Shopify
  async function handlePushToShopify(products: GeneratedProduct[], isDraft: boolean) {
    if (!selectedStoreId) return;

    setPushing(true);
    setPushResult(null);

    try {
      const res = await fetch("/api/shopify/products/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeId: selectedStoreId,
          products,
          isDraft,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setPushResult({ created: data.created, failed: data.failed });
        setToast(
          `Pushed ${data.created} product${data.created !== 1 ? "s" : ""} to Shopify${
            isDraft ? " as drafts" : ""
          }!`
        );
        loadStores(); // Refresh product counts
      } else {
        setToast(`Error: ${data.error}`);
      }
    } catch {
      setToast("Network error pushing to Shopify");
    } finally {
      setPushing(false);
    }
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Toast notification */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 max-w-sm rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-lg">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-700">{toast}</span>
            <button
              onClick={() => setToast(null)}
              className="ml-auto text-gray-400 hover:text-gray-600"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      <main className="mx-auto max-w-6xl px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">ProdSamp Dashboard</h1>
          <p className="text-gray-500 mt-1">
            Generate product samples and push them to your Shopify store
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column: Store connection + list */}
          <div className="space-y-6">
            <ShopifyConnect onConnected={loadStores} />

            {stores.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">
                  Connected Stores
                </h3>
                <ShopifyStoreList
                  stores={stores}
                  selectedStoreId={selectedStoreId || undefined}
                  onSelect={(store) => setSelectedStoreId(store.id)}
                  onDisconnect={(storeId) => {
                    setStores((prev) => prev.filter((s) => s.id !== storeId));
                    if (selectedStoreId === storeId) {
                      setSelectedStoreId(null);
                    }
                  }}
                />
              </div>
            )}
          </div>

          {/* Right column: Generator + Preview */}
          <div className="lg:col-span-2 space-y-6">
            <ProductGenerator
              onGenerated={(products) => {
                setGeneratedProducts(products);
                setPushResult(null);
              }}
            />

            {generatedProducts.length > 0 && (
              <ProductPreview
                products={generatedProducts}
                selectedStoreId={selectedStoreId || undefined}
                onPushToShopify={handlePushToShopify}
                pushing={pushing}
              />
            )}

            {pushResult && (
              <div className="rounded-xl border border-green-200 bg-green-50 p-4">
                <div className="flex items-center gap-2">
                  <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <p className="text-sm font-medium text-green-800">
                    {pushResult.created} product{pushResult.created !== 1 ? "s" : ""} created
                    {pushResult.failed > 0 && (
                      <span className="text-red-600 ml-2">
                        ({pushResult.failed} failed)
                      </span>
                    )}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
