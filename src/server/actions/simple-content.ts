"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { recordAudit } from "@/lib/audit";
import { assertPermission } from "@/lib/auth/server";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { blogExcerpt, slugify } from "@/lib/fitx/blog-text";
import { deleteStoredFiles, MediaValidationError, processUpload } from "@/lib/media-storage";
import { toFieldErrors } from "@/lib/validation/errors";
import type { ActionState } from "./types";

/**
 * The simple admin: testimonials and blog posts, each just a heading, text and
 * a picture. The picture is uploaded with the form itself (no media library).
 */

const PHOTO_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

/** Folders whose files belong to one testimonial / post and go when it does. */
const OWN_FOLDERS = new Set(["testimonials", "blog", "gallery"]);

/** Stores the form's picture, if one was chosen. Returns its media id. */
async function storePicture(formData: FormData, folder: string, userId: string): Promise<string | null> {
  const file = formData.get("photo");
  if (!(file instanceof File) || file.size === 0) return null;
  return storeFile(file, folder, userId);
}

/** Validates and stores one uploaded picture. Returns its media id. */
async function storeFile(file: File, folder: string, userId: string): Promise<string> {
  if (!PHOTO_TYPES.has(file.type)) {
    throw new MediaValidationError("Please choose a JPG, PNG or WebP picture.");
  }
  const stored = await processUpload(file, folder, env.UPLOAD_MAX_MB * 1024 * 1024);
  const media = await prisma.media.create({
    data: {
      filename: file.name,
      path: stored.path,
      mime: stored.mime,
      size: stored.size,
      width: stored.width,
      height: stored.height,
      folder,
      variants: stored.variants as never,
      uploadedBy: userId,
    },
  });
  return media.id;
}

/** Deletes a picture this admin uploaded for one item (never shared library files). */
async function removePicture(id: string | null | undefined): Promise<void> {
  if (!id) return;
  const media = await prisma.media.findUnique({ where: { id } });
  if (!media || !OWN_FOLDERS.has(media.folder)) return;
  await prisma.media.delete({ where: { id } });
  await deleteStoredFiles({ path: media.path, variants: media.variants as Record<string, string> | null });
}

function refreshSite(adminPath: string) {
  revalidatePath(adminPath);
  revalidatePath("/", "layout");
}

// ---------------------------------------------------------------------------
// Testimonials

const testimonialSchema = z.object({
  name: z.string().trim().min(1, "Please enter the person's name.").max(120, "Keep the name under 120 characters."),
  quote: z.string().trim().min(1, "Please enter the review text.").max(3000, "Keep the review under 3000 characters."),
});

export async function saveTestimonialAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const actor = await assertPermission("content:write");
  const id = String(formData.get("id") ?? "");
  const parsed = testimonialSchema.safeParse({ name: formData.get("name"), quote: formData.get("quote") });
  if (!parsed.success) return { ok: false, fieldErrors: toFieldErrors(parsed.error) };

  const existing = id ? await prisma.testimonial.findUnique({ where: { id } }) : null;
  if (id && !existing) return { ok: false, error: "This testimonial no longer exists." };

  let photoId: string | null;
  try {
    photoId = await storePicture(formData, "testimonials", actor.id);
  } catch (error) {
    return { ok: false, fieldErrors: { photo: [error instanceof MediaValidationError ? error.message : "Could not save the picture."] } };
  }
  const dropPhoto = formData.get("removePhoto") === "on";

  if (existing) {
    const keepOld = !photoId && !dropPhoto;
    await prisma.testimonial.update({
      where: { id: existing.id },
      data: { ...parsed.data, photoId: keepOld ? existing.photoId : photoId },
    });
    if (!keepOld) await removePicture(existing.photoId);
  } else {
    // Newest first: place it before the current first testimonial.
    const first = await prisma.testimonial.findFirst({ orderBy: { sortOrder: "asc" }, select: { sortOrder: true } });
    await prisma.testimonial.create({
      data: { ...parsed.data, photoId, rating: null, isPublished: true, sortOrder: (first?.sortOrder ?? 1) - 1 },
    });
  }

  await recordAudit({
    userId: actor.id,
    action: existing ? "testimonial.updated" : "testimonial.created",
    entity: "testimonial",
    entityId: existing?.id,
    meta: { name: parsed.data.name },
  });
  refreshSite("/admin/testimonials");
  redirect(`/admin/testimonials?saved=${encodeURIComponent(parsed.data.name)}`);
}

