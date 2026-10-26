import type { Metadata } from "next";
import { headers } from "next/headers";
import { Inter, Montserrat, Playfair_Display } from "next/font/google";
import { permanentRedirect, redirect } from "next/navigation";
import Script from "next/script";

import { env } from "@/lib/env";
import { prisma } from "@/lib/db";
import { mediaUrl } from "@/lib/media-url";
import { getSiteSettings, type SiteSettings } from "@/lib/site/settings";
import { themeToCss } from "@/lib/theme/tokens";
import { SiteFooter } from "@/components/site/site-footer";
import { AIChatbot } from "@/components/chatbot/ai-chatbot";

import "../globals.css";

const headingFont = Montserrat({
  subsets: ["latin"],
  variable: "--font-heading",
  weight: ["400", "600", "700", "800", "900"],
  display: "swap",
});

const bodyFont = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

const serifFont = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
});

export const metadata = {
  title: "FITX Personal Fitness Training Studio",
  description: "The most premium personal training program in Sahiwal, Punjab",
};

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSiteSettings();

  const seo = {
    title: "FITX Personal Fitness Training Studio",
    description: "The most premium personal training program in Sahiwal, Punjab",
  } as const;

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: "FITX Personal Fitness Training Studio",
    description: "The most premium personal training program",
    address: settings?.general?.address || "Sahiwal, Punjab, Pakistan",
    telephone: settings?.general?.phone || "+92 300 0000000",
    geo: {
      latitude: 30.9878,
      longitude: 73.0473,
    },
  };

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{seo.title}</title>
        <meta name="description" content={seo.description} />
        <link rel="icon" href="/favicon.ico" />
      </head>

      <body className="font-body antialiased">
        <div className="bg-3d-gradient" />
        <div className="scanlines" />
        <div className="vignette" />
        <div className="cube-3d" style={{ top: "20%", left: "10%", width: "80px", height: "80px", background: "var(--brand-accent)" }} />
        <div className="cube-3d" style={{ top: "50%", left: "70%", width: "60px", height: "60px", background: "var(--brand-navy)", animationDelay: "2s" }} />
        <div className="cube-3d" style={{ top: "80%", left: "30%", width: "100px", height: "100px", background: "var(--brand-accent)", animationDelay: "4s" }} />
        <div className="cube-3d" style={{ top: "10%", left: "80%", width: "50px", height: "50px", background: "rgba(255,215,0,0.5)", animationDelay: "1s" }} />
        <div className="cube-3d" style={{ top: "60%", left: "10%", width: "70px", height: "70px", background: "var(--brand-navy)", animationDelay: "3s" }} />

        <div id="main-content" className="relative z-10 min-h-full">
          {children}
        </div>

        <SiteFooter />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />

        <AIChatbot />
      </body>
    </html>
  );
}