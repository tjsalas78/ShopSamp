"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "@/components/layout/ThemeProvider";
import { BrandBlurProvider } from "@/components/ui/BrandName";
import { TrackerProvider } from "@/components/TrackerProvider";
import { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <TrackerProvider>
        <ThemeProvider>
          <BrandBlurProvider>{children}</BrandBlurProvider>
        </ThemeProvider>
      </TrackerProvider>
    </SessionProvider>
  );
}
