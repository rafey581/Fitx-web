"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { recordAudit } from "@/lib/audit";
import { assertPermission } from "@/lib/auth/server";
import { prisma } from "@/lib/db";
import {
  validateDraftSections,
  type ValidatedDraftSection,
} from "@/lib/sections/types";
import { slugify, uniqueSlug } from "@/lib/slug";
import { toFieldErrors } from "@/lib/validation/errors";
import type { ActionState } from "./types";

/**
 * Page manager + visual builder server actions (PRD Phase 3).
 *
 * Publishing model: `sections` rows are the working draft; publishing snapshots
 * the page metadata + draft sections into an immutable `PageVersion` and points
 * the page at it. `has_unpublished_changes` tracks drafts that diverged after
 * the last publish. See src/lib/site/pages.ts for the public read side.
 */

const optStr = (max: number) =>
  z.union([z.string().trim().max(max), z.literal("")]).optional();

const createPageSchema = z.object({
  title: z.string().trim().min(1, "Give the page a name").max(200),
  slug: z.string().trim().max(80).optional(),
  copyFrom: z.string().trim().max(200).optional(),
});

const saveMetaSchema = z.object({
  pageId: z.string().trim().min(1),
  title: z.string().trim().min(1, "Title is required").max(200),
  slug: z.string().trim().max(80).optional(),
  seoTitle: optStr(200),
  seoDescription: optStr(400),
  ogImageId: optStr(120),
  noindex: z.boolean(),
  isHome: z.boolean(),
  status: z.enum(["DRAFT", "PUBLISHED", "SCHEDULED"]),
  publishAt: z.string().trim().max(30).optional(),
});

const idActionSchema = z.object({
  pageId: z.string().trim().min(1),
});

function revalidatePagePaths(pageId: string): void {
  revalidatePath("/", "layout");
  revalidatePath("/admin/pages");
  revalidatePath(`/admin/pages/${pageId}`);
}

/** @internal shared by duplicate/publish/revert. */
async function sectionsOf(pageId: string) {
  return prisma.section.findMany({
    where: { pageId },
    orderBy: { sortOrder: "asc" },
  });
}

// ---------------------------------------------------------------------------
// Create / metadata
// ---------------------------------------------------------------------------

/** Create a page (DRAFT by default) and open the builder for it. */
export async function createPageAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await assertPermission("pages:write");

  const parsed = createPageSchema.safeParse({
    title: formData.get("title"),
    slug: formData.get("slug") || undefined,
    copyFrom: formData.get("copyFrom") || undefined,
  });
  if (!parsed.success) {
    return {
      ok: false,
      error: "Please fix the highlighted fields.",
      fieldErrors: toFieldErrors(parsed.error),
    };
  }

  const title = parsed.data.title;
  const baseSlug = slugify(parsed.data.slug || title);
  const slug = await uniqueSlug(baseSlug, async (candidate) => {
    const existing = await prisma.page.findFirst({
      where: { slug: candidate, deletedAt: null },
      select: { id: true },
    });
    return existing !== null;
  });

  const page = await prisma.page.create({
    data: { title, slug, status: "DRAFT" },
  });

  let copiedSections = 0;
  if (parsed.data.copyFrom) {
    const copyFrom = await prisma.page.findUnique({
      where: { id: parsed.data.copyFrom },
      include: { sections: { orderBy: { sortOrder: "asc" } } },
    });
    if (copyFrom && !copyFrom.deletedAt && copyFrom.sections.length > 0) {
      await prisma.section.createMany({
        data: copyFrom.sections.map((section, index) => ({
          pageId: page.id,
          type: section.type,
          sortOrder: index,
          content: structuredClone(section.content) as never,
          style: structuredClone(section.style) as never,
          isVisible: section.isVisible,
          visibilityDevices: section.visibilityDevices,
        })),
      });
      copiedSections = copyFrom.sections.length;
    }
  }

  await recordAudit({
    userId: actor.id,
    action: "pages.created",
    entity: "page",
    entityId: page.id,
    meta: { title, slug, copiedSections },
  });
  revalidatePath("/admin/pages");

  redirect(`/admin/pages/${page.id}`);
}

