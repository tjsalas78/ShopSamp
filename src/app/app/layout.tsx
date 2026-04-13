"use client";

import { AppProvider as PolarisProvider } from "@shopify/polaris";
import enTranslations from "@shopify/polaris/locales/en.json";
import "@shopify/polaris/build/esm/styles.css";
import { Suspense } from "react";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={null}>
      <PolarisProvider i18n={enTranslations}>
        {children}
      </PolarisProvider>
    </Suspense>
  );
}
