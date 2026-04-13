"use client";

import {
  Card,
  Checkbox,
  InlineStack,
  BlockStack,
  Text,
  Badge,
  Collapsible,
  Button,
  Tag,
  Divider,
} from "@shopify/polaris";
import { useState } from "react";
import type { GeneratedProduct } from "./ProductGenerator";

interface Props {
  product: GeneratedProduct;
  selected: boolean;
  onToggle: () => void;
}

export function ProductPreview({ product, selected, onToggle }: Props) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card>
      <BlockStack gap="300">
        <InlineStack align="space-between" blockAlign="start">
          <InlineStack gap="300" blockAlign="start">
            <Checkbox
              label=""
              checked={selected}
              onChange={onToggle}
            />
            <BlockStack gap="100">
              <Text variant="headingSm" as="h3">{product.title}</Text>
              <InlineStack gap="200">
                <Badge>{product.product_type}</Badge>
                {product.vendor && <Text as="span" tone="subdued">{product.vendor}</Text>}
              </InlineStack>
            </BlockStack>
          </InlineStack>
          <BlockStack gap="100" align="end">
            <Text variant="headingSm" as="p">${product.price}</Text>
            {product.compare_at_price && (
              <Text as="p" tone="subdued">
                <s>${product.compare_at_price}</s>
              </Text>
            )}
          </BlockStack>
        </InlineStack>

        {product.tags.length > 0 && (
          <InlineStack gap="100" wrap>
            {product.tags.slice(0, 6).map((tag) => (
              <Tag key={tag}>{tag}</Tag>
            ))}
            {product.tags.length > 6 && (
              <Text as="span" tone="subdued">+{product.tags.length - 6} more</Text>
            )}
          </InlineStack>
        )}

        <Button
          variant="plain"
          onClick={() => setExpanded((e) => !e)}
          ariaExpanded={expanded}
        >
          {expanded ? "Hide details" : "Show details"}
        </Button>

        <Collapsible open={expanded} id={`product-details-${product.title}`}>
          <BlockStack gap="300">
            <Divider />
            <BlockStack gap="100">
              <Text variant="bodySm" as="p" tone="subdued" fontWeight="semibold">Description</Text>
              <div
                style={{ fontSize: "13px", lineHeight: 1.5, color: "#6d7175" }}
                dangerouslySetInnerHTML={{ __html: product.body_html }}
              />
            </BlockStack>

            {product.variants.length > 0 && (
              <BlockStack gap="100">
                <Text variant="bodySm" as="p" tone="subdued" fontWeight="semibold">
                  Variants ({product.variants.length})
                </Text>
                <BlockStack gap="100">
                  {product.variants.slice(0, 6).map((v, i) => (
                    <InlineStack key={i} gap="200">
                      {v.option1 && <Tag>{v.option1}</Tag>}
                      {v.option2 && <Tag>{v.option2}</Tag>}
                      {v.option3 && <Tag>{v.option3}</Tag>}
                      <Text as="span" tone="subdued">${v.price}</Text>
                      {v.sku && <Text as="span" tone="subdued">SKU: {v.sku}</Text>}
                    </InlineStack>
                  ))}
                  {product.variants.length > 6 && (
                    <Text as="p" tone="subdued">…and {product.variants.length - 6} more variants</Text>
                  )}
                </BlockStack>
              </BlockStack>
            )}

            {product.seo_title && (
              <BlockStack gap="100">
                <Text variant="bodySm" as="p" tone="subdued" fontWeight="semibold">SEO Title</Text>
                <Text as="p">{product.seo_title}</Text>
              </BlockStack>
            )}
          </BlockStack>
        </Collapsible>
      </BlockStack>
    </Card>
  );
}
