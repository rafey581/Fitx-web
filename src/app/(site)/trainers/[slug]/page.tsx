import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { mediaUrl } from "@/lib/media-url";
import { serializeJsonLd } from "@/lib/seo";

export const dynamic = "force-dynamic";

const SOCIAL_LINKS = [
  { key: "facebookUrl", label: "Facebook", href: "https://facebook.com" },
  { key: "instagramUrl", label: "Instagram", href: "https://instagram.com" },
  { key: "twitterUrl", label: "X (Twitter)", href: "https://x.com" },
  { key: "youtubeUrl", label: "YouTube", href: "https://youtube.com" },
] as const;

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

/**
 * Trainer profile page (PRD Phase 4): photo, bio, specialties, certifications,
 * social links and the classes they teach from the timetable module.
 * Unpublished trainers 404.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const trainer = await prisma.trainer.findUnique({
    where: { slug },
    select: {
      name: true,
      title: true,
      seoTitle: true,
      seoDescription: true,
      isPublished: true,
    },
  });
  if (!trainer || !trainer.isPublished) return {};
  const title = trainer.seoTitle || trainer.name;
  const description =
    trainer.seoDescription ||
    (trainer.title ? `${trainer.name} — ${trainer.title} at FITX.` : undefined);
  return { title, description, openGraph: { title, description } };
}

export default async function TrainerDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const trainer = await prisma.trainer.findUnique({ where: { slug } });
  if (!trainer || !trainer.isPublished) notFound();

  const photo = trainer.photoId
    ? await prisma.media.findUnique({ where: { id: trainer.photoId } })
    : null;

  const specialties = Array.isArray(trainer.specialties)
    ? (trainer.specialties as unknown[]).map(String)
    : [];
  const certifications = Array.isArray(trainer.certifications)
    ? (trainer.certifications as unknown[]).map(String)
    : [];

  const classes = await prisma.timetableEntry.findMany({
    where: { trainerId: trainer.id, isPublished: true },
    orderBy: [{ dayOfWeek: "asc" }, { sortOrder: "asc" }],
  });

  const socials: { label: string; url: string }[] = [];
  for (const { key, label } of SOCIAL_LINKS) {
    const url = trainer[key];
    if (url) socials.push({ label, url });
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
      <Link
        href="/trainers"
        className="text-sm font-semibold text-muted transition hover:text-accent"
      >
        ← All trainers
      </Link>

      <header className="mt-6 grid gap-8 lg:grid-cols-[280px_1fr] lg:items-start">
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={mediaUrl({ path: photo.path })}
            alt={trainer.name}
            className="aspect-square w-full max-w-xs rounded-brand object-cover shadow-[0_30px_60px_-40px_rgba(13,10,16,0.6)] lg:max-w-none"
          />
        ) : (
          <div className="media-placeholder grid aspect-square w-full max-w-xs place-items-center rounded-brand lg:max-w-none">
            <span className="heading-display text-6xl text-white">
              {trainer.name.trim().charAt(0)}
            </span>
          </div>
        )}
        <div>
          <p className="eyebrow eyebrow-bar">Trainer</p>
          <h1 className="heading-display mt-3 text-4xl text-ink sm:text-5xl">
            {trainer.name}
          </h1>
          {trainer.title ? (
            <p className="mt-2 font-serif text-lg text-accent">
              {trainer.title}
            </p>
          ) : null}

          {specialties.length > 0 ? (
            <ul className="mt-5 flex flex-wrap gap-2">
              {specialties.map((specialty) => (
                <li key={specialty} className="chip">
                  {specialty}
                </li>
              ))}
            </ul>
          ) : null}

          {trainer.bio ? (
            <div className="mt-6 max-w-2xl space-y-4">
              {trainer.bio
                .split(/\n{2,}/)
                .map((paragraph) => paragraph.trim())
                .filter(Boolean)
                .map((paragraph, index) => (
                  <p
                    key={index}
                    className="font-serif text-lg leading-relaxed text-ink/80"
                  >
                    {paragraph}
                  </p>
                ))}
            </div>
          ) : null}

          {certifications.length > 0 ? (
            <div className="mt-8">
              <h2 className="font-heading text-sm font-bold text-muted uppercase">
                Certifications
              </h2>
              <ul className="mt-3 space-y-1">
                {certifications.map((certification) => (
                  <li
                    key={certification}
                    className="flex items-center gap-2 text-sm text-ink"
                  >
                    <span className="text-accent">✓</span> {certification}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {socials.length > 0 ? (
            <div className="mt-8 flex flex-wrap gap-3">
              {socials.map(({ label, url }) => (
                <a
                  key={label}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full border border-line px-4 py-1.5 text-sm font-semibold text-ink transition hover:border-accent hover:text-accent"
                >
                  {label}
                </a>
              ))}
            </div>
          ) : null}
        </div>
      </header>

      {classes.length > 0 ? (
        <section className="mt-12">
          <h2 className="heading-display text-xl text-ink">
            Classes with {trainer.name.split(" ")[0]}
          </h2>
          <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {classes.map((entry) => (
              <li
                key={entry.id}
                className="card card-hover p-4"
              >
                <p className="font-semibold text-ink">{entry.title}</p>
                <p className="mt-1 text-xs font-semibold tracking-wide text-muted uppercase">
                  {DAY_NAMES[entry.dayOfWeek] ?? `Day ${entry.dayOfWeek}`} ·{" "}
                  {entry.startTime}–{entry.endTime}
                </p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <div className="mt-12">
        <Link href="/contact" className="btn btn-accent inline-flex">
          Train with {trainer.name.split(" ")[0]}
        </Link>
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd({
            "@context": "https://schema.org",
            "@type": "Person",
            name: trainer.name,
            jobTitle: trainer.title || undefined,
            description: trainer.bio?.split(/\n{2,}/)[0]?.trim() || undefined,
            url: new URL(`/trainers/${trainer.slug}`, env.APP_URL).toString(),
            ...(trainer.specialties && Array.isArray(trainer.specialties)
              ? { knowsAbout: trainer.specialties.map(String) }
              : {}),
          }),
        }}
      />
    </main>
  );
}
