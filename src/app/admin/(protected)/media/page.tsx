import { roleHasPermission } from "@/lib/auth/permissions";
import { requirePermission } from "@/lib/auth/server";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { mediaSrc, type MediaLike } from "@/lib/media-url";

import { MediaManager, type MediaRow } from "./media-manager";

export default async function MediaPage() {
  const user = await requirePermission("media:read");

  const [items, folderRows] = await Promise.all([
    prisma.media.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.media.findMany({ select: { folder: true }, distinct: ["folder"] }),
  ]);

  const rows: MediaRow[] = items.map((media) => {
    const like: MediaLike = {
      path: media.path,
      variants: media.variants as Record<string, string> | null,
    };
    return {
      id: media.id,
      filename: media.filename,
      mime: media.mime,
      size: media.size,
      width: media.width,
      height: media.height,
      alt: media.alt,
      caption: media.caption,
      folder: media.folder,
      createdAt: media.createdAt.toISOString(),
      thumb: `/uploads/${like.path.replace(/^\/+/, "")}`,
      thumb480: mediaSrc(like, 480).src,
    };
  });

  return (
    <MediaManager
      rows={rows}
      folders={[...new Set(folderRows.map((row) => row.folder))].sort()}
      maxUploadMb={env.UPLOAD_MAX_MB}
      canWrite={roleHasPermission(user.role, "media:write")}
      canDelete={roleHasPermission(user.role, "media:delete")}
    />
  );
}
