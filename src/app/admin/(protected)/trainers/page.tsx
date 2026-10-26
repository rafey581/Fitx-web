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
  createTrainerAction,
  deleteModuleItemAction,
  moveModuleItemAction,
  updateTrainerAction,
} from "@/server/actions/modules";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Trainers" };

export default async function AdminTrainersPage() {
  const user = await requirePermission("content:read");
  const canWrite = roleHasPermission(user.role, "content:write");

  const [trainers, media] = await Promise.all([
    prisma.trainer.findMany({ orderBy: { sortOrder: "asc" } }),
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
      maxLength: 160,
    },
    { kind: "text", name: "title", label: "Role / title", maxLength: 160 },
    { kind: "media", name: "photoId", label: "Photo" },
    {
      kind: "textarea",
      name: "bio",
      label: "Bio",
      rows: 6,
      maxLength: 10000,
      wide: true,
    },
    {
      kind: "list",
      name: "specialties",
      label: "Specialties",
      hint: "e.g. Strength, Boxing, Mobility",
      wide: true,
    },
    {
      kind: "list",
      name: "certifications",
      label: "Certifications",
      hint: "e.g. ACE CPT, CrossFit L1",
      wide: true,
    },
    {
      kind: "text",
      name: "facebookUrl",
      label: "Facebook URL",
      maxLength: 500,
    },
    {
      kind: "text",
      name: "instagramUrl",
      label: "Instagram URL",
      maxLength: 500,
    },
    {
      kind: "text",
      name: "twitterUrl",
      label: "X / Twitter URL",
      maxLength: 500,
    },
    { kind: "text", name: "youtubeUrl", label: "YouTube URL", maxLength: 500 },
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

  const rows: ModuleRow[] = trainers.map((trainer) => {
    const photo = trainer.photoId ? byId.get(trainer.photoId) : undefined;
    return {
      id: trainer.id,
      title: trainer.name,
      subtitle: [trainer.title ?? "", `slug: ${trainer.slug}`]
        .filter(Boolean)
        .join(" · "),
      thumb: photo ? mediaUrl(photo) : null,
      published: trainer.isPublished,
      viewHref: `/trainers/${trainer.slug}`,
      values: {
        name: trainer.name,
        title: trainer.title ?? "",
        photoId: trainer.photoId ?? "",
        bio: trainer.bio ?? "",
        specialties: Array.isArray(trainer.specialties)
          ? (trainer.specialties as unknown[]).map(String)
          : [],
        certifications: Array.isArray(trainer.certifications)
          ? (trainer.certifications as unknown[]).map(String)
          : [],
        facebookUrl: trainer.facebookUrl ?? "",
        instagramUrl: trainer.instagramUrl ?? "",
        twitterUrl: trainer.twitterUrl ?? "",
        youtubeUrl: trainer.youtubeUrl ?? "",
        seoTitle: trainer.seoTitle ?? "",
        seoDescription: trainer.seoDescription ?? "",
        isPublished: trainer.isPublished,
        sortOrder: trainer.sortOrder,
      },
    };
  });

  return (
    <ModuleManager
      module="trainers"
      heading="Trainers"
      intro="Coaches shown in the Trainers grid and on their own profile pages."
      createLabel="Add a trainer"
      fields={fields}
      rows={rows}
      media={mediaItems}
      createAction={createTrainerAction}
      updateAction={updateTrainerAction}
      deleteAction={deleteModuleItemAction}
      moveAction={moveModuleItemAction}
      canWrite={canWrite}
    />
  );
}
