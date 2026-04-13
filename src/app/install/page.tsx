"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

/**
 * Install page — shown when merchants visit the app URL directly (not via Shopify Admin).
 * Collects their shop domain and kicks off the OAuth install flow.
 */
export default function InstallPage() {
  const [shop, setShop] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const raw = shop.trim().toLowerCase().replace(/^https?:\/\//, "");
    if (!raw) return;
    const domain = raw.endsWith(".myshopify.com") ? raw : `${raw}.myshopify.com`;
    router.push(`/api/shopify/auth?shop=${encodeURIComponent(domain)}`);
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "system-ui, sans-serif",
        background: "#f6f6f7",
        padding: "24px",
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: "12px",
          padding: "48px",
          maxWidth: "420px",
          width: "100%",
          boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
        }}
      >
        <h1 style={{ fontSize: "24px", fontWeight: 700, marginBottom: "8px" }}>
          Install ShopSamp
        </h1>
        <p style={{ color: "#6d7175", marginBottom: "32px", fontSize: "14px" }}>
          Generate AI-powered product samples for your Shopify store in seconds.
          Enter your store URL to get started.
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "16px" }}>
            <label
              htmlFor="shop"
              style={{ display: "block", fontWeight: 500, marginBottom: "6px", fontSize: "14px" }}
            >
              Shopify Store URL
            </label>
            <input
              id="shop"
              type="text"
              value={shop}
              onChange={(e) => { setShop(e.target.value); setError(""); }}
              placeholder="your-store.myshopify.com"
              style={{
                width: "100%",
                padding: "10px 12px",
                border: "1px solid #d1d5db",
                borderRadius: "8px",
                fontSize: "14px",
                outline: "none",
                boxSizing: "border-box",
              }}
              required
            />
            {error && (
              <p style={{ color: "#e53e3e", fontSize: "12px", marginTop: "4px" }}>{error}</p>
            )}
          </div>

          <button
            type="submit"
            style={{
              width: "100%",
              padding: "12px",
              background: "#008060",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              fontSize: "15px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Install App →
          </button>
        </form>

        <p style={{ color: "#9ca3af", fontSize: "12px", marginTop: "24px", textAlign: "center" }}>
          You&apos;ll be redirected to Shopify to approve access.
        </p>
      </div>
    </main>
  );
}
