import type { Metadata } from "next";

import { AdminShell } from "@/components/admin/admin-shell";
import { adminNav } from "@/lib/admin/nav";
import { ROLE_LABELS, roleHasPermission } from "@/lib/auth/permissions";
import { requireUser } from "@/lib/auth/server";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

/**
 * Authenticated admin chrome. `requireUser()` redirects anonymous visitors to
 * the login screen; the proxy already bounced cookie-less requests, but pages
 * must still verify (Next.js does not treat Proxy as an auth boundary).
 */
export default async function ProtectedAdminLayout(
  props: LayoutProps<"/admin">,
) {
  const user = await requireUser();

  const nav = adminNav.map((item) => ({
    ...item,
    allowed:
      item.permission === null || roleHasPermission(user.role, item.permission),
  }));

  return (
    <AdminShell
      user={{
        name: user.name,
        email: user.email,
        roleLabel: ROLE_LABELS[user.role],
      }}
      nav={nav}
    >
      {props.children}
    </AdminShell>
  );
}
