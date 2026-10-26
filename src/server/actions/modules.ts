"use server";

import { revalidatePath } from "next/cache";

import { recordAudit } from "@/lib/audit";
import { assertPermission } from "@/lib/auth/server";
import { prisma } from "@/lib/db";
import { slugify, uniqueSlug } from "@/lib/slug";
import {
  galleryItemSchema,
  moduleDeleteSchema,
  moduleMoveSchema,
  planSchema,
  serviceSchema,
  testimonialSchema,
  timetableEntrySchema,
  trainerSchema,
  type ContentModule,
} from "@/lib/validation/modules";
import { toFieldErrors } from "@/lib/validation/errors";

import type { ActionState } from "./types";

/** Empty string form values become NULL for nullable DB columns. */
const idOrNull = (value: string): string | null =>
  value.trim() ? value.trim() : null;

function revalidateAll(): void {
  revalidatePath("/", "layout");
}

function revalidateModule(module: ContentModule): void {
  revalidatePath(`/admin/${module}`);
  if (module === "trainers") {
    revalidatePath("/trainers");
  } else if (module === "services") {
    revalidatePath("/services");
  }
  revalidateAll();
}

async function nextSortOrder(
  model:
    | "trainer"
    | "service"
    | "plan"
    | "testimonial"
    | "galleryItem"
    | "timetableEntry",
): Promise<number> {
  const delegate = prisma[model] as unknown as {
    findFirst: (args: {
      orderBy: { sortOrder: "desc" };
      select: { sortOrder: true };
    }) => Promise<{ sortOrder: number } | null>;
  };
  const last = await delegate.findFirst({
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true },
  });
  return (last?.sortOrder ?? -1) + 1;
}

// ---------------------------------------------------------------------------
// Trainers
// ---------------------------------------------------------------------------

export async function createTrainerAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await assertPermission("content:write");
  const parsed = trainerSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    title: formData.get("title"),
    photoId: formData.get("photoId"),
    bio: formData.get("bio"),
    specialties: formData.get("specialties"),
    certifications: formData.get("certifications"),
    facebookUrl: formData.get("facebookUrl"),
    instagramUrl: formData.get("instagramUrl"),
    twitterUrl: formData.get("twitterUrl"),
    youtubeUrl: formData.get("youtubeUrl"),
    seoTitle: formData.get("seoTitle"),
    seoDescription: formData.get("seoDescription"),
    isPublished: formData.get("isPublished") === "on",
  });
  if (!parsed.success)
    return { ok: false, fieldErrors: toFieldErrors(parsed.error) };

  const slug =
    parsed.data.slug ||
    (await uniqueSlug(slugify(parsed.data.name), (candidate) =>
      prisma.trainer.findUnique({ where: { slug: candidate } }).then(Boolean),
    ));

  const trainer = await prisma.trainer.create({
    data: {
      name: parsed.data.name,
      slug,
      title: parsed.data.title || null,
      photoId: idOrNull(parsed.data.photoId),
      bio: parsed.data.bio || null,
      specialties: parsed.data.specialties as never,
      certifications: parsed.data.certifications as never,
      facebookUrl: parsed.data.facebookUrl || null,
      instagramUrl: parsed.data.instagramUrl || null,
      twitterUrl: parsed.data.twitterUrl || null,
      youtubeUrl: parsed.data.youtubeUrl || null,
      seoTitle: parsed.data.seoTitle || null,
      seoDescription: parsed.data.seoDescription || null,
      isPublished: parsed.data.isPublished,
      sortOrder: await nextSortOrder("trainer"),
    },
  });

  await recordAudit({
    userId: actor.id,
    action: "trainer.created",
    entity: "trainer",
    entityId: trainer.id,
    meta: { name: trainer.name },
  });

  revalidateModule("trainers");
  return { ok: true, message: `Added ${trainer.name}.` };
}

