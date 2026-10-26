import fs from "node:fs/promises";

import { resolveStoredPath } from "@/lib/media-storage";

export const dynamic = "force-dynamic";

const MIME_FALLBACK = "application/octet-stream";

/**
 * Serves stored media from the local upload directory.
 *
 * Files are only addressed by the relative path recorded in the database and
 * written by us (UUID names), so a long immutable cache header is safe. Path
 * traversal is rejected in `resolveStoredPath`.
 */
export async function GET(
  _request: Request,
  props: { params: Promise<{ path: string[] }> },
) {
  const { path: segments } = await props.params;
  if (!segments.length) return new Response("Not found", { status: 404 });

  const relative = segments.join("/");
  const absolute = await resolveStoredPath(relative);
  if (!absolute) return new Response("Not found", { status: 404 });

  const data = await fs.readFile(absolute);

  const extension = relative.split(".").pop()?.toLowerCase() ?? "";
  const mimeByExt: Record<string, string> = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
    gif: "image/gif",
    avif: "image/avif",
    svg: "image/svg+xml",
    mp4: "video/mp4",
    mov: "video/quicktime",
    webm: "video/webm",
  };

  return new Response(data, {
    headers: {
      "Content-Type": mimeByExt[extension] ?? MIME_FALLBACK,
      "Content-Length": String(data.byteLength),
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
