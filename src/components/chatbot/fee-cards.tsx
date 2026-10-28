import Link from "next/link";

import { fees, formatRs, studio, tracking } from "@/lib/fitx/knowledge";
import { whatsappHref } from "@/components/site/whatsapp-button";

/**
 * Structured fee answer shown in the chat under the assistant's intro. Every
 * price comes from the knowledge base, never from the AI's text.
 */
export function FeeCards() {
  const whatsapp = whatsappHref(studio.whatsapp);
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <p className="font-[family-name:var(--font-mono)] text-[10px] tracking-[0.2em] text-accent uppercase">
        FITX personal training
      </p>
      <p className="mt-1.5 text-lg leading-tight font-semibold text-white">Choose your program</p>
      <p className="mt-1 text-xs leading-relaxed text-white/55">
        Structured coaching. Measurable progress. Professional tracking.
      </p>

      <ul className="mt-4 space-y-3">
        {fees.map((fee) => {
          const saving = fee.monthly * 3 - fee.quarterly;
          return (
            <li
              key={fee.name}
              className={`rounded-xl border p-3.5 ${
                fee.highlighted ? "border-accent bg-accent/[0.06]" : "border-white/12 bg-black/20"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-semibold text-white">{fee.name}</p>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] ${
                    fee.highlighted ? "bg-accent/15 text-accent" : "bg-white/10 text-white/70"
                  }`}
                >
                  {fee.badge}
                </span>
              </div>
              <p className="mt-2 text-white">
                <span className="text-2xl font-semibold tracking-tight">{formatRs(fee.monthly)}</span>
                <span className="ml-1 text-xs text-white/55">/ month</span>
              </p>
              <div className="mt-3 border-t border-white/10 pt-2.5">
                <p className="flex items-baseline justify-between gap-2 text-xs text-white/75">
                  3-month package
                  <span className="text-sm font-semibold text-white">{formatRs(fee.quarterly)}</span>
                </p>
                {saving > 0 ? (
                  <p className="mt-1 text-[11px] text-white/50">
                    Save {formatRs(saving)} over three monthly payments.
                  </p>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>

      <div className="mt-3 flex gap-2.5 rounded-xl border border-white/10 bg-black/20 p-3">
        <svg className="mt-0.5 h-4 w-4 shrink-0 text-accent" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 17l5-5 4 4 8-8M15 8h5v5" />
        </svg>
        <div>
          <p className="text-xs font-semibold text-white">Body-composition tracking</p>
          <p className="mt-0.5 text-[11px] leading-relaxed text-white/55">
            {tracking.metrics.slice(0, 3).join(", ")} and more in a phone app, reviewed weekly or about every 10 days.
          </p>
        </div>
      </div>

      <div className="mt-3 flex gap-2">
        <Link
          href="/contact"
          className="flex-1 rounded-full bg-accent px-3 py-2 text-center font-[family-name:var(--font-mono)] text-[10px] tracking-[0.12em] text-white uppercase transition hover:brightness-110"
        >
          Book a consultation
        </Link>
        {whatsapp ? (
          <a
            href={whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full border border-[#25d366]/60 px-3 py-2 font-[family-name:var(--font-mono)] text-[10px] tracking-[0.12em] text-[#25d366] uppercase transition hover:bg-[#25d366]/10"
          >
            WhatsApp
          </a>
        ) : null}
      </div>
    </div>
  );
}
