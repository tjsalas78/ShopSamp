"use client";

import { useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";

function BrandBlurApplier() {
  const params = useSearchParams();
  const enabled = !!params.get("blurbrand");

  useEffect(() => {
    if (enabled) {
      document.body.classList.add("blur-brand");
    } else {
      document.body.classList.remove("blur-brand");
    }
    return () => document.body.classList.remove("blur-brand");
  }, [enabled]);

  return null;
}

export function BrandBlurProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Suspense>
        <BrandBlurApplier />
      </Suspense>
      {children}
    </>
  );
}

/** Renders the brand name — blurs automatically when ?blurbrand=true is in the URL. */
export function BrandName() {
  return <span data-brand>ProdSamp</span>;
}

/** Renders a string that may contain "ProdSamp", splitting it so instances can be blurred. */
export function BrandText({ s }: { s: string }) {
  const parts = s.split(/(ProdSamp|prodsamp)/gi);
  return (
    <>
      {parts.map((part, i) =>
        /^prodsamp$/i.test(part) ? (
          <span key={i} data-brand>
            {part}
          </span>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}
