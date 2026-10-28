import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { mediaUrl } from "@/lib/media-url";
import { coachPhoto } from "@/components/experience/content";
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

  // Same fallback photo as this coach's card on /coaches (position in the
  // published list), so the card and the profile always match.
  const order = photo
    ? []
    : await prisma.trainer.findMany({
        where: { isPublished: true },
        orderBy: { sortOrder: "asc" },
        select: { id: true },
      });
  const position = Math.max(0, order.findIndex((t) => t.id === trainer.id));
  const portrait = photo
    ? mediaUrl({ path: photo.path })
    : coachPhoto(trainer.slug, position);
  const firstName = trainer.name.split(" ")[0];

  return (
    <main>
      <section className="mx-auto grid min-h-[86svh] w-full max-w-7xl items-end gap-10 px-5 pt-32 pb-16 sm:px-10 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <Link href="/coaches" className="film-mono block w-fit text-[11px] text-white/50 transition hover:text-accent">
            ← All coaches
          </Link>
          <p className="eyebrow eyebrow-bar mt-10">{trainer.title || "Coach"}</p>
          <h1 className="film-display mt-5 type-hero">{trainer.name}</h1>

          {specialties.length > 0 ? (
            <ul className="mt-6 flex flex-wrap gap-2">
              {specialties.map((specialty) => (
                <li key={specialty} className="chip">
                  {specialty}
                </li>
              ))}
            </ul>
          ) : null}

          {trainer.bio ? (
            <div className="mt-6 max-w-xl space-y-4">
              {trainer.bio
                .split(/\n{2,}/)
                .map((paragraph) => paragraph.trim())
                .filter(Boolean)
                .map((paragraph, index) => (
                  <p key={index} className="text-lg leading-relaxed text-ink/80">
                    {paragraph}
                  </p>
                ))}
            </div>
          ) : null}

          {certifications.length > 0 ? (
            <ul className="film-mono mt-8 space-y-1.5 text-[11px] text-white/60">
              {certifications.map((certification) => (
                <li key={certification} className="flex items-center gap-2">
                  <span className="text-accent">✓</span> {certification}
                </li>
              ))}
            </ul>
          ) : null}

          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/contact" className="film-btn film-btn-hot">
              Train with {firstName}
            </Link>
            {socials.map(({ label, url }) => (
              <a key={label} href={url} target="_blank" rel="noopener noreferrer" className="film-btn">
                {label} ↗
              </a>
            ))}
          </div>
        </div>

        <figure className="overflow-hidden rounded-brand border border-line">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={portrait} alt={trainer.name} className="aspect-[4/5] w-full object-cover" />
        </figure>
      </section>

      {classes.length > 0 ? (
        <section className="mx-auto w-full max-w-7xl px-5 pb-24 sm:px-10">
          <p className="film-mono text-[11px] text-white/50">
            <span className="text-accent">[ 01 ]</span> Classes with {firstName}
          </p>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {classes.map((entry) => (
              <li key={entry.id} className="card card-hover p-5">
                <p className="heading-display text-lg text-ink">{entry.title}</p>
                <p className="film-mono mt-2 text-[10px] text-white/50">
                  {DAY_NAMES[entry.dayOfWeek] ?? `Day ${entry.dayOfWeek}`} · {entry.startTime}–{entry.endTime}
                </p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

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
