import type { MetadataRoute } from "next";

import { env } from "@/lib/env";
import { getSiteSettings } from "@/lib/site/settings";

/**
 * robots.txt (Phase 5): generated per request so the Settings → SEO "robots"
 * directive and APP_URL are honoured. `/admin` and `/preview` are always
 * blocked; when the owner chooses `noindex` the entire public site is blocked.
 */
export const dynamic = "force-dynamic";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const { seo } = await getSiteSettings();
  const directive = (seo.robots || "index,follow").toLowerCase();

  const rules: MetadataRoute.Robots["rules"] = directive.includes("noindex")
    ? { userAgent: "*", disallow: "/" }
    : [
        { userAgent: "*", allow: "/", disallow: ["/admin/", "/preview/"] },
        { userAgent: "*", disallow: ["/api/"] },
      ];

  return {
    rules,
    sitemap: `${env.APP_URL}/sitemap.xml`,
  };
}