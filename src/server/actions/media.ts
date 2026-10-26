"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { recordAudit } from "@/lib/audit";
import { assertPermission } from "@/lib/auth/server";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import {
  deleteStoredFiles,
  MediaValidationError,
  processUpload,
  sanitizeFolder,
} from "@/lib/media-storage";
import { toFieldErrors } from "@/lib/validation/errors";
import type { ActionState } from "./types";

const updateSchema = z.object({
  id: z.string().min(1),
  alt: z.string().max(500),
  caption: z.string().max(500),
  folder: z.string().min(1).max(60),
});

/**
 * Upload one or more files through a multipart server action.
 *
 * Each file is validated (extension allow-list, size, magic bytes via sharp)
 * and stored on disk with webp responsive variants. This is progressive
 * enhancement friendly: the plain form posts `files[]` + `folder`.
 */
export async function uploadMediaAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await assertPermission("media:write");

  const folderInput = String(formData.get("folder") ?? "general").trim();
  const files = formData
    .getAll("files[]")
    .filter((entry): entry is File => entry instanceof File);

  if (files.length === 0) {
    return { ok: false, error: "Choose at least one file to upload." };
  }

  const maxBytes = env.UPLOAD_MAX_MB * 1024 * 1024;
  const folder = sanitizeFolder(folderInput);
  let uploaded = 0;
  const failures: string[] = [];

  for (const file of files) {
    try {
      const stored = await processUpload(file, folder, maxBytes);
      await prisma.media.create({
        data: {
          filename: file.name,
          path: stored.path,
          mime: stored.mime,
          size: stored.size,
          width: stored.width,
          height: stored.height,
          folder,
          variants: stored.variants as never,
          uploadedBy: actor.id,
        },
      });
      uploaded += 1;
    } catch (error) {
      failures.push(
        error instanceof MediaValidationError
          ? error.message
          : `Could not store "${file.name}".`,
      );
    }
  }

  await recordAudit({
    userId: actor.id,
    action: "media.uploaded",
    entity: "media",
    meta: { uploaded, failed: failures.length },
  });
  revalidatePath("/admin/media");

  if (uploaded === 0) {
    return { ok: false, error: failures[0] ?? "Upload failed." };
  }
  const message = `Uploaded ${uploaded} file${uploaded === 1 ? "" : "s"}.`;
  const suffix = failures.length
    ? failures.length > 1
      ? ` ${failures.length} files were rejected.`
      : ` ${failures[0]}`
    : "";
  return { ok: true, message: message + suffix };
}

/** Edit alt text, caption or folder for a stored file. */
export async function updateMediaAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await assertPermission("media:write");

  const parsed = updateSchema.safeParse({
    id: formData.get("id"),
    alt: formData.get("alt") ?? "",
    caption: formData.get("caption") ?? "",
    folder: formData.get("folder") ?? "",
  });
  if (!parsed.success) {
    return {
      ok: false,
      error: "Please fix the highlighted fields.",
      fieldErrors: toFieldErrors(parsed.error),
    };
  }

  const media = await prisma.media.findUnique({
    where: { id: parsed.data.id },
  });
  if (!media) return { ok: false, error: "That file no longer exists." };

  const folder = sanitizeFolder(parsed.data.folder);
  const moved = folder !== media.folder;

  await prisma.media.update({
    where: { id: media.id },
    data: {
      alt: parsed.data.alt || null,
      caption: parsed.data.caption || null,
      folder,
    },
  });

  await recordAudit({
    userId: actor.id,
    action: "media.updated",
    entity: "media",
    entityId: media.id,
    meta: { moved },
  });
  revalidatePath("/admin/media");

  return { ok: true, message: "Updated." };
}

/**
 * Where is a media file referenced? Delete is blocked while in use.
 *
 * Deliberately NOT exported: every export of a `"use server"` module becomes a
 * callable action endpoint, so keeping this private avoids exposing an
 * unauthenticated DB-count probe (Phase 6 hardening review).
 */
async function mediaUsageLabels(mediaId: string): Promise<string[]> {
  const [pages, trainers, services, testimonials, gallery, blogs, instagram] =
    await Promise.all([
      prisma.page.count({ where: { ogImageId: mediaId } }),
      prisma.trainer.count({ where: { photoId: mediaId } }),
      prisma.service.count({
        where: { OR: [{ iconId: mediaId }, { imageId: mediaId }] },
      }),
      prisma.testimonial.count({
        where: {
          OR: [
            { photoId: mediaId },
            { beforeImageId: mediaId },
            { afterImageId: mediaId },
          ],
        },
      }),
      prisma.galleryItem.count({ where: { mediaId } }),
      prisma.blogPost.count({ where: { coverId: mediaId } }),
      prisma.instagramHighlight.count({ where: { imageId: mediaId } }),
    ]);

  const labels: string[] = [];
  const tuples: Array<[number, string]> = [
    [pages, "pages (OG image)"],
    [trainers, "trainer photos"],
    [services, "services"],
    [testimonials, "testimonials"],
    [gallery, "gallery items"],
    [blogs, "blog covers"],
    [instagram, "Instagram highlights"],
  ];
  for (const [count, label] of tuples) {
    if (count > 0) labels.push(label);
  }

  // Also check settings that reference a media id (logos, OG image, favicon).
  const settings = await prisma.setting.findMany({
    where: { key: { in: ["general", "seo"] } },
    select: { key: true, value: true },
  });
  for (const setting of settings) {
    if (JSON.stringify(setting.value).includes(mediaId)) {
      labels.push(`"${setting.key}" settings`);
    }
  }

  return labels;
}

/** Permanently delete a stored file + all its variants. */
export async function deleteMediaAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await assertPermission("media:delete");

  const id = String(formData.get("id") ?? "");
  const media = await prisma.media.findUnique({ where: { id } });
  if (!media) return { ok: false, error: "That file no longer exists." };

  const usage = await mediaUsageLabels(id);
  if (usage.length > 0) {
    return {
      ok: false,
      error: `This file is used by ${usage.join(", ")}. Remove those references first.`,
    };
  }

  await deleteStoredFiles({
    path: media.path,
    variants: media.variants as Record<string, string> | null,
  });
  await prisma.media.delete({ where: { id } });

  await recordAudit({
    userId: actor.id,
    action: "media.deleted",
    entity: "media",
    entityId: id,
    meta: { filename: media.filename },
  });
  revalidatePath("/admin/media");

  return { ok: true, message: "File deleted." };
}
