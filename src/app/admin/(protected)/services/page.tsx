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
  createServiceAction,
  deleteModuleItemAction,
  moveModuleItemAction,
  updateServiceAction,
} from "@/server/actions/modules";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Services" };

export default async function AdminServicesPage() {
  const user = await requirePermission("content:read");
  const canWrite = roleHasPermission(user.role, "content:write");

  const [services, media] = await Promise.all([
    prisma.service.findMany({ orderBy: { sortOrder: "asc" } }),
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
      name: "title",
      label: "Title",
      required: true,
      maxLength: 160,
    },
    {
      kind: "textarea",
      name: "shortDescription",
      label: "Short description (cards)",
      rows: 3,
      maxLength: 300,
      wide: true,
    },
    {
      kind: "textarea",
      name: "content",
      label: "Full description (profile page)",
      rows: 12,
      maxLength: 20000,
      wide: true,
    },
    { kind: "media", name: "iconId", label: "Icon" },
    { kind: "media", name: "imageId", label: "Cover image" },
    {
      kind: "mediaMulti",
      name: "gallery",
      label: "Gallery images",
      hint: "Pick the images shown on the service profile page.",
      wide: true,
    },
    { kind: "text", name: "ctaLabel", label: "Button label", maxLength: 80 },
    { kind: "text", name: "ctaUrl", label: "Button link", maxLength: 500 },
    { kind: "text", name: "seoTitle", label: "SEO title", maxLength: 160 },
    {
      kind: "text",
      name: "seoDescription",
      label: "SEO description",
      maxLength: 500,
      wide: true,
    },
    { kind: "checkbox", name: "isPublished", label: "Visible on the site" },
  ];

  const rows: ModuleRow[] = services.map((service) => {
    const image = service.imageId ? byId.get(service.imageId) : undefined;
    return {
      id: service.id,
      title: service.title,
      subtitle: service.shortDescription ?? `slug: ${service.slug}`,
      thumb: image ? mediaUrl(image) : null,
      published: service.isPublished,
      viewHref: `/services/${service.slug}`,
      values: {
        title: service.title,
        shortDescription: service.shortDescription ?? "",
        content: service.content ?? "",
        iconId: service.iconId ?? "",
        imageId: service.imageId ?? "",
        gallery: Array.isArray(service.gallery)
          ? (service.gallery as unknown[]).map(String)
          : [],
        ctaLabel: service.ctaLabel ?? "",
        ctaUrl: service.ctaUrl ?? "",
        seoTitle: service.seoTitle ?? "",
        seoDescription: service.seoDescription ?? "",
        isPublished: service.isPublished,
        sortOrder: service.sortOrder,
      },
    };
  });

  return (
    <ModuleManager
      module="services"
      heading="Services"
      intro="Programs shown in the Services grid and on their own profile pages."
      createLabel="Add a service"
      fields={fields}
      rows={rows}
      media={mediaItems}
      createAction={createServiceAction}
      updateAction={updateServiceAction}
      deleteAction={deleteModuleItemAction}
      moveAction={moveModuleItemAction}
      canWrite={canWrite}
    />
  );
}
