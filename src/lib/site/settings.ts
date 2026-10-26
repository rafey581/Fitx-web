import "server-only";

import { cache } from "react";

import { LinkType, MenuLocation } from "@/generated/prisma/enums";
import { prisma } from "@/lib/db";
import { defaultTheme } from "@/lib/theme/tokens";

/**
 * Server-only access to global settings for the public site (header, footer,
 * announcement bar, theme, maintenance mode). Values are read per request and
 * cached with `React.cache`, so admin saves show up immediately in dev and
 * remain cheap under load. Phase 3 layers ISR/`unstable_cache` on top.
 */

export const generalDefaults = {
  businessName: "FITX Fitness Studio",
  tagline: "",
  address: "",
  phone: "",
  whatsapp: "",
  email: "",
  openingHours: "",
  mapEmbed: "",
  instagram: "",
  facebook: "",
  tiktok: "",
  youtube: "",
  logoLightId: null as string | null,
  logoDarkId: null as string | null,
  faviconId: null as string | null,
  announcementEnabled: false,
  announcementText: "",
  announcementHref: "",
  announcementStartsAt: null as string | null,
  announcementEndsAt: null as string | null,
  maintenanceMode: false,
};

export const seoDefaults = {
  defaultTitle: "FITX Fitness Studio",
  defaultDescription: "",
  ogImageId: null as string | null,
  robots: "index,follow",
  googleAnalyticsId: "",
  metaPixelId: "",
};

export type SiteSettings = {
  general: typeof generalDefaults;
  theme: typeof defaultTheme;
  seo: typeof seoDefaults;
  email: Record<string, unknown>;
  scripts: { headScripts: string; bodyScripts: string };
};

/** Merge stored JSON for a key over its defaults, tolerating partial rows. */
function mergeOver<T extends Record<string, unknown>>(
  defaults: T,
  stored: unknown,
): T {
  if (!stored || typeof stored !== "object" || Array.isArray(stored)) {
    return defaults;
  }
  return { ...defaults, ...(stored as Partial<T>) };
}

export const getSiteSettings = cache(async (): Promise<SiteSettings> => {
  const rows = await prisma.setting.findMany();
  const byKey: Record<string, unknown> = {};
  for (const row of rows) byKey[row.key] = row.value;

  return {
    general: mergeOver(generalDefaults, byKey.general),
    theme: mergeOver(defaultTheme, byKey.theme),
    seo: mergeOver(seoDefaults, byKey.seo),
    email: mergeOver({}, byKey.email),
    scripts: mergeOver({ headScripts: "", bodyScripts: "" }, byKey.scripts),
  } as SiteSettings;
});

export type PublicMenuLink = {
  id: string;
  label: string;
  href: string;
  newTab: boolean;
  children: PublicMenuLink[];
};

/** Build the display tree (one level of nesting) for a header/footer menu. */
export const getMenuLinks = cache(
  async (menu: MenuLocation): Promise<PublicMenuLink[]> => {
    const items = await prisma.menuItem.findMany({
      where: { menu },
      orderBy: { sortOrder: "asc" },
      include: {
        page: {
          select: { slug: true, isHome: true, status: true, deletedAt: true },
        },
      },
    });

    /**
     * Only pages that are actually live may be in the menu (Phase 3): a page
     * that is a draft, still scheduled, or trashed is skipped so the public
     * site never links to a 404.
     */
    const publiclyVisible = (page: (typeof items)[number]["page"]): boolean => {
      if (!page) return false;
      if (page.deletedAt) return false;
      if (page.status === "DRAFT") return false;
      if (page.status === "SCHEDULED") return false;
      return true;
    };

    const linkFor = (
      item: (typeof items)[number],
    ): { href: string; newTab: boolean } | null => {
      if (item.linkType === LinkType.URL) {
        return { href: item.url ?? "/", newTab: item.newTab };
      }
      const page = item.page;
      if (!page || !publiclyVisible(page)) return null;
      const href = page.isHome ? "/" : `/${page.slug}`;
      return { href, newTab: item.newTab };
    };

    const top: PublicMenuLink[] = [];
    const childrenById = new Map<string, PublicMenuLink[]>();

    for (const item of items) {
      const link = linkFor(item);
      if (!link) continue;
      const node: PublicMenuLink = {
        id: item.id,
        label: item.label,
        href: link.href,
        newTab: link.newTab,
        children: [],
      };
      if (item.parentId) {
        const list = childrenById.get(item.parentId) ?? [];
        list.push(node);
        childrenById.set(item.parentId, list);
      } else {
        top.push(node);
      }
    }

    for (const node of top) {
      node.children = childrenById.get(node.id) ?? [];
    }
    return top;
  },
);
