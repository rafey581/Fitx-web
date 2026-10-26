import type { Metadata } from "next";
import Link from "next/link";

import { requirePermission } from "@/lib/auth/server";
import { prisma } from "@/lib/db";
import { formatDateTime } from "@/lib/format";

export const metadata: Metadata = { title: "Audit log" };
export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

export default async function AuditLogPage(
  props: PageProps<"/admin/audit-log">,
) {
  await requirePermission("audit:read");

  const { page: pageParam } = await props.searchParams;
  const parsedPage = Number(typeof pageParam === "string" ? pageParam : "1");
  const page =
    Number.isFinite(parsedPage) && parsedPage > 0 ? Math.floor(parsedPage) : 1;

  const [total, logs] = await Promise.all([
    prisma.auditLog.count(),
    prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { user: { select: { name: true, email: true } } },
    }),
  ]);

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <header>
        <p className="eyebrow">System</p>
        <h1 className="heading-display mt-2 text-3xl text-ink">Audit log</h1>
        <p className="mt-2 text-sm text-muted">
          {total} recorded {total === 1 ? "entry" : "entries"}. Newest first.
        </p>
      </header>

      <div className="overflow-x-auto rounded-brand border border-black/10 bg-white shadow-sm">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              <th className="border-b border-black/10 px-4 py-3 text-left text-xs font-semibold tracking-wide text-muted uppercase">
                When
              </th>
              <th className="border-b border-black/10 px-4 py-3 text-left text-xs font-semibold tracking-wide text-muted uppercase">
                Actor
              </th>
              <th className="border-b border-black/10 px-4 py-3 text-left text-xs font-semibold tracking-wide text-muted uppercase">
                Action
              </th>
              <th className="border-b border-black/10 px-4 py-3 text-left text-xs font-semibold tracking-wide text-muted uppercase">
                Entity
              </th>
              <th className="border-b border-black/10 px-4 py-3 text-left text-xs font-semibold tracking-wide text-muted uppercase">
                Details
              </th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted">
                  No activity recorded yet.
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="align-top">
                  <td className="border-b border-black/5 px-4 py-3 whitespace-nowrap text-muted">
                    {formatDateTime(log.createdAt)}
                  </td>
                  <td className="border-b border-black/5 px-4 py-3">
                    {log.user ? (
                      <>
                        <span className="block font-medium text-ink">
                          {log.user.name}
                        </span>
                        <span className="block text-xs text-muted">
                          {log.user.email}
                        </span>
                      </>
                    ) : (
                      <span className="text-muted">system</span>
                    )}
                  </td>
                  <td className="border-b border-black/5 px-4 py-3">
                    <code className="rounded bg-black/5 px-1.5 py-0.5 text-xs text-ink">
                      {log.action}
                    </code>
                  </td>
                  <td className="border-b border-black/5 px-4 py-3 text-muted">
                    {log.entity}
                    {log.entityId ? (
                      <span className="block text-xs text-muted/70">
                        {log.entityId}
                      </span>
                    ) : null}
                  </td>
                  <td className="border-b border-black/5 px-4 py-3">
                    <code className="block max-w-xs truncate text-xs text-muted">
                      {JSON.stringify(log.meta)}
                    </code>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pageCount > 1 ? (
        <nav
          className="flex items-center justify-between text-sm"
          aria-label="Audit log pages"
        >
          {page > 1 ? (
            <Link
              href={`/admin/audit-log?page=${page - 1}`}
              className="font-medium text-accent hover:underline"
            >
              ← Newer
            </Link>
          ) : (
            <span />
          )}
          <span className="text-muted">
            Page {page} of {pageCount}
          </span>
          {page < pageCount ? (
            <Link
              href={`/admin/audit-log?page=${page + 1}`}
              className="font-medium text-accent hover:underline"
            >
              Older →
            </Link>
          ) : (
            <span />
          )}
        </nav>
      ) : null}
    </div>
  );
}
