"use client";

import { useEffect, useState } from "react";

interface LoadingOverlayProps {
  loading: boolean;
  /** Delay in ms before the overlay appears. Default: 100 */
  delay?: number;
  /** Main status label */
  label?: string;
}

export function LoadingOverlay({ loading, delay = 100, label }: LoadingOverlayProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!loading) {
      setVisible(false);
      return;
    }
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [loading, delay]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/50 backdrop-blur-[2px]">
      <div className="flex w-[26rem] max-w-[90vw] flex-col items-center gap-4 rounded-2xl border border-surface-variant bg-surface px-8 py-7 shadow-2xl">
        <svg
          className="h-10 w-10 shrink-0 animate-spin text-primary"
          viewBox="0 0 48 48"
          fill="none"
        >
          <circle cx="24" cy="24" r="20" stroke="currentColor" strokeOpacity="0.15" strokeWidth="4" />
          <path d="M44 24c0-11.046-8.954-20-20-20" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
        </svg>
        {/* Fixed-height text area — always reserves space for 2 lines so the card never resizes */}
        <div className="flex h-10 w-full items-center justify-center">
          <p className="text-sm font-medium text-on-surface text-center leading-snug line-clamp-2">
            {label ?? ""}
          </p>
        </div>
      </div>
    </div>
  );
}
