"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

interface Store {
  id: string;
  shopName: string;
  shopDomain: string;
  isActive: boolean;
  createdAt: string;
  _count: { products: number };
}

interface ShopifyStoreListProps {
  stores: Store[];
  onDisconnect?: (storeId: string) => void;
  onSelect?: (store: Store) => void;
  selectedStoreId?: string;
}

export function ShopifyStoreList({
  stores,
  onDisconnect,
  onSelect,
  selectedStoreId,
}: ShopifyStoreListProps) {
  const [disconnecting, setDisconnecting] = useState<string | null>(null);

  async function handleDisconnect(storeId: string) {
    setDisconnecting(storeId);
    try {
      const res = await fetch("/api/shopify/stores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storeId, action: "disconnect" }),
      });
      if (res.ok) {
        onDisconnect?.(storeId);
      }
    } finally {
      setDisconnecting(null);
    }
  }

  if (stores.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 p-6 text-center">
        <p className="text-sm text-gray-500">No stores connected yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {stores.map((store) => (
        <div
          key={store.id}
          onClick={() => onSelect?.(store)}
          className={`flex items-center justify-between rounded-xl border p-4 cursor-pointer transition-colors ${
            selectedStoreId === store.id
              ? "border-green-500 bg-green-50"
              : "border-gray-200 bg-white hover:border-gray-300"
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-100">
              <span className="text-green-600 text-xs font-bold">
                {store.shopName.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <p className="font-medium text-gray-900 text-sm">{store.shopName}</p>
              <p className="text-xs text-gray-500">
                {store._count.products} product{store._count.products !== 1 ? "s" : ""} synced
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleDisconnect(store.id);
            }}
            disabled={disconnecting === store.id}
            className="text-xs text-gray-400 hover:text-red-600"
          >
            {disconnecting === store.id ? "..." : "Disconnect"}
          </Button>
        </div>
      ))}
    </div>
  );
}
