import type { Metadata } from "next";
import "@fontsource/inter/300.css";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import "@fontsource/inter/800.css";
import "@fontsource/ibm-plex-sans/400.css";
import "@fontsource/ibm-plex-sans/500.css";
import "@fontsource/ibm-plex-sans/600.css";
import "@fontsource/ibm-plex-mono/400.css";
import "@fontsource/ibm-plex-mono/500.css";
import "@fontsource/ibm-plex-mono/600.css";
import "@fontsource/spectral/600.css";

import { AppProviders } from "@/components/providers/app-providers";
import "./globals.css";
import "./monarch/design.css";
import { MonarchNavigation } from "./monarch/navigation";

export const metadata: Metadata = {
  title: "EconMap",
  description: "Premium world economic intelligence terminal with transparent source-backed data and map-first workflows.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-slate-950 antialiased monarch-product" data-monarch-product="econmap">
        <MonarchNavigation />
        <div className="monarch-product-surface">
        <AppProviders>{children}</AppProviders>
      </div>
      </body>
    </html>
  );
}