/** Save page metadata: title, slug, SEO, status, scheduling, home flag. */
export async function savePageMetaAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await assertPermission("pages:write");

  const parsed = saveMetaSchema.safeParse({
    pageId: formData.get("pageId"),
    title: formData.get("title"),
    slug: formData.get("slug") || undefined,
    seoTitle: formData.get("seoTitle") ?? "",
    seoDescription: formData.get("seoDescription") ?? "",
    ogImageId: formData.get("ogImageId") ?? "",
    noindex: formData.get("noindex") === "on",
    isHome: formData.get("isHome") === "on",
    status: formData.get("status"),
    publishAt: formData.get("publishAt") ?? "",
  });
  if (!parsed.success) {
    return {
      ok: false,
      error: "Please fix the highlighted fields.",
      fieldErrors: toFieldErrors(parsed.error),
    };
  }

  const page = await prisma.page.findFirst({
    where: { id: parsed.data.pageId, deletedAt: null },
  });
  if (!page) return { ok: false, error: "That page no longer exists." };

  const baseSlug = slugify(parsed.data.slug || parsed.data.title);
  if (baseSlug !== page.slug) {
    const clash = await prisma.page.findFirst({
      where: { slug: baseSlug, id: { not: page.id }, deletedAt: null },
      select: { id: true },
    });
    if (clash) {
      return {
        ok: false,
        error: `The slug "/${baseSlug}" is already used by another page.`,
      };
    }
  }

  const publishAtValue = parsed.data.publishAt
    ? new Date(parsed.data.publishAt)
    : null;
  let status = parsed.data.status;

  // A publish date in the future means "scheduled", whatever the picker says.
  if (
    status === "PUBLISHED" &&
    publishAtValue &&
    publishAtValue.getTime() > Date.now()
  ) {
    status = "SCHEDULED";
  }
  if (status === "SCHEDULED" && !publishAtValue) {
    return {
      ok: false,
      error: "A scheduled page needs a publish date and time.",
    };
  }

  const update = prisma.page.update({
    where: { id: page.id },
    data: {
      title: parsed.data.title,
      slug: baseSlug,
      seoTitle: parsed.data.seoTitle || null,
      seoDescription: parsed.data.seoDescription || null,
      ogImageId: parsed.data.ogImageId || null,
      noindex: parsed.data.noindex,
      isHome: parsed.data.isHome,
      status,
      publishAt: publishAtValue,
      // Metadata is part of the published snapshot, so it is an unpublished
      // change once the page has ever been published.
      hasUnpublishedChanges: page.publishedVersionId
        ? true
        : page.hasUnpublishedChanges,
    },
  });

  if (parsed.data.isHome && !page.isHome) {
    await prisma.$transaction([
      prisma.page.updateMany({
        where: { isHome: true },
        data: { isHome: false },
      }),
      update,
    ]);
  } else {
    await update;
  }

  await recordAudit({
    userId: actor.id,
    action: "pages.meta_updated",
    entity: "page",
    entityId: page.id,
    meta: { title: parsed.data.title, status },
  });
  revalidatePagePaths(page.id);

  return { ok: true, message: "Page settings saved." };
}

// ---------------------------------------------------------------------------
// Sections (the draft)
// ---------------------------------------------------------------------------

