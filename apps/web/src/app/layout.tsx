import type { Metadata } from "next";
import { Noto_Sans, Noto_Sans_Devanagari } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { LanguageProvider } from "@/components/nivaran/language-provider";
import "./globals.css";

const noto = Noto_Sans({ variable: "--font-noto", subsets: ["latin"], display: "swap" });
const devanagari = Noto_Sans_Devanagari({ variable: "--font-devanagari", subsets: ["devanagari"], display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: { default: "Nivaran — Accountable civic service", template: "%s · Nivaran" },
  description: "A multilingual, privacy-aware civic redressal and accountable routing system for Samanvay Nagar.",
  openGraph: { title: "Nivaran — Accountable civic service", description: "A complaint should never disappear between departments.", images: [{ url: "/og.png", width: 1200, height: 630 }] },
  twitter: { card: "summary_large_image", title: "Nivaran", description: "A complaint should never disappear between departments.", images: ["/og.png"] },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-scroll-behavior="smooth" className={`${noto.variable} ${devanagari.variable}`}>
      <body><LanguageProvider><TooltipProvider>{children}<Toaster richColors position="top-right" /></TooltipProvider></LanguageProvider></body>
    </html>
  );
}
