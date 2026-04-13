"use client";

import { useState, useCallback } from "react";
import {
  Layout,
  Card,
  FormLayout,
  TextField,
  Select,
  RangeSlider,
  Button,
  ButtonGroup,
  InlineStack,
  BlockStack,
  Text,
  Divider,
  Tag,
  Spinner,
  Banner,
  Checkbox,
  Badge,
  Collapsible,
} from "@shopify/polaris";
import { ProductPreview } from "./ProductPreview";

interface Props {
  shop: string;
}

const CATEGORY_OPTIONS = [
  { label: "— Select category —", value: "" },
  { label: "Apparel & Clothing", value: "apparel" },
  { label: "Electronics & Gadgets", value: "electronics" },
  { label: "Home & Garden", value: "home-garden" },
  { label: "Sports & Outdoors", value: "sports" },
  { label: "Beauty & Personal Care", value: "beauty" },
  { label: "Toys & Games", value: "toys" },
  { label: "Books & Media", value: "books" },
  { label: "Food & Grocery", value: "food" },
  { label: "Automotive", value: "automotive" },
  { label: "Furniture", value: "furniture" },
  { label: "Jewelry & Accessories", value: "jewelry" },
  { label: "Pet Supplies", value: "pets" },
  { label: "Health & Wellness", value: "health" },
  { label: "Office & Stationery", value: "office" },
  { label: "Art & Craft Supplies", value: "art" },
];

const VARIANT_PRESETS = [
  { label: "None", value: "none" },
  { label: "Color only", value: "color" },
  { label: "Size only", value: "size" },
  { label: "Color + Size", value: "color-size" },
  { label: "Color + Size + Condition", value: "color-size-condition" },
  { label: "Condition only", value: "condition" },
];

const DEFAULT_COLORS = ["Black", "White", "Navy", "Red", "Green", "Gray"];
const DEFAULT_SIZES = ["XS", "S", "M", "L", "XL", "XXL"];
const DEFAULT_CONDITIONS = ["New", "Like New", "Good", "Fair"];

