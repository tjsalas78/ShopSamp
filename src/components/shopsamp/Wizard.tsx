"use client";

import {
  Card,
  BlockStack,
  InlineStack,
  Text,
  Button,
  ButtonGroup,
  Divider,
  Banner,
  Spinner,
  Badge,
  RangeSlider,
  Select,
  Checkbox,
  ProgressBar,
} from "@shopify/polaris";
import { useState } from "react";
import { CategoryPicker } from "./CategoryPicker";

interface TaxonomyNode {
  id: string;
  label: string;
  fullPath: string;
}

interface WizardConfig {
  categories: TaxonomyNode[];
  productsPerCategory: number;
  imagesPerProduct: number;
  isDraft: boolean;
  variantPreset: string;
}

interface GeneratedProduct {
  title: string;
  body_html: string;
  vendor: string;
  product_type: string;
  tags: string[];
  price: string;
  compare_at_price?: string;
  variants: { option1?: string; option2?: string; option3?: string; price: string; sku?: string }[];
  images: { src: string; alt: string }[];
  category: string;
}

const VARIANT_OPTIONS = [
  { label: "No variants", value: "none" },
  { label: "Color", value: "color" },
  { label: "Size", value: "size" },
  { label: "Color + Size", value: "color-size" },
  { label: "Condition (New → Fair)", value: "condition" },
];

interface Props {
  shop: string;
}

