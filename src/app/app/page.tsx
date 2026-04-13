"use client";

import { useSearchParams } from "next/navigation";
import { Page, Layout, Banner } from "@shopify/polaris";
import { Suspense } from "react";
import { Wizard } from "@/components/shopsamp/Wizard";

function AppContent() {
  const params = useSearchParams();
  const shop = params.get("shop") ?? "";

  return (
    <Page
      title="ShopSamp"
      subtitle="Generate realistic product samples for your Shopify store"
    >
      {!shop ? (
        <Layout>
          <Layout.Section>
            <Banner tone="warning" title="Shop not detected">
              Open this app from your Shopify Admin to get started.
            </Banner>
          </Layout.Section>
        </Layout>
      ) : (
        <Wizard shop={shop} />
      )}
    </Page>
  );
}

export default function AppPage() {
  return (
    <Suspense fallback={null}>
      <AppContent />
    </Suspense>
  );
}
