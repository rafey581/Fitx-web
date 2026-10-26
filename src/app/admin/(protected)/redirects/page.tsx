import { requirePermission } from "@/lib/auth/server";
import { prisma } from "@/lib/db";

import { RedirectsManager, type RedirectRow } from "./redirects-manager";

export default async function RedirectsPage() {
  await requirePermission("navigation:write");

  const redirects = await prisma.redirect.findMany({
    orderBy: { createdAt: "desc" },
  });

  const rows: RedirectRow[] = redirects.map((redirect) => ({
    id: redirect.id,
    fromPath: redirect.fromPath,
    toPath: redirect.toPath,
    code: String(redirect.code),
  }));

  return <RedirectsManager rows={rows} />;
}
