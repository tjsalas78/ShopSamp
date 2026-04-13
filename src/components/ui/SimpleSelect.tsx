"use client";

import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

export function SimpleSelect({ value, options, onChange, className, label }: {
  value: string;
  options: string[];
  onChange: (v: string) => void;
  className?: string;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const [style, setStyle] = useState<React.CSSProperties>({});
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  function handleOpen() {
    if (!open && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const maxH = 240;
      if (spaceBelow < maxH && rect.top > maxH) {
        setStyle({ position: "fixed", bottom: window.innerHeight - rect.top + 4, left: rect.left, width: rect.width, zIndex: 9999 });
      } else {
        setStyle({ position: "fixed", top: rect.bottom + 4, left: rect.left, width: rect.width, zIndex: 9999 });
      }
    }
    setOpen((o) => !o);
  }

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      const t = e.target as Node;
      if (!containerRef.current?.contains(t) && !dropdownRef.current?.contains(t)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label && <label className="text-xs text-secondary">{label}</label>}
      <div className="relative" ref={containerRef}>
        <button
          type="button"
          onClick={handleOpen}
          className={cn(
            "w-full flex items-center justify-between gap-2 rounded bg-surface-low px-3 py-2 text-sm transition-shadow text-left",
            open ? "ring-1 ring-primary" : "focus:outline-none focus:ring-1 focus:ring-primary",
            value ? "text-on-surface" : "text-secondary/40"
          )}
        >
          <span className="truncate">{value || "Select…"}</span>
          <svg className={cn("h-4 w-4 shrink-0 text-secondary/40 transition-transform", open && "rotate-180")} viewBox="0 0 16 16" fill="currentColor">
            <path fillRule="evenodd" d="M4.22 6.22a.75.75 0 011.06 0L8 8.94l2.72-2.72a.75.75 0 111.06 1.06l-3.25 3.25a.75.75 0 01-1.06 0L4.22 7.28a.75.75 0 010-1.06z" clipRule="evenodd" />
          </svg>
        </button>
        {open && (
          <div ref={dropdownRef} style={style} className="rounded-xl border border-surface-variant bg-surface shadow-float overflow-hidden">
            {options.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => { onChange(opt); setOpen(false); }}
                className={cn(
                  "w-full px-3 py-2 text-sm text-left transition-colors hover:bg-surface-container-low",
                  opt === value ? "text-primary font-medium" : "text-on-surface"
                )}
              >
                {opt}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
