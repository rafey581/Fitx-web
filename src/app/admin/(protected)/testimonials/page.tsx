import type { Metadata } from "next";

import {
  ModuleManager,
  type MediaPickerItem,
  type ModuleField,
  type ModuleRow,
} from "@/components/admin/module-manager";
import { roleHasPermission } from "@/lib/auth/permissions";
import { requirePermission } from "@/lib/auth/server";
import { prisma } from "@/lib/db";
import { mediaUrl } from "@/lib/media-url";

import {
  createTestimonialAction,
  deleteModuleItemAction,
  moveModuleItemAction,
  updateTestimonialAction,
} from "@/server/actions/modules";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Testimonials" };

const RATING_OPTIONS = [5, 4, 3, 2, 1].map((value) => ({
  value: String(value),
  label: `${value} star${value === 1 ? "" : "s"}`,
}));

export default async function AdminTestimonialsPage() {
  const user = await requirePermission("content:read");
  const canWrite = roleHasPermission(user.role, "content:write");

  const [testimonials, media] = await Promise.all([
    prisma.testimonial.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.media.findMany({
      orderBy: { createdAt: "desc" },
      take: 300,
      select: { id: true, path: true, filename: true },
    }),
  ]);

  const byId = new Map(media.map((entry) => [entry.id, entry]));
  const mediaItems: MediaPickerItem[] = media.map((entry) => ({
    id: entry.id,
    thumb: mediaUrl(entry),
    filename: entry.filename,
  }));

  const fields: ModuleField[] = [
    {
      kind: "text",
      name: "name",
      label: "Name",
      required: true,
      maxLength: 120,
    },
    {
      kind: "textarea",
      name: "quote",
      label: "Quote",
      rows: 4,
      maxLength: 2000,
      wide: true,
      hint: "What the member said, in their own words.",
    },
    { kind: "media", name: "photoId", label: "Photo" },
    {
      kind: "select",
      name: "rating",
      label: "Rating",
      options: RATING_OPTIONS,
    },
    { kind: "media", name: "beforeImageId", label: "Before image" },
    { kind: "media", name: "afterImageId", label: "After image" },
    { kind: "checkbox", name: "isPublished", label: "Visible on the site" },
  ];

  const rows: ModuleRow[] = testimonials.map((testimonial) => {
    const photo = testimonial.photoId
      ? byId.get(testimonial.photoId)
      : undefined;
    return {
      id: testimonial.id,
      title: testimonial.name,
      subtitle: `${testimonial.quote.slice(0, 90)}${testimonial.quote.length > 90 ? "…" : ""}`,
      thumb: photo ? mediaUrl(photo) : null,
      published: testimonial.isPublished,
      values: {
        name: testimonial.name,
        quote: testimonial.quote,
        photoId: testimonial.photoId ?? "",
        rating: testimonial.rating ?? 5,
        beforeImageId: testimonial.beforeImageId ?? "",
        afterImageId: testimonial.afterImageId ?? "",
        isPublished: testimonial.isPublished,
        sortOrder: testimonial.sortOrder,
      },
    };
  });

  return (
    <ModuleManager
      module="testimonials"
      heading="Testimonials"
      intro="Member reviews shown in the testimonial slider."
      createLabel="Add a testimonial"
      fields={fields}
      rows={rows}
      media={mediaItems}
      createAction={createTestimonialAction}
      updateAction={updateTestimonialAction}
      deleteAction={deleteModuleItemAction}
      moveAction={moveModuleItemAction}
      canWrite={canWrite}
    />
  );
}
