"use client";

import { useEffect, useState } from "react";

import { Alert, Field } from "@/components/ui/field";
import { ActionForm } from "@/components/ui/action-form";
import { inputClass } from "@/components/ui/styles";
import { SubmitButton } from "@/components/ui/submit-button";
import { saveThemeAction } from "@/server/actions/settings";
import { FONT_OPTIONS, themeVarNames } from "@/lib/theme/tokens";

const RADIUS_OPTIONS = ["0", "0.25rem", "0.5rem", "1rem"];

const FONT_CSS_VAR: Record<string, string> = {
  Montserrat: "var(--font-heading)",
  Inter: "var(--font-body)",
  "Playfair Display": "var(--font-serif)",
};

/**
 * Theme settings with a live preview: dragging a colour updates the CSS
 * variables on <html> immediately, so the preview and admin chrome react before
 * anything is saved. Saving persists the values to the settings table.
 */
export function ThemeForm({ theme }: { theme: Record<string, string> }) {
  const [values, setValues] = useState<Record<string, string>>({ ...theme });

  useEffect(() => {
    const root = document.documentElement;
    for (const [key, cssVar] of Object.entries(themeVarNames)) {
      const value = values[key] ?? "";
      const resolved =
        key.endsWith("Font") && FONT_CSS_VAR[value]
          ? FONT_CSS_VAR[value]
          : value;
      root.style.setProperty(cssVar, resolved);
    }
    return () => {
      for (const cssVar of Object.values(themeVarNames)) {
        root.style.removeProperty(cssVar);
      }
    };
  }, [values]);

  const set = (key: string, value: string) =>
    setValues((previous) => ({ ...previous, [key]: value }));

  const colors: Array<[keyof typeof themeVarNames, string]> = [
    ["accent", "Brand accent (buttons, highlights)"],
    ["navy", "Navy / dark panels"],
    ["ink", "Ink (header background)"],
    ["footer", "Footer background"],
    ["background", "Page background"],
    ["foreground", "Default text"],
    ["muted", "Muted text"],
  ];

  const radiusOptions = RADIUS_OPTIONS.includes(values.radius ?? "")
    ? RADIUS_OPTIONS
    : [values.radius as string, ...RADIUS_OPTIONS];

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <ActionForm action={saveThemeAction} className="space-y-6">
        {(state) => (
          <>
            {state.error ? <Alert variant="error">{state.error}</Alert> : null}
            {state.message ? (
              <Alert variant="success">{state.message}</Alert>
            ) : null}

            <section className="rounded-brand border border-black/10 bg-white p-6 shadow-sm">
              <h2 className="font-heading text-lg font-bold text-ink">
                Colours
              </h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {colors.map(([key, label]) => (
                  <Field key={key} label={label} htmlFor={`theme-${key}`}>
                    <div className="flex items-center gap-3">
                      <input
                        id={`theme-${key}`}
                        name={key}
                        type="color"
                        value={values[key]}
                        onChange={(event) => set(key, event.target.value)}
                        className="h-11 w-14 cursor-pointer rounded-brand border border-black/15 bg-white p-1"
                        aria-label={`${label} colour`}
                      />
                      <input
                        name={`${key}-preview`}
                        type="text"
                        value={values[key]}
                        onChange={(event) => set(key, event.target.value)}
                        className={`${inputClass} font-mono text-xs`}
                        aria-label={`${label} hex value`}
                      />
                    </div>
                  </Field>
                ))}
              </div>
            </section>

            <section className="rounded-brand border border-black/10 bg-white p-6 shadow-sm">
              <h2 className="font-heading text-lg font-bold text-ink">
                Typography & shape
              </h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {(
                  [
                    ["headingFont", "Display / heading font"],
                    ["bodyFont", "Body font"],
                    ["serifFont", "Serif accent font"],
                  ] as const
                ).map(([key, label]) => (
                  <Field key={key} label={label} htmlFor={`theme-${key}`}>
                    <select
                      id={`theme-${key}`}
                      name={key}
                      value={values[key]}
                      onChange={(event) => set(key, event.target.value)}
                      className={inputClass}
                    >
                      {FONT_OPTIONS.map((font) => (
                        <option key={font} value={font}>
                          {font}
                        </option>
                      ))}
                    </select>
                  </Field>
                ))}
                <Field label="Corner radius" htmlFor="theme-radius">
                  <select
                    id="theme-radius"
                    name="radius"
                    value={values.radius}
                    onChange={(event) => set("radius", event.target.value)}
                    className={inputClass}
                  >
                    {radiusOptions.map((value) => (
                      <option key={value} value={value}>
                        {value === "0" ? "Sharp (0)" : value}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
            </section>

            <SubmitButton pendingLabel="Saving…">Save theme</SubmitButton>
          </>
        )}
      </ActionForm>

      <aside className="rounded-brand border border-black/10 bg-white p-6 shadow-sm">
        <h2 className="font-heading text-lg font-bold text-ink">
          Live preview
        </h2>
        <div
          className="mt-4 rounded-brand border border-black/10 p-6"
          style={{ background: values.background, color: values.foreground }}
        >
          <p className="eyebrow">Eyebrow /</p>
          <h3 className="heading-display mt-2 text-2xl">Headline display</h3>
          <p className="mt-2 font-serif text-base opacity-80">
            “A serif quote in Playfair.”
          </p>
          <p className="mt-2 text-sm" style={{ color: values.muted }}>
            Body copy uses the body font at 14px with muted text.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <button type="button" className="btn btn-accent" tabIndex={-1}>
              Primary button
            </button>
            <button type="button" className="btn btn-outline" tabIndex={-1}>
              Outline
            </button>
          </div>
          <div className="mt-4 grid grid-cols-4 gap-2">
            {colors.map(([key, label]) => (
              <div
                key={key}
                title={label}
                className="aspect-square rounded-full border border-black/10"
                style={{ background: values[key] }}
              />
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
}
