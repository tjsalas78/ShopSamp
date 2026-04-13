import type { Metadata } from "next";
import { Providers } from "@/components/layout/Providers";
import "@/lib/init";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "ProdSamp", template: "%s – ProdSamp" },
  description: "Generate product samples and push them to your Shopify store with AI.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Blocking script — applies theme class before first paint, no flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem("theme")||"dark";document.documentElement.classList.toggle("dark",t==="dark")}catch(e){}`,
          }}
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,600;0,9..144,700;1,9..144,400&display=swap" rel="stylesheet" />
      </head>
      <body>
        <div className="ambient-bg" aria-hidden="true">
          <div className="bg-grid" />
          <div className="bg-glow teal" />
          <div className="bg-glow purple" />
        </div>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
