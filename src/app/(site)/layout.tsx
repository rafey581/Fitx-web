import { JetBrains_Mono } from "next/font/google";

import { MenuLocation } from "@/generated/prisma/enums";
import { getMenuLinks, getSiteSettings } from "@/lib/site/settings";
import { AIChatbot } from "@/components/chatbot/ai-chatbot";
import { FilmShell, type ShellLink } from "@/components/site/film-shell";
import { SiteFooter } from "@/components/site/site-footer";

const monoFont = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500"],
  display: "swap",
});

/**
 * Inner pages share the home film's world: a dark 3D backdrop, HUD header and
 * full-screen menu. The root layout owns <html>/<body>, theme CSS and SEO
 * defaults; this layout only adds the shell around the page content.
 */
export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSiteSettings();
  const general = settings.general;
  const header = await getMenuLinks(MenuLocation.HEADER);

  const links: ShellLink[] = [
    ...header.map((l) => ({
      label: l.label,
      href: l.href,
      children: l.children.map((c) => ({ label: c.label, href: c.href })),
    })),
  ];
  // Code-defined pages that the CMS menu doesn't know about.
  for (const extra of [
    { label: "Transformations", href: "/transformations" },
    { label: "Blog", href: "/blog" },
  ]) {
    if (!links.some((l) => l.href === extra.href)) links.push({ ...extra, children: [] });
  }

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: general.businessName,
    address: general.address || "Sahiwal, Punjab, Pakistan",
    telephone: general.phone || undefined,
    geo: { "@type": "GeoCoordinates", latitude: 30.6682, longitude: 73.1114 },
  };

  return (
    <div className={`${monoFont.variable} film-root film-site w-full`}>
      <FilmShell
        links={links}
        businessName={general.businessName}
        address={general.address}
        phone={general.phone}
        email={general.email}
      />

      <div id="main-content" className="relative z-10">
        {children}
        <SiteFooter />
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <AIChatbot />
    </div>
  );
}