/** Replace the whole section draft from the builder's JSON snapshot. */
export async function saveSectionsAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await assertPermission("pages:write");

  const pageId = String(formData.get("pageId") ?? "");
  const page = await prisma.page.findFirst({
    where: { id: pageId, deletedAt: null },
  });
  if (!page) return { ok: false, error: "That page no longer exists." };

  let raw: unknown;
  try {
    raw = JSON.parse(String(formData.get("sections") ?? "[]"));
  } catch {
    return {
      ok: false,
      error: "The builder data could not be read. Reload and retry.",
    };
  }

  const validation = validateDraftSections(raw);
  if (!validation.ok) return { ok: false, error: validation.error };
  const sections = validation.sections as ValidatedDraftSection[];

  await prisma.$transaction(async (tx) => {
    await tx.section.deleteMany({ where: { pageId } });
    if (sections.length > 0) {
      await tx.section.createMany({
        data: sections.map((section, index) => ({
          pageId,
          type: section.type,
          sortOrder: index,
          content: section.content as never,
          style: section.style as never,
          isVisible: section.isVisible,
          visibilityDevices: section.visibilityDevices,
        })),
      });
    }
    await tx.page.update({
      where: { id: pageId },
      data: {
        draftUpdatedAt: new Date(),
        hasUnpublishedChanges: page.publishedVersionId ? true : false,
      },
    });
  });

  await recordAudit({
    userId: actor.id,
    action: "pages.sections_saved",
    entity: "page",
    entityId: pageId,
    meta: { count: sections.length },
  });
  revalidatePagePaths(pageId);

  return {
    ok: true,
    message: `Draft saved (${
      sections.length
    } section${sections.length === 1 ? "" : "s"}).`,
  };
}

// ---------------------------------------------------------------------------
// Publish / versions / revert
// ---------------------------------------------------------------------------

const MAX_VERSIONS_KEPT = 20;

/**
 * Publish the draft: snapshot page + sections into an immutable version.
 *
 * The builder sends the current draft JSON so save+publish happen atomically —
 * publishing can never snapshot stale sections the user already edited on
 * screen. Without the JSON the server reads the saved draft as before.
 */
export async function publishPageAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await assertPermission("pages:publish");
  const pageId = String(formData.get("pageId") ?? "");
  if (!pageId) return { ok: false, error: "Missing page id." };

  const page = await prisma.page.findFirst({
    where: { id: pageId, deletedAt: null },
  });
  if (!page) return { ok: false, error: "That page no longer exists." };

  let draft: ValidatedDraftSection[] = [];
  const sectionsRaw = String(formData.get("sections") ?? "");
  if (sectionsRaw.trim() !== "") {
    let raw: unknown;
    try {
      raw = JSON.parse(sectionsRaw);
    } catch {
      return {
        ok: false,
        error: "The builder data could not be read. Reload and retry.",
      };
    }
    const validation = validateDraftSections(raw);
    if (!validation.ok) return { ok: false, error: validation.error };
    draft = validation.sections;
  }

  if (draft.length > 0) {
    // Persist the exact draft that is being published (transactional).
    await prisma.$transaction(async (tx) => {
      await tx.section.deleteMany({ where: { pageId } });
      await tx.section.createMany({
        data: draft.map((section, index) => ({
          pageId,
          type: section.type,
          sortOrder: index,
          content: section.content as never,
          style: section.style as never,
          isVisible: section.isVisible,
          visibilityDevices: section.visibilityDevices,
        })),
      });
    });
  } else {
    const rows = await sectionsOf(pageId);
    draft = rows.map((row) => ({
      type: row.type as ValidatedDraftSection["type"],
      content: row.content as unknown as Record<string, unknown>,
      style: row.style as unknown as Record<string, unknown>,
      isVisible: row.isVisible,
      visibilityDevices:
        (row.visibilityDevices as ValidatedDraftSection["visibilityDevices"]) ??
        "all",
    }));
  }

  if (draft.length === 0) {
    return {
      ok: false,
      error: "This page has no sections yet — add some before publishing.",
    };
  }

  const snapshot = {
    page: {
      title: page.title,
      slug: page.slug,
      seoTitle: page.seoTitle,
      seoDescription: page.seoDescription,
      ogImageId: page.ogImageId,
      noindex: page.noindex,
    },
    sections: draft.map((section) => ({
      type: section.type,
      content: section.content,
      style: section.style,
      isVisible: section.isVisible,
      visibilityDevices: section.visibilityDevices,
    })),
  };

  const now = new Date();
  const version = await prisma.pageVersion.create({
    data: {
      pageId,
      label: `Published ${now.toLocaleString("en-PK", { dateStyle: "medium", timeStyle: "short" })}`,
      snapshot: snapshot as never,
      createdBy: actor.id,
    },
  });

  await prisma.page.update({
    where: { id: pageId },
    data: {
      status: "PUBLISHED",
      publishAt: null,
      publishedAt: now,
      publishedVersionId: version.id,
      hasUnpublishedChanges: false,
      draftUpdatedAt: now,
    },
  });

  // Keep the paper trail tidy: only the newest N versions per page.
  const older = await prisma.pageVersion.findMany({
    where: { pageId },
    orderBy: { createdAt: "desc" },
    skip: MAX_VERSIONS_KEPT,
    select: { id: true },
  });
  if (older.length > 0) {
    await prisma.pageVersion.deleteMany({
      where: { id: { in: older.map((item) => item.id) } },
    });
  }

  await recordAudit({
    userId: actor.id,
    action: "pages.published",
    entity: "page",
    entityId: pageId,
    meta: { versionId: version.id, sections: draft.length },
  });
  revalidatePagePaths(pageId);

  return {
    ok: true,
    message: "Published. The live page now shows this version.",
  };
}

