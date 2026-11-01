import Link from "next/link";

import { cardClass } from "@/components/ui/styles";
import { requireUser } from "@/lib/auth/server";
import { prisma } from "@/lib/db";
import { chatWeekStats } from "@/lib/fitx/chat-log";

export const dynamic = "force-dynamic";

/** Admin home: what the studio manages (testimonials, blog, gallery) and its chatbot chats. */
export default async function AdminHomePage() {
  const user = await requireUser();
  const [testimonials, posts, photos, { chats, unanswered }] = await Promise.all([
    prisma.testimonial.count({ where: { isPublished: true } }),
    prisma.blogPost.count({ where: { status: "PUBLISHED" } }),
    prisma.galleryItem.count({ where: { isPublished: true } }),
    chatWeekStats(),
  ]);

  const sections = [
    {
      title: "Testimonials",
      count: `${testimonials} on the website`,
      text: "Add a client’s review with their name and photo, or edit and delete existing ones.",
      list: "/admin/testimonials",
      add: "/admin/testimonials/new",
      addLabel: "+ Add testimonial",
      view: "/success-stories",
    },
    {
      title: "Blog",
      count: `${posts} published`,
      text: "Write a post with a heading, text and a cover picture, or edit and delete existing posts.",
      list: "/admin/blog",
      add: "/admin/blog/new",
      addLabel: "+ Write a post",
      view: "/blog",
    },
    {
      title: "Gallery",
      count: `${photos} photos`,
      text: "Upload photos of the studio, training and events, or change their captions and categories.",
      list: "/admin/gallery",
      add: "/admin/gallery",
      addLabel: "+ Upload photos",
      view: "/gallery",
    },
    {
      title: "Chats",
      count: `${chats} this week`,
      text: `Read what visitors asked the website chatbot and what it replied.${unanswered ? ` ${unanswered} conversation${unanswered === 1 ? " has" : "s have"} a question it couldn’t answer.` : ""}`,
      list: "/admin/chats",
      add: "/admin/chats?filter=unanswered",
      addLabel: "Unanswered questions",
      view: null as string | null,
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-extrabold text-ink">Welcome, {user.name.split(" ")[0]}</h1>
        <p className="mt-1 text-sm text-muted">What would you like to update or check on the FITX website?</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {sections.map((s) => (
          <section key={s.title} className={`${cardClass} flex flex-col`}>
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="font-heading text-xl font-extrabold text-ink">{s.title}</h2>
              <span className="text-sm text-muted">{s.count}</span>
            </div>
            <p className="mt-2 flex-1 text-sm text-muted">{s.text}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Link href={s.add} className="btn btn-accent">
                {s.addLabel}
              </Link>
              <Link href={s.list} className="btn btn-outline">
                {s.view ? "Manage" : "All chats"}
              </Link>
              {s.view ? (
                <Link href={s.view} target="_blank" className="btn btn-outline">
                  View on website ↗
                </Link>
              ) : null}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