export async function updateTrainerAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await assertPermission("content:write");
  const parsed = trainerSchema.safeParse({
    id: formData.get("id"),
    name: formData.get("name"),
    slug: formData.get("slug"),
    title: formData.get("title"),
    photoId: formData.get("photoId"),
    bio: formData.get("bio"),
    specialties: formData.get("specialties"),
    certifications: formData.get("certifications"),
    facebookUrl: formData.get("facebookUrl"),
    instagramUrl: formData.get("instagramUrl"),
    twitterUrl: formData.get("twitterUrl"),
    youtubeUrl: formData.get("youtubeUrl"),
    seoTitle: formData.get("seoTitle"),
    seoDescription: formData.get("seoDescription"),
    sortOrder: formData.get("sortOrder"),
    isPublished: formData.get("isPublished") === "on",
  });
  if (!parsed.success)
    return { ok: false, fieldErrors: toFieldErrors(parsed.error) };

  const existing = await prisma.trainer.findUnique({
    where: { id: parsed.data.id },
  });
  if (!existing) return { ok: false, error: "That trainer no longer exists." };

  let slug = parsed.data.slug || existing.slug;
  if (slug !== existing.slug) {
    slug = await uniqueSlug(slugify(slug), (candidate) =>
      prisma.trainer
        .findFirst({ where: { slug: candidate, id: { not: existing.id } } })
        .then(Boolean),
    );
  }

  await prisma.trainer.update({
    where: { id: existing.id },
    data: {
      name: parsed.data.name,
      slug,
      title: parsed.data.title || null,
      photoId: idOrNull(parsed.data.photoId),
      bio: parsed.data.bio || null,
      specialties: parsed.data.specialties as never,
      certifications: parsed.data.certifications as never,
      facebookUrl: parsed.data.facebookUrl || null,
      instagramUrl: parsed.data.instagramUrl || null,
      twitterUrl: parsed.data.twitterUrl || null,
      youtubeUrl: parsed.data.youtubeUrl || null,
      seoTitle: parsed.data.seoTitle || null,
      seoDescription: parsed.data.seoDescription || null,
      sortOrder: parsed.data.sortOrder,
      isPublished: parsed.data.isPublished,
    },
  });

  await recordAudit({
    userId: actor.id,
    action: "trainer.updated",
    entity: "trainer",
    entityId: existing.id,
    meta: { name: parsed.data.name },
  });

  revalidateModule("trainers");
  return { ok: true, message: `Saved ${parsed.data.name}.` };
}

// ---------------------------------------------------------------------------
// Services
// ---------------------------------------------------------------------------

export async function createServiceAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await assertPermission("content:write");
  const parsed = serviceSchema.safeParse({
    title: formData.get("title"),
    slug: formData.get("slug"),
    shortDescription: formData.get("shortDescription"),
    content: formData.get("content"),
    iconId: formData.get("iconId"),
    imageId: formData.get("imageId"),
    gallery: formData.get("gallery"),
    ctaLabel: formData.get("ctaLabel"),
    ctaUrl: formData.get("ctaUrl"),
    seoTitle: formData.get("seoTitle"),
    seoDescription: formData.get("seoDescription"),
    isPublished: formData.get("isPublished") === "on",
  });
  if (!parsed.success)
    return { ok: false, fieldErrors: toFieldErrors(parsed.error) };

  const slug =
    parsed.data.slug ||
    (await uniqueSlug(slugify(parsed.data.title), (candidate) =>
      prisma.service.findUnique({ where: { slug: candidate } }).then(Boolean),
    ));

  const service = await prisma.service.create({
    data: {
      title: parsed.data.title,
      slug,
      shortDescription: parsed.data.shortDescription || null,
      content: parsed.data.content || null,
      iconId: idOrNull(parsed.data.iconId),
      imageId: idOrNull(parsed.data.imageId),
      gallery: parsed.data.gallery as never,
      ctaLabel: parsed.data.ctaLabel || null,
      ctaUrl: parsed.data.ctaUrl || null,
      seoTitle: parsed.data.seoTitle || null,
      seoDescription: parsed.data.seoDescription || null,
      isPublished: parsed.data.isPublished,
      sortOrder: await nextSortOrder("service"),
    },
  });

  await recordAudit({
    userId: actor.id,
    action: "service.created",
    entity: "service",
    entityId: service.id,
    meta: { title: service.title },
  });

  revalidateModule("services");
  return { ok: true, message: `Added ${service.title}.` };
}