/** Restore a previous version's snapshot as the working draft. */
export async function revertPageAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await assertPermission("pages:write");
  const pageId = String(formData.get("pageId") ?? "");
  const versionId = String(formData.get("versionId") ?? "");

  const version = await prisma.pageVersion.findFirst({
    where: { id: versionId, pageId },
  });
  if (!version) return { ok: false, error: "That version no longer exists." };

  const snapshot = version.snapshot as { sections?: unknown[] } | null;
  const sections = Array.isArray(snapshot?.sections) ? snapshot.sections : [];

  await prisma.$transaction(async (tx) => {
    await tx.section.deleteMany({ where: { pageId } });
    if (sections.length > 0) {
      await tx.section.createMany({
        data: sections
          .map((raw, index) => {
            const section = raw as Record<string, unknown>;
            if (!section || typeof section.type !== "string") return null;
            return {
              pageId,
              type: section.type,
              sortOrder: index,
              content: structuredClone(
                (section.content ?? {}) as Record<string, unknown>,
              ) as never,
              style: structuredClone(
                (section.style ?? {}) as Record<string, unknown>,
              ) as never,
              isVisible:
                typeof section.isVisible === "boolean"
                  ? section.isVisible
                  : true,
              visibilityDevices:
                typeof section.visibilityDevices === "string"
                  ? section.visibilityDevices
                  : "all",
            };
          })
          .filter(
            (entry): entry is NonNullable<typeof entry> => entry !== null,
          ),
      });
    }
    const page = await tx.page.findFirst({ where: { id: pageId } });
    await tx.page.update({
      where: { id: pageId },
      data: {
        draftUpdatedAt: new Date(),
        hasUnpublishedChanges: page
          ? versionId !== page.publishedVersionId
          : true,
      },
    });
  });

  await recordAudit({
    userId: actor.id,
    action: "pages.reverted",
    entity: "page",
    entityId: pageId,
    meta: { versionId },
  });
  revalidatePagePaths(pageId);

  return { ok: true, message: "Draft restored from that version." };
}

// ---------------------------------------------------------------------------
// Duplicate / trash / restore / delete
// ---------------------------------------------------------------------------

