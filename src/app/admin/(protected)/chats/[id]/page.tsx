import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { SubmitButton } from "@/components/ui/submit-button";
import { cardClass } from "@/components/ui/styles";
import { requirePermission } from "@/lib/auth/server";
import { prisma } from "@/lib/db";
import { isUnanswered } from "@/lib/fitx/chat-log";
import { formatDateTime } from "@/lib/format";
import { deleteChatAction } from "@/server/actions/simple-content";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Conversation" };

const SOURCE: Record<string, string> = {
  ai: "AI answer",
  "ai-unknown": "AI answer",
  approved: "Approved answer (AI unavailable)",
  limit: "Visitor was sending too fast",
};

/** One chatbot conversation: the visitor's messages and the bot's replies. */
export default async function AdminChatPage(props: PageProps<"/admin/chats/[id]">) {
  await requirePermission("content:write");
  const { id } = await props.params;
  const chat = await prisma.chatConversation.findUnique({
    where: { id },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });
  if (!chat) notFound();

  return (
    <div className="max-w-3xl space-y-6">
      <Link href="/admin/chats" className="text-sm text-muted hover:text-accent">
        ← All chats
      </Link>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-extrabold text-ink">Conversation</h1>
          <p className="mt-1 text-sm text-muted">
            Started {formatDateTime(chat.startedAt)}
            {chat.page ? ` on ${chat.page}` : ""}
            {chat.device ? ` · ${chat.device}` : ""} · {chat.messageCount / 2} question
            {chat.messageCount === 2 ? "" : "s"}
          </p>
        </div>
        <form action={deleteChatAction}>
          <input type="hidden" name="id" value={chat.id} />
          <SubmitButton variant="danger" pendingLabel="Deleting…" confirm="Delete this conversation?">
            Delete
          </SubmitButton>
        </form>
      </div>

      <ol className={`${cardClass} space-y-4`}>
        {chat.messages.map((m) => {
          const visitor = m.role === "user";
          const missed = !visitor && (m.source?.endsWith("-unknown") || isUnanswered(m.content));
          return (
            <li key={m.id} className={`flex flex-col ${visitor ? "items-end" : "items-start"}`}>
              <p className="mb-1 text-xs text-muted">
                {visitor ? "Visitor" : "FITX assistant"} · {formatDateTime(m.createdAt)}
              </p>
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-line ${
                  visitor ? "rounded-br-md bg-accent text-white" : "rounded-bl-md border border-black/10 bg-black/[0.03] text-ink"
                }`}
              >
                {m.content}
              </div>
              {!visitor ? (
                <p className="mt-1 flex flex-wrap gap-2 text-xs text-muted">
                  {m.source ? <span>{SOURCE[m.source] ?? m.source}</span> : null}
                  {m.cards === "fees" ? <span>· Fee cards shown</span> : null}
                  {missed ? (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 font-semibold text-amber-800">
                      Bot couldn’t answer
                    </span>
                  ) : null}
                </p>
              ) : null}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
