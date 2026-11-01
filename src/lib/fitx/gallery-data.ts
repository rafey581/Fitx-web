import "server-only";

import { prisma } from "@/lib/db";
import { galleryPhotos, type GalleryCategory, type GalleryPhoto } from "@/lib/fitx/gallery";
import { mediaUrl } from "@/lib/media-url";

const CATEGORIES: GalleryCategory[] = ["studio", "training", "events"];
const builtIn = new Map(galleryPhotos.map((p) => [p.src, p]));

export type GalleryRow = GalleryPhoto & { id: string };

/** Gallery photos managed in Admin → Gallery (published only for the website). */
export async function galleryRows({ all = false } = {}): Promise<GalleryRow[]> {
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