export async function updateServiceAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await assertPermission("content:write");
  const parsed = serviceSchema.safeParse({
    id: formData.get("id"),
    title: formData.get("title"),
    slug: formData.get("slug"),
    shortDescription: formData.get("shortDescription"),
    content: formData.get("content"),
    iconId: formData.get("iconId"),
    imageId: formData.get("imageId"),
    gallery: formData.get("gallery"),
    ctaLabel: formData.get("ctaLabel"),
    ctaUrl: formData.get("ctaUrl"),
    seoTitle: formData.get("seoTitle"),
    seoDescription: formData.get("seoDescription"),
    sortOrder: formData.get("sortOrder"),
    isPublished: formData.get("isPublished") === "on",
  });
  if (!parsed.success)
    return { ok: false, fieldErrors: toFieldErrors(parsed.error) };

  const existing = await prisma.service.findUnique({
    where: { id: parsed.data.id },
  });
  if (!existing) return { ok: false, error: "That service no longer exists." };

  let slug = parsed.data.slug || existing.slug;
  if (slug !== existing.slug) {
    slug = await uniqueSlug(slugify(slug), (candidate) =>
      prisma.service
        .findFirst({ where: { slug: candidate, id: { not: existing.id } } })
        .then(Boolean),
    );
  }

  await prisma.service.update({
    where: { id: existing.id },
    data: {
      title: parsed.data.title,
      slug,
      shortDescription: parsed.data.shortDescription || null,
      content: parsed.data.content || null,
      iconId: idOrNull(parsed.data.iconId),
      imageId: idOrNull(parsed.data.imageId),
      gallery: parsed.data.gallery as never,
      ctaLabel: parsed.data.ctaLabel || null,
      ctaUrl: parsed.data.ctaUrl || null,
      seoTitle: parsed.data.seoTitle || null,
      seoDescription: parsed.data.seoDescription || null,
      sortOrder: parsed.data.sortOrder,
      isPublished: parsed.data.isPublished,
    },
  });

  await recordAudit({
    userId: actor.id,
    action: "service.updated",
    entity: "service",
    entityId: existing.id,
    meta: { title: parsed.data.title },
  });

  revalidateModule("services");
  return { ok: true, message: `Saved ${parsed.data.title}.` };
}

// ---------------------------------------------------------------------------
// Plans
// ---------------------------------------------------------------------------

export async function createPlanAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await assertPermission("content:write");
  const parsed = planSchema.safeParse({
    name: formData.get("name"),
    price: formData.get("price"),
    currency: formData.get("currency"),
    billingPeriod: formData.get("billingPeriod"),
    features: formData.get("features"),
    isHighlighted: formData.get("isHighlighted") === "on",
    ctaLabel: formData.get("ctaLabel"),
    ctaUrl: formData.get("ctaUrl"),
    isPublished: formData.get("isPublished") === "on",
  });
  if (!parsed.success)
    return { ok: false, fieldErrors: toFieldErrors(parsed.error) };

  const plan = await prisma.plan.create({
    data: {
      name: parsed.data.name,
      price: parsed.data.price ? parsed.data.price : null,
      currency: parsed.data.currency,
      billingPeriod: parsed.data.billingPeriod || null,
      features: parsed.data.features as never,
      isHighlighted: parsed.data.isHighlighted,
      ctaLabel: parsed.data.ctaLabel || null,
      ctaUrl: parsed.data.ctaUrl || null,
      isPublished: parsed.data.isPublished,
      sortOrder: await nextSortOrder("plan"),
    },
  });

  await recordAudit({
    userId: actor.id,
    action: "plan.created",
    entity: "plan",
    entityId: plan.id,
    meta: { name: plan.name },
  });

  revalidateModule("plans");
  return { ok: true, message: `Added the ${plan.name} plan.` };
}

