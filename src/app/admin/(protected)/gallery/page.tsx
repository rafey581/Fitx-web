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
  createGalleryItemAction,
  deleteModuleItemAction,
  moveModuleItemAction,
  updateGalleryItemAction,
} from "@/server/actions/modules";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Gallery" };

export default async function AdminGalleryPage() {
  const user = await requirePermission("content:read");
  const canWrite = roleHasPermission(user.role, "content:write");

  const [items, media] = await Promise.all([
    prisma.galleryItem.findMany({ orderBy: { sortOrder: "asc" } }),
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
      name: "category",
      label: "Category",
      maxLength: 80,
      hint: "e.g. general, boxing, yoga",
    },
    {
      kind: "media",
      name: "mediaId",
      label: "Image",
      hint: "Pick an image from the library.",
    },
    {
      kind: "text",
      name: "externalUrl",
      label: "External link (optional)",
      maxLength: 500,
      hint: "e.g. an Instagram post of this image.",
    },
    { kind: "text", name: "caption", label: "Caption", maxLength: 200 },
    { kind: "checkbox", name: "isPublished", label: "Visible on the site" },
  ];

  const rows: ModuleRow[] = items.map((item) => {
    const mediaRow = item.mediaId ? byId.get(item.mediaId) : undefined;
    return {
      id: item.id,
      title: item.caption ?? item.mediaId?.slice(-6) ?? "Gallery item",
      subtitle: `${item.category}${item.externalUrl ? " · linked" : ""}`,
      thumb: mediaRow ? mediaUrl(mediaRow) : null,
      published: item.isPublished,
      values: {
        category: item.category,
        mediaId: item.mediaId ?? "",
        externalUrl: item.externalUrl ?? "",
        caption: item.caption ?? "",
        isPublished: item.isPublished,
        sortOrder: item.sortOrder,
      },
    };
  });

  return (
    <ModuleManager
      module="gallery"
      heading="Gallery"
      intro="Images for the Gallery blocks — show all, or pick specific ones per section."
      createLabel="Add a gallery image"
      fields={fields}
      rows={rows}
      media={mediaItems}
      createAction={createGalleryItemAction}
      updateAction={updateGalleryItemAction}
      deleteAction={deleteModuleItemAction}
      moveAction={moveModuleItemAction}
      canWrite={canWrite}
    />
  );
}
