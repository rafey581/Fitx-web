import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { mediaUrl } from "@/lib/media-url";
import { serializeJsonLd } from "@/lib/seo";
import { getSiteSettings } from "@/lib/site/settings";

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

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
      <Link
        href="/services"
        className="text-sm font-semibold text-muted transition hover:text-accent"
      >
        ← All services
      </Link>

      <header className="mt-6 max-w-3xl">
        <p className="eyebrow eyebrow-bar">Programs</p>
        <h1 className="heading-display mt-3 text-4xl text-ink sm:text-5xl">
          {service.title}
        </h1>
        {service.shortDescription ? (
          <p className="mt-4 font-serif text-lg leading-relaxed text-muted">
            {service.shortDescription}
          </p>
        ) : null}
      </header>

      {cover ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={mediaUrl({ path: cover.path })}
          alt={service.title}
          className="mt-8 aspect-[16/9] w-full rounded-brand border border-line object-cover shadow-[0_36px_70px_-46px_rgba(13,10,16,0.65)]"
        />
      ) : null}

      {contentParagraphs.length > 0 ? (
        <div className="mt-10 max-w-3xl space-y-5">
          {contentParagraphs.map((paragraph, index) => (
            <p
              key={index}
              className="font-serif text-lg leading-relaxed text-ink/80"
            >
              {paragraph}
            </p>
          ))}
        </div>
      ) : null}

      {galleryByIndex.length > 0 ? (
        <section className="mt-12">
          <h2 className="heading-display text-xl text-ink">Gallery</h2>
          <div className="mt-5 grid grid-cols-2 gap-4 lg:grid-cols-3">
            {galleryByIndex.map((image) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={image.id}
                src={mediaUrl({ path: image.path })}
                alt={service.title}
                className="aspect-square w-full rounded-brand border border-line object-cover"
              />
            ))}
          </div>
        </section>
      ) : null}

      <div className="mt-12">
        <a
          href={cta.href}
          className="btn btn-accent inline-flex"
          {...(cta.href.startsWith("http")
            ? { target: "_blank", rel: "noopener noreferrer" }
            : {})}
        >
          {cta.label}
        </a>
      </div>

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
