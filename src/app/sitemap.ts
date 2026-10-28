import type { MetadataRoute } from "next";

import { prisma } from "@/lib/db";
import { env } from "@/lib/env";

/**
 * sitemap.xml (Phase 5): dynamic per request. Lists every published CMS page,
 * plus the public service and trainer detail routes from their modules.
 * Pages flagged `noindex` and trashed rows are excluded.
 */
export const dynamic = "force-dynamic";

function absoluteUrl(path: string): string {
  const base = env.APP_URL.replace(/\/+$/, "");
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [pages, services, trainers] = await Promise.all([
    prisma.page.findMany({
      where: { deletedAt: null, status: "PUBLISHED" },
      select: { slug: true, isHome: true, noindex: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.service.findMany({
      where: { isPublished: true },
      select: { slug: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.trainer.findMany({
      where: { isPublished: true },
      select: { slug: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  const entries: MetadataRoute.Sitemap = [];

  for (const page of pages) {
    if (page.noindex) continue;
    entries.push({
      url: absoluteUrl(page.isHome ? "/" : `/${page.slug}`),
      lastModified: page.updatedAt,
      changeFrequency: page.isHome ? "weekly" : "monthly",
      priority: page.isHome ? 1 : 0.7,
    });
  }

  for (const service of services) {
    entries.push({
      url: absoluteUrl(`/services/${service.slug}`),
      lastModified: service.updatedAt,
      changeFrequency: "monthly",
      priority: 0.6,
    });
  }

  for (const trainer of trainers) {
    entries.push({
      url: absoluteUrl(`/trainers/${trainer.slug}`),
      lastModified: trainer.updatedAt,
      changeFrequency: "monthly",
      priority: 0.6,
    });
  }

  // Code-defined pages (not in the CMS page table).
  for (const path of ["/transformations", "/blog"]) {
    entries.push({ url: absoluteUrl(path), changeFrequency: "monthly", priority: 0.7 });
  }

  return entries;
}