export async function updatePlanAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await assertPermission("content:write");
  const parsed = planSchema.safeParse({
    id: formData.get("id"),
    name: formData.get("name"),
    price: formData.get("price"),
    currency: formData.get("currency"),
    billingPeriod: formData.get("billingPeriod"),
    features: formData.get("features"),
    isHighlighted: formData.get("isHighlighted") === "on",
    ctaLabel: formData.get("ctaLabel"),
    ctaUrl: formData.get("ctaUrl"),
    sortOrder: formData.get("sortOrder"),
    isPublished: formData.get("isPublished") === "on",
  });
  if (!parsed.success)
    return { ok: false, fieldErrors: toFieldErrors(parsed.error) };

  const existing = await prisma.plan.findUnique({
    where: { id: parsed.data.id },
  });
  if (!existing) return { ok: false, error: "That plan no longer exists." };

  await prisma.plan.update({
    where: { id: existing.id },
    data: {
      name: parsed.data.name,
      price: parsed.data.price ? parsed.data.price : null,
      currency: parsed.data.currency,
      billingPeriod: parsed.data.billingPeriod || null,
      features: parsed.data.features as never,
      isHighlighted: parsed.data.isHighlighted,
      ctaLabel: parsed.data.ctaLabel || null,
      ctaUrl: parsed.data.ctaUrl || null,
      sortOrder: parsed.data.sortOrder,
      isPublished: parsed.data.isPublished,
    },
  });

  await recordAudit({
    userId: actor.id,
    action: "plan.updated",
    entity: "plan",
    entityId: existing.id,
    meta: { name: parsed.data.name },
  });

  revalidateModule("plans");
  return { ok: true, message: `Saved the ${parsed.data.name} plan.` };
}

// ---------------------------------------------------------------------------
// Testimonials
// ---------------------------------------------------------------------------

export async function createTestimonialAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await assertPermission("content:write");
  const parsed = testimonialSchema.safeParse({
    name: formData.get("name"),
    quote: formData.get("quote"),
    photoId: formData.get("photoId"),
    rating: formData.get("rating"),
    beforeImageId: formData.get("beforeImageId"),
    afterImageId: formData.get("afterImageId"),
    isPublished: formData.get("isPublished") === "on",
  });
  if (!parsed.success)
    return { ok: false, fieldErrors: toFieldErrors(parsed.error) };

  const testimonial = await prisma.testimonial.create({
    data: {
      name: parsed.data.name,
      quote: parsed.data.quote,
      photoId: idOrNull(parsed.data.photoId),
      rating: parsed.data.rating,
      beforeImageId: idOrNull(parsed.data.beforeImageId),
      afterImageId: idOrNull(parsed.data.afterImageId),
      isPublished: parsed.data.isPublished,
      sortOrder: await nextSortOrder("testimonial"),
    },
  });

  await recordAudit({
    userId: actor.id,
    action: "testimonial.created",
    entity: "testimonial",
    entityId: testimonial.id,
    meta: { name: testimonial.name },
  });

  revalidateModule("testimonials");
  return { ok: true, message: `Added testimonial from ${testimonial.name}.` };
}

