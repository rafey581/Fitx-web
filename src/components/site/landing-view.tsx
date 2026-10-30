import Link from "next/link";

import { whatsappHref } from "@/components/site/whatsapp-button";
import { env } from "@/lib/env";
import { coaches, faqs, fees, formatRs, familyHour, studio } from "@/lib/fitx/knowledge";
import { landingPages, sessionsFor, type LandingPage } from "@/lib/fitx/landing";
import { googleReviews } from "@/lib/fitx/reviews";
import { breadcrumbJsonLd, jsonLd } from "@/lib/fitx/seo";

/** A local landing page (e.g. "Gym in Sahiwal"), rendered from src/lib/fitx/landing.ts. */
export function LandingView({ page }: { page: LandingPage }) {
  const featured = coaches.filter((c) => page.coaches.includes(c.slug));
  const reviews = googleReviews
    .filter((r) => page.reviewWords.some((w) => r.text.toLowerCase().includes(w)))
    .slice(0, 3);
  const answers = page.faqIds
    .map((id) => faqs.find((f) => f.id === id))
    .filter((f): f is (typeof faqs)[number] => Boolean(f));
  const others = landingPages.filter((p) => p.path !== page.path);
  const whatsapp = whatsappHref(studio.whatsapp);

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd(breadcrumbJsonLd(env.APP_URL, [{ name: page.label, path: page.path }])),
        }}
      />

      <section className="flex min-h-[60svh] items-end pt-36 pb-12">
        <div className="mx-auto w-full max-w-7xl px-5 sm:px-10">
          <p className="eyebrow eyebrow-bar">{page.eyebrow}</p>
          <h1 className="film-display mt-5 max-w-4xl type-title">{page.h1}</h1>
          <div className="mt-6 max-w-2xl space-y-4 text-lg leading-relaxed text-muted">
            {page.intro.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/contact" className="film-btn film-btn-hot">
              Book a free consultation
            </Link>
            {whatsapp ? (
              <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="film-btn">
                WhatsApp {studio.whatsapp}
              </a>
            ) : null}
          </div>
        </div>
      </section>

      <div className="mx-auto w-full max-w-7xl space-y-16 px-5 pb-20 sm:px-10">
        {page.sections.map((section) => (
          <section key={section.heading} className="max-w-3xl">
            <h2 className="heading-display text-2xl text-ink sm:text-3xl">{section.heading}</h2>
            {section.paragraphs?.map((p) => (
              <p key={p} className="mt-4 text-lg leading-relaxed text-ink/80">
                {p}
              </p>
            ))}
            {section.bullets?.length ? (
              <ul className="mt-5 space-y-3">
                {section.bullets.map((b) => (
                  <li key={b} className="flex gap-3 text-lg leading-relaxed text-ink/80">
                    <span aria-hidden="true" className="mt-3 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                    {b}
                  </li>
                ))}
              </ul>
            ) : null}
          </section>
        ))}

        {page.showFees ? (
          <section>
            <h2 className="heading-display text-2xl text-ink sm:text-3xl">Fees</h2>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {fees.map((fee) => (
                <div key={fee.name} className={`card p-6 ${fee.highlighted ? "border-accent" : ""}`}>
                  <p className="eyebrow">{fee.badge}</p>
                  <h3 className="heading-display mt-2 text-xl text-ink">{fee.name}</h3>
                  <p className="mt-3 text-ink">
                    <span className="text-3xl font-semibold">{formatRs(fee.monthly)}</span>
                    <span className="text-muted"> / month</span>
                  </p>
                  <p className="mt-2 text-sm text-muted">
                    3 months: {formatRs(fee.quarterly)} (save {formatRs(fee.monthly * 3 - fee.quarterly)})
                  </p>
                </div>
              ))}
            </div>
            <Link href="/plans" className="film-link mt-6">
              All plans
            </Link>
          </section>
        ) : null}

        {page.showTimings ? (
          <section>
            <h2 className="heading-display text-2xl text-ink sm:text-3xl">Timings</h2>
            <p className="mt-3 text-muted">
              Open {studio.days} · closed on {studio.closedDay}.
            </p>
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {(["Male", "Female", "Family"] as const).map((g) => (
                <div key={g} className="card p-6">
                  <h3 className="eyebrow">{g === "Family" ? "Family Hour" : `${g} sessions`}</h3>
                  <p className="mt-3 text-lg text-ink">{g === "Family" ? familyHour.time : sessionsFor(g)}</p>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {featured.length ? (
          <section>
            <h2 className="heading-display text-2xl text-ink sm:text-3xl">
              {featured.length === 1 ? "Your coach" : "Your coaches"}
            </h2>
            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {featured.map((c) => (
                <Link key={c.slug} href={`/trainers/${c.slug}`} className="card card-hover group overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={c.photo}
                    alt={`${c.name}, ${c.role} at FITX Sahiwal`}
                    loading="lazy"
                    className="aspect-[4/5] w-full object-cover"
                  />
                  <div className="p-5">
                    <h3 className="heading-display text-base text-ink group-hover:text-accent">{c.name}</h3>
                    <p className="eyebrow mt-1">{c.role}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        {reviews.length ? (
          <section>
            <h2 className="heading-display text-2xl text-ink sm:text-3xl">What members say</h2>
            <div className="mt-6 grid gap-5 md:grid-cols-3">
              {reviews.map((r) => (
                <figure key={r.name} className="card p-6">
                  <blockquote className="line-clamp-[8] leading-relaxed text-ink/80">“{r.text}”</blockquote>
                  <figcaption className="mt-4 text-sm text-muted">{r.name} · Google review</figcaption>
                </figure>
              ))}
            </div>
            <Link href="/success-stories" className="film-link mt-6">
              Read all reviews
            </Link>
          </section>
        ) : null}

        {answers.length ? (
          <section className="max-w-3xl">
            <h2 className="heading-display text-2xl text-ink sm:text-3xl">Questions</h2>
            <div className="mt-6 divide-y divide-white/10 border-y border-white/10">
              {answers.map((f) => (
                <details key={f.id} className="group py-4">
                  <summary className="cursor-pointer list-none text-lg text-ink marker:hidden">
                    {f.question}
                  </summary>
                  <p className="mt-3 leading-relaxed text-ink/75">{f.answer}</p>
                </details>
              ))}
            </div>
            <Link href="/faq" className="film-link mt-6">
              All questions
            </Link>
          </section>
        ) : null}

        <section className="card flex flex-col items-start justify-between gap-6 p-8 md:flex-row md:items-center">
          <div>
            <h2 className="heading-display text-2xl text-ink">Start with a free consultation</h2>
            <p className="mt-2 text-muted">
              {studio.address} · {studio.phones.join(" / ")}
            </p>
          </div>
          <Link href="/contact" className="film-btn film-btn-hot">
            Book now
          </Link>
        </section>

        <nav aria-label="More from FITX" className="flex flex-wrap gap-x-6 gap-y-3 text-sm">
          {others.map((p) => (
            <Link key={p.path} href={p.path} className="footer-link">
              {p.label}
            </Link>
          ))}
          <Link href="/faq" className="footer-link">
            FAQ
          </Link>
        </nav>
      </div>
    </main>
  );
}
