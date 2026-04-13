"use client";

import {
  BlockStack,
  InlineStack,
  Text,
  Button,
  Spinner,
  Badge,
  Scrollable,
} from "@shopify/polaris";
import { useState, useEffect } from "react";

interface TaxonomyNode {
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
  max?: number;
}

export function CategoryPicker({ selected, onChange, max = 10 }: Props) {
  const [taxonomy, setTaxonomy] = useState<TaxonomyTop[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTop, setActiveTop] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/taxonomy")
      .then((r) => r.json())
      .then((d) => { setTaxonomy(d.taxonomy); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  function toggleNode(node: TaxonomyNode) {
    const isSelected = selected.some((s) => s.id === node.id);
    if (isSelected) {
      onChange(selected.filter((s) => s.id !== node.id));
    } else if (selected.length < max) {
      onChange([...selected, node]);
    }
  }

  if (loading) {
    return (
      <InlineStack gap="200" align="center">
        <Spinner size="small" />
        <Text as="p" tone="subdued">Loading Google taxonomy…</Text>
      </InlineStack>
    );
  }

  const activeTopData = taxonomy.find((t) => t.label === activeTop);

  return (
    <BlockStack gap="400">
      {/* ── Top-level strip ── */}
      <BlockStack gap="200">
        <Text variant="bodySm" as="p" tone="subdued" fontWeight="semibold">
          TOP-LEVEL CATEGORY
        </Text>
        <Scrollable style={{ maxHeight: "160px" }} shadow>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", padding: "4px 0" }}>
            {taxonomy.map((top) => {
              const hasSelected = selected.some((s) =>
                s.fullPath.startsWith(top.label)
              );
              const isActive = activeTop === top.label;
              return (
                <button
                  key={top.label}
                  onClick={() => setActiveTop(isActive ? null : top.label)}
                  style={{
                    padding: "6px 14px",
                    borderRadius: "20px",
                    border: isActive
                      ? "2px solid #008060"
                      : hasSelected
                      ? "2px solid #1a73e8"
                      : "1px solid #d1d5db",
                    background: isActive ? "#008060" : hasSelected ? "#e8f0fe" : "#fff",
                    color: isActive ? "#fff" : hasSelected ? "#1a73e8" : "#3d4149",
                    fontSize: "13px",
                    fontWeight: 500,
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    transition: "all 0.15s",
                  }}
                >
                  {top.label}
                  {hasSelected && !isActive && (
                    <span style={{ marginLeft: "6px", fontSize: "11px" }}>
                      ({selected.filter((s) => s.fullPath.startsWith(top.label)).length})
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
          <InlineStack align="space-between">
            <Text variant="bodySm" as="p" tone="subdued" fontWeight="semibold">
              {activeTop?.toUpperCase()} — SELECT SUBCATEGORIES
            </Text>
            <Text variant="bodySm" as="p" tone="subdued">
              {selected.length}/{max} selected
            </Text>
          </InlineStack>
          <Scrollable style={{ maxHeight: "200px" }} shadow>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", padding: "4px 0" }}>
              {activeTopData.children.map((node) => {
                const isSelected = selected.some((s) => s.id === node.id);
                const atMax = !isSelected && selected.length >= max;
                return (
                  <button
                    key={node.id}
                    onClick={() => !atMax && toggleNode(node)}
                    style={{
                      padding: "5px 12px",
                      borderRadius: "16px",
                      border: isSelected ? "2px solid #1a73e8" : "1px solid #d1d5db",
                      background: isSelected ? "#1a73e8" : atMax ? "#f9fafb" : "#fff",
                      color: isSelected ? "#fff" : atMax ? "#9ca3af" : "#3d4149",
                      fontSize: "13px",
                      cursor: atMax ? "not-allowed" : "pointer",
                      opacity: atMax ? 0.6 : 1,
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
        <BlockStack gap="100">
          <Text variant="bodySm" as="p" tone="subdued" fontWeight="semibold">
            SELECTED ({selected.length})
          </Text>
          <InlineStack gap="100" wrap>
            {selected.map((node) => (
              <Badge
                key={node.id}
                tone="info"
              >
                {node.label}
                <button
                  onClick={() => toggleNode(node)}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    marginLeft: "4px",
                    color: "inherit",
                    fontSize: "12px",
                    lineHeight: 1,
                    padding: 0,
                  }}
                >
                  ×
                </button>
              </Badge>
            ))}
            <Button variant="plain" size="slim" onClick={() => onChange([])}>
              Clear all
            </Button>
          </InlineStack>
        </BlockStack>
      )}
    </BlockStack>
  );
}
