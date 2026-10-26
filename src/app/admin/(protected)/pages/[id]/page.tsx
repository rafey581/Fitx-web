import { notFound } from "next/navigation";

import { PageBuilder } from "./builder";
import { roleHasPermission } from "@/lib/auth/permissions";
import { requirePermission } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

/**
 * Visual page builder (PRD Phase 3): compose sections, reorder, preview at
 * different device widths, save the draft, publish, and browse versions.
 * `pages:read` is required to view; the banner, editor and forms are gated by
 * `pages:write` / `pages:publish` (server actions re-check every permission).
 */
export default async function AdminPageBuilderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requirePermission("pages:read");
  const canWrite = roleHasPermission(user.role, "pages:write");
  const canPublish = roleHasPermission(user.role, "pages:publish");

  const { prisma } = await import("@/lib/db");
  const page = await prisma.page.findFirst({
    where: { id, deletedAt: null },
  });
  if (!page) notFound();

  const [draftRows, versions, media, services, trainers, plans, gallery] =
    await Promise.all([
      prisma.section.findMany({
        where: { pageId: id },
        orderBy: { sortOrder: "asc" },
      }),
      prisma.pageVersion.findMany({
        where: { pageId: id },
        orderBy: { createdAt: "desc" },
        take: 20,
        select: { id: true, label: true, createdAt: true },
      }),
      prisma.media.findMany({
        orderBy: { createdAt: "desc" },
        select: { id: true, path: true, filename: true },
      }),
      prisma.service.findMany({
        where: { isPublished: true },
        orderBy: { title: "asc" },
        select: { id: true, title: true },
      }),
      prisma.trainer.findMany({
        where: { isPublished: true },
        orderBy: { name: "asc" },
        select: { id: true, name: true },
      }),
      prisma.plan.findMany({
        where: { isPublished: true },
        orderBy: { name: "asc" },
        select: { id: true, name: true },
      }),
      prisma.galleryItem.findMany({
        where: { isPublished: true },
        orderBy: { sortOrder: "asc" },
        select: { id: true, caption: true, category: true },
      }),
    ]);

  return (
    <PageBuilder
      page={{
        id: page.id,
        title: page.title,
        slug: page.slug,
        isHome: page.isHome,
        status: page.status,
        noindex: page.noindex,
        seoTitle: page.seoTitle,
        seoDescription: page.seoDescription,
        ogImageId: page.ogImageId,
        publishAt: page.publishAt?.toISOString() ?? null,
        hasUnpublishedChanges: page.hasUnpublishedChanges,
        published: page.publishedAt !== null,
      }}
      drafts={draftRows.map((row) => ({
        key: row.id,
        type: row.type,
        content: (row.content ?? {}) as Record<string, unknown>,
        style: (row.style ?? {}) as Record<string, unknown>,
        isVisible: row.isVisible,
        visibilityDevices: row.visibilityDevices as
          "all" | "desktop" | "mobile",
      }))}
      versions={versions.map((version) => ({
        id: version.id,
        label: version.label ?? `${version.createdAt.toISOString()}`,
        createdAt: version.createdAt.toISOString(),
        isCurrent: version.id === page.publishedVersionId,
      }))}
      canWrite={canWrite}
      canPublish={canPublish}
      context={{
        media: media.map((entry) => ({
          id: entry.id,
          thumb: `/uploads/${entry.path.replace(/^\/+/, "")}`,
          filename: entry.filename,
        })),
        services: services.map((entry) => ({
          id: entry.id,
          title: entry.title,
        })),
        trainers: trainers.map((entry) => ({ id: entry.id, name: entry.name })),
        plans: plans.map((entry) => ({ id: entry.id, name: entry.name })),
        gallery: gallery.map((entry) => ({
          id: entry.id,
          label: entry.caption?.trim() || entry.category,
        })),
      }}
    />
  );
}
