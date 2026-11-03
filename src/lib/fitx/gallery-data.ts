import "server-only";

import { prisma } from "@/lib/db";
import { galleryPhotos, type GalleryCategory, type GalleryPhoto } from "@/lib/fitx/gallery";
import { mediaUrl } from "@/lib/media-url";

const CATEGORIES: GalleryCategory[] = ["studio", "training", "events"];
const builtIn = new Map(galleryPhotos.map((p) => [p.src, p]));

/** Marker shared with `npm run db:sync-knowledge` (settings key `sync-imports`). */
const IMPORTS_KEY = "sync-imports";

export type GalleryRow = GalleryPhoto & { id: string };

/**
 * The studio's own photos live in `gallery.ts` as URLs. Copy them into the
 * gallery table once so Admin → Gallery lists them, and so the website keeps
 * showing them after the first photo is added in the admin. The marker stops a
 * later "delete everything" from bringing them back.
 */
export async function importStudioPhotos(): Promise<number> {
  try {
    const marker = await prisma.setting.findUnique({ where: { key: IMPORTS_KEY } });
    const done = Boolean((marker?.value as Record<string, unknown> | null)?.["galleryPhotos"]);
    if (done) return 0;

    const present = await prisma.galleryItem.count({
      where: { externalUrl: { in: galleryPhotos.map((p) => p.src) } },
    });
    let added = 0;
    if (present === 0) {
      const last = await prisma.galleryItem.findFirst({
        orderBy: { sortOrder: "desc" },
        select: { sortOrder: true },
      });
      const start = (last?.sortOrder ?? 0) + 1;
      const created = await prisma.galleryItem.createMany({
        data: galleryPhotos.map((photo, index) => ({
          externalUrl: photo.src,
          category: photo.category,
          caption: photo.alt,
          sortOrder: start + index,
          isPublished: true,
        })),
      });
      added = created.count;
    }

    const value = {
      ...((marker?.value as Record<string, unknown> | null) ?? {}),
      galleryPhotos: new Date().toISOString(),
    };
    await prisma.setting.upsert({
      where: { key: IMPORTS_KEY },
      update: { value: value as never },
      create: { key: IMPORTS_KEY, group: "system", value: value as never },
    });
    return added;
  } catch {
    // Never break a page render for the one-time import: the built-in set is
    // still used as a fallback below.
    return 0;
  }
}

/** Gallery photos managed in Admin → Gallery (published only for the website). */
export async function galleryRows({ all = false } = {}): Promise<GalleryRow[]> {
  await importStudioPhotos();
  const rows = await prisma.galleryItem.findMany({
    where: all ? {} : { isPublished: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    include: { media: { select: { path: true, width: true, height: true } } },
  });
  return rows.flatMap((row) => {
    const src = row.media ? mediaUrl(row.media) : row.externalUrl;
    if (!src) return [];
    const original = builtIn.get(src);
    return [
      {
        id: row.id,
        src,
        alt: row.caption || original?.alt || "Inside FITX Personal Fitness Training Studio, Sahiwal",
        category: CATEGORIES.includes(row.category as GalleryCategory) ? (row.category as GalleryCategory) : "studio",
        width: row.media?.width ?? original?.width,
        height: row.media?.height ?? original?.height,
      },
    ];
  });
}

/** Photos for the Gallery page: the managed gallery, or the original set until it is imported. */
export async function websiteGallery(): Promise<GalleryPhoto[]> {
  const rows = await galleryRows();
  return rows.length ? rows : galleryPhotos;
}
