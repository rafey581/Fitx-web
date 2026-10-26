import { notFound } from "next/navigation";

import { renderSections } from "@/components/sections/renderers";
import { getPublicPageBySlug } from "@/lib/site/pages";

export const dynamic = "force-dynamic";

/**
 * Database-driven home page (PRD 5.3, Phase 3). The home row flagged
 * `is_home` is always served at `/`; its published snapshot (or the working
 * draft for legacy pages) is rendered through the section renderers.
 */
export default async function HomePage() {
  const data = await getPublicPageBySlug(null);
  if (!data) notFound();

  return (
    <main className="min-h-full">{await renderSections(data.sections)}</main>
  );
}