export async function updateTestimonialAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await assertPermission("content:write");
  const parsed = testimonialSchema.safeParse({
    id: formData.get("id"),
    name: formData.get("name"),
    quote: formData.get("quote"),
    photoId: formData.get("photoId"),
    rating: formData.get("rating"),
    beforeImageId: formData.get("beforeImageId"),
    afterImageId: formData.get("afterImageId"),
    sortOrder: formData.get("sortOrder"),
    isPublished: formData.get("isPublished") === "on",
  });
  if (!parsed.success)
    return { ok: false, fieldErrors: toFieldErrors(parsed.error) };

  const existing = await prisma.testimonial.findUnique({
    where: { id: parsed.data.id },
  });
  if (!existing)
    return { ok: false, error: "That testimonial no longer exists." };

  await prisma.testimonial.update({
    where: { id: existing.id },
    data: {
      name: parsed.data.name,
      quote: parsed.data.quote,
      photoId: idOrNull(parsed.data.photoId),
      rating: parsed.data.rating,
      beforeImageId: idOrNull(parsed.data.beforeImageId),
      afterImageId: idOrNull(parsed.data.afterImageId),
      sortOrder: parsed.data.sortOrder,
      isPublished: parsed.data.isPublished,
    },
  });

  await recordAudit({
    userId: actor.id,
    action: "testimonial.updated",
    entity: "testimonial",
    entityId: existing.id,
    meta: { name: parsed.data.name },
  });

  revalidateModule("testimonials");
  return { ok: true, message: `Saved testimonial from ${parsed.data.name}.` };
}

// ---------------------------------------------------------------------------
// Gallery
// ---------------------------------------------------------------------------

export async function createGalleryItemAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await assertPermission("content:write");
  const parsed = galleryItemSchema.safeParse({
    mediaId: formData.get("mediaId"),
    externalUrl: formData.get("externalUrl"),
    category: formData.get("category"),
    caption: formData.get("caption"),
    isPublished: formData.get("isPublished") === "on",
  });
  if (!parsed.success)
    return { ok: false, fieldErrors: toFieldErrors(parsed.error) };

  if (!idOrNull(parsed.data.mediaId) && !parsed.data.externalUrl) {
    return {
      ok: false,
      fieldErrors: {
        mediaId: ["Pick an image from the library or paste a link."],
      },
    };
  }

  const item = await prisma.galleryItem.create({
    data: {
      mediaId: idOrNull(parsed.data.mediaId),
      externalUrl: parsed.data.externalUrl || null,
      category: parsed.data.category,
      caption: parsed.data.caption || null,
      isPublished: parsed.data.isPublished,
      sortOrder: await nextSortOrder("galleryItem"),
    },
  });

  await recordAudit({
    userId: actor.id,
    action: "gallery_item.created",
    entity: "galleryItem",
    entityId: item.id,
    meta: { category: item.category },
  });

  revalidateModule("gallery");
  return { ok: true, message: "Gallery image added." };
}

export async function updateGalleryItemAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await assertPermission("content:write");
  const parsed = galleryItemSchema.safeParse({
    id: formData.get("id"),
    mediaId: formData.get("mediaId"),
    externalUrl: formData.get("externalUrl"),
    category: formData.get("category"),
    caption: formData.get("caption"),
    sortOrder: formData.get("sortOrder"),
    isPublished: formData.get("isPublished") === "on",
  });
  if (!parsed.success)
    return { ok: false, fieldErrors: toFieldErrors(parsed.error) };

  const existing = await prisma.galleryItem.findUnique({
    where: { id: parsed.data.id },
  });
  if (!existing)
    return { ok: false, error: "That gallery image no longer exists." };

  if (!idOrNull(parsed.data.mediaId) && !parsed.data.externalUrl) {
    return {
      ok: false,
      fieldErrors: {
        mediaId: ["Pick an image from the library or paste a link."],
      },
    };
  }

  await prisma.galleryItem.update({
    where: { id: existing.id },
    data: {
      mediaId: idOrNull(parsed.data.mediaId),
      externalUrl: parsed.data.externalUrl || null,
      category: parsed.data.category,
      caption: parsed.data.caption || null,
      sortOrder: parsed.data.sortOrder,
      isPublished: parsed.data.isPublished,
    },
  });

  await recordAudit({
    userId: actor.id,
    action: "gallery_item.updated",
    entity: "galleryItem",
    entityId: existing.id,
    meta: { category: parsed.data.category },
  });

  revalidateModule("gallery");
  return { ok: true, message: "Gallery image saved." };
}

