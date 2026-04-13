"use client";

import {
  BlockStack,
  InlineStack,
  Text,
  Button,
  Spinner,
  Badge,
  Scrollable,
  Banner,
} from "@shopify/polaris";
import { useState, useEffect } from "react";

export interface TaxonomyNode {
  id: string;
  label: string;
  fullPath: string;
}

interface TaxonomyTop {
  label: string;
  children: TaxonomyNode[];
}

interface Props {
  selected: TaxonomyNode[];
  onChange: (nodes: TaxonomyNode[]) => void;
  onContinue?: () => void;
  max?: number;
}

export function CategoryPicker({ selected, onChange, onContinue, max = 10 }: Props) {
  const [taxonomy, setTaxonomy] = useState<TaxonomyTop[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTop, setActiveTop] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/taxonomy")
      .then((r) => r.json())
      .then((d) => { setTaxonomy(d.taxonomy); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  function topNode(top: TaxonomyTop): TaxonomyNode {
    return { id: `top::${top.label}`, label: top.label, fullPath: top.label };
  }

  function isSelected(node: TaxonomyNode) {
    return selected.some((s) => s.id === node.id);
  }

  function toggleNode(node: TaxonomyNode) {
    if (isSelected(node)) {
      onChange(selected.filter((s) => s.id !== node.id));
    } else if (selected.length < max) {
      onChange([...selected, node]);
    }
  }

  function handleTopClick(top: TaxonomyTop) {
    const node = topNode(top);
    // Always toggle selection
    toggleNode(node);
    // Also open/close subcategory panel
    setActiveTop((prev) => (prev === top.label ? null : top.label));
  }

  if (loading) {
    return (
      <InlineStack gap="200" align="center">
        <Spinner size="small" />
        <Text as="p" tone="subdued">Loading categories…</Text>
      </InlineStack>
    );
  }

  const activeTopData = taxonomy.find((t) => t.label === activeTop);
  const atMax = selected.length >= max;

  return (
    <BlockStack gap="500">
      {/* ── Top-level categories ── */}
      <BlockStack gap="300">
        <InlineStack align="space-between">
          <Text variant="headingSm" as="h3">Select categories</Text>
          <Text variant="bodySm" as="p" tone="subdued">
            {selected.length}/{max} selected
          </Text>
        </InlineStack>

        {atMax && (
          <Banner tone="warning">
            Maximum {max} categories selected.
          </Banner>
        )}

        <Scrollable style={{ maxHeight: "200px" }} shadow>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", padding: "4px 2px 8px" }}>
            {taxonomy.map((top) => {
              const sel = isSelected(topNode(top));
              const hasSubSel = selected.some(
                (s) => s.fullPath.startsWith(top.label + " >") && !s.id.startsWith("top::")
              );
              const isOpen = activeTop === top.label;
              const disabled = atMax && !sel;

              return (
                <button
                  key={top.label}
                  onClick={() => !disabled && handleTopClick(top)}
                  title={disabled ? "Max categories reached" : undefined}
                  style={{
                    padding: "7px 16px",
                    borderRadius: "24px",
                    border: sel
                      ? "2px solid #008060"
                      : isOpen
                      ? "2px solid #1a73e8"
                      : "1px solid #d1d5db",
                    background: sel ? "#008060" : isOpen ? "#e8f0fe" : "#fff",
                    color: sel ? "#fff" : isOpen ? "#1a73e8" : disabled ? "#9ca3af" : "#3d4149",
                    fontSize: "13px",
                    fontWeight: 500,
                    cursor: disabled ? "not-allowed" : "pointer",
                    opacity: disabled ? 0.5 : 1,
                    whiteSpace: "nowrap",
                    transition: "all 0.15s",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  {sel && <span style={{ fontSize: "10px" }}>✓</span>}
                  {top.label}
                  {hasSubSel && (
                    <span style={{
                      background: sel ? "rgba(255,255,255,0.3)" : "#1a73e8",
                      color: "#fff",
                      borderRadius: "10px",
                      padding: "1px 6px",
                      fontSize: "11px",
                    }}>
                      +{selected.filter(s => s.fullPath.startsWith(top.label + " >")).length}
                    </span>
                  )}
                  {top.children.length > 0 && (
                    <span style={{ opacity: 0.6, fontSize: "11px" }}>
                      {isOpen ? "▲" : "▼"}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </Scrollable>
      </BlockStack>

      {/* ── Subcategory panel ── */}
      {activeTopData && (
        <BlockStack gap="200">
          <Text variant="bodySm" as="p" tone="subdued" fontWeight="semibold">
            {activeTop?.toUpperCase()} — REFINE (OPTIONAL)
          </Text>
          <Scrollable style={{ maxHeight: "180px" }} shadow>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", padding: "4px 0 8px" }}>
              {activeTopData.children.map((node) => {
                const sel = isSelected(node);
                const dis = atMax && !sel;
                return (
                  <button
                    key={node.id}
                    onClick={() => !dis && toggleNode(node)}
                    style={{
                      padding: "5px 12px",
                      borderRadius: "16px",
                      border: sel ? "2px solid #1a73e8" : "1px solid #d1d5db",
                      background: sel ? "#1a73e8" : dis ? "#f9fafb" : "#fff",
                      color: sel ? "#fff" : dis ? "#9ca3af" : "#3d4149",
                      fontSize: "13px",
                      cursor: dis ? "not-allowed" : "pointer",
                      opacity: dis ? 0.6 : 1,
                      whiteSpace: "nowrap",
                      transition: "all 0.15s",
                    }}
                  >
                    {node.label}
                  </button>
                );
              })}
            </div>
          </Scrollable>
        </BlockStack>
      )}

      {/* ── Selected summary ── */}
      {selected.length > 0 && (
        <BlockStack gap="200">
          <Text variant="bodySm" as="p" tone="subdued" fontWeight="semibold">
            SELECTED ({selected.length})
          </Text>
          <InlineStack gap="100" wrap>
            {selected.map((node) => (
              <Badge key={node.id} tone="success">
                <InlineStack gap="100" align="center">
                  <span>{node.label}</span>
                  <button
                    onClick={() => toggleNode(node)}
                    style={{
                      background: "none", border: "none", cursor: "pointer",
                      color: "inherit", fontSize: "12px", lineHeight: 1, padding: 0,
                    }}
                  >
                    ×
                  </button>
                </InlineStack>
              </Badge>
            ))}
            <Button variant="plain" size="slim" onClick={() => onChange([])}>
              Clear all
            </Button>
          </InlineStack>
        </BlockStack>
      )}

      {/* ── Continue button ── */}
      {selected.length > 0 && onContinue && (
        <div style={{ paddingTop: "8px" }}>
          <Button variant="primary" size="large" onClick={onContinue} fullWidth>
            Continue with {selected.length} {selected.length === 1 ? "category" : "categories"} →
          </Button>
        </div>
      )}
    </BlockStack>
  );
}
