import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ShopSamp",
  description: "Generate AI-powered product samples for your Shopify store.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
