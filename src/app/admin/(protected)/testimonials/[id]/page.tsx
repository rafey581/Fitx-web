import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { requirePermission } from "@/lib/auth/server";
import { prisma } from "@/lib/db";
import { reviewPhoto } from "@/lib/fitx/reviews";
import { mediaUrl } from "@/lib/media-url";
import { TestimonialForm } from "../testimonial-form";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Edit testimonial" };

export default async function EditTestimonialPage(props: PageProps<"/admin/testimonials/[id]">) {
  await requirePermission("content:write");
  const { id } = await props.params;
  const t = await prisma.testimonial.findUnique({ where: { id }, include: { photo: { select: { path: true } } } });
  if (!t) notFound();
  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-extrabold text-ink">Edit testimonial</h1>
      <TestimonialForm
        id={t.id}
        name={t.name}
        quote={t.quote}
        photo={t.photo ? mediaUrl(t.photo) : (reviewPhoto(t.name) ?? null)}
        photoRemovable={Boolean(t.photo)}
      />
    </div>
  );
}
