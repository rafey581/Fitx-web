import type { Metadata } from "next";

import { requirePermission } from "@/lib/auth/server";
import { prisma } from "@/lib/db";

import { UsersManager, type AdminUserRow } from "./users-manager";

export const metadata: Metadata = { title: "Users" };
export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const current = await requirePermission("users:read");

  const users = await prisma.user.findMany({
    orderBy: [{ role: "asc" }, { name: "asc" }],
  });

  const rows: AdminUserRow[] = users.map((user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    lastLoginAt: user.lastLoginAt ? user.lastLoginAt.toISOString() : null,
  }));

  return (
    <div className="mx-auto w-full max-w-4xl space-y-8">
      <header>
        <p className="eyebrow">System</p>
        <h1 className="heading-display mt-2 text-3xl text-ink">Users</h1>
        <p className="mt-2 text-sm text-muted">
          Create and manage admin accounts. Roles control what each person can
          see and do.
        </p>
      </header>

      <UsersManager users={rows} currentUserId={current.id} />
    </div>
  );
}