export function ProductGenerator({ shop }: Props) {
  const [category, setCategory] = useState("");
  const [keywords, setKeywords] = useState("");
  const [quantity, setQuantity] = useState<number>(5);
  const [variantPreset, setVariantPreset] = useState("none");
  const [isDraft, setIsDraft] = useState(true);
  const [priceMin, setPriceMin] = useState("9.99");
  const [priceMax, setPriceMax] = useState("99.99");
  const [brand, setBrand] = useState("");
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const [loading, setLoading] = useState(false);
  const [pushing, setPushing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [generated, setGenerated] = useState<GeneratedProduct[] | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());

  const handleGenerate = useCallback(async () => {
    if (!category) {
      setError("Please select a product category.");
      return;
    }
    setError(null);
    setSuccess(null);
    setGenerated(null);
    setSelected(new Set());
    setLoading(true);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shop,
          category,
          keywords,
          quantity,
          variantPreset,
          priceMin: parseFloat(priceMin),
          priceMax: parseFloat(priceMax),
          brand,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Generation failed");
      }

      const data = await res.json();
      setGenerated(data.products);
      setSelected(new Set(data.products.map((_: GeneratedProduct, i: number) => i)));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [shop, category, keywords, quantity, variantPreset, priceMin, priceMax, brand]);

  const handlePushToShopify = useCallback(async () => {
    if (!generated || selected.size === 0) return;
    setPushing(true);
    setError(null);
    setSuccess(null);

    const products = generated.filter((_, i) => selected.has(i));

    try {
      const res = await fetch("/api/shopify/products/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shop, products, isDraft }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Push failed");
      }

      const data = await res.json();
      setSuccess(
        `${data.created} product${data.created !== 1 ? "s" : ""} pushed to Shopify${isDraft ? " as drafts" : " and published"}.`
      );
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setPushing(false);
    }
  }, [shop, generated, selected, isDraft]);

  const toggleSelect = (i: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };

  const selectAll = () => generated && setSelected(new Set(generated.map((_, i) => i)));
  const deselectAll = () => setSelected(new Set());

  return (
    <Layout>
      {/* ── Generator Controls ──────────────────────────────── */}
      <Layout.Section variant="oneThird">
        <BlockStack gap="400">
          <Card>
            <BlockStack gap="400">
              <Text variant="headingMd" as="h2">
                Sample Configuration
              </Text>

              <FormLayout>
                <Select
                  label="Product Category"
                  options={CATEGORY_OPTIONS}
                  value={category}
                  onChange={setCategory}
                  helpText="Determines the product type Claude generates"
                />

                <TextField
                  label="Keywords / Theme"
                  value={keywords}
                  onChange={setKeywords}
                  placeholder="e.g. vintage, minimalist, streetwear, eco-friendly"
                  helpText="Influences product titles, descriptions, and tags"
                  autoComplete="off"
                />

                <TextField
                  label="Brand / Vendor (optional)"
                  value={brand}
                  onChange={setBrand}
                  placeholder="e.g. Acme Co, TestBrand"
                  autoComplete="off"
                />

                <RangeSlider
                  label={`Quantity: ${quantity}`}
                  value={quantity}
                  min={1}
                  max={50}
                  step={1}
                  onChange={(v) => setQuantity(v as number)}
                  helpText="Up to 50 products per batch"
                />

                <Select
                  label="Variant Structure"
                  options={VARIANT_PRESETS}
                  value={variantPreset}
                  onChange={setVariantPreset}
                  helpText="Shopify variant options to add to each product"
                />

                <InlineStack gap="300">
                  <div style={{ flex: 1 }}>
                    <TextField
                      label="Min Price ($)"
                      type="number"
                      value={priceMin}
                      onChange={setPriceMin}
                      autoComplete="off"
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <TextField
                      label="Max Price ($)"
                      type="number"
                      value={priceMax}
                      onChange={setPriceMax}
                      autoComplete="off"
                    />
                  </div>
                </InlineStack>
              </FormLayout>

              <Divider />

              <Button
                variant="plain"
                onClick={() => setAdvancedOpen((o) => !o)}
                ariaExpanded={advancedOpen}
              >
                {advancedOpen ? "Hide advanced options" : "Show advanced options"}
              </Button>
              <Collapsible open={advancedOpen} id="advanced-options">
                <BlockStack gap="300">
                  <Checkbox
                    label="Create as drafts (recommended)"
                    checked={isDraft}
                    onChange={setIsDraft}
                    helpText="Drafts won't be visible to customers until you publish them"
                  />
                </BlockStack>
              </Collapsible>

              <Button
                variant="primary"
                size="large"
                onClick={handleGenerate}
                loading={loading}
                disabled={!category || loading}
                fullWidth
              >
                {loading ? "Generating…" : `Generate ${quantity} Sample${quantity !== 1 ? "s" : ""}`}
              </Button>
            </BlockStack>
          </Card>

          {variantPreset !== "none" && (
            <Card>
              <BlockStack gap="200">
                <Text variant="headingSm" as="h3">
                  Variant Preview
                </Text>
                {(variantPreset === "color" || variantPreset === "color-size" || variantPreset === "color-size-condition") && (
                  <BlockStack gap="100">
                    <Text variant="bodySm" as="p" tone="subdued">Colors</Text>
                    <InlineStack gap="100" wrap>
                      {DEFAULT_COLORS.map((c) => <Tag key={c}>{c}</Tag>)}
                    </InlineStack>
                  </BlockStack>
                )}
                {(variantPreset === "size" || variantPreset === "color-size" || variantPreset === "color-size-condition") && (
                  <BlockStack gap="100">
                    <Text variant="bodySm" as="p" tone="subdued">Sizes</Text>
                    <InlineStack gap="100" wrap>
                      {DEFAULT_SIZES.map((s) => <Tag key={s}>{s}</Tag>)}
                    </InlineStack>
                  </BlockStack>
                )}
                {(variantPreset === "condition" || variantPreset === "color-size-condition") && (
                  <BlockStack gap="100">
                    <Text variant="bodySm" as="p" tone="subdued">Conditions</Text>
                    <InlineStack gap="100" wrap>
                      {DEFAULT_CONDITIONS.map((c) => <Tag key={c}>{c}</Tag>)}
                    </InlineStack>
                  </BlockStack>
                )}
              </BlockStack>
            </Card>
          )}
        </BlockStack>
      </Layout.Section>

      {/* ── Preview + Push ──────────────────────────────────── */}
      <Layout.Section>
        <BlockStack gap="400">
          {error && (
            <Banner tone="critical" title="Error" onDismiss={() => setError(null)}>
              {error}
            </Banner>
          )}
          {success && (
            <Banner tone="success" title="Done!" onDismiss={() => setSuccess(null)}>
              {success}
            </Banner>
          )}

          {loading && (
            <Card>
              <InlineStack align="center" gap="300">
                <Spinner size="small" />
                <Text as="p">Claude is generating your products…</Text>
              </InlineStack>
            </Card>
          )}

          {generated && generated.length > 0 && (
            <>
              <Card>
                <InlineStack align="space-between" blockAlign="center">
                  <InlineStack gap="200" blockAlign="center">
                    <Text variant="headingMd" as="h2">
                      Generated Products
                    </Text>
                    <Badge tone="info">{`${selected.size} / ${generated.length} selected`}</Badge>
                  </InlineStack>
                  <ButtonGroup>
                    <Button variant="plain" onClick={selectAll}>Select all</Button>
                    <Button variant="plain" onClick={deselectAll}>Deselect all</Button>
                    <Button
                      variant="primary"
                      onClick={handlePushToShopify}
                      loading={pushing}
                      disabled={selected.size === 0 || pushing}
                    >
                      {pushing
                        ? "Pushing…"
                        : `Push ${selected.size} to Shopify${isDraft ? " (Draft)" : ""}`}
                    </Button>
                  </ButtonGroup>
                </InlineStack>
              </Card>

              <BlockStack gap="300">
                {generated.map((product, i) => (
                  <ProductPreview
                    key={i}
                    product={product}
                    selected={selected.has(i)}
                    onToggle={() => toggleSelect(i)}
                  />
                ))}
              </BlockStack>
            </>
          )}

          {!generated && !loading && (
            <Card>
              <BlockStack gap="200" align="center">
                <Text variant="headingMd" as="h2" alignment="center">
                  No samples yet
                </Text>
                <Text as="p" tone="subdued" alignment="center">
                  Configure your settings and click Generate to create realistic product samples with AI.
                </Text>
              </BlockStack>
            </Card>
          )}
        </BlockStack>
      </Layout.Section>
    </Layout>
  );
}

export interface GeneratedProduct {
  title: string;
  body_html: string;
  vendor: string;
  product_type: string;
  tags: string[];
  price: string;
  compare_at_price?: string;
  variants: ProductVariant[];
  seo_title?: string;
  seo_description?: string;
}

export interface ProductVariant {
  option1?: string;
  option2?: string;
  option3?: string;
  price: string;
  compare_at_price?: string;
  sku?: string;
  inventory_quantity?: number;
}