// ---------------------------------------------------------------------------
// Timetable
// ---------------------------------------------------------------------------

export async function createTimetableEntryAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await assertPermission("content:write");
  const parsed = timetableEntrySchema.safeParse({
    dayOfWeek: formData.get("dayOfWeek"),
    startTime: formData.get("startTime"),
    endTime: formData.get("endTime"),
    title: formData.get("title"),
    trainerId: formData.get("trainerId"),
    isPublished: formData.get("isPublished") === "on",
  });
  if (!parsed.success)
    return { ok: false, fieldErrors: toFieldErrors(parsed.error) };

  const entry = await prisma.timetableEntry.create({
    data: {
      dayOfWeek: parsed.data.dayOfWeek,
      startTime: parsed.data.startTime,
      endTime: parsed.data.endTime,
      title: parsed.data.title,
      trainerId: idOrNull(parsed.data.trainerId),
      isPublished: parsed.data.isPublished,
      sortOrder: await nextSortOrder("timetableEntry"),
    },
  });

  await recordAudit({
    userId: actor.id,
    action: "timetable.created",
    entity: "timetableEntry",
    entityId: entry.id,
    meta: { title: entry.title },
  });

  revalidateModule("timetable");
  return { ok: true, message: `Added ${entry.title}.` };
}

export async function updateTimetableEntryAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await assertPermission("content:write");
  const parsed = timetableEntrySchema.safeParse({
    id: formData.get("id"),
    dayOfWeek: formData.get("dayOfWeek"),
    startTime: formData.get("startTime"),
    endTime: formData.get("endTime"),
    title: formData.get("title"),
    trainerId: formData.get("trainerId"),
    sortOrder: formData.get("sortOrder"),
    isPublished: formData.get("isPublished") === "on",
  });
  if (!parsed.success)
    return { ok: false, fieldErrors: toFieldErrors(parsed.error) };

  const existing = await prisma.timetableEntry.findUnique({
    where: { id: parsed.data.id },
  });
  if (!existing)
    return { ok: false, error: "That timetable entry no longer exists." };

  await prisma.timetableEntry.update({
    where: { id: existing.id },
    data: {
      dayOfWeek: parsed.data.dayOfWeek,
      startTime: parsed.data.startTime,
      endTime: parsed.data.endTime,
      title: parsed.data.title,
      trainerId: idOrNull(parsed.data.trainerId),
      sortOrder: parsed.data.sortOrder,
      isPublished: parsed.data.isPublished,
    },
  });

  await recordAudit({
    userId: actor.id,
    action: "timetable.updated",
    entity: "timetableEntry",
    entityId: existing.id,
    meta: { title: parsed.data.title },
  });

  revalidateModule("timetable");
  return { ok: true, message: `Saved ${parsed.data.title}.` };
}

// ---------------------------------------------------------------------------
// Shared: delete + reorder
// ---------------------------------------------------------------------------

export async function deleteModuleItemAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await assertPermission("content:write");
  const parsed = moduleDeleteSchema.safeParse({
    module: formData.get("module"),
    id: formData.get("id"),
  });
  if (!parsed.success) return { ok: false, error: "Missing module or item." };

  const { module, id } = parsed.data;
  switch (module) {
    case "trainers":
      await prisma.trainer.delete({ where: { id } });
      break;
    case "services":
      await prisma.service.delete({ where: { id } });
      break;
    case "plans":
      await prisma.plan.delete({ where: { id } });
      break;
    case "testimonials":
      await prisma.testimonial.delete({ where: { id } });
      break;
    case "gallery":
      await prisma.galleryItem.delete({ where: { id } });
      break;
    case "timetable":
      await prisma.timetableEntry.delete({ where: { id } });
      break;
  }

  await recordAudit({
    userId: actor.id,
    action: `${module}.deleted`,
    entity: module,
    entityId: id,
  });

  revalidateModule(module);
  return { ok: true, message: "Deleted." };
}

