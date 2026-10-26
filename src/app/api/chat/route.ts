import Anthropic from "@anthropic-ai/sdk";

import { localAnswer } from "@/lib/fitx/answer";
import { systemPrompt } from "@/lib/fitx/knowledge";

/**
 * Website chatbot endpoint.
 *
 * With ANTHROPIC_API_KEY set, Claude answers from the FITX knowledge base
 * (src/lib/fitx/knowledge.ts) under its approved-answers rules. Without a key,
 * or if the API call fails or declines, the offline matcher replies with the
 * approved answer text, so the bot never goes silent and never improvises.
 */

export const dynamic = "force-dynamic";

const MODEL = process.env.CHATBOT_MODEL || "claude-opus-5-5";
const MAX_HISTORY = 12;
const MAX_CHARS = 600;

const SYSTEM = systemPrompt();

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
  const offline = () => Response.json({ reply: localAnswer(question), source: "approved" });

  if (limited(ip)) {
    return Response.json(
      { reply: "You're sending messages quickly — please wait a moment and try again.", source: "limit" },
      { status: 429 },
    );
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
