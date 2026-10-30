import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { env } from "@/lib/env";
import { blogBlocks } from "@/lib/fitx/blog-text";
import { breadcrumbJsonLd, jsonLd, SITE_NAME } from "@/lib/fitx/seo";
import { coverFor, formatPostDate, publishedPost } from "../blog-data";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await publishedPost(slug);
  if (!post) return {};
  const description = post.seoDescription || post.excerpt || undefined;
  return {
    title: post.seoTitle || post.title,
    description,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      type: "article",
      title: post.title,
      description,
      url: `/blog/${post.slug}`,
      publishedTime: post.publishedAt?.toISOString(),
      modifiedTime: post.updatedAt.toISOString(),
      images: [coverFor(post)],
    },
    twitter: { card: "summary_large_image", title: post.title, description, images: [coverFor(post)] },
  };
}

/** "Contact page" in a post becomes a link to it. */
function withContactLink(text: string) {
  return text.split(/(Contact page)/g).map((part, i) =>
    part === "Contact page" ? (
      <Link key={i} href="/contact" className="text-accent hover:underline">
        Contact page
      </Link>
    ) : (
      part
    ),
  );
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await publishedPost(slug);
  if (!post) notFound();

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd([
            {
              "@context": "https://schema.org",
              "@type": "BlogPosting",
              headline: post.title,
              description: post.excerpt ?? undefined,
              image: new URL(coverFor(post), env.APP_URL).toString(),
              datePublished: post.publishedAt?.toISOString(),
              dateModified: post.updatedAt.toISOString(),
              mainEntityOfPage: new URL(`/blog/${post.slug}`, env.APP_URL).toString(),
              author: { "@type": "Organization", name: SITE_NAME, url: env.APP_URL },
              publisher: { "@id": new URL("/#gym", env.APP_URL).toString() },
            },
            breadcrumbJsonLd(env.APP_URL, [
              { name: "Blog", path: "/blog" },
              { name: post.title, path: `/blog/${post.slug}` },
            ]),
          ]),
        }}
      />
      <article>
        <section className="relative overflow-hidden bg-ink py-24 sm:py-32">
          <div aria-hidden="true" className="bg-arena absolute inset-0" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={coverFor(post)}
            alt=""
            className="absolute inset-0 h-full w-full object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/80 to-ink/40" />
          <div className="relative mx-auto max-w-4xl px-4 sm:px-6">
            <Link
              href="/blog"
              className="mb-6 inline-flex items-center gap-2 text-sm text-white/70 transition hover:text-accent"
            >
              <span aria-hidden="true">←</span> Back to Blog
            </Link>
            <time className="mt-6 block text-sm text-white/60">
              {formatPostDate(post.publishedAt)}
            </time>
            <h1 className="heading-display mt-4 text-4xl text-white sm:text-5xl lg:text-6xl">
              {post.title}
            </h1>
          </div>
        </section>

        <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
          <div className="w-full">
            <div className="space-y-6 text-lg leading-relaxed text-ink/80">
              {blogBlocks(post.content ?? "").map((block, i) =>
                block.kind === "heading" ? (
                  <h2
                    key={i}
                    className="pt-6 font-heading text-xl leading-tight font-extrabold tracking-tight text-ink uppercase sm:text-2xl"
                  >
                    {block.text}
                  </h2>
                ) : block.kind === "list" ? (
                  <ul key={i} className="space-y-2">
                    {block.items.map((item) => (
                      <li key={item} className="flex gap-3">
                        <span
                          aria-hidden="true"
                          className="mt-3 h-1.5 w-1.5 shrink-0 rounded-full bg-accent"
                        />
                        {withContactLink(item)}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p key={i} className="whitespace-pre-line">
                    {withContactLink(block.text)}
                  </p>
                ),
              )}
            </div>
            <div className="mt-12 border-t border-line pt-8">
              <Link href="/blog" className="btn btn-accent">
                View All Posts <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </section>
      </article>
    </main>
  );
}
