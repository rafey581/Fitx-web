"use server";

import { revalidatePath } from "next/cache";

import { recordAudit } from "@/lib/audit";
import { assertPermission } from "@/lib/auth/server";
import { prisma } from "@/lib/db";
import { defaultTheme } from "@/lib/theme/tokens";
import { toFieldErrors } from "@/lib/validation/errors";
import {
  emailSettingsSchema,
  generalSettingsSchema,
  scriptsSettingsSchema,
  seoSettingsSchema,
  themeSettingsSchema,
} from "@/lib/validation/settings";
import type { ActionState } from "./types";

/** Upsert a settings row and flush public caches. */
async function saveSetting(params: {
  key: string;
  group: string;
  value: unknown;
  revalidatePaths?: string[];
}) {
  await prisma.setting.upsert({
    where: { key: params.key },
    update: { value: params.value as never },
    create: {
      key: params.key,
      group: params.group,
      value: params.value as never,
    },
  });
  // Public header/footer/root layout read these settings.
  revalidatePath("/", "layout");
  for (const path of params.revalidatePaths ?? []) {
    revalidatePath(path);
  }
}

const asString = (formData: FormData, name: string): string =>
  String(formData.get(name) ?? "").trim();
const asBool = (formData: FormData, name: string): boolean =>
  formData.get(name) === "on";

// ---------------------------------------------------------------------------
// General (business info, announcement bar, maintenance, logos)
// ---------------------------------------------------------------------------

export async function saveGeneralAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await assertPermission("settings:write");

  const parsed = generalSettingsSchema.safeParse({
    businessName: asString(formData, "businessName"),
    tagline: asString(formData, "tagline"),
    address: asString(formData, "address"),
    phone: asString(formData, "phone"),
    whatsapp: asString(formData, "whatsapp"),
    email: asString(formData, "email"),
    openingHours: asString(formData, "openingHours"),
    mapEmbed: asString(formData, "mapEmbed"),
    instagram: asString(formData, "instagram"),
    facebook: asString(formData, "facebook"),
    tiktok: asString(formData, "tiktok"),
    youtube: asString(formData, "youtube"),
    logoLightId: asString(formData, "logoLightId"),
    logoDarkId: asString(formData, "logoDarkId"),
    faviconId: asString(formData, "faviconId"),
    announcementEnabled: asBool(formData, "announcementEnabled"),
    announcementText: asString(formData, "announcementText"),
    announcementHref: asString(formData, "announcementHref"),
    announcementStartsAt: asString(formData, "announcementStartsAt"),
    announcementEndsAt: asString(formData, "announcementEndsAt"),
    maintenanceMode: asBool(formData, "maintenanceMode"),
  });
  if (!parsed.success) {
    return {
      ok: false,
      error: "Please fix the highlighted fields.",
      fieldErrors: toFieldErrors(parsed.error),
    };
  }

  // Normalise dates for storage: keep "YYYY-MM-DD", blank -> null.
  const value = {
    ...parsed.data,
    announcementStartsAt: parsed.data.announcementStartsAt || null,
    announcementEndsAt: parsed.data.announcementEndsAt || null,
  };

  await saveSetting({
    key: "general",
    group: "general",
    value,
    revalidatePaths: ["/admin/settings"],
  });
  await recordAudit({
    userId: actor.id,
    action: "settings.general.updated",
    entity: "settings",
    entityId: "general",
  });
  return {
    ok: true,
    message:
      "General settings saved. The public site now reflects your change.",
  };
}

// ---------------------------------------------------------------------------
// SEO defaults
// ---------------------------------------------------------------------------

export async function saveSeoAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await assertPermission("settings:write");

  const parsed = seoSettingsSchema.safeParse({
    defaultTitle: asString(formData, "defaultTitle"),
    defaultDescription: asString(formData, "defaultDescription"),
    ogImageId: asString(formData, "ogImageId"),
    robots: asString(formData, "robots"),
    googleAnalyticsId: asString(formData, "googleAnalyticsId"),
    metaPixelId: asString(formData, "metaPixelId"),
  });
  if (!parsed.success) {
    return {
      ok: false,
      error: "Please fix the highlighted fields.",
      fieldErrors: toFieldErrors(parsed.error),
    };
  }

  await saveSetting({ key: "seo", group: "seo", value: parsed.data });
  await recordAudit({
    userId: actor.id,
    action: "settings.seo.updated",
    entity: "settings",
    entityId: "seo",
  });
  return { ok: true, message: "SEO defaults saved." };
}

// ---------------------------------------------------------------------------
// Email (used by lead notifications — PRD 5.10; wired in Phase 4)
// ---------------------------------------------------------------------------

export async function saveEmailAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await assertPermission("settings:write");

  const parsed = emailSettingsSchema.safeParse({
    smtpHost: asString(formData, "smtpHost"),
    smtpPort: String(formData.get("smtpPort") ?? "587"),
    smtpUser: asString(formData, "smtpUser"),
    smtpPassword: asString(formData, "smtpPassword"),
    notifyTo: asString(formData, "notifyTo"),
  });
  if (!parsed.success) {
    return {
      ok: false,
      error: "Please fix the highlighted fields.",
      fieldErrors: toFieldErrors(parsed.error),
    };
  }

  await saveSetting({ key: "email", group: "email", value: parsed.data });
  await recordAudit({
    userId: actor.id,
    action: "settings.email.updated",
    entity: "settings",
    entityId: "email",
  });
  return { ok: true, message: "Email settings saved." };
}

// ---------------------------------------------------------------------------
// Custom scripts — Owner only (PRD 5.10)
// ---------------------------------------------------------------------------

export async function saveScriptsAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await assertPermission("scripts:write");

  const parsed = scriptsSettingsSchema.safeParse({
    headScripts: asString(formData, "headScripts"),
    bodyScripts: asString(formData, "bodyScripts"),
  });
  if (!parsed.success) {
    return {
      ok: false,
      error: "Please fix the highlighted fields.",
      fieldErrors: toFieldErrors(parsed.error),
    };
  }

  await saveSetting({ key: "scripts", group: "scripts", value: parsed.data });
  await recordAudit({
    userId: actor.id,
    action: "settings.scripts.updated",
    entity: "settings",
    entityId: "scripts",
  });
  return { ok: true, message: "Custom scripts saved." };
}

// ---------------------------------------------------------------------------
// Theme
// ---------------------------------------------------------------------------

export async function saveThemeAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await assertPermission("theme:write");

  const parsed = themeSettingsSchema.safeParse({
    accent: asString(formData, "accent"),
    navy: asString(formData, "navy"),
    ink: asString(formData, "ink"),
    footer: asString(formData, "footer"),
    background: asString(formData, "background"),
    foreground: asString(formData, "foreground"),
    muted: asString(formData, "muted"),
    headingFont: asString(formData, "headingFont"),
    bodyFont: asString(formData, "bodyFont"),
    serifFont: asString(formData, "serifFont"),
    radius: asString(formData, "radius") || defaultTheme.radius,
  });
  if (!parsed.success) {
    return {
      ok: false,
      error: "Please fix the highlighted fields.",
      fieldErrors: toFieldErrors(parsed.error),
    };
  }

  await saveSetting({
    key: "theme",
    group: "theme",
    value: parsed.data,
    revalidatePaths: ["/admin/theme"],
  });
  await recordAudit({
    userId: actor.id,
    action: "settings.theme.updated",
    entity: "settings",
    entityId: "theme",
  });
  return {
    ok: true,
    message: "Theme saved. Brand colours now apply across the site.",
  };
}
