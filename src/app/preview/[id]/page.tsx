import { notFound } from "next/navigation";

import { renderSections } from "@/components/sections/renderers";
import { requireUser } from "@/lib/auth/server";
import { getPageDraftForPreview } from "@/lib/site/pages";

export const dynamic = "force-dynamic";

export const metadata = {
  robots: { index: false, follow: false },
};

/**
 * Auth-guarded draft preview, rendered inside the builder's iframe. Never
 * linked publicly: the route requires a logged-in admin, includes a `noindex`
 * meta tag, and renders the WORKING DRAFT (not the live snapshot).
 */
export default async function PreviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireUser();

  const data = await getPageDraftForPreview(id);
  if (!data) notFound();

  return (
    <main className="min-h-full bg-white">
      {await renderSections(data.sections)}
    </main>
  );
}
