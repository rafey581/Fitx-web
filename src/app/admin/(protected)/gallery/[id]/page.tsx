import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { GalleryPhotoForm } from "@/components/admin/gallery-admin";
import { requirePermission } from "@/lib/auth/server";
import { prisma } from "@/lib/db";
import { galleryRows } from "@/lib/fitx/gallery-data";
import { saveGalleryPhotoAction } from "@/server/actions/simple-content";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Edit photo" };

export default async function EditGalleryPhotoPage(props: PageProps<"/admin/gallery/[id]">) {
  await requirePermission("content:write");
  const { id } = await props.params;
  const [row, photo] = await Promise.all([
    prisma.galleryItem.findUnique({ where: { id }, select: { caption: true } }),
    galleryRows({ all: true }).then((rows) => rows.find((r) => r.id === id)),
  ]);
  if (!row || !photo) notFound();
  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-extrabold text-ink">Edit photo</h1>
      <GalleryPhotoForm
        action={saveGalleryPhotoAction}
        id={id}
        src={photo.src}
        caption={row.caption ?? ""}
        category={photo.category}
      />
    </div>
  );
}
