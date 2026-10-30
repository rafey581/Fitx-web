import type { Metadata } from "next";
import Link from "next/link";

import { TransformationsGallery } from "@/components/site/transformations-gallery";
import { seoMetadata } from "@/lib/fitx/seo";
import { featuredTransformations, transformations } from "@/lib/fitx/transformations";

export const metadata: Metadata = seoMetadata("/transformations");

/** Before/after gallery: Client of the Month features, then every result. */
export default function TransformationsPage() {
  const total = featuredTransformations.length + transformations.length;
  return (
    <main>
      <section className="flex min-h-[64svh] items-end pt-36 pb-12">
        <div className="mx-auto w-full max-w-7xl px-5 sm:px-10">
          <p className="eyebrow eyebrow-bar">Real results</p>
          <h1 className="film-display mt-5 type-hero">
            Before <span className="text-accent">&amp;</span> after
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted">
            {total} FITX clients, coached and tracked. Some faces are covered for privacy.
          </p>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-5 sm:px-10">
        <p className="footer-label">Client of the month</p>
        <div className="mt-6 grid gap-6 md:grid-cols-3">
          {featuredTransformations.map((t) => (
            <figure key={t.src} className="overflow-hidden rounded-brand border border-line">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={t.src}
                width={t.width}
                height={t.height}
                alt={`${t.name}, FITX Client of the Month: ${t.result}`}
                className="h-auto w-full"
              />
              <figcaption className="flex items-baseline justify-between gap-3 border-t border-line px-5 py-4">
                <span className="heading-display text-lg text-ink">{t.name}</span>
                <span className="film-mono text-[11px] text-accent">{t.result}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-5 py-20 sm:px-10">
        <p className="footer-label">All transformations</p>
        <p className="mt-3 mb-8 max-w-xl text-sm text-muted">Tap any result to see it full size.</p>
        <TransformationsGallery items={transformations} />
        <p className="mt-10 max-w-2xl text-sm text-muted">
          Results vary from person to person and depend on consistency, training and nutrition. FITX does not
          guarantee a specific result or timeline.
        </p>
      </section>

      <section className="mx-auto w-full max-w-7xl px-5 pb-10 sm:px-10">
        <div className="card flex flex-col items-start justify-between gap-6 p-8 md:flex-row md:items-center">
          <div>
            <h2 className="film-display type-heading">
              Your turn<span className="text-accent">.</span>
            </h2>
            <p className="mt-2 text-muted">Tell us your goal and we&apos;ll build the plan to reach it.</p>
          </div>
          <Link href="/contact" className="film-btn film-btn-hot">
            Book a consultation
          </Link>
        </div>
      </section>
    </main>
  );
}
