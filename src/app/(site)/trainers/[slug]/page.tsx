import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { mediaUrl } from "@/lib/media-url";
import { coachPhoto, rosterPhoto } from "@/components/experience/content";
import { coaches } from "@/lib/fitx/knowledge";
import { breadcrumbJsonLd } from "@/lib/fitx/seo";
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
  const profile = coaches.find((c) => c.slug === slug);
  const title =
    trainer.seoTitle ||
    `${trainer.name}${trainer.title ? ` – ${trainer.title}` : ""} in Sahiwal`;
  const description =
    trainer.seoDescription ||
    (profile?.summary
      ? `${profile.summary} Train with ${trainer.name.split(" ")[0]} at FITX, Shadman Town, Sahiwal.`
      : trainer.title
        ? `${trainer.name}, ${trainer.title} at FITX Personal Fitness Training Studio, Sahiwal.`
        : undefined);
  return {
    title,
    description,
    alternates: { canonical: `/trainers/${slug}` },
    openGraph: {
      title: `${title} | FITX`,
      description,
      url: `/trainers/${slug}`,
      images: profile ? [{ url: profile.photo }] : undefined,
    },
  };
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
  const portrait =
    rosterPhoto(trainer.slug) ?? (photo ? mediaUrl({ path: photo.path }) : coachPhoto(trainer.slug, position));
  const firstName = trainer.name.split(" ")[0];
  // The studio's written profile (quote, focus, who it suits) for roster coaches.
  const profile = coaches.find((c) => c.slug === trainer.slug);

  return (
    <main>
      <section className="mx-auto grid min-h-[86svh] w-full max-w-7xl items-end gap-10 px-5 pt-32 pb-16 sm:px-10 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <Link href="/coaches" className="film-mono block w-fit text-[11px] text-white/50 transition hover:text-accent">
            ← All coaches
          </Link>
          <p className="eyebrow eyebrow-bar mt-10">{trainer.title || "Coach"}</p>
          <h1 className="film-display mt-5 type-hero">{trainer.name}</h1>

          {profile?.specialty ? (
            <p className="mt-4 text-lg text-white/85">{profile.specialty}</p>
          ) : null}
          {profile?.experience ? (
            <p className="film-mono mt-3 text-[11px] text-accent">{profile.experience}</p>
          ) : null}

          {specialties.length > 0 && !profile?.focus?.length ? (
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

      {profile?.quote || profile?.focus?.length || profile?.rightFor?.length ? (
        <section className="mx-auto w-full max-w-7xl px-5 pb-20 sm:px-10">
          {profile.quote ? (
            <blockquote className="max-w-3xl border-l-2 border-accent pl-6 font-serif text-2xl leading-snug text-white/90 sm:text-3xl">
              &ldquo;{profile.quote}&rdquo;
            </blockquote>
          ) : null}
          <div className="mt-12 grid gap-6 md:grid-cols-2">
            {[
              { title: "Training focus", items: profile.focus ?? [] },
              { title: `Who ${firstName} is right for`, items: profile.rightFor ?? [] },
            ]
              .filter((list) => list.items.length > 0)
              .map((list) => (
                <div key={list.title} className="card p-6">
                  <p className="eyebrow">{list.title}</p>
                  <ul className="mt-4 space-y-3">
                    {list.items.map((item) => (
                      <li key={item} className="flex gap-3 leading-relaxed text-white/80">
                        <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
          </div>
        </section>
      ) : null}

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
          __html: serializeJsonLd([
            {
              "@context": "https://schema.org",
              "@type": "Person",
              name: trainer.name,
              jobTitle: trainer.title || undefined,
              description: trainer.bio?.split(/\n{2,}/)[0]?.trim() || undefined,
              url: new URL(`/trainers/${trainer.slug}`, env.APP_URL).toString(),
              image: new URL(portrait, env.APP_URL).toString(),
              worksFor: { "@id": new URL("/#gym", env.APP_URL).toString() },
              ...(profile?.credentials?.length ? { hasCredential: profile.credentials } : {}),
              ...(trainer.specialties && Array.isArray(trainer.specialties)
                ? { knowsAbout: trainer.specialties.map(String) }
                : {}),
            },
            breadcrumbJsonLd(env.APP_URL, [
              { name: "Coaches", path: "/coaches" },
              { name: trainer.name, path: `/trainers/${trainer.slug}` },
            ]),
          ]),
        }}
      />
    </main>
  );
}