export async function deleteTestimonialAction(formData: FormData): Promise<void> {
  const actor = await assertPermission("content:write");
  const id = String(formData.get("id") ?? "");
  const existing = await prisma.testimonial.findUnique({ where: { id } });
  if (existing) {
    await prisma.testimonial.delete({ where: { id } });
    await removePicture(existing.photoId);
    await recordAudit({ userId: actor.id, action: "testimonial.deleted", entity: "testimonial", entityId: id, meta: { name: existing.name } });
  }
  refreshSite("/admin/testimonials");
  redirect("/admin/testimonials?deleted=1");
}

// ---------------------------------------------------------------------------
// Blog posts

const postSchema = z.object({
  title: z.string().trim().min(1, "Please enter a heading.").max(200, "Keep the heading under 200 characters."),
  content: z.string().trim().min(1, "Please write the post text.").max(50000, "The post is too long."),
});

async function uniqueSlug(title: string): Promise<string> {
  const base = slugify(title);
  for (let n = 1; ; n += 1) {
    const slug = n === 1 ? base : `${base}-${n}`;
    if (!(await prisma.blogPost.findUnique({ where: { slug }, select: { id: true } }))) return slug;
  }
}

export async function saveBlogPostAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const actor = await assertPermission("content:write");
  const id = String(formData.get("id") ?? "");
  const parsed = postSchema.safeParse({ title: formData.get("title"), content: formData.get("content") });
  if (!parsed.success) return { ok: false, fieldErrors: toFieldErrors(parsed.error) };

  const existing = id ? await prisma.blogPost.findUnique({ where: { id } }) : null;
  if (id && !existing) return { ok: false, error: "This post no longer exists." };

  let coverId: string | null;
  try {
    coverId = await storePicture(formData, "blog", actor.id);
  } catch (error) {
    return { ok: false, fieldErrors: { photo: [error instanceof MediaValidationError ? error.message : "Could not save the picture."] } };
  }
  const dropCover = formData.get("removePhoto") === "on";
  const excerpt = blogExcerpt(parsed.data.content);

  if (existing) {
    // The address (slug) stays the same so shared links keep working.
    const keepOld = !coverId && !dropCover;
    await prisma.blogPost.update({
      where: { id: existing.id },
      data: { ...parsed.data, excerpt, coverId: keepOld ? existing.coverId : coverId },
    });
    if (!keepOld) await removePicture(existing.coverId);
  } else {
    await prisma.blogPost.create({
      data: {
        ...parsed.data,
        excerpt,
        coverId,
        slug: await uniqueSlug(parsed.data.title),
        status: "PUBLISHED",
        publishedAt: new Date(),
        authorId: actor.id,
      },
    });
  }

  await recordAudit({
    userId: actor.id,
    action: existing ? "blog.updated" : "blog.created",
    entity: "blog_post",
    entityId: existing?.id,
    meta: { title: parsed.data.title },
  });
  refreshSite("/admin/blog");
  redirect(`/admin/blog?saved=${encodeURIComponent(parsed.data.title)}`);
}

export async function deleteBlogPostAction(formData: FormData): Promise<void> {
  const actor = await assertPermission("content:write");
  const id = String(formData.get("id") ?? "");
  const existing = await prisma.blogPost.findUnique({ where: { id } });
  if (existing) {
    await prisma.blogPost.delete({ where: { id } });
    await removePicture(existing.coverId);
    await recordAudit({ userId: actor.id, action: "blog.deleted", entity: "blog_post", entityId: id, meta: { title: existing.title } });
  }
  refreshSite("/admin/blog");
  redirect("/admin/blog?deleted=1");
}

// ---------------------------------------------------------------------------
// Gallery photos

const GALLERY_CATEGORIES = ["studio", "training", "events"] as const;
const categorySchema = z.enum(GALLERY_CATEGORIES, { message: "Please choose a category." });
const captionSchema = z.string().trim().max(200, "Keep the caption under 200 characters.");

