import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Blog | FITX Personal Fitness Training Studio",
  description: "Fitness tips, workout guides, nutrition advice and gym insights from FITX Sahiwal.",
};

const blogPosts = [
  {
    slug: "benefits-of-personal-training",
    title: "5 Benefits of Personal Training vs Group Classes",
    excerpt: "Discover why one-on-one coaching at FITX delivers faster, safer results than generic group workouts.",
    category: "Training",
    date: "2026-10-15",
    image: "/images/fitx/PHOTO-2026-09-30-13-30-25.jpg",
  },
  {
    slug: "boxing-for-fitness",
    title: "Boxing for Fitness: More Than Just Fighting",
    excerpt: "How boxing and conditioning at FITX builds strength, cardio, and confidence like nothing else.",
    category: "Boxing",
    date: "2026-10-12",
    image: "/images/fitx/PHOTO-2026-09-30-13-37-25.jpg",
  },
  {
    slug: "recovery-and-mobility",
    title: "The Power of Recovery & Mobility",
    excerpt: "Why yoga and mobility work is essential for injury prevention and long-term progress.",
    category: "Recovery",
    date: "2026-10-08",
    image: "/images/fitx/PHOTO-2026-09-30-14-06-02.jpg",
  },
  {
    slug: "nutrition-for-gym-goals",
    title: "Nutrition Coaching: Fueling Your Fitness Journey",
    excerpt: "Simple, sustainable nutrition strategies that complement your training at FITX.",
    category: "Nutrition",
    date: "2026-10-05",
    image: "/images/fitx/PHOTO-2026-09-30-13-49-45.jpg",
  },
];

export default function BlogPage() {
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
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {blogPosts.map((post) => (
            <article key={post.slug} className="card card-hover group overflow-hidden">
              <Link href={`/blog/${post.slug}`} className="flex h-full flex-col">
                <div className="relative aspect-[16/10] overflow-hidden">
                  <Image
                    src={post.image}
                    alt={post.title}
                    fill
                    className="object-cover transition duration-500 group-hover:scale-105"
                  />
                  <div className="absolute left-4 top-4">
                    <span className="chip bg-accent text-white">{post.category}</span>
                  </div>
                </div>
                <div className="flex flex-1 flex-col p-6">
                  <time className="text-xs uppercase tracking-wider text-muted">
                    {new Date(post.date).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </time>
                  <h2 className="heading-display mt-3 text-xl transition group-hover:text-accent">
                    {post.title}
                  </h2>
                  <p className="mt-3 flex-1 text-sm leading-relaxed text-muted">
                    {post.excerpt}
                  </p>
                  <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-accent">
                    Read More
                    <span aria-hidden="true" className="transition group-hover:translate-x-1">→</span>
                  </span>
                </div>
              </Link>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
