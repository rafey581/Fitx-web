/**
 * URL helpers for media, safe to import from Client Components.
 *
 * Media files live on disk under `uploads/` and are served by the route handler
 * at `/uploads/[...path]`. Nothing here touches the filesystem or the database.
 */

export type MediaLike = {
  path: string;
  variants?: Record<string, string> | null;
  mime?: string;
};

/** Build a public URL to a stored media file. */
export function mediaUrl(media: MediaLike): string {
  return `/uploads/${media.path.replace(/^\/+/, "")}`;
}

/**
 * URL to the closest responsive variant at or under `width`; falls back to the
 * original when no variant is small enough.
 */
export function mediaSrc(
  media: MediaLike,
  width: number,
): { src: string; width: number } {
  const variants = media.variants ?? {};
  const widthList = Object.keys(variants)
    .map(Number)
    .sort((a, b) => b - a);
  const best = widthList.find((w) => w <= width) ?? null;
  if (best !== null) {
    return { src: `/uploads/${variants[String(best)]}`, width: best };
  }
  return { src: mediaUrl(media), width: widthList[0] ?? 0 };
}

/** True for raster images we generate responsive variants for. */
export function isRasterMime(mime: string): boolean {
  return ["image/jpeg", "image/png", "image/webp", "image/avif"].includes(mime);
}