export function Wizard({ shop }: Props) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [config, setConfig] = useState<WizardConfig>({
    categories: [],
    productsPerCategory: 3,
    imagesPerProduct: 2,
    isDraft: true,
    variantPreset: "none",
  });

  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<GeneratedProduct[]>([]);
  const [pushing, setPushing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedIdxs, setSelectedIdxs] = useState<Set<number>>(new Set());

  const totalProducts = config.categories.length * config.productsPerCategory;

  async function handleGenerate() {
    setGenerating(true);
    setError(null);
    setResults([]);
    setProgress(0);
    setSelectedIdxs(new Set());

    const all: GeneratedProduct[] = [];

    for (let i = 0; i < config.categories.length; i++) {
      const cat = config.categories[i];
      try {
        const res = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            shop,
            category: cat.fullPath,
            quantity: config.productsPerCategory,
            variantPreset: config.variantPreset,
            imagesPerProduct: config.imagesPerProduct,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          const tagged = (data.products ?? []).map((p: GeneratedProduct) => ({
            ...p,
            category: cat.label,
          }));
          all.push(...tagged);
        }
      } catch {
        // continue to next category
      }
      setProgress(Math.round(((i + 1) / config.categories.length) * 100));
    }

    setResults(all);
    setSelectedIdxs(new Set(all.map((_, i) => i)));
    setGenerating(false);
    setStep(3);
  }

  async function handlePush() {
    const products = results.filter((_, i) => selectedIdxs.has(i));
    if (!products.length) return;
    setPushing(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/shopify/products/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shop, products, isDraft: config.isDraft }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Push failed");
      setSuccess(`${data.created} product${data.created !== 1 ? "s" : ""} pushed${config.isDraft ? " as drafts" : " and published"}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Push failed");
    } finally {
      setPushing(false);
    }
  }

  function toggleIdx(i: number) {
    setSelectedIdxs((prev) => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  }

  return (
    <BlockStack gap="500">
      {/* ── Step indicators ── */}
      <InlineStack gap="300" align="center">
        {([1, 2, 3] as const).map((s) => (
          <InlineStack key={s} gap="100" blockAlign="center">
            <div style={{
              width: 28, height: 28, borderRadius: "50%",
              background: step >= s ? "#008060" : "#e4e5e7",
              color: step >= s ? "#fff" : "#6d7175",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 13, fontWeight: 600,
            }}>{s}</div>
            <Text as="span" variant="bodySm" tone={step >= s ? undefined : "subdued"}>
              {s === 1 ? "Categories" : s === 2 ? "Configure" : "Preview & Push"}
            </Text>
            {s < 3 && <Text as="span" tone="subdued"> → </Text>}
          </InlineStack>
        ))}
      </InlineStack>

      {/* ──────── STEP 1: Category selection ──────── */}
      {step === 1 && (
        <Card>
          <BlockStack gap="400">
            <BlockStack gap="100">
              <Text variant="headingMd" as="h2">Pick Categories</Text>
              <Text as="p" tone="subdued">
                Select up to 10 subcategories from the Google Product Taxonomy. ShopSamp will generate products for each.
              </Text>
            </BlockStack>

            <Divider />

            <CategoryPicker
              selected={config.categories}
              onChange={(cats) => setConfig((c) => ({ ...c, categories: cats }))}
              max={10}
            />

            <Divider />

            <InlineStack align="end">
              <Button
                variant="primary"
                disabled={config.categories.length === 0}
                onClick={() => setStep(2)}
              >
                Next: Configure →
              </Button>
            </InlineStack>
          </BlockStack>
        </Card>
      )}

      {/* ──────── STEP 2: Configuration ──────── */}
      {step === 2 && (
        <Card>
          <BlockStack gap="400">
            <BlockStack gap="100">
              <Text variant="headingMd" as="h2">Configure Samples</Text>
              <InlineStack gap="200" wrap>
                {config.categories.map((c) => (
                  <Badge key={c.id} tone="info">{c.label}</Badge>
                ))}
              </InlineStack>
            </BlockStack>

            <Divider />

            <BlockStack gap="400">
              <BlockStack gap="100">
                <RangeSlider
                  label={`Products per category: ${config.productsPerCategory}`}
                  value={config.productsPerCategory}
                  min={1}
                  max={20}
                  step={1}
                  onChange={(v) => setConfig((c) => ({ ...c, productsPerCategory: v as number }))}
                />
                <Text as="p" tone="subdued" variant="bodySm">
                  Total: {totalProducts} product{totalProducts !== 1 ? "s" : ""} across {config.categories.length} categor{config.categories.length !== 1 ? "ies" : "y"}
                </Text>
              </BlockStack>

              <RangeSlider
                label={`Images per product: ${config.imagesPerProduct}`}
                value={config.imagesPerProduct}
                min={0}
                max={5}
                step={1}
                onChange={(v) => setConfig((c) => ({ ...c, imagesPerProduct: v as number }))}
                helpText="Images are sourced from Unsplash, matched to product title + category"
              />

              <Select
                label="Variant structure"
                options={VARIANT_OPTIONS}
                value={config.variantPreset}
                onChange={(v) => setConfig((c) => ({ ...c, variantPreset: v }))}
              />

              <Checkbox
                label="Create as drafts"
                checked={config.isDraft}
                onChange={(v) => setConfig((c) => ({ ...c, isDraft: v }))}
                helpText="Drafts are hidden from customers until you publish"
              />
            </BlockStack>

            <Divider />

            <InlineStack align="space-between">
              <Button onClick={() => setStep(1)}>← Back</Button>
              <Button variant="primary" onClick={handleGenerate}>
                Generate {totalProducts} Products →
              </Button>
            </InlineStack>
          </BlockStack>
        </Card>
      )}

      {/* ──────── Generating progress ──────── */}
      {generating && (
        <Card>
          <BlockStack gap="300">
            <InlineStack gap="300" blockAlign="center">
              <Spinner size="small" />
              <Text as="p">
                Generating category {Math.ceil((progress / 100) * config.categories.length)} of {config.categories.length}…
              </Text>
            </InlineStack>
            <ProgressBar progress={progress} size="small" tone="highlight" />
          </BlockStack>
        </Card>
      )}

      {/* ──────── STEP 3: Preview + Push ──────── */}
      {step === 3 && results.length > 0 && !generating && (
        <BlockStack gap="400">
          {error && <Banner tone="critical" onDismiss={() => setError(null)}>{error}</Banner>}
          {success && <Banner tone="success" onDismiss={() => setSuccess(null)}>{success}</Banner>}

          <Card>
            <InlineStack align="space-between" blockAlign="center">
              <InlineStack gap="200" blockAlign="center">
                <Text variant="headingMd" as="h2">Generated Products</Text>
                <Badge tone="info">{selectedIdxs.size} / {results.length} selected</Badge>
              </InlineStack>
              <ButtonGroup>
                <Button variant="plain" onClick={() => setStep(1)}>← Start over</Button>
                <Button variant="plain" onClick={() => setSelectedIdxs(new Set(results.map((_, i) => i)))}>
                  Select all
                </Button>
                <Button variant="plain" onClick={() => setSelectedIdxs(new Set())}>
                  Deselect all
                </Button>
                <Button
                  variant="primary"
                  onClick={handlePush}
                  loading={pushing}
                  disabled={selectedIdxs.size === 0 || pushing}
                >
                  Push {selectedIdxs.size} to Shopify{config.isDraft ? " (Draft)" : ""}
                </Button>
              </ButtonGroup>
            </InlineStack>
          </Card>

          {/* Group by category */}
          {config.categories.map((cat) => {
            const catProducts = results
              .map((p, i) => ({ p, i }))
              .filter(({ p }) => p.category === cat.label);
            if (!catProducts.length) return null;
            return (
              <BlockStack key={cat.id} gap="200">
                <InlineStack gap="200" blockAlign="center">
                  <Text variant="headingSm" as="h3">{cat.label}</Text>
                  <Badge>{catProducts.length} products</Badge>
                </InlineStack>
                {catProducts.map(({ p, i }) => (
                  <ProductCard
                    key={i}
                    product={p}
                    selected={selectedIdxs.has(i)}
                    onToggle={() => toggleIdx(i)}
                  />
                ))}
              </BlockStack>
            );
          })}
        </BlockStack>
      )}
    </BlockStack>
  );
}

function ProductCard({
  product,
  selected,
  onToggle,
}: {
  product: GeneratedProduct;
  selected: boolean;
  onToggle: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card>
      <BlockStack gap="200">
        <InlineStack align="space-between" blockAlign="start">
          <InlineStack gap="300" blockAlign="start">
            {/* Image thumbnail */}
            {product.images?.[0] && (
              <div style={{
                width: 56, height: 56, borderRadius: 8, overflow: "hidden",
                flexShrink: 0, border: "1px solid #e4e5e7",
              }}>
                <img
                  src={product.images[0].src}
                  alt={product.images[0].alt}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </div>
            )}
            <BlockStack gap="050">
              <InlineStack gap="200" blockAlign="center">
                <input
                  type="checkbox"
                  checked={selected}
                  onChange={onToggle}
                  style={{ width: 16, height: 16, cursor: "pointer", accentColor: "#008060" }}
                />
                <Text variant="headingSm" as="h4">{product.title}</Text>
              </InlineStack>
              <InlineStack gap="150">
                <Badge>{product.product_type}</Badge>
                {product.vendor && <Text as="span" tone="subdued" variant="bodySm">{product.vendor}</Text>}
                {product.variants?.length > 0 && (
                  <Text as="span" tone="subdued" variant="bodySm">{product.variants.length} variants</Text>
                )}
              </InlineStack>
            </BlockStack>
          </InlineStack>
          <InlineStack gap="200" blockAlign="center">
            <Text variant="headingSm" as="p">${product.price}</Text>
            {product.compare_at_price && (
              <Text as="p" tone="subdued" variant="bodySm"><s>${product.compare_at_price}</s></Text>
            )}
            <Button variant="plain" size="slim" onClick={() => setExpanded((e) => !e)}>
              {expanded ? "Less" : "More"}
            </Button>
          </InlineStack>
        </InlineStack>

        {expanded && (
          <BlockStack gap="200">
            <Divider />
            {/* Image strip */}
            {product.images?.length > 1 && (
              <InlineStack gap="150">
                {product.images.slice(1).map((img, i) => (
                  <div key={i} style={{ width: 48, height: 48, borderRadius: 6, overflow: "hidden", border: "1px solid #e4e5e7" }}>
                    <img src={img.src} alt={img.alt} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </div>
                ))}
              </InlineStack>
            )}
            <div
              style={{ fontSize: 13, lineHeight: 1.6, color: "#6d7175" }}
              dangerouslySetInnerHTML={{ __html: product.body_html }}
            />
            {product.tags?.length > 0 && (
              <InlineStack gap="100" wrap>
                {product.tags.map((t) => (
                  <span key={t} style={{ background: "#f3f4f6", borderRadius: 12, padding: "2px 8px", fontSize: 12, color: "#4b5563" }}>{t}</span>
                ))}
              </InlineStack>
            )}
          </BlockStack>
        )}
      </BlockStack>
    </Card>
  );
}
