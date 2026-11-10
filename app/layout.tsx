import type { Metadata, Viewport } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import { Providers } from "@/components/providers";
import { Pwa } from "@/components/pwa";
import { ThemeColor } from "@/components/theme-color";
import { RouteTitle } from "@/components/route-title";
import { ToasterHost } from "@/components/toaster-host";
import { Suspense } from "react";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const grotesk = Space_Grotesk({ variable: "--font-grotesk", subsets: ["latin"], weight: ["500", "600", "700"] });

// No `title` here: RouteTitle owns <title> for every route, and a second metadata title would win after navigation.
export const metadata: Metadata = {
  description: "Pick what matters today, then win the day.",
  applicationName: "Tiny ToDo",
  appleWebApp: { capable: true, title: "Tiny ToDo", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  interactiveWidget: "resizes-content",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F5F5F1" },
    { media: "(prefers-color-scheme: dark)", color: "#0D0E11" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} ${grotesk.variable}`} suppressHydrationWarning>
      <body>
        <a className="skip-link" href="#content">
          Skip to content
        </a>
        <Suspense>
          <RouteTitle />
        </Suspense>
        <Providers>
          {children}
          <ToasterHost />
          <Pwa />
          <ThemeColor />
        </Providers>
      </body>
    </html>
  );
}
