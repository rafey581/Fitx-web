import type { Metadata } from "next";

import { noticeFrom, SimpleList } from "@/components/admin/simple-list";
import { requirePermission } from "@/lib/auth/server";
import { prisma } from "@/lib/db";
import { reviewPhoto } from "@/lib/fitx/reviews";
import { mediaUrl } from "@/lib/media-url";
import { deleteTestimonialAction } from "@/server/actions/simple-content";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Testimonials" };

export default async function AdminTestimonialsPage(props: PageProps<"/admin/testimonials">) {
  await requirePermission("content:write");
  const params = await props.searchParams;
  const testimonials = await prisma.testimonial.findMany({
    where: { isPublished: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    include: { photo: { select: { path: true } } },
  });

  return (
    <SimpleList
      heading="Testimonials"
      intro="Client reviews shown on the Success Stories page. Newest are shown first."
      addHref="/admin/testimonials/new"
      addLabel="Add testimonial"
      emptyText="No testimonials yet. Click “Add testimonial” to add the first one."
      notice={noticeFrom(params, "testimonial")}
      deleteAction={deleteTestimonialAction}
      deleteConfirm={(name) => `Delete the testimonial from ${name}? It will be removed from the website.`}
      round
      items={testimonials.map((t) => ({
        id: t.id,
        title: t.name,
        subtitle: t.quote,
        thumb: t.photo ? mediaUrl(t.photo) : (reviewPhoto(t.name) ?? null),
        editHref: `/admin/testimonials/${t.id}`,
      }))}
    />
  );
}
