import Link from "next/link";

import { coaches, owners } from "@/lib/fitx/knowledge";

/**
 * The studio's owners, as on its Core Team page: portrait and profile side by
 * side, alternating. Shown on the Who We Are page after the story.
 */
export function CoreTeam() {
  return (
    <section className="relative py-16" aria-labelledby="core-team-heading">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <p className="eyebrow eyebrow-bar">Core team</p>
        <h2 id="core-team-heading" className="heading-display heading-slash mt-4 text-3xl text-ink sm:text-5xl">
          The people behind FITX
        </h2>

        <div className="mt-12 space-y-16 md:space-y-24">
          {owners.map((owner, i) => (
            <article key={owner.slug} className="grid items-center gap-8 md:grid-cols-[0.8fr_1.2fr] md:gap-14">
              <figure className={`overflow-hidden rounded-brand border border-line ${i % 2 ? "md:order-2" : ""}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={owner.photo}
                  alt={`${owner.name}, ${owner.role}`}
                  loading="lazy"
                  className="aspect-[4/5] w-full object-cover object-top"
                />
              </figure>
              <div>
                <p className="eyebrow">{owner.role}</p>
                <h3 className="heading-display mt-3 text-2xl text-ink sm:text-3xl">{owner.name}</h3>
                <div className="mt-5 space-y-4">
                  {owner.bio.split(/\n{2,}/).map((paragraph, k) => (
                    <p key={k} className="leading-relaxed text-muted">
                      {paragraph}
                    </p>
                  ))}
                </div>
                {coaches.some((c) => c.slug === owner.slug) ? (
                  <Link href={`/trainers/${owner.slug}`} className="film-link mt-6">
                    View coach profile
                  </Link>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
