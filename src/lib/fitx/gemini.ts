import "server-only";

/**
 * Minimal Gemini (Google AI) client for the website chatbot, using the REST
 * API directly. Models are tried in order: a busy (429/503) or failing model
 * falls through to the next, so one overloaded model never silences the bot.
 *
 * Env: GEMINI_API_KEY (required to enable), GEMINI_MODELS (optional,
 * comma-separated override of the model order).
 */

const ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models";
const DEFAULT_MODELS = [
  "gemini-3.6-flash",
  "gemini-3.5-flash",
  "gemini-3.5-flash-lite",
  "gemini-3.1-flash-lite",
  "gemini-flash-lite-latest",
];
/** A model that is rate-limited or overloaded is skipped for this long. */
const COOLDOWN_MS = 60_000;
const coolingUntil = new Map<string, number>();
const ATTEMPT_TIMEOUT_MS = 7000;

export type ChatTurn = { role: "user" | "assistant"; content: string };

export function geminiEnabled() {
  return Boolean(process.env.GEMINI_API_KEY);
}

function models() {
  const custom = process.env.GEMINI_MODELS?.split(",").map((m) => m.trim()).filter(Boolean);
  return custom?.length ? custom : DEFAULT_MODELS;
}

type GeminiResponse = {
  candidates?: { content?: { parts?: { text?: string; thought?: boolean }[] }; finishReason?: string }[];
  error?: { code?: number; message?: string };
};

/** Returns the reply text, or null if every model failed. */
export async function askGemini(system: string, turns: ChatTurn[]): Promise<string | null> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;

  const body = JSON.stringify({
    systemInstruction: { parts: [{ text: system }] },
    contents: turns.map((t) => ({ role: t.role === "assistant" ? "model" : "user", parts: [{ text: t.content }] })),
    generationConfig: { temperature: 0.5, maxOutputTokens: 1024 },
  });

  const now = Date.now();
  const ready = models().filter((m) => (coolingUntil.get(m) ?? 0) <= now);
  // If everything is cooling down, try them all anyway rather than give up.
  for (const model of ready.length ? ready : models()) {
    try {
      const res = await fetch(`${ENDPOINT}/${encodeURIComponent(model)}:generateContent`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": key },
        body,
        signal: AbortSignal.timeout(ATTEMPT_TIMEOUT_MS),
      });
      const data = (await res.json()) as GeminiResponse;
      if (!res.ok) {
        if (res.status === 429 || res.status === 503) coolingUntil.set(model, Date.now() + COOLDOWN_MS);
        console.warn(`[chat] Gemini ${model} HTTP ${res.status}: ${data.error?.message?.slice(0, 120) ?? ""}`);
        continue;
      }
      const text = (data.candidates?.[0]?.content?.parts ?? [])
        .filter((p) => !p.thought && p.text)
        .map((p) => p.text)
        .join("")
        .trim();
      if (text) return toPlainText(text);
      console.warn(`[chat] Gemini ${model} returned no text (${data.candidates?.[0]?.finishReason ?? "unknown"})`);
    } catch (error) {
      // Timeouts and network errors: rest this model too.
      coolingUntil.set(model, Date.now() + COOLDOWN_MS);
      console.warn(`[chat] Gemini ${model} failed:`, error instanceof Error ? error.message : error);
    }
  }
  return null;
}

/** The chat window shows plain text: drop markdown emphasis/headings the model may add. */
function toPlainText(text: string) {
  return text
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/__(.+?)__/g, "$1")
    .replace(/(^|\s)\*(?!\s)([^*\n]+?)\*(?=\s|[.,!?]|$)/g, "$1$2")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^\s*\*\s+/gm, "- ")
    .trim();
}