/** Uploads one or more photos into a gallery category (newest shown first). */
export async function uploadGalleryPhotosAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const actor = await assertPermission("content:write");
  const category = categorySchema.safeParse(formData.get("category"));
  if (!category.success) return { ok: false, fieldErrors: { category: ["Please choose a category."] } };
  const files = formData.getAll("photos").filter((f): f is File => f instanceof File && f.size > 0);
  if (files.length === 0) return { ok: false, fieldErrors: { photos: ["Please choose at least one photo."] } };

  const first = await prisma.galleryItem.findFirst({ orderBy: { sortOrder: "asc" }, select: { sortOrder: true } });
  let sortOrder = (first?.sortOrder ?? 1) - files.length;
  const failed: string[] = [];
  let added = 0;
  for (const file of files) {
    try {
      const mediaId = await storeFile(file, "gallery", actor.id);
      await prisma.galleryItem.create({
        data: { mediaId, category: category.data, caption: null, sortOrder: sortOrder++, isPublished: true },
      });
      added += 1;
    } catch (error) {
      failed.push(error instanceof MediaValidationError ? `${file.name}: ${error.message}` : `${file.name}: could not be saved.`);
    }
  }

  await recordAudit({ userId: actor.id, action: "gallery.uploaded", entity: "gallery_item", meta: { added, category: category.data } });
  refreshSite("/admin/gallery");
  if (failed.length) {
    return { ok: added > 0, message: added ? `Added ${added} photo${added === 1 ? "" : "s"}.` : undefined, error: failed.join(" ") };
  }
  redirect(`/admin/gallery?added=${added}`);
}

/** Edits one gallery photo: caption, category, or a replacement picture. */
export async function saveGalleryPhotoAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const actor = await assertPermission("content:write");
  const id = String(formData.get("id") ?? "");
  const existing = await prisma.galleryItem.findUnique({ where: { id } });
  if (!existing) return { ok: false, error: "This photo no longer exists." };
  const category = categorySchema.safeParse(formData.get("category"));
  const caption = captionSchema.safeParse(formData.get("caption") ?? "");
  if (!category.success || !caption.success) {
    return {
      ok: false,
      fieldErrors: {
        ...(category.success ? {} : { category: ["Please choose a category."] }),
        ...(caption.success ? {} : { caption: caption.error.issues.map((i) => i.message) }),
      },
    };
  }

  let mediaId: string | null;
  try {
    mediaId = await storePicture(formData, "gallery", actor.id);
  } catch (error) {
    return { ok: false, fieldErrors: { photo: [error instanceof MediaValidationError ? error.message : "Could not save the picture."] } };
  }
  await prisma.galleryItem.update({
    where: { id },
    data: {
      category: category.data,
      caption: caption.data || null,
      // A new picture replaces the old one (uploaded or built-in).
      ...(mediaId ? { mediaId, externalUrl: null } : {}),
    },
  });
  if (mediaId) await removePicture(existing.mediaId);

  await recordAudit({ userId: actor.id, action: "gallery.updated", entity: "gallery_item", entityId: id });
  refreshSite("/admin/gallery");
  redirect("/admin/gallery?saved=1");
}

export async function deleteGalleryPhotoAction(formData: FormData): Promise<void> {
  const actor = await assertPermission("content:write");
  const id = String(formData.get("id") ?? "");
  const existing = await prisma.galleryItem.findUnique({ where: { id } });
  if (existing) {
    await prisma.galleryItem.delete({ where: { id } });
    await removePicture(existing.mediaId);
    await recordAudit({ userId: actor.id, action: "gallery.deleted", entity: "gallery_item", entityId: id });
  }
  refreshSite("/admin/gallery");
  redirect("/admin/gallery?deleted=1");
}

// ---------------------------------------------------------------------------
// Chatbot conversations

export async function deleteChatAction(formData: FormData): Promise<void> {
  const actor = await assertPermission("content:write");
  const id = String(formData.get("id") ?? "");
  const deleted = await prisma.chatConversation.deleteMany({ where: { id } });
  if (deleted.count) {
    await recordAudit({ userId: actor.id, action: "chat.deleted", entity: "chat_conversation", entityId: id });
  }
  revalidatePath("/admin/chats");
  redirect("/admin/chats?deleted=1");
}
