import type { Metadata } from "next";
import Link from "next/link";

import { env } from "@/lib/env";
import { faqs, studio } from "@/lib/fitx/knowledge";
import { breadcrumbJsonLd, jsonLd, seoMetadata } from "@/lib/fitx/seo";

export const metadata: Metadata = seoMetadata("/faq", {
  title: "FITX Gym Sahiwal FAQ – Fees, Timings, Female Sessions & Joining",
  description:
    "Answers about FITX in Sahiwal: gym fees, male and female timings, Family Hour, Friday closing, progress tracking, coaches and how to join.",
});

/** Topics in reading order; each lists approved answer ids from knowledge.ts. */
const TOPICS: { title: string; ids: string[] }[] = [
  { title: "Fees", ids: ["fees", "group-fee", "one-to-one-fee", "discount"] },
  { title: "Timings", ids: ["timings", "days", "open-close", "female", "male", "family"] },
  { title: "Coaches & training", ids: ["founder", "which-coach", "approach", "nutrition", "guarantee"] },
  { title: "Progress tracking", ids: ["tracking", "report", "app", "frequency", "included"] },
  { title: "Location & joining", ids: ["location", "contact", "join"] },
];

/** Every approved answer, grouped by topic, with FAQPage structured data. */
export default function FaqPage() {
  const groups = TOPICS.map((t) => ({
    ...t,
    items: t.ids.map((id) => faqs.find((f) => f.id === id)).filter((f): f is (typeof faqs)[number] => Boolean(f)),
  }));
  const all = groups.flatMap((g) => g.items);

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd([
            {
              "@context": "https://schema.org",
              "@type": "FAQPage",
              mainEntity: all.map((f) => ({
                "@type": "Question",
                name: f.question,
                acceptedAnswer: { "@type": "Answer", text: f.answer },
              })),
            },
            breadcrumbJsonLd(env.APP_URL, [{ name: "FAQ", path: "/faq" }]),
          ]),
        }}
      />
      <section className="flex min-h-[52svh] items-end pt-36 pb-12">
        <div className="mx-auto w-full max-w-7xl px-5 sm:px-10">
          <p className="eyebrow eyebrow-bar">FAQ</p>
          <h1 className="film-display mt-5 type-title">Questions about FITX Sahiwal</h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted">
            Fees, timings, coaches and joining. Can’t find your answer? Call or WhatsApp {studio.phones[0]}.
          </p>
        </div>
      </section>
      <div className="mx-auto w-full max-w-3xl space-y-14 px-5 pb-24 sm:px-10">
        {groups.map((g) => (
          <section key={g.title}>
            <h2 className="heading-display text-2xl text-ink">{g.title}</h2>
            <div className="mt-4 divide-y divide-white/10 border-y border-white/10">
              {g.items.map((f) => (
                <details key={f.id} className="py-4">
                  <summary className="cursor-pointer list-none text-lg text-ink">{f.question}</summary>
                  <p className="mt-3 leading-relaxed text-ink/75">{f.answer}</p>
                </details>
              ))}
            </div>
          </section>
        ))}
        <Link href="/contact" className="film-btn film-btn-hot">
          Book a free consultation
        </Link>
      </div>
    </main>
  );
}
