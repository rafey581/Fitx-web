import type { Metadata } from "next";
import { headers } from "next/headers";
import { Inter, Montserrat, Playfair_Display } from "next/font/google";
import { permanentRedirect, redirect } from "next/navigation";
import Script from "next/script";

import { env } from "@/lib/env";
import { prisma } from "@/lib/db";
import { mediaUrl } from "@/lib/media-url";
import { studio } from "@/lib/fitx/knowledge";
import { pageSeo, SHARE_IMAGE, SITE_NAME } from "@/lib/fitx/seo";
import { getSiteSettings } from "@/lib/site/settings";
import { themeToCss } from "@/lib/theme/tokens";

import "./globals.css";

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

/**
 * Site-wide SEO defaults. Copy lives in src/lib/fitx/seo.ts (local search
 * terms, written from the studio's knowledge base); pages override the title,
 * description and canonical URL with `seoMetadata(path)`. An OpenGraph image
 * chosen in Settings → SEO still replaces the default share card.
 */
export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  const seo = settings.seo;

  let ogImage = SHARE_IMAGE;
  if (seo.ogImageId) {
    const media = await prisma.media.findUnique({
      where: { id: seo.ogImageId },
      select: { path: true },
    });
    if (media) ogImage = new URL(mediaUrl({ path: media.path }), env.APP_URL).toString();
  }
  const home = pageSeo["/"];

  return {
    metadataBase: new URL(env.APP_URL),
    title: { default: home.title, template: "%s | FITX" },
    description: home.description,
    applicationName: SITE_NAME,
    category: "fitness",
    formatDetection: { telephone: true, address: true },
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      locale: "en_PK",
      images: [{ url: ogImage, width: 1200, height: 630, alt: "FITX Personal Fitness Training Studio, Sahiwal" }],
    },
    twitter: { card: "summary_large_image", images: [ogImage] },
    other: {
      "geo.region": "PK-PB",
      "geo.placename": "Sahiwal",
      "geo.position": `${studio.geo.latitude};${studio.geo.longitude}`,
      ICBM: `${studio.geo.latitude}, ${studio.geo.longitude}`,
    },
  };
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // Inject theme settings (brand colours, fonts, radius) from the database so
  // admin Theme changes apply site-wide. Read via `cache`, so layouts and
  // components re-use this fetch instead of hitting the database repeatedly.
  const settings = await getSiteSettings();
  const themeCss = themeToCss(settings.theme);

  // Maintenance mode + 301/302 redirects must apply to every public URL —
  // including paths that match no route (their not-found page renders under
  // THIS layout), which is exactly the case redirects exist for. The pathname
  // is stamped on a request header by src/proxy.ts because server components
  // cannot otherwise see the request URL. Admin/health/static paths skip both.
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") ?? "/";
  const isAdminPath = pathname === "/admin" || pathname.startsWith("/admin/");
  const isPreviewPath =
    pathname === "/preview" || pathname.startsWith("/preview/");
  const isAssetPath =
    pathname === "/health" ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/uploads");

  let content = children;
  if (!isAdminPath && !isPreviewPath && !isAssetPath) {
    if (settings.general.maintenanceMode) {
      // Maintenance mode (PRD 5.10): the whole public site stands down.
      content = (
        <main className="flex min-h-[60vh] flex-1 flex-col items-center justify-center bg-ink px-6 py-24 text-center text-white">
          <p className="eyebrow">Sahiwal · Punjab</p>
          <h1 className="heading-display heading-slash mt-4 text-3xl sm:text-5xl">
            Back shortly
          </h1>
          <p className="mt-6 max-w-md text-white/70">
            {settings.general.businessName} is doing maintenance. We will be
            back at the gym in a moment.
          </p>
        </main>
      );
    } else if (pathname !== "/") {
      // 301/302 redirects (PRD 5.10). `fromPath` is unique, so this is an
      // indexed point lookup rather than loading the whole table per request.
      const match = await prisma.redirect.findUnique({
        where: { fromPath: pathname },
      });
      if (match) {
        if (match.code === 301 || match.code === 308) {
          permanentRedirect(match.toPath);
        }
        redirect(match.toPath);
      }
    }
  }

  return (
    <html
      lang="en"
      className={`${headingFont.variable} ${bodyFont.variable} ${serifFont.variable} h-full`}
    >
      <body className="flex min-h-full flex-col">
        <style dangerouslySetInnerHTML={{ __html: themeCss }} />
        {/* Owner-supplied analytics/pixel scripts (Settings → SEO, owner only). */}
        {settings.scripts.headScripts ? (
          <Script
            id="site-head-scripts"
            strategy="beforeInteractive"
            dangerouslySetInnerHTML={{ __html: settings.scripts.headScripts }}
          />
        ) : null}
        {content}
        {settings.scripts.bodyScripts ? (
          <script
            dangerouslySetInnerHTML={{ __html: settings.scripts.bodyScripts }}
          />
        ) : null}
      </body>
    </html>
  );
}
