"use client";

import { useActionState, useEffect, useId, useRef, useState } from "react";

import { Alert, Field } from "@/components/ui/field";
import { inputClass } from "@/components/ui/styles";
import { SubmitButton } from "@/components/ui/submit-button";
import { createLeadAction } from "@/server/actions/leads";
import { initialActionState } from "@/server/actions/types";

declare global {
  interface Window {
    turnstile?: {
      render: (
        element: HTMLElement,
        options: Record<string, unknown>,
      ) => string | undefined;
    };
  }
}

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";

const GOAL_OPTIONS = [
  "Personal training",
  "Boxing & conditioning",
  "Yoga & mobility",
  "Group training",
  "Nutrition coaching",
  "Not sure yet",
];

/** Loads the Turnstile script once and renders a widget into a ref'd div. */
function TurnstileWidget() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !TURNSTILE_SITE_KEY || !ref.current)
      return;
    const container = ref.current;
    // Already rendered (e.g. StrictMode double-mount). Leave it alone.
    if (container.querySelector(".cf-turnstile")) return;

    const render = () => {
      if (window.turnstile) {
        window.turnstile.render(container, { sitekey: TURNSTILE_SITE_KEY });
      }
    };

    if (window.turnstile) {
      render();
      return;
    }

    const existing = document.querySelector<HTMLScriptElement>(
      "script[data-turnstile]",
    );
    if (existing?.dataset.loaded === "true") {
      render();
      return;
    }
    const script =
      existing ??
      (() => {
        const element = document.createElement("script");
        element.src =
          "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
        element.async = true;
        element.defer = true;
        element.dataset.turnstile = "true";
        document.head.appendChild(element);
        return element;
      })();
    const onLoad = () => {
      script.dataset.loaded = "true";
      render();
    };
    script.addEventListener("load", onLoad);
    return () => script.removeEventListener("load", onLoad);
  }, []);

  if (!TURNSTILE_SITE_KEY) return null;
  return <div ref={ref} className="cf-turnstile" />;
}

/**
 * Public contact / consultation form (PRD 5.7). Saves to the Leads inbox via a
 * server action, with a honeypot and optional Cloudflare Turnstile.
 */
export function LeadForm({
  submitLabel = "Send message",
}: {
  submitLabel?: string;
}) {
  const [state, formAction, pending] = useActionState(
    createLeadAction,
    initialActionState,
  );
  const baseId = useId();
  const [sourcePage] = useState(() =>
    typeof window === "undefined" ? "" : window.location.pathname,
  );

  if (state.ok) {
    return (
      <div className="card relative overflow-hidden p-7">
        <span
          aria-hidden="true"
          className="absolute inset-y-0 left-0 w-1 bg-accent"
        />
        <p className="heading-display text-lg text-ink">Request received</p>
        <p className="mt-2 text-sm text-muted">{state.message}</p>
      </div>
    );
  }

  return (
    <form
      action={formAction}
      noValidate
      className="card p-6 sm:p-7"
    >
      {state.error ? (
        <div className="mb-4">
          <Alert variant="error">{state.error}</Alert>
        </div>
      ) : null}

      <input type="hidden" name="sourcePage" value={sourcePage} />
      {/* Honeypot — hidden from humans and assistive tech. */}
      <div aria-hidden="true" className="absolute h-0 w-0 overflow-hidden">
        <label htmlFor={`${baseId}-company`}>Company</label>
        <input
          id={`${baseId}-company`}
          name="company"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Your name"
          htmlFor={`${baseId}-name`}
          error={state.fieldErrors?.name?.[0]}
        >
          <input
            id={`${baseId}-name`}
            name="name"
            className={inputClass}
            autoComplete="name"
            required
          />
        </Field>
        <Field
          label="Phone"
          htmlFor={`${baseId}-phone`}
          error={state.fieldErrors?.phone?.[0]}
        >
          <input
            id={`${baseId}-phone`}
            name="phone"
            type="tel"
            className={inputClass}
            autoComplete="tel"
            placeholder="+92 300 1234567"
            required
          />
        </Field>
        <Field
          label="Email (optional)"
          htmlFor={`${baseId}-email`}
          error={state.fieldErrors?.email?.[0]}
        >
          <input
            id={`${baseId}-email`}
            name="email"
            type="email"
            className={inputClass}
            autoComplete="email"
          />
        </Field>
        <Field label="I'm interested in" htmlFor={`${baseId}-goal`}>
          <select id={`${baseId}-goal`} name="goal" className={inputClass}>
            <option value="">Choose a program…</option>
            {GOAL_OPTIONS.map((goal) => (
              <option key={goal} value={goal}>
                {goal}
              </option>
            ))}
          </select>
        </Field>
        <Field
          label="Message (optional)"
          htmlFor={`${baseId}-message`}
          className="sm:col-span-2"
          error={state.fieldErrors?.message?.[0]}
        >
          <textarea
            id={`${baseId}-message`}
            name="message"
            rows={4}
            className={inputClass}
            placeholder="Tell us about your goals or preferred times."
          />
        </Field>
      </div>

      <div className="mt-5 flex flex-col gap-3">
        <TurnstileWidget />
        <SubmitButton pendingLabel="Sending…">
          {pending ? "Sending…" : submitLabel}
        </SubmitButton>
      </div>
    </form>
  );
}
