import { faqs, studio, type Faq } from "./knowledge";

/**
 * Offline answer engine for the chatbot: matches a visitor's message against
 * the approved FAQ answers. It never composes new facts, so it is the safe
 * fallback when no AI model is configured or reachable.
 *
 * Built for how people actually type in a chat box: single words ("fees?"),
 * typos ("timmings", "adress"), Roman Urdu, and follow-ups that only make
 * sense with the previous question ("and for ladies?").
 */

/** Specific answers make their general "parent" redundant. */
const PARENT: Record<string, string> = {
  "group-fee": "fees",
  "one-to-one-fee": "fees",
  discount: "fees",
  female: "timings",
  male: "timings",
  family: "timings",
  "open-close": "timings",
  report: "tracking",
  app: "tracking",
  frequency: "tracking",
  included: "tracking",
  contact: "location",
};

const GREETING = /^(hi+|hii+|hello|helo|hey|salam|salaam|assalam|assalamualaikum|aoa|asalam|as-salam|good (morning|evening|afternoon)|yo)\b/;
const THANKS = /\b(thanks|thank you|thx|thnx|shukriya|shukria|jazakallah|ok thanks)\b/;
const ACK = /^(ok|okay|k|acha|achha|theek|thik|great|nice|cool|fine|sure|hmm+)\W*$/;

function normalise(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9:+\- ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Levenshtein distance, capped for speed (returns max+1 when exceeded). */
function distance(a: string, b: string, max: number) {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const row = [i];
    let best = i;
    for (let j = 1; j <= b.length; j++) {
      const v = Math.min(prev[j] + 1, row[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      row.push(v);
      best = Math.min(best, v);
    }
    if (best > max) return max + 1;
    prev = row;
  }
  return prev[b.length];
}

/** True when `a` is `b` with two neighbouring letters swapped ("fess"/"fees"). */
function swapped(a: string, b: string) {
  if (a.length !== b.length || a.length < 4) return false;
  const diff = [...a].flatMap((ch, i) => (ch === b[i] ? [] : [i]));
  return diff.length === 2 && diff[1] === diff[0] + 1 && a[diff[0]] === b[diff[1]] && a[diff[1]] === b[diff[0]];
}

/** Does a typed word match a keyword, allowing plurals, prefixes and typos? */
function wordMatches(word: string, keyword: string) {
  if (word === keyword || swapped(word, keyword)) return true;
  if (keyword.length >= 4 && (word.startsWith(keyword) || (word.length >= 4 && keyword.startsWith(word)))) return true;
  const allowed = keyword.length >= 8 ? 2 : keyword.length >= 5 ? 1 : 0;
  return allowed > 0 && distance(word, keyword, allowed) <= allowed;
}

function score(faq: Faq, text: string, words: string[]) {
  let total = 0;
  for (const keyword of faq.keywords) {
    if (keyword.includes(" ")) {
      if (` ${text} `.includes(` ${keyword} `)) total += 2;
    } else if (words.some((w) => wordMatches(w, keyword))) {
      total += 1;
    }
  }
  return total;
}

export const fallbackAnswer = `I don't have that detail yet — the FITX team can help. Call ${studio.phones.join(" or ")}, or send a message from the Contact page.`;

function rank(text: string) {
  const words = text.split(" ").filter((w) => w.length > 1 || /\d/.test(w));
  return faqs
    .map((faq) => ({ faq, score: score(faq, text, words) }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score);
}

export function localAnswer(message: string, previous?: string): string {
  const text = normalise(message);
  if (!text) return fallbackAnswer;

  let ranked = rank(text);

  if (ranked.length === 0) {
    if (GREETING.test(text)) {
      return "Hi! I can help with FITX fees, timings, Family Hour, progress tracking and how to join. What would you like to know?";
    }
    if (THANKS.test(text)) return "You're welcome! Anything else about FITX I can help with?";
    if (ACK.test(text)) return "Great! Anything else — fees, timings, Family Hour or how to join?";
  }

  // Follow-ups ("and for ladies?", "3 months?") borrow the previous question's topic.
  if (previous) {
    const combined = rank(`${normalise(previous)} ${text}`);
    const own = ranked[0]?.score ?? 0;
    if (combined.length && (own === 0 || combined[0].score > own + 1)) ranked = combined;
  }

  if (ranked.length === 0) return fallbackAnswer;

  // Keep the best match, plus the next one when it is about a different topic
  // (e.g. "female fees" → fees + female timings), skipping redundant parents.
  const picked: Faq[] = [ranked[0].faq];
  for (const r of ranked.slice(1)) {
    if (picked.length === 2 || r.score < ranked[0].score) break;
    const clash = picked.some(
      (p) =>
        PARENT[p.id] === r.faq.id ||
        PARENT[r.faq.id] === p.id ||
        (PARENT[p.id] !== undefined && PARENT[p.id] === PARENT[r.faq.id]),
    );
    if (!clash) picked.push(r.faq);
  }
  // A specific answer beats its own parent even when the parent scored higher.
  const best = picked.map((p) => {
    const child = ranked.find((r) => PARENT[r.faq.id] === p.id && r.score >= ranked[0].score - 1);
    return child && !picked.includes(child.faq) ? child.faq : p;
  });

  return [...new Set(best)].map((f) => f.answer).join("\n\n");
}
