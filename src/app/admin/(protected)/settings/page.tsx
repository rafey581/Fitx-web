import { roleHasPermission } from "@/lib/auth/permissions";
import { requirePermission } from "@/lib/auth/server";
import { prisma } from "@/lib/db";
import { mediaSrc, type MediaLike } from "@/lib/media-url";
import { getSiteSettings } from "@/lib/site/settings";

import { SettingsManager, type SettingsManagerProps } from "./settings-manager";

export default async function SettingsPage() {
  const user = await requirePermission("settings:read");
  const canScripts = roleHasPermission(user.role, "scripts:write");

  const settings = await getSiteSettings();

  const media = await prisma.media.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, path: true, variants: true, filename: true },
  });
  const mediaItems = media.map((item) => {
    const like: MediaLike = {
      path: item.path,
      variants: item.variants as Record<string, string> | null,
    };
    return {
      id: item.id,
      filename: item.filename,
      thumb: mediaSrc(like, 480).src,
    };
  });

  const props: SettingsManagerProps = {
    canScripts,
    media: mediaItems,
    general: settings.general,
    seo: settings.seo,
    email: settings.email,
    scripts: settings.scripts,
  };

  return <SettingsManager {...props} />;
}
