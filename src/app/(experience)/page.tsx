import { Experience } from "@/components/experience/Experience";
import { getFilmContent } from "@/lib/site/film";

export const dynamic = "force-dynamic";

/**
 * Home: a single scroll-driven 3D film (origin → forge → programs → studio →
 * coaches → plans → join). Copy comes from the CMS via `getFilmContent`.
 */
export default async function HomePage() {
  const content = await getFilmContent();
  return <Experience content={content} />;
}
