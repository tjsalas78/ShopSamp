"use client";

import { useSearchParams } from "next/navigation";
import { AppProvider } from "@shopify/app-bridge-react";
import { AppProvider as PolarisProvider } from "@shopify/polaris";
import enTranslations from "@shopify/polaris/locales/en.json";
import "@shopify/polaris/build/esm/styles.css";
import { Suspense } from "react";

function EmbeddedProviders({ children }: { children: React.ReactNode }) {
  const params = useSearchParams();
  const host = params.get("host") ?? "";

  return (
    <AppProvider
      id={process.env.NEXT_PUBLIC_SHOPIFY_API_KEY!}
      host={host}
      forceRedirect
    >
      <PolarisProvider i18n={enTranslations}>{children}</PolarisProvider>
    </AppProvider>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={null}>
      <EmbeddedProviders>{children}</EmbeddedProviders>
    </Suspense>
  );
}
