import type { Metadata, Viewport } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import { Toaster } from "sonner";
import { Providers } from "@/components/providers";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const grotesk = Space_Grotesk({ variable: "--font-grotesk", subsets: ["latin"], weight: ["500", "600", "700"] });

export const metadata: Metadata = {
  title: "Todo",
  description: "Pick what matters today, then win the day.",
  applicationName: "Todo",
  appleWebApp: { capable: true, title: "Todo", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F5F5F1" },
    { media: "(prefers-color-scheme: dark)", color: "#0D0E11" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} ${grotesk.variable}`} suppressHydrationWarning>
      <body>
        <Providers>
          {children}
          <Toaster position="bottom-center" offset={24} mobileOffset={{ bottom: 96 }} toastOptions={{ unstyled: true }} />
        </Providers>
      </body>
    </html>
  );
}
