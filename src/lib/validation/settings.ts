import { z } from "zod";

import { FONT_OPTIONS } from "@/lib/theme/tokens";

/** Optional free-text field: empty string or a short string. */
function optStr(max: number) {
  return z.union([z.string().max(max), z.literal("")]).optional();
}

const hexColor = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/, "Use a 6-digit hex colour like #FF4B00");

// ---------------------------------------------------------------------------
// Global settings (PRD 5.10)
// ---------------------------------------------------------------------------

export const generalSettingsSchema = z.object({
  businessName: optStr(160),
  tagline: optStr(240),
  address: optStr(300),
  phone: optStr(40),
  whatsapp: optStr(40),
  email: z.union([z.email("Enter a valid email"), z.literal("")]).optional(),
  openingHours: optStr(300),
  mapEmbed: optStr(4000),
  instagram: optStr(500),
  facebook: optStr(500),
  tiktok: optStr(500),
  youtube: optStr(500),
  logoLightId: optStr(120),
  logoDarkId: optStr(120),
  faviconId: optStr(120),
  announcementEnabled: z.boolean(),
  announcementText: optStr(300),
  announcementHref: optStr(500),
  announcementStartsAt: z
    .union([z.string().regex(/^\d{4}-\d{2}-\d{2}$/), z.literal("")])
    .optional(),
  announcementEndsAt: z
    .union([z.string().regex(/^\d{4}-\d{2}-\d{2}$/), z.literal("")])
    .optional(),
  maintenanceMode: z.boolean(),
});

export const seoSettingsSchema = z.object({
  defaultTitle: optStr(200),
  defaultDescription: optStr(400),
  ogImageId: optStr(120),
  robots: optStr(100),
  googleAnalyticsId: optStr(100),
  metaPixelId: optStr(100),
});

export const emailSettingsSchema = z.object({
  smtpHost: optStr(200),
  smtpPort: z.coerce.number().int().min(1).max(65535).default(587),
  smtpUser: optStr(200),
  smtpPassword: optStr(200),
  notifyTo: optStr(300),
});

export const scriptsSettingsSchema = z.object({
  headScripts: optStr(16000),
  bodyScripts: optStr(16000),
});

// ---------------------------------------------------------------------------
// Theme settings (PRD 5.9)
// ---------------------------------------------------------------------------

export const themeSettingsSchema = z.object({
  accent: hexColor,
  navy: hexColor,
  ink: hexColor,
  footer: hexColor,
  background: hexColor,
  foreground: hexColor,
  muted: hexColor,
  headingFont: z.enum(FONT_OPTIONS),
  bodyFont: z.enum(FONT_OPTIONS),
  serifFont: z.enum(FONT_OPTIONS),
  radius: optStr(20),
});

// ---------------------------------------------------------------------------
// Menu manager (PRD 5.8) — one-level nesting, validated as a whole
// ---------------------------------------------------------------------------

export const menuLinkSchema = z.object({
  /** Client-side key used to wire parents before ids exist on the server. */
  key: z.string().min(1).max(40),
  label: z.string().min(1, "Every link needs a label").max(80),
  linkType: z.enum(["PAGE", "URL"]),
  pageId: z.string().min(1).nullable().optional(),
  url: z.string().max(500).nullable().optional(),
  newTab: z.boolean(),
  parentKey: z.string().min(1).nullable().optional(),
});

export const saveMenusSchema = z.object({
  header: z.array(menuLinkSchema).max(60),
  footer: z.array(menuLinkSchema).max(60),
});

export type SaveMenusInput = z.infer<typeof saveMenusSchema>;
export type MenuLinkInput = z.infer<typeof menuLinkSchema>;

// ---------------------------------------------------------------------------
// Redirects (PRD 5.10)
// ---------------------------------------------------------------------------

const pathOrUrl = z
  .string()
  .min(1, "Enter a destination")
  .max(500)
  .regex(/^(\/|https?:\/\/)/, "Must start with / or http(s)://")
  .refine((value) => !value.toLowerCase().includes("javascript:"), {
    message: "That destination is not allowed.",
  });

export const redirectSchema = z.object({
  fromPath: z
    .string()
    .min(1, "Enter the old path")
    .max(300)
    .regex(/^\//, "Must start with /")
    .refine((value) => !value.startsWith("/admin"), {
      message: "Admin paths cannot be redirected.",
    }),
  toPath: pathOrUrl,
  code: z.enum(["301", "302", "307", "308"]),
});

export const updateRedirectSchema = redirectSchema.extend({
  id: z.string().min(1),
});

export type GeneralSettingsInput = z.infer<typeof generalSettingsSchema>;
export type ThemeSettingsInput = z.infer<typeof themeSettingsSchema>;
export type RedirectInput = z.infer<typeof redirectSchema>;
