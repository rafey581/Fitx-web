import type { Metadata } from "next";
import Link from "next/link";

import { cardClass } from "@/components/ui/styles";
import { requirePermission } from "@/lib/auth/server";
import { prisma } from "@/lib/db";
import { CHAT_RETENTION_DAYS, pruneOldChats } from "@/lib/fitx/chat-log";
import { formatDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Chats" };

const PER_PAGE = 30;

/** Conversations visitors had with the website chatbot, newest first. */
export default async function AdminChatsPage(props: PageProps<"/admin/chats">) {
  await requirePermission("content:write");
  await pruneOldChats();
  const params = await props.searchParams;
  const onlyUnanswered = params.filter === "unanswered";
  const pageNo = Math.max(1, Number(params.page) || 1);
  const where = onlyUnanswered ? { unanswered: { gt: 0 } } : {};

  const [total, unansweredTotal, conversations] = await Promise.all([
    prisma.chatConversation.count(),
    prisma.chatConversation.count({ where: { unanswered: { gt: 0 } } }),
    prisma.chatConversation.findMany({
      where,
      orderBy: { lastMessageAt: "desc" },
      skip: (pageNo - 1) * PER_PAGE,
      take: PER_PAGE + 1,
      include: {
        messages: { where: { role: "user" }, orderBy: { createdAt: "asc" }, take: 1, select: { content: true } },
      },
    }),
  ]);
  const hasMore = conversations.length > PER_PAGE;
  const rows = conversations.slice(0, PER_PAGE);
  const link = (p: number) =>
    `/admin/chats?${new URLSearchParams({ ...(onlyUnanswered ? { filter: "unanswered" } : {}), page: String(p) })}`;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-extrabold text-ink">Chats</h1>
        <p className="mt-1 text-sm text-muted">
          What visitors asked the website chatbot and what it replied. Conversations are kept for {CHAT_RETENTION_DAYS}{" "}
          days.
        </p>
      </div>

      {params.deleted ? (
        <p role="status" className="rounded-brand bg-green-50 px-4 py-3 text-sm font-medium text-green-800">
          The conversation was deleted.
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {[
          { href: "/admin/chats", label: "All", count: total, active: !onlyUnanswered },
          { href: "/admin/chats?filter=unanswered", label: "Bot couldn’t answer", count: unansweredTotal, active: onlyUnanswered },
        ].map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className={`rounded-full border px-4 py-2 text-sm ${
              tab.active ? "border-accent bg-accent text-white" : "border-black/15 bg-white text-ink"
            }`}
          >
            {tab.label} <span className="opacity-60">{tab.count}</span>
          </Link>
        ))}
      </div>

      {rows.length === 0 ? (
        <div className={`${cardClass} text-center text-sm text-muted`}>
          {onlyUnanswered ? "No unanswered questions. The bot answered everything." : "No conversations yet."}
        </div>
      ) : (
        <ul className="space-y-3">
          {rows.map((c) => (
            <li key={c.id}>
              <Link
                href={`/admin/chats/${c.id}`}
                className={`${cardClass} flex flex-col gap-2 p-4 transition hover:border-accent sm:flex-row sm:items-center sm:gap-6`}
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-ink">“{c.messages[0]?.content ?? "…"}”</p>
                  <p className="mt-1 text-xs text-muted">
                    {formatDateTime(c.lastMessageAt)} · {c.messageCount / 2} question{c.messageCount === 2 ? "" : "s"}
                    {c.page ? ` · from ${c.page}` : ""}
                    {c.device ? ` · ${c.device}` : ""}
                  </p>
                </div>
                {c.unanswered > 0 ? (
                  <span className="w-fit shrink-0 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
                    {c.unanswered} not answered
                  </span>
                ) : null}
              </Link>
            </li>
          ))}
        </ul>
      )}

      {pageNo > 1 || hasMore ? (
        <div className="flex gap-3">
          {pageNo > 1 ? (
            <Link href={link(pageNo - 1)} className="btn btn-outline">
              ← Newer
            </Link>
          ) : null}
          {hasMore ? (
            <Link href={link(pageNo + 1)} className="btn btn-outline">
              Older →
            </Link>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
