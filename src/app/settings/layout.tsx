"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { cn } from "@/lib/utils";

const SETTINGS_NAV = [
  { href: "/settings/profile", label: "Profile" },
  { href: "/settings/marketplace", label: "Marketplace" },
  { href: "/settings/photo", label: "Photo" },
  { href: "/settings/seller-defaults", label: "Seller Defaults" },
  { href: "/settings/billing", label: "Billing" },
];

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-surface-low md:pl-56">
      <Navbar />

      <div className="mx-auto max-w-screen-lg px-4 py-6 md:py-8">
        <h1 className="text-xl font-bold text-on-surface mb-4 md:mb-6">Settings</h1>

        {/* Mobile: horizontal scrollable tab bar */}
        <div className="md:hidden -mx-4 px-4 overflow-x-auto mb-5">
          <nav className="flex border-b border-surface-variant" style={{ minWidth: "max-content" }}>
            {SETTINGS_NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors relative",
                  pathname === item.href
                    ? "text-on-surface font-semibold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary"
                    : "text-on-surface/50 hover:text-on-surface"
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Desktop: sidebar + content */}
        <div className="md:flex gap-8 items-start">
          <aside className="hidden md:block w-52 shrink-0">
            <nav className="flex flex-col gap-0.5">
              {SETTINGS_NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "rounded-lg px-3 py-2 text-sm transition-colors",
                    pathname === item.href
                      ? "bg-primary/15 font-semibold text-on-surface"
                      : "text-on-surface/50 hover:bg-surface-variant/40 hover:text-on-surface"
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </aside>

          <main className="flex-1 min-w-0">{children}</main>
        </div>
      </div>
    </div>
  );
}
