import Link from "next/link";

import { PagesManager, type PageSummaryRow } from "./pages-manager";
import { roleHasPermission } from "@/lib/auth/permissions";
import { requirePermission } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

/**
 * Page manager (PRD Phase 3): list, build, duplicate, trash, restore.
 * Permissions are enforced on the server: the route requires `pages:read` and
 * every action re-checks `pages:write`, `pages:publish` or `pages:delete`.
 */
export default async function AdminPagesPage() {
  const user = await requirePermission("pages:read");
  const canWrite = roleHasPermission(user.role, "pages:write");
  const canDelete = roleHasPermission(user.role, "pages:delete");

  const { prisma } = await import("@/lib/db");
  const rows = await prisma.page.findMany({
    orderBy: [{ deletedAt: "asc" }, { isHome: "desc" }, { updatedAt: "desc" }],
    include: {
      _count: { select: { sections: true } },
    },
  });

  const pages: PageSummaryRow[] = rows.map((page) => ({
    id: page.id,
    title: page.title,
    slug: page.slug,
    href: page.isHome ? "/" : `/${page.slug}`,
    isHome: page.isHome,
    status: page.status,
    noindex: page.noindex,
    sectionCount: page._count.sections,
    isTrashed: page.deletedAt !== null,
    hasUnpublishedChanges: page.hasUnpublishedChanges,
    published: page.publishedAt !== null,
    publishedAt: page.publishedAt?.toISOString() ?? null,
    updatedAt: page.updatedAt.toISOString(),
  }));

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Content</p>
          <h1 className="heading-display mt-2 text-3xl text-ink">Pages</h1>
          <p className="mt-2 text-sm text-muted">
            Build pages from blocks and publish them — live content updates
            immediately.
          </p>
        </div>
        {canWrite ? (
          <Link
            href="/admin/pages/new"
            className="btn btn-accent px-5 py-2.5 text-[0.7rem]"
          >
            + New page
          </Link>
        ) : null}
      </header>

      <PagesManager pages={pages} canWrite={canWrite} canDelete={canDelete} />
    </div>
  );
}
