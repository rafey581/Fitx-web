import type { Metadata } from "next";

import { Experience } from "@/components/experience/Experience";
import { seoMetadata } from "@/lib/fitx/seo";
import { getFilmContent } from "@/lib/site/film";

export const dynamic = "force-dynamic";

export const metadata: Metadata = seoMetadata("/");

/**
 * Home: a single scroll-driven 3D film (origin → forge → programs → studio →
 * coaches → plans → join). Copy comes from the CMS via `getFilmContent`.
 */
export default async function HomePage() {
  const content = await getFilmContent();
  return <Experience content={content} />;
}
