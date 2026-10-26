import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { mediaUrl } from "@/lib/media-url";
import { serializeJsonLd } from "@/lib/seo";
import { getSiteSettings } from "@/lib/site/settings";
import { defaultContent, fallbackServiceImages } from "@/components/experience/content";

export const dynamic = "force-dynamic";

/**
 * Service profile page (PRD Phase 4): markdown-free, plain-text content with a
 * cover image, optional gallery and a consultation CTA. Draft/unpublished
 * services 404 so nothing unreleased is ever reachable.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const service = await prisma.service.findUnique({
    where: { slug },
    select: {
      title: true,
      shortDescription: true,
      seoTitle: true,
      seoDescription: true,
      isPublished: true,
    },
  });
  if (!service || !service.isPublished) return {};
  const title = service.seoTitle || service.title;
  const description =
    service.seoDescription || service.shortDescription || undefined;
  return { title, description, openGraph: { title, description } };
}

export default async function ServiceDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const service = await prisma.service.findUnique({ where: { slug } });
  if (!service || !service.isPublished) notFound();

  const galleryIds = Array.isArray(service.gallery)
    ? (service.gallery as unknown[]).map(String).filter(Boolean)
    : [];
  const cover = service.imageId
    ? await prisma.media.findUnique({ where: { id: service.imageId } })
    : null;
  const galleryMedia = galleryIds.length
    ? await prisma.media.findMany({ where: { id: { in: galleryIds } } })
    : [];
  const galleryByIndex = galleryIds
    .map((id) => galleryMedia.find((entry) => entry.id === id))
    .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry));

  const contentParagraphs = (service.content ?? "")
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  const cta = {
    label: service.ctaLabel?.trim() || "Book a consultation",
    href: service.ctaUrl?.trim() || "/contact",
  };

  const coverSrc = cover
    ? mediaUrl({ path: cover.path })
    : (defaultContent.services.find((s) => s.href === `/services/${service.slug}`)?.image ??
      fallbackServiceImages[Math.max(0, service.sortOrder) % fallbackServiceImages.length]);

  return (
    <main>
      <section className="relative flex min-h-[78svh] items-end pt-36 pb-14">
        <div className="mx-auto w-full max-w-7xl px-5 sm:px-10">
          <Link href="/services" className="film-mono block w-fit text-[11px] text-white/50 transition hover:text-accent">
            ← All programs
          </Link>
          <p className="eyebrow eyebrow-bar mt-10">Program</p>
          <h1 className="film-display mt-5 max-w-5xl text-[13vw] md:text-[7.5vw]">{service.title}</h1>
          {service.shortDescription ? (
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted">{service.shortDescription}</p>
          ) : null}
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href={cta.href}
              className="film-btn film-btn-hot"
              {...(cta.href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}
            >
              {cta.label}
            </a>
            <Link href="/plans" className="film-btn">
              See plans
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-5 sm:px-10">
        <figure className="overflow-hidden rounded-brand border border-line">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={coverSrc} alt={service.title} className="aspect-[21/9] w-full object-cover" />
        </figure>
      </section>

      {contentParagraphs.length > 0 ? (
        <section className="mx-auto grid w-full max-w-7xl gap-8 px-5 py-24 sm:px-10 md:grid-cols-[1fr_2fr]">
          <p className="film-mono text-[11px] text-white/50">
            <span className="text-accent">[ 01 ]</span> The program
          </p>
          <div className="space-y-5">
            {contentParagraphs.map((paragraph, index) => (
              <p key={index} className="text-lg leading-relaxed text-ink/80">
                {paragraph}
              </p>
            ))}
          </div>
        </section>
      ) : null}

      {galleryByIndex.length > 0 ? (
        <section className="mx-auto w-full max-w-7xl px-5 pb-24 sm:px-10">
          <p className="film-mono text-[11px] text-white/50">
            <span className="text-accent">[ 02 ]</span> On the floor
          </p>
          <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-3">
            {galleryByIndex.map((image) => (
              <figure key={image.id} className="overflow-hidden rounded-brand border border-line">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={mediaUrl({ path: image.path })}
                  alt={service.title}
                  className="aspect-square w-full object-cover"
                />
              </figure>
            ))}
          </div>
        </section>
      ) : null}

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd({
            "@context": "https://schema.org",
            "@type": "Service",
            name: service.title,
            description: service.shortDescription?.trim() || undefined,
            url: new URL(`/services/${service.slug}`, env.APP_URL).toString(),
            provider: {
              "@type": "HealthClub",
              name: (await getSiteSettings()).general.businessName,
            },
          }),
        }}
      />
    </main>
  );
}
