import "server-only";

import { revalidatePath } from "next/cache";
import { cache } from "react";

import { prisma } from "@/lib/db";
import type { RenderableSection } from "@/components/sections/renderers";

/**
 * Public page resolution (PRD 5.2, 5.3) with the Phase 3 publishing model:
 *
 *  - `sections` rows on a page are the WORKING DRAFT.
 *  - Publishing snapshots page metadata + sections into an immutable
 *    `PageVersion.snapshot` and points the page at it (`published_version_id`).
 *  - The public site renders the published snapshot. Legacy pages that are
 *    PUBLISHED but have no snapshot yet (e.g. the seeded home page before its
 *    first publish) render the live draft sections so the site is never blank.
 *  - SCHEDULED pages keep showing their last published snapshot (or 404 if they
 *    were never published); when `publish_at` arrives they are promoted to
 *    PUBLISHED lazily on the next request (no cron job needed).
 */

type PublicPageRow = {
  id: string;
  title: string;
  slug: string;
  isHome: boolean;
  status: "DRAFT" | "PUBLISHED" | "SCHEDULED";
  seoTitle: string | null;
  seoDescription: string | null;
  ogImageId: string | null;
  noindex: boolean;
  publishedAt: Date | null;
  publishAt: Date | null;
  hasUnpublishedChanges: boolean;
  publishedVersionId: string | null;
};

export type PublicPageData = {
  page: PublicPageRow;
  sections: RenderableSection[];
  /** True when this render served a snapshot (prefers snapshots going forward). */
  fromSnapshot: boolean;
};

function toRenderable(row: {
  id: string;
  type: string;
  content: unknown;
  style: unknown;
  isVisible: boolean;
  visibilityDevices: string;
}): RenderableSection {
  return {
    id: row.id,
    type: row.type,
    content: (row.content ?? {}) as Record<string, unknown>,
    style: (row.style ?? {}) as Record<string, unknown>,
    isVisible: row.isVisible,
    visibilityDevices: row.visibilityDevices,
  };
}

/** Promote a due SCHEDULED page to PUBLISHED (lazy, read-time). */
export async function promoteScheduledIfDue(
  page: PublicPageRow,
): Promise<boolean> {
  if (page.status !== "SCHEDULED" || !page.publishAt) return false;
  if (page.publishAt > new Date()) return false;
  await prisma.page.update({
    where: { id: page.id },
    data: { status: "PUBLISHED", publishAt: null },
  });
  revalidatePath("/", "layout");
  return true;
}

/**
 * Resolve the published version of a page for public rendering. `slug === null`
 * means the home page (the row flagged `is_home`).
 */
export const getPublicPageBySlug = cache(
  async (slug: string | null): Promise<PublicPageData | null> => {
    const page = await prisma.page.findFirst({
      where: slug === null ? { isHome: true } : { slug },
    });
    if (!page || page.deletedAt) return null;

    const row: PublicPageRow = {
      id: page.id,
      title: page.title,
      slug: page.slug,
      isHome: page.isHome,
      status: page.status,
      seoTitle: page.seoTitle,
      seoDescription: page.seoDescription,
      ogImageId: page.ogImageId,
      noindex: page.noindex,
      publishedAt: page.publishedAt,
      publishAt: page.publishAt,
      hasUnpublishedChanges: page.hasUnpublishedChanges,
      publishedVersionId: page.publishedVersionId,
    };

    if (row.status === "DRAFT") return null;

    if (row.status === "SCHEDULED") {
      // Not due yet: keep serving the last published snapshot, or 404 when the
      // page has never been published.
      const due = await promoteScheduledIfDue(row);
      if (!due && !row.publishedVersionId) return null;
      if (due) row.status = "PUBLISHED";
    }

    let sections: RenderableSection[] | null = null;
    let fromSnapshot = false;

    if (row.publishedVersionId) {
      const version = await prisma.pageVersion.findUnique({
        where: { id: row.publishedVersionId },
        select: { snapshot: true },
      });
      const snapshot = version?.snapshot as { sections?: unknown } | null;
      if (Array.isArray(snapshot?.sections)) {
        sections = (snapshot.sections as RenderableSection[]).filter(
          (section) => section && typeof section === "object",
        );
        fromSnapshot = true;
      }
    }

    if (!sections) {
      const rows = await prisma.section.findMany({
        where: { pageId: page.id },
        orderBy: { sortOrder: "asc" },
      });
      sections = rows.map(toRenderable);
    }

    return { page: row, sections, fromSnapshot };
  },
);

/** Draft sections for the admin preview iframe (never served publicly). */
export async function getPageDraftForPreview(pageId: string): Promise<{
  page: PublicPageRow;
  sections: RenderableSection[];
} | null> {
  const page = await prisma.page.findFirst({ where: { id: pageId } });
  if (!page || page.deletedAt) return null;
  const rows = await prisma.section.findMany({
    where: { pageId },
    orderBy: { sortOrder: "asc" },
  });
  return {
    page: {
      id: page.id,
      title: page.title,
      slug: page.slug,
      isHome: page.isHome,
      status: page.status,
      seoTitle: page.seoTitle,
      seoDescription: page.seoDescription,
      ogImageId: page.ogImageId,
      noindex: page.noindex,
      publishedAt: page.publishedAt,
      publishAt: page.publishAt,
      hasUnpublishedChanges: page.hasUnpublishedChanges,
      publishedVersionId: page.publishedVersionId,
    },
    sections: rows.map(toRenderable),
  };
}
