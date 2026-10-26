import "server-only";

import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

import sharp from "sharp";

import { env } from "@/lib/env";

/**
 * Local-disk media storage + image processing (sharp).
 *
 * Layout under `UPLOAD_DIR` (default `uploads/`):
 *   <folder>/<uuid>.<ext>          original file
 *   <folder>/<uuid>-480.webp       responsive variants (webp, quality 80)
 *   <folder>/<uuid>-960.webp
 *   <folder>/<uuid>-1920.webp
 *
 * Only raster photos (jpeg/png/webp/avif) get variants; gif/svg/mp4 are stored
 * as-is (gif/svg may still report dimensions). SVG is rejected when it contains
 * scripts/event handlers (`javascript:` URLs, `on*=`, `<foreignObject>`).
 * Files are named with UUIDs so URLs never change when metadata is edited.
 */

export type StoredMedia = {
  mime: string;
  size: number;
  width: number | null;
  height: number | null;
  /** Original file, relative to the uploads root, e.g. `general/ab12-orig.jpg`. */
  path: string;
  /** Width -> relative path of webp variants. */
  variants: Record<string, string>;
};

export const ALLOWED_EXTENSIONS: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  avif: "image/avif",
  svg: "image/svg+xml",
  mp4: "video/mp4",
};

export const VARIANT_WIDTHS = [480, 960, 1920] as const;

export class MediaValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MediaValidationError";
  }
}

export function uploadsRoot(): string {
  return path.resolve(process.cwd(), env.UPLOAD_DIR);
}

/** Keep folders to URL/disc-safe characters. */
export function sanitizeFolder(input: string): string {
  const cleaned = input
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return cleaned || "general";
}

function sanitizeSvg(text: string): void {
  if (/<\s*(script|foreignobject)|javascript\s*:|on[a-z]+\s*=/i.test(text)) {
    throw new MediaValidationError(
      "This SVG contains scripts or event handlers and was not stored.",
    );
  }
}

/** Resolve a stored relative path to an absolute path, rejecting traversal. */
export async function resolveStoredPath(
  relativePath: string,
): Promise<string | null> {
  const root = uploadsRoot();
  const candidate = path.resolve(root, relativePath);
  if (!candidate.startsWith(root + path.sep)) return null;

  try {
    const stat = await fs.stat(candidate);
    if (!stat.isFile()) return null;
    return candidate;
  } catch {
    return null;
  }
}

/** Remove every stored file for a media row (original + variants). */
export async function deleteStoredFiles(media: {
  path: string;
  variants: Record<string, string> | null;
}): Promise<void> {
  const files = [media.path, ...Object.values(media.variants ?? {})];
  await Promise.all(
    files.map((rel) =>
      resolveStoredPath(rel).then((abs) => {
        if (abs) return fs.unlink(abs).catch(() => undefined);
      }),
    ),
  );
}

export async function processUpload(
  file: File,
  folderInput: string,
  maxBytes: number,
): Promise<StoredMedia> {
  if (file.size <= 0) {
    throw new MediaValidationError(`${file.name} is empty.`);
  }
  if (file.size > maxBytes) {
    throw new MediaValidationError(
      `${file.name} is ${(file.size / 1024 / 1024).toFixed(1)} MB — the limit is ${
        env.UPLOAD_MAX_MB
      } MB.`,
    );
  }

  const name = file.name.trim().toLowerCase();
  const ext = name.split(".").pop() ?? "";
  const mime = ALLOWED_EXTENSIONS[ext];
  if (!mime) {
    throw new MediaValidationError(
      `"${ext}" files are not supported (jpg, png, webp, gif, avif, svg, mp4).`,
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const folder = sanitizeFolder(folderInput);
  // Ensure both the uploads root AND this upload's folder exist (fs.writeFile
  // does not create missing parent directories).
  await fs.mkdir(path.join(uploadsRoot(), folder), { recursive: true });

  if (ext === "svg") {
    sanitizeSvg(buffer.toString("utf8"));
  }

  const id = randomUUID();
  const originalRel = `${folder}/${id}.${ext}`;

  let width: number | null = null;
  let height: number | null = null;
  const variants: Record<string, string> = {};

  const raster = ["jpg", "jpeg", "png", "webp", "avif"].includes(ext);
  if (raster || ext === "gif" || ext === "svg") {
    try {
      const metadata = await sharp(buffer).metadata();
      width = metadata.width ?? null;
      height = metadata.height ?? null;
    } catch {
      throw new MediaValidationError(
        `${file.name} does not look like a valid image.`,
      );
    }
  }

  if (raster && width) {
    for (const w of VARIANT_WIDTHS) {
      if (w < width) {
        const rel = `${folder}/${id}-${w}.webp`;
        await sharp(buffer)
          .rotate()
          .resize({ width: w, withoutEnlargement: true })
          .webp({ quality: 80 })
          .toFile(path.join(uploadsRoot(), rel));
        variants[String(w)] = rel;
      }
    }
  }

  await fs.writeFile(path.join(uploadsRoot(), originalRel), buffer);

  return {
    mime,
    size: file.size,
    width,
    height,
    path: originalRel,
    variants,
  };
}
