"use client";

import { Fragment, useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";

import { FeeCards } from "@/components/chatbot/fee-cards";
import { asksAboutFees, localAnswer } from "@/lib/fitx/answer";
import { studio, suggestedQuestions } from "@/lib/fitx/knowledge";

type Message = { role: "user" | "assistant"; content: string; cards?: "fees" };

const GREETING: Message = {
  role: "assistant",
  content:
    "Hi! I'm the FITX assistant. Ask me about fees, timings, Family Hour, progress tracking or how to join.",
};

/** Turn phone numbers and "Contact page" mentions into links. */
function linkify(text: string): ReactNode[] {
  const parts = text.split(/(0\d{3}-\d{7}|Contact page)/g);
  return parts.map((part, i) => {
    if (/^0\d{3}-\d{7}$/.test(part)) {
      return (
        <a key={i} href={`tel:+92${part.slice(1).replace("-", "")}`} className="text-accent underline underline-offset-2">
          {part}
        </a>
      );
    }
    if (part === "Contact page") {
      return (
        <Link key={i} href="/contact" className="text-accent underline underline-offset-2">
          {part}
        </Link>
      );
    }
    return <Fragment key={i}>{part}</Fragment>;
  });
}

export function AIChatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([GREETING]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    // A fee answer is tall: show it from its start instead of jumping past the cards.
    const last = [...list.querySelectorAll<HTMLElement>("[data-message]")].at(-1);
    const top = !busy && messages.at(-1)?.cards && last ? last.offsetTop - 12 : list.scrollHeight;
    list.scrollTo({ top, behavior: "smooth" });
  }, [messages, busy]);

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  async function send(text: string) {
    const question = text.trim();
    if (!question || busy) return;
    const next: Message[] = [...messages, { role: "user", content: question }];
    setMessages(next);
    setInput("");
    setBusy(true);
    const previous = messages.filter((m) => m.role === "user").at(-1)?.content;
    // Offline or server unreachable: answer from the approved answers.
    const fallback = (): Message => {
      const cards = asksAboutFees(question, previous);
      return {
        role: "assistant",
        content: localAnswer(question, previous, { feeCards: cards }),
        cards: cards ? "fees" : undefined,
      };
    };
    let reply: Message;
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // The greeting is UI chrome, not part of the conversation.
        // Only text goes back to the server; cards are display-only.
        body: JSON.stringify({ messages: next.slice(1).map(({ role, content }) => ({ role, content })) }),
      });
      const data = (await res.json()) as { reply?: string; cards?: "fees" };
      reply = data.reply ? { role: "assistant", content: data.reply, cards: data.cards } : fallback();
    } catch {
      reply = fallback();
    }
    setMessages((m) => [...m, reply]);
    setBusy(false);
  }

  const showSuggestions = messages.length <= 2 && !busy;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Close chat" : "Chat with FITX"}
        aria-expanded={open}
        className="fixed right-5 bottom-5 z-50 grid h-14 w-14 place-items-center rounded-full bg-accent text-white shadow-[0_0_40px_-8px_var(--brand-accent)] transition hover:scale-105"
      >
        {open ? (
          <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
          </svg>
        ) : (
          <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h8M8 14h5m-9 6l2.5-3H19a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v9a2 2 0 001 1.7" />
          </svg>
        )}
      </button>

      {open ? (
        <section
          role="dialog"
          aria-label="FITX assistant"
          className="fixed right-3 bottom-24 left-3 z-50 flex max-h-[min(36rem,calc(100svh-8rem))] flex-col overflow-hidden rounded-2xl border border-white/12 bg-[#0b0a0e]/95 text-[#ede9e3] shadow-2xl backdrop-blur-xl sm:left-auto sm:w-[23rem]"
        >
          <header className="flex items-center justify-between border-b border-white/10 px-5 py-4">
            <div>
              <p className="font-[family-name:var(--font-mono)] text-[10px] tracking-[0.2em] text-accent uppercase">
                FITX assistant
              </p>
              <p className="mt-1 text-xs text-white/50">Fees · timings · tracking · joining</p>
            </div>
            <a
              href={`tel:+92${studio.phones[0].slice(1).replace("-", "")}`}
              className="rounded-full border border-white/20 px-3 py-1.5 font-[family-name:var(--font-mono)] text-[10px] tracking-[0.15em] uppercase transition hover:border-accent hover:text-accent"
            >
              Call
            </a>
          </header>

          <div ref={listRef} className="relative flex-1 space-y-3 overflow-y-auto px-4 py-4" aria-live="polite">
            {messages.map((m, i) => (
              <div
                key={i}
                data-message
                className={m.role === "user" ? "flex flex-col items-end" : "flex flex-col items-start gap-2"}
              >
                <p
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-line ${
                    m.role === "user"
                      ? "rounded-br-md bg-accent text-white"
                      : "rounded-bl-md border border-white/10 bg-white/[0.04]"
                  }`}
                >
                  {m.role === "assistant" ? linkify(m.content) : m.content}
                </p>
                {m.cards === "fees" ? (
                  <div className="w-full">
                    <FeeCards />
                  </div>
                ) : null}
              </div>
            ))}
            {busy ? (
              <div className="flex gap-1 px-2 py-2" aria-label="Assistant is typing">
                {[0, 1, 2].map((d) => (
                  <span
                    key={d}
                    className="h-1.5 w-1.5 animate-bounce rounded-full bg-white/50"
                    style={{ animationDelay: `${d * 120}ms` }}
                  />
                ))}
              </div>
            ) : null}
            {showSuggestions ? (
              <div className="flex flex-wrap gap-2 pt-1">
                {suggestedQuestions.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => send(q)}
                    className="rounded-full border border-white/15 px-3 py-1.5 text-xs text-white/75 transition hover:border-accent hover:text-white"
                  >
                    {q}
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              void send(input);
            }}
            className="flex gap-2 border-t border-white/10 p-3"
          >
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              maxLength={600}
              placeholder="Ask about fees, timings…"
              aria-label="Your question"
              className="min-w-0 flex-1 rounded-full border border-white/12 bg-white/[0.04] px-4 py-2.5 text-sm text-[#ede9e3] outline-none placeholder:text-white/35 focus:border-accent"
            />
            <button
              type="submit"
              disabled={busy || !input.trim()}
              className="rounded-full bg-accent px-4 font-[family-name:var(--font-mono)] text-[10px] tracking-[0.15em] text-white uppercase transition disabled:opacity-40"
            >
              Send
            </button>
          </form>
          <p className="px-4 pb-3 text-[10px] leading-snug text-white/35">
            Answers come from FITX&apos;s published information. Body-composition readings are estimates, not medical advice.
          </p>
        </section>
      ) : null}
    </>
  );
}
