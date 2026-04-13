"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import Image from "next/image";
import { useTheme } from "@/components/layout/ThemeProvider";
import { BrandName } from "@/components/ui/BrandName";

const NAV = [
  {
    href: "/dashboard",
    label: "Dashboard",
    match: (p: string) => p === "/dashboard",
    icon: (
      <svg className="h-[18px] w-[18px]" viewBox="0 0 20 20" fill="currentColor">
        <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 6a1 1 0 011-1h5a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zm9 0a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"/>
      </svg>
    ),
  },
  {
    href: "/listings",
    label: "Listings",
    match: (p: string) => p.startsWith("/listings"),
    icon: (
      <svg className="h-[18px] w-[18px]" viewBox="0 0 20 20" fill="currentColor">
        <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
        <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd"/>
      </svg>
    ),
  },
  {
    href: "/settings",
    label: "Settings",
    match: (p: string) => p.startsWith("/settings"),
    icon: (
      <svg className="h-[18px] w-[18px]" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd"/>
      </svg>
    ),
  },
  {
    href: "/support",
    label: "Support",
    match: (p: string) => p === "/support",
    icon: (
      <svg className="h-[18px] w-[18px]" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd"/>
      </svg>
    ),
  },
];

// ── Sidebar content (shared between desktop fixed + mobile drawer) ──────────
function SidebarContent({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { theme, toggle: toggleTheme } = useTheme();
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const sha = (process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA ?? "local").slice(0, 7);
  const buildTime = parseInt(process.env.NEXT_PUBLIC_BUILD_TIME ?? "0") || Date.now();

  const initials = session?.user?.name
    ? session.user.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : session?.user?.email?.[0]?.toUpperCase() ?? "?";

  return (
    <div className="flex h-full flex-col">

      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-surface-variant">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-on-primary shrink-0">
          <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z"/>
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.077 2.353 1.237V17a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 15.766 14 14.991 14 14c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 11.092V9.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.077-2.354-1.237V5z" clipRule="evenodd"/>
          </svg>
        </div>
        <span className="text-sm font-bold text-on-surface tracking-tight">
          <BrandName />
        </span>
      </div>

      {/* New Listing + Import CTAs */}
      <div className="px-3 pt-4 pb-2 space-y-2">
        <Link
          href="/listings/new"
          onClick={onClose}
          className="flex items-center justify-center gap-2 w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-on-primary hover:opacity-90 transition-opacity"
        >
          <svg className="h-4 w-4" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 2a1 1 0 011 1v4h4a1 1 0 110 2H9v4a1 1 0 11-2 0V9H3a1 1 0 110-2h4V3a1 1 0 011-1z"/>
          </svg>
          New Listing
        </Link>
        <Link
          href="/listings?import=1"
          onClick={onClose}
          className="flex items-center justify-center gap-2 w-full rounded-xl border border-surface-variant px-4 py-2.5 text-sm font-semibold text-secondary hover:bg-surface-variant/50 hover:text-on-surface transition-colors"
        >
          <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 2v9M4 7l4 4 4-4M2 13h12"/>
          </svg>
          Import
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-2 space-y-0.5">
        {NAV.map((item) => {
          const active = item.match(pathname);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors relative",
                active
                  ? "bg-primary/10 text-primary"
                  : "text-secondary hover:bg-surface-variant/50 hover:text-on-surface"
              )}
            >
              {active && (
                <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-full bg-primary" />
              )}
              <span className={cn("shrink-0", active ? "text-primary" : "text-secondary")}>
                {item.icon}
              </span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom: theme + avatar */}
      <div className="border-t border-surface-variant px-3 py-3 space-y-0.5">
        <button
          onClick={toggleTheme}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-secondary hover:bg-surface-variant/50 hover:text-on-surface transition-colors"
        >
          {isHydrated && theme === "dark" ? (
            <>
              <svg className="h-[18px] w-[18px] shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd"/>
              </svg>
              Light mode
            </>
          ) : isHydrated ? (
            <>
              <svg className="h-[18px] w-[18px] shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"/>
              </svg>
              Dark mode
            </>
          ) : (
            <svg className="h-[18px] w-[18px] shrink-0" viewBox="0 0 20 20" fill="currentColor">
              <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"/>
            </svg>
          )}
        </button>

        <Link
          href="/settings/profile"
          onClick={onClose}
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-surface-variant/50"
        >
          <div className="h-7 w-7 shrink-0 overflow-hidden rounded-full border border-surface-variant bg-surface-low flex items-center justify-center text-2xs font-semibold text-on-surface">
            {session?.user?.image ? (
              <Image src={session.user.image} alt="avatar" width={28} height={28} className="h-full w-full object-cover"/>
            ) : (
              <span>{initials}</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-on-surface truncate">{session?.user?.name ?? "Account"}</p>
            <p className="text-2xs text-secondary truncate">{session?.user?.email}</p>
          </div>
        </Link>

        {/* Build info */}
        <div className="flex justify-center pt-2">
          {/* Build info removed for ProdSamp */}
        </div>
      </div>
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────
export function Navbar() {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <>
      {/* Desktop sidebar — fixed left */}
      <aside className="hidden md:flex fixed inset-y-0 left-0 z-40 w-56 flex-col border-r border-surface-variant bg-surface">
        <SidebarContent />
      </aside>

      {/* Mobile top bar */}
      <header className="md:hidden sticky top-0 z-40 flex h-12 items-center justify-between border-b border-surface-variant bg-surface px-4">
        <button
          onClick={() => setDrawerOpen(true)}
          className="flex h-8 w-8 items-center justify-center rounded text-secondary hover:text-on-surface hover:bg-surface-low transition-colors"
          aria-label="Open menu"
        >
          <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd"/>
          </svg>
        </button>
        <Link href="/dashboard" className="text-sm font-bold text-on-surface">
          <BrandName />
        </Link>
        <Link href="/listings/new" className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-on-primary hover:opacity-90 transition-opacity">
          <svg className="h-4 w-4" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 2a1 1 0 011 1v4h4a1 1 0 110 2H9v4a1 1 0 11-2 0V9H3a1 1 0 110-2h4V3a1 1 0 011-1z"/>
          </svg>
        </Link>
      </header>

      {/* Mobile drawer overlay */}
      {drawerOpen && (
        <>
          <div
            className="md:hidden fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="md:hidden fixed inset-y-0 left-0 z-50 w-64 bg-surface shadow-float">
            <div className="flex items-center justify-end px-4 py-3 border-b border-surface-variant">
              <button
                onClick={() => setDrawerOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded text-secondary hover:text-on-surface"
              >
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/>
                </svg>
              </button>
            </div>
            <SidebarContent onClose={() => setDrawerOpen(false)} />
          </div>
        </>
      )}
    </>
  );
}
