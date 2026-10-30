import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { renderSections } from "@/components/sections/renderers";
import { CoreTeam } from "@/components/site/core-team";
import { pageSeo, seoMetadata } from "@/lib/fitx/seo";
import { getPublicPageBySlug } from "@/lib/site/pages";

export const dynamic = "force-dynamic";

/**
 * Dynamic public page route (PRD 5.2, Phase 3): resolves a page by slug,
 * promotes due scheduled pages lazily, and renders the published snapshot.
 * Drafts, scheduled-but-not-due pages without a live version, and trashed
 * pages all 404 on the public site.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const data = await getPublicPageBySlug(slug);
  if (!data) return {};

  const { page } = data;
  // Pages with written search copy (src/lib/fitx/seo.ts) use it.
  if (pageSeo[`/${slug}`]) {
    const metadata = seoMetadata(`/${slug}`);
    if (page.noindex) metadata.robots = { index: false, follow: false };
    return metadata;
  }
  const title = page.seoTitle || page.title;
  const description = page.seoDescription ?? undefined;

  const metadata: Metadata = { title, description, alternates: { canonical: `/${slug}` } };
  if (page.noindex) {
    metadata.robots = { index: false, follow: false };
  }
  metadata.openGraph = { title, description };
  if (page.ogImageId) {
    try {
      const { prisma } = await import("@/lib/db");
      const image = await prisma.media.findUnique({
        where: { id: page.ogImageId },
        select: { path: true, filename: true },
      });
      if (image) {
        metadata.openGraph = {
          title,
          description,
          images: [{ url: `/uploads/${image.path.replace(/^\/+/, "")}` }],
        };
      }
    } catch {
      // Media lookup is best-effort — never fail a page render for a broken og:image.
    }
  }
  return metadata;
}

export default async function PublicPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await getPublicPageBySlug(slug);
  if (!data) notFound();

  // The owners' profiles follow the story on the Who We Are page.
  if (slug === "who-we-are") {
    const [story, ...rest] = data.sections;
    return (
      <main className="min-h-full">
        {await renderSections(story ? [story] : [])}
        <CoreTeam />
        {await renderSections(rest, false)}
      </main>
    );
  }

  return (
    <main className="min-h-full">{await renderSections(data.sections)}</main>
  );
}