/** Swap order with the previous/next row so managers get up/down controls. */
export async function moveModuleItemAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await assertPermission("content:write");
  const parsed = moduleMoveSchema.safeParse({
    module: formData.get("module"),
    id: formData.get("id"),
    direction: formData.get("direction"),
  });
  if (!parsed.success) return { ok: false, error: "Missing module or item." };

  const { module, id, direction } = parsed.data;

  type SortRow = { id: string; sortOrder: number };
  const rows = (() => {
    switch (module) {
      case "trainers":
        return prisma.trainer.findMany({
          orderBy: { sortOrder: "asc" },
          select: { id: true, sortOrder: true },
        });
      case "services":
        return prisma.service.findMany({
          orderBy: { sortOrder: "asc" },
          select: { id: true, sortOrder: true },
        });
      case "plans":
        return prisma.plan.findMany({
          orderBy: { sortOrder: "asc" },
          select: { id: true, sortOrder: true },
        });
      case "testimonials":
        return prisma.testimonial.findMany({
          orderBy: { sortOrder: "asc" },
          select: { id: true, sortOrder: true },
        });
      case "gallery":
        return prisma.galleryItem.findMany({
          orderBy: { sortOrder: "asc" },
          select: { id: true, sortOrder: true },
        });
      case "timetable":
        return prisma.timetableEntry.findMany({
          orderBy: { sortOrder: "asc" },
          select: { id: true, sortOrder: true },
        });
    }
  })() as Promise<SortRow[]>;

  const list = await rows;
  const index = list.findIndex((row) => row.id === id);
  if (index === -1) return { ok: false, error: "That item no longer exists." };
  const target = direction === "up" ? index - 1 : index + 1;
  if (target < 0 || target >= list.length) return { ok: true, message: "" };
  const other = list[target];

  const apply = (aId: string, aOrder: number, bId: string, bOrder: number) => {
    switch (module) {
      case "trainers":
        return prisma.$transaction([
          prisma.trainer.update({
            where: { id: aId },
            data: { sortOrder: aOrder },
          }),
          prisma.trainer.update({
            where: { id: bId },
            data: { sortOrder: bOrder },
          }),
        ]);
      case "services":
        return prisma.$transaction([
          prisma.service.update({
            where: { id: aId },
            data: { sortOrder: aOrder },
          }),
          prisma.service.update({
            where: { id: bId },
            data: { sortOrder: bOrder },
          }),
        ]);
      case "plans":
        return prisma.$transaction([
          prisma.plan.update({
            where: { id: aId },
            data: { sortOrder: aOrder },
          }),
          prisma.plan.update({
            where: { id: bId },
            data: { sortOrder: bOrder },
          }),
        ]);
      case "testimonials":
        return prisma.$transaction([
          prisma.testimonial.update({
            where: { id: aId },
            data: { sortOrder: aOrder },
          }),
          prisma.testimonial.update({
            where: { id: bId },
            data: { sortOrder: bOrder },
          }),
        ]);
      case "gallery":
        return prisma.$transaction([
          prisma.galleryItem.update({
            where: { id: aId },
            data: { sortOrder: aOrder },
          }),
          prisma.galleryItem.update({
            where: { id: bId },
            data: { sortOrder: bOrder },
          }),
        ]);
      case "timetable":
        return prisma.$transaction([
          prisma.timetableEntry.update({
            where: { id: aId },
            data: { sortOrder: aOrder },
          }),
          prisma.timetableEntry.update({
            where: { id: bId },
            data: { sortOrder: bOrder },
          }),
        ]);
    }
  };

  await apply(id, other.sortOrder, other.id, list[index].sortOrder);

  await recordAudit({
    userId: actor.id,
    action: `${module}.reordered`,
    entity: module,
    entityId: id,
  });

  revalidateModule(module);
  return { ok: true, message: "" };
}
