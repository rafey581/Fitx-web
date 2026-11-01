import "server-only";

import { prisma } from "@/lib/db";
import { isUnanswered } from "@/lib/fitx/answer";

export { isUnanswered };

/**
 * Saves website chatbot turns so the studio can read them in Admin → Chats.
 * Best-effort: a logging failure never affects the visitor's reply. No IP
 * address is stored, only the page and a coarse device type.
 */

/** Conversations older than this are deleted automatically. */
export const CHAT_RETENTION_DAYS = 90;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function validConversationId(id: unknown): id is string {
  return typeof id === "string" && UUID.test(id);
}

function deviceFrom(userAgent: string | null): string {
  const ua = userAgent ?? "";
  if (/ipad|tablet/i.test(ua)) return "tablet";
  if (/mobi|android|iphone/i.test(ua)) return "phone";
  return ua ? "computer" : "unknown";
}

export async function logChatTurn(turn: {
  conversationId: string;
  page: string | null;
  userAgent: string | null;
  question: string;
  reply: string;
  source: string;
  cards?: string;
  /** The AI flagged that the knowledge base had no answer. */
  unknown?: boolean;
}): Promise<void> {
  try {
    const now = new Date();
    const unanswered = turn.unknown || isUnanswered(turn.reply) ? 1 : 0;
    await prisma.chatConversation.upsert({
      where: { id: turn.conversationId },
      create: {
        id: turn.conversationId,
        page: turn.page,
        device: deviceFrom(turn.userAgent),
        messageCount: 2,
        unanswered,
        startedAt: now,
        lastMessageAt: now,
      },
      update: { messageCount: { increment: 2 }, unanswered: { increment: unanswered }, lastMessageAt: now },
    });
    await prisma.chatMessage.createMany({
      data: [
        { conversationId: turn.conversationId, role: "user", content: turn.question, createdAt: now },
        {
          conversationId: turn.conversationId,
          role: "assistant",
          content: turn.reply,
          // "ai-unknown" marks a reply the AI flagged as not covered by the knowledge base.
          source: turn.unknown ? `${turn.source}-unknown` : turn.source,
          cards: turn.cards ?? null,
          // A millisecond later so the reply always sorts after the question.
          createdAt: new Date(now.getTime() + 1),
        },
      ],
    });
  } catch (error) {
    console.warn("[chat] Could not save the conversation:", error instanceof Error ? error.message : error);
  }
}

/** Removes conversations past the retention period. */
export async function pruneOldChats(): Promise<void> {
  const cutoff = new Date(Date.now() - CHAT_RETENTION_DAYS * 24 * 60 * 60 * 1000);
  await prisma.chatConversation.deleteMany({ where: { lastMessageAt: { lt: cutoff } } });
}

/** Conversations in the last 7 days, and how many had a question the bot couldn't answer. */
export async function chatWeekStats(): Promise<{ chats: number; unanswered: number }> {
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const [chats, unanswered] = await Promise.all([
    prisma.chatConversation.count({ where: { lastMessageAt: { gte: since } } }),
    prisma.chatConversation.count({ where: { unanswered: { gt: 0 }, lastMessageAt: { gte: since } } }),
  ]);
  return { chats, unanswered };
}
