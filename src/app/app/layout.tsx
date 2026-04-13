"use client";

import { useSearchParams } from "next/navigation";
import { Provider as AppBridgeProvider } from "@shopify/app-bridge-react";
import { AppProvider as PolarisProvider } from "@shopify/polaris";
import enTranslations from "@shopify/polaris/locales/en.json";
import "@shopify/polaris/build/esm/styles.css";
import { Suspense } from "react";

function EmbeddedProviders({ children }: { children: React.ReactNode }) {
  const params = useSearchParams();
  const host = params.get("host") ?? "";

  const config = {
    apiKey: process.env.NEXT_PUBLIC_SHOPIFY_API_KEY!,
    host,
    forceRedirect: true,
  };

  return (
    <AppBridgeProvider config={config}>
      <PolarisProvider i18n={enTranslations}>{children}</PolarisProvider>
    </AppBridgeProvider>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={null}>
      <EmbeddedProviders>{children}</EmbeddedProviders>
    </Suspense>
  );
}
