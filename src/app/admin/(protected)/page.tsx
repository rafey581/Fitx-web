import Link from "next/link";

import {
  ROLE_LABELS,
  roleHasPermission,
  type Permission,
} from "@/lib/auth/permissions";
import { requireUser } from "@/lib/auth/server";
import { prisma } from "@/lib/db";
import { formatDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

type Stat = { label: string; value: number; hint?: string };

/** A representative slice of the permission map, shown on the dashboard. */
const ACCESS_PREVIEW: Permission[] = [
  "pages:read",
  "pages:write",
  "pages:publish",
  "media:read",
  "media:write",
  "content:read",
  "content:write",
  "leads:read",
  "leads:write",
  "navigation:write",
  "settings:read",
  "settings:write",
  "theme:write",
  "scripts:write",
  "users:read",
  "users:write",
  "audit:read",
];

export default async function AdminDashboardPage() {
  const user = await requireUser();
  const canReadUsers = roleHasPermission(user.role, "users:read");

  const [pages, publishedPages, trainers, services, newLeads, users] =
    await Promise.all([
      prisma.page.count({ where: { deletedAt: null } }),
      prisma.page.count({ where: { status: "PUBLISHED", deletedAt: null } }),
      prisma.trainer.count(),
      prisma.service.count(),
      prisma.lead.count({ where: { status: "NEW" } }),
      canReadUsers ? prisma.user.count() : Promise.resolve(0),
    ]);

  const stats: Stat[] = [
    { label: "Pages", value: pages, hint: `${publishedPages} published` },
    { label: "Trainers", value: trainers },
    { label: "Services", value: services },
    { label: "New leads", value: newLeads },
  ];

  if (canReadUsers) {
    stats.push({ label: "Admin users", value: users });
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-8">
      <header>
        <p className="eyebrow">Overview</p>
        <h1 className="heading-display mt-2 text-3xl text-ink">
          Welcome back, {user.name.split(" ")[0]}
        </h1>
        <p className="mt-2 text-sm text-muted">
          Signed in as {ROLE_LABELS[user.role]} · last login{" "}
          {formatDateTime(user.lastLoginAt)}
        </p>
      </header>

      <section
        aria-label="Site summary"
        className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5"
      >
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-brand border border-black/10 bg-white p-5 shadow-sm"
          >
            <p className="text-xs font-semibold tracking-wide text-muted uppercase">
              {stat.label}
            </p>
            <p className="mt-2 font-heading text-3xl font-extrabold text-ink">
              {stat.value}
            </p>
            {stat.hint ? (
              <p className="mt-1 text-xs text-muted">{stat.hint}</p>
            ) : null}
          </div>
        ))}
      </section>

      <section className="rounded-brand border border-black/10 bg-white p-6 shadow-sm">
        <h2 className="font-heading text-lg font-bold text-ink">Your access</h2>
        <p className="mt-1 text-sm text-muted">
          Permissions are enforced on the server for every page and action.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {ACCESS_PREVIEW.filter((permission) =>
            roleHasPermission(user.role, permission),
          ).map((permission) => (
            <span
              key={permission}
              className="rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold text-accent"
            >
              {permission}
            </span>
          ))}
        </div>
      </section>

      <section className="rounded-brand border border-black/10 bg-white p-6 shadow-sm">
        <h2 className="font-heading text-lg font-bold text-ink">
          Quick actions
        </h2>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href="/admin/pages/new"
            className="btn btn-accent px-5 py-2.5 text-[0.7rem]"
          >
            New page
          </Link>
          <Link
            href="/admin/pages"
            className="btn btn-outline px-5 py-2.5 text-[0.7rem]"
          >
            Build pages
          </Link>
          <Link
            href="/admin/media"
            className="btn btn-outline px-5 py-2.5 text-[0.7rem]"
          >
            Upload media
          </Link>
          <Link
            href="/admin/theme"
            className="btn btn-outline px-5 py-2.5 text-[0.7rem]"
          >
            Change brand look
          </Link>
          <Link
            href="/admin/menus"
            className="btn btn-outline px-5 py-2.5 text-[0.7rem]"
          >
            Edit menus
          </Link>
        </div>
      </section>

      <section className="rounded-brand border border-dashed border-black/15 bg-black/[0.02] p-6">
        <h2 className="font-heading text-lg font-bold text-ink">
          What&apos;s next
        </h2>
        <p className="mt-1 text-sm text-muted">
          Phase 3 is live: create pages, compose them from blocks, preview at
          mobile or desktop width, then publish — the public site renders your
          pages instantly and published pages can be added to the menus. Next up
          is Phase 4: the content modules (trainers, services, plans) so the
          block builder and public pages pull from your own content.
        </p>
      </section>
    </div>
  );
}
