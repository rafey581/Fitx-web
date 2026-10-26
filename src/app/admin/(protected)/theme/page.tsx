import { requirePermission } from "@/lib/auth/server";
import { getSiteSettings } from "@/lib/site/settings";

import { ThemeForm } from "./theme-form";

export default async function ThemePage() {
  await requirePermission("theme:write");
  const theme = (await getSiteSettings()).theme;
  return <ThemeForm theme={theme} />;
}
