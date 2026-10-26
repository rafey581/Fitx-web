import { NewPageForm } from "./new-page-form";
import { requirePermission } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

/** Create a page: name + optional slug + optional "copy sections from". */
export default async function AdminNewPagePage() {
  await requirePermission("pages:write");

  const { prisma } = await import("@/lib/db");
  const pages = await prisma.page.findMany({
    where: { deletedAt: null },
    orderBy: { title: "asc" },
    select: {
      id: true,
      title: true,
      slug: true,
      isHome: true,
      _count: { select: { sections: true } },
    },
  });

  return (
    <div className="mx-auto w-full max-w-2xl">
      <header>
        <p className="eyebrow">Content</p>
        <h1 className="heading-display mt-2 text-3xl text-ink">New page</h1>
        <p className="mt-2 text-sm text-muted">
          Pages start as drafts. After creating one you&apos;ll open the block
          builder to add sections, then publish.
        </p>
      </header>
      <div className="mt-8 rounded-brand border border-black/10 bg-white p-6 shadow-sm">
        <NewPageForm
          pages={pages.map((page) => ({
            id: page.id,
            title: page.title,
            sectionCount: page._count.sections,
          }))}
        />
      </div>
    </div>
  );
}