/** Duplicate a page (DRAFT copy with " (copy)" title and all sections). */
export async function duplicatePageAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await assertPermission("pages:write");
  const parsed = idActionSchema.safeParse({
    pageId: formData.get("pageId"),
  });
  if (!parsed.success) return { ok: false, error: "Missing page id." };

  const source = await prisma.page.findFirst({
    where: { id: parsed.data.pageId, deletedAt: null },
    include: { sections: { orderBy: { sortOrder: "asc" } } },
  });
  if (!source) return { ok: false, error: "That page no longer exists." };

  const baseTitle = `${source.title} (copy)`;
  const slug = await uniqueSlug(slugify(baseTitle), async (candidate) => {
    const existing = await prisma.page.findFirst({
      where: { slug: candidate },
      select: { id: true },
    });
    return existing !== null;
  });

  const copy = await prisma.page.create({
    data: {
      title: baseTitle,
      slug,
      status: "DRAFT",
      seoTitle: source.seoTitle,
      seoDescription: source.seoDescription,
      ogImageId: source.ogImageId,
    },
  });

  if (source.sections.length > 0) {
    await prisma.section.createMany({
      data: source.sections.map((section, index) => ({
        pageId: copy.id,
        type: section.type,
        sortOrder: index,
        content: structuredClone(section.content) as never,
        style: structuredClone(section.style) as never,
        isVisible: section.isVisible,
        visibilityDevices: section.visibilityDevices,
      })),
    });
  }

  await recordAudit({
    userId: actor.id,
    action: "pages.duplicated",
    entity: "page",
    entityId: copy.id,
    meta: { from: source.id },
  });
  revalidatePath("/admin/pages");

  return { ok: true, message: `Duplicated as "${baseTitle}".` };
}

/** Soft-delete a page to the trash (home pages and menu links are protected). */
export async function trashPageAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await assertPermission("pages:delete");
  const parsed = idActionSchema.safeParse({ pageId: formData.get("pageId") });
  if (!parsed.success) return { ok: false, error: "Missing page id." };

  const page = await prisma.page.findUnique({
    where: { id: parsed.data.pageId },
  });
  if (!page) return { ok: false, error: "That page no longer exists." };
  if (page.deletedAt)
    return { ok: false, error: "That page is already in the trash." };
  if (page.isHome) {
    return { ok: false, error: "The home page cannot be trashed." };
  }

  await prisma.$transaction([
    prisma.menuItem.deleteMany({ where: { pageId: page.id } }),
    prisma.page.update({
      where: { id: page.id },
      data: { deletedAt: new Date() },
    }),
  ]);

  await recordAudit({
    userId: actor.id,
    action: "pages.trashed",
    entity: "page",
    entityId: page.id,
    meta: { title: page.title },
  });
  revalidatePagePaths(page.id);

  return { ok: true, message: `"${page.title}" moved to the trash.` };
}

/** Restore a page from the trash. */
export async function restorePageAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await assertPermission("pages:delete");
  const parsed = idActionSchema.safeParse({ pageId: formData.get("pageId") });
  if (!parsed.success) return { ok: false, error: "Missing page id." };

  const page = await prisma.page.findUnique({
    where: { id: parsed.data.pageId },
  });
  if (!page) return { ok: false, error: "That page no longer exists." };
  if (!page.deletedAt)
    return { ok: false, error: "That page is not in the trash." };

  await prisma.page.update({
    where: { id: page.id },
    data: { deletedAt: null },
  });
  await recordAudit({
    userId: actor.id,
    action: "pages.restored",
    entity: "page",
    entityId: page.id,
    meta: { title: page.title },
  });
  revalidatePagePaths(page.id);

  return { ok: true, message: `"${page.title}" restored.` };
}

/** Permanently delete a page that is already in the trash. */
export async function deletePageForeverAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await assertPermission("pages:delete");
  const parsed = idActionSchema.safeParse({ pageId: formData.get("pageId") });
  if (!parsed.success) return { ok: false, error: "Missing page id." };

  const page = await prisma.page.findUnique({
    where: { id: parsed.data.pageId },
  });
  if (!page) return { ok: false, error: "That page no longer exists." };
  if (!page.deletedAt) {
    return {
      ok: false,
      error: "Move the page to the trash before permanent deletion.",
    };
  }

  await prisma.page.delete({ where: { id: page.id } });
  await recordAudit({
    userId: actor.id,
    action: "pages.deleted",
    entity: "page",
    entityId: page.id,
    meta: { title: page.title },
  });
  revalidatePagePaths(page.id);

  return { ok: true, message: "Page permanently deleted." };
}
