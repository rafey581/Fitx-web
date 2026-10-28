import type { Metadata } from "next";
import Link from "next/link";

import { coverFor, formatPostDate, publishedPosts } from "./blog-data";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Blog | FITX Personal Fitness Training Studio",
  description: "Fitness tips, workout guides, nutrition advice and gym insights from FITX Sahiwal.",
};

export default async function BlogPage() {
  const posts = await publishedPosts();

  return (
    <main>
      <section className="relative overflow-hidden bg-ink py-24 sm:py-32">
        <div aria-hidden="true" className="absolute inset-0 bg-arena" />
        <div aria-hidden="true" className="absolute inset-0 bg-grid-overlay opacity-40" />
        <div aria-hidden="true" className="absolute -top-40 right-0 h-[30rem] w-[30rem] rounded-full bg-accent/20 blur-3xl" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
          <p className="eyebrow eyebrow-bar text-accent">FITX Blog</p>
          <h1 className="heading-display mt-6 max-w-4xl text-5xl text-white sm:text-6xl lg:text-7xl">
            Training Insights & Tips
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-white/75">
            Expert advice on fitness, nutrition, recovery, and making the most of your training journey.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:py-24">
        {posts.length === 0 ? (
          <p className="text-muted">New posts are coming soon.</p>
        ) : (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((post, index) => (
              <article key={post.id} className="card card-hover group overflow-hidden">
                <Link href={`/blog/${post.slug}`} className="flex h-full flex-col">
                  <div className="relative aspect-[16/10] overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={coverFor(post, index)}
                      alt={post.title}
                      loading="lazy"
                      className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="flex flex-1 flex-col p-6">
                    <time className="text-xs uppercase tracking-wider text-muted">{formatPostDate(post.publishedAt)}</time>
                    <h2 className="heading-display mt-3 text-xl transition group-hover:text-accent">{post.title}</h2>
                    <p className="mt-3 flex-1 text-sm leading-relaxed text-muted">{post.excerpt}</p>
                    <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-accent">
                      Read More
                      <span aria-hidden="true" className="transition group-hover:translate-x-1">
                        →
                      </span>
                    </span>
                  </div>
                </Link>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
