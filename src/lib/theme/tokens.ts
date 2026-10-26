/**
 * Design tokens for the FITX site.
 *
 * These are the *defaults*. The admin Theme Settings page stores overrides in
 * the `settings` table (`group = "theme"`); at render time we turn those into
 * CSS custom properties on `<html>` so every Tailwind utility reacts to them.
 *
 * Defaults are taken from the reference design (PRD section 16.1) and are
 * approximate until the client supplies brand files.
 */
/**
 * Curated Google font families self-hosted via next/font at build time. The
 * admin can swap which family each role uses among these; adding a new family
 * requires a code change (documented assumption).
 */
export const FONT_OPTIONS = [
  "Montserrat",
  "Inter",
  "Playfair Display",
] as const;
export type FontOption = (typeof FONT_OPTIONS)[number];

export const defaultTheme = {
  /** Primary call-to-action / eyebrow accent. */
  accent: "#FF4B00",
  /** Navy caption bars and dark panels. */
  navy: "#1E2330",
  /** Near-black used for the footer and body copy on light sections. */
  ink: "#0D0A10",
  /** Footer background. */
  footer: "#0D0A10",
  /** Page background. */
  background: "#FFFFFF",
  /** Default text colour. */
  foreground: "#171717",
  /** Muted body text ("body grey"). */
  muted: "#5B5F6B",

  /** Curated Google font families (self-hosted via next/font where possible). */
  headingFont: "Montserrat",
  bodyFont: "Inter",
  serifFont: "Playfair Display",

  /** Corner radius used by buttons and cards. */
  radius: "0.5rem",
} as const;

export type ThemeTokens = {
  [K in keyof typeof defaultTheme]: string;
};

/** CSS custom property names used to expose theme values to Tailwind. */
export const themeVarNames = {
  accent: "--brand-accent",
  navy: "--brand-navy",
  ink: "--brand-ink",
  footer: "--brand-footer",
  background: "--brand-background",
  foreground: "--brand-foreground",
  muted: "--brand-muted",
  headingFont: "--brand-font-heading",
  bodyFont: "--brand-font-body",
  serifFont: "--brand-font-serif",
  radius: "--brand-radius",
} as const satisfies Record<keyof ThemeTokens, string>;

/**
 * Map from curated font family names (what the admin stores) to the next/font
 * CSS variables actually registered on <html>. Bare family names are not
 * available at runtime because next/font self-hosts under hashed ids.
 */
const FONT_CSS_VAR: Record<string, string> = {
  Montserrat: "var(--font-heading)",
  Inter: "var(--font-body)",
  "Playfair Display": "var(--font-serif)",
};

/**
 * Serialise a theme into a CSS `:root { ... }` rule. Used by the root layout to
 * inject DB-driven theme settings. Values are sanitised to avoid breaking out
 * of the declaration.
 */
export function themeToCss(theme: Partial<ThemeTokens>): string {
  const merged = { ...defaultTheme, ...theme } as ThemeTokens;
  const declarations = Object.entries(themeVarNames)
    .map(([key, cssVar]) => {
      const raw = merged[key as keyof ThemeTokens] ?? "";
      const isFontKey = key.endsWith("Font");
      let value = String(raw)
        .replace(/[;{}<>"]/g, "")
        .trim();
      if (isFontKey && FONT_CSS_VAR[value]) value = FONT_CSS_VAR[value];
      return `${cssVar}:${value};`;
    })
    .join("");

  return `:root{${declarations}}`;
}
