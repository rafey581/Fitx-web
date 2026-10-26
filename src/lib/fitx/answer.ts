import { faqs, studio, type Faq } from "./knowledge";

/**
 * Offline answer engine for the chatbot: matches a visitor's message against
 * the approved FAQ answers. It never composes new facts, so it is the safe
 * default when no AI model is configured (and the fallback if one fails).
 */

/** Specific answers make their general "parent" redundant. */
const PARENT: Record<string, string> = {
  "group-fee": "fees",
  "one-to-one-fee": "fees",
  discount: "fees",
  female: "timings",
  male: "timings",
  family: "timings",
  report: "tracking",
  app: "tracking",
  frequency: "tracking",
  included: "tracking",
  contact: "location",
};

const GREETING = /^(hi+|hello|hey|salam|salaam|assalam|aoa|asalam|as-salam|good (morning|evening|afternoon))\b/;
const THANKS = /\b(thanks|thank you|thx|shukriya|shukria|jazakallah)\b/;

function normalise(text: string) {
  return ` ${text.toLowerCase().replace(/[^a-z0-9:+\- ]+/g, " ").replace(/\s+/g, " ").trim()} `;
}

function score(faq: Faq, text: string) {
  let total = 0;
  for (const keyword of faq.keywords) {
    if (text.includes(` ${keyword} `)) total += keyword.includes(" ") ? 2 : 1;
  }
  return total;
}

export const fallbackAnswer = `I don't have that detail yet — the FITX team can help. Call ${studio.phones.join(" or ")}, or send a message from the Contact page.`;

export function localAnswer(message: string): string {
  const text = normalise(message);
  if (text.trim().length === 0) return fallbackAnswer;

  const ranked = faqs
    .map((faq) => ({ faq, score: score(faq, text) }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score);

  if (ranked.length === 0) {
    if (GREETING.test(text.trim())) {
      return "Hi! I can help with FITX fees, timings, Family Hour, progress tracking and how to join. What would you like to know?";
    }
    if (THANKS.test(text)) return "You're welcome! Anything else about FITX I can help with?";
    return fallbackAnswer;
  }

  // Keep the best match, plus the next one when it is about a different topic
  // (e.g. "female fees" → fees + female timings), skipping redundant parents.
  const picked: Faq[] = [ranked[0].faq];
  for (const r of ranked.slice(1)) {
    if (picked.length === 2 || r.score < ranked[0].score) break;
    const clash = picked.some(
      (p) => PARENT[p.id] === r.faq.id || PARENT[r.faq.id] === p.id || PARENT[p.id] === PARENT[r.faq.id] && PARENT[p.id] !== undefined,
    );
    if (!clash) picked.push(r.faq);
  }
  // A specific answer beats its own parent even when the parent scored higher.
  const best = picked.map((p) => {
    const child = ranked.find((r) => PARENT[r.faq.id] === p.id && r.score >= ranked[0].score - 1 && r.score > 0);
    return child && !picked.includes(child.faq) ? child.faq : p;
  });

  return [...new Set(best)].map((f) => f.answer).join("\n\n");
}
