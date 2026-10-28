import Anthropic from "@anthropic-ai/sdk";

import { prisma } from "@/lib/db";
import { localAnswer } from "@/lib/fitx/answer";
import { askGemini, geminiEnabled } from "@/lib/fitx/gemini";
import { systemPrompt, type SiteContext } from "@/lib/fitx/knowledge";

/**
 * Website chatbot endpoint.
 *
 * Provider order: Gemini (GEMINI_API_KEY) → Claude (ANTHROPIC_API_KEY) → the
 * offline matcher. Both AI providers answer from the FITX knowledge base
 * (src/lib/fitx/knowledge.ts) plus the published services/coaches, under its
 * approved-answers rules. If no key is set, or every call fails, the offline
 * matcher replies with approved answer text, so the bot never goes silent.
 */

export const dynamic = "force-dynamic";

const MODEL = process.env.CHATBOT_MODEL || "claude-opus-5-5";
const MAX_HISTORY = 12;
const MAX_CHARS = 600;

// Published services/coaches for the prompt, refreshed every few minutes so
// admin edits reach the bot without a restart.
let cachedSystem: { text: string; at: number } | null = null;
async function getSystem(): Promise<string> {
  if (cachedSystem && Date.now() - cachedSystem.at < 5 * 60_000) return cachedSystem.text;
  let site: SiteContext | undefined;
  try {
    const [services, trainers] = await Promise.all([
      prisma.service.findMany({
        where: { isPublished: true },
        orderBy: { sortOrder: "asc" },
        select: { title: true, shortDescription: true, slug: true },
      }),
      prisma.trainer.findMany({
        where: { isPublished: true },
        orderBy: { sortOrder: "asc" },
        select: { name: true, title: true, slug: true },
      }),
    ]);
    site = {
      services: services.map((s) => ({ title: s.title, description: s.shortDescription ?? "", href: `/services/${s.slug}` })),
      coaches: trainers.map((t) => ({ name: t.name, role: t.title ?? "Coach", href: `/trainers/${t.slug}` })),
    };
  } catch (error) {
    console.warn("[chat] Could not load services/coaches for the prompt:", error);
  }
  cachedSystem = { text: systemPrompt(site), at: Date.now() };
  return cachedSystem.text;
}

let client: Anthropic | null = null;
function getClient() {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  client ??= new Anthropic();
  return client;
}

// Small per-IP limiter (per server process) so the endpoint can't be used to
// run up the API bill. 12 messages per minute is plenty for a real visitor.
const hits = new Map<string, number[]>();
function limited(ip: string) {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < 60_000);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) hits.clear();
  return recent.length > 12;
}

type Incoming = { role: "user" | "assistant"; content: string };

function sanitise(body: unknown): Anthropic.MessageParam[] | null {
  const raw = (body as { messages?: unknown })?.messages;
  if (!Array.isArray(raw)) return null;
  const messages = raw
    .filter(
      (m): m is Incoming =>
        !!m &&
        (m.role === "user" || m.role === "assistant") &&
        typeof m.content === "string" &&
        m.content.trim().length > 0,
    )
    .slice(-MAX_HISTORY)
    .map((m) => ({ role: m.role, content: m.content.slice(0, MAX_CHARS) }));
  // The API expects the conversation to open with the visitor.
  while (messages.length && messages[0].role !== "user") messages.shift();
  if (!messages.length || messages[messages.length - 1].role !== "user") return null;
  return messages;
}

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }
  const messages = sanitise(body);
  if (!messages) return Response.json({ error: "Invalid request" }, { status: 400 });

  const question = String(messages[messages.length - 1].content);
  const userTurns = messages.filter((m) => m.role === "user").map((m) => String(m.content));
  const previous = userTurns.length > 1 ? userTurns[userTurns.length - 2] : undefined;
  const offline = () => Response.json({ reply: localAnswer(question, previous), source: "approved" });

  if (limited(ip)) {
    return Response.json(
      { reply: "You're sending messages quickly — please wait a moment and try again.", source: "limit" },
      { status: 429 },
    );
  }

  const SYSTEM = await getSystem();

  if (geminiEnabled()) {
    const reply = await askGemini(
      SYSTEM,
      messages.map((m) => ({ role: m.role === "assistant" ? "assistant" : "user", content: String(m.content) })),
    );
    if (reply) return Response.json({ reply, source: "ai" });
  }

  const anthropic = getClient();
  if (!anthropic) return offline();

  try {
    const response = await anthropic.beta.messages.create({
      model: MODEL,
      max_tokens: 2048,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { effort: "low" },
      system: [{ type: "text", text: SYSTEM, cache_control: { type: "ephemeral" } }],
      messages,
    });

    if (response.stop_reason === "refusal") return offline();
    const reply = response.content
      .map((block) => (block.type === "text" ? block.text : ""))
      .join("")
      .trim();
    if (!reply) return offline();
    return Response.json({ reply, source: "ai" });
  } catch (error) {
    if (error instanceof Anthropic.AuthenticationError) {
      console.error("[chat] Anthropic API key rejected; using approved answers.");
    } else if (error instanceof Anthropic.RateLimitError) {
      console.warn("[chat] Anthropic rate limited; using approved answers.");
    } else if (error instanceof Anthropic.APIError) {
      console.error(`[chat] Anthropic API error ${error.status}:`, error.message);
    } else {
      console.error("[chat] Unexpected error:", error);
    }
    return offline();
  }
}
