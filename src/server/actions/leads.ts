"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { recordAudit } from "@/lib/audit";
import { assertPermission } from "@/lib/auth/server";
import { prisma } from "@/lib/db";
import { sendMail } from "@/lib/email";
import { env } from "@/lib/env";
import {
  leadDeleteSchema,
  leadSchema,
  leadUpdateSchema,
} from "@/lib/validation/modules";
import { toFieldErrors } from "@/lib/validation/errors";

import type { ActionState } from "./types";

/**
 * Contact / consultation lead capture.
 *
 * Spam protection (PRD 5.7) is defense-in-depth:
 *  1. A hidden honeypot field silently swallows naive bots.
 *  2. Cloudflare Turnstile is verified whenever the secret key is configured;
 *     with no keys set (typical local dev) the check is skipped.
 * 3. The admin inbox (statuses, notes, CSV export) is where staff work the
 *    leads; an optional email notification goes out on every new lead.
 */

async function verifyTurnstile(token: string): Promise<boolean> {
  if (!env.TURNSTILE_SECRET_KEY) return true;
  if (!token) return false;
  try {
    const response = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          secret: env.TURNSTILE_SECRET_KEY,
          response: token,
        }),
      },
    );
    const data = (await response.json()) as { success?: boolean };
    return data.success === true;
  } catch (error) {
    console.error("[lead] turnstile verification failed", error);
    return false;
  }
}

async function leadNotifyTo(): Promise<string> {
  const emailRow = await prisma.setting.findUnique({ where: { key: "email" } });
  const stored = (emailRow?.value ?? {}) as { notifyTo?: unknown };
  const fromSettings =
    typeof stored.notifyTo === "string" ? stored.notifyTo.trim() : "";
  return fromSettings || env.LEAD_NOTIFY_TO.trim();
}

/** Best-effort email notification; never blocks the lead being saved. */
async function notifyNewLead(input: {
  name: string;
  phone: string;
  email?: string | null;
  goal?: string | null;
  sourcePage?: string | null;
}): Promise<void> {
  const to = await leadNotifyTo();
  if (!to) return;
  await sendMail({
    to,
    subject: `New lead: ${input.name}`,
    text: [
      `Name: ${input.name}`,
      `Phone: ${input.phone}`,
      `Email: ${input.email || "—"}`,
      `Goal: ${input.goal || "—"}`,
      `Source: ${input.sourcePage || "Website"}`,
      "",
      `Open the inbox: ${env.APP_URL}/admin/leads`,
    ].join("\n"),
  });
}

export async function createLeadAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  // Honeypot: bots fill hidden fields — answer politely and drop the payload.
  const honeypot = String(formData.get("company") ?? "");
  if (honeypot.trim()) return { ok: true, message: "Thanks!" };

  const parsed = leadSchema.safeParse({
    name: formData.get("name"),
    phone: formData.get("phone"),
    email: formData.get("email"),
    goal: formData.get("goal"),
    message: formData.get("message"),
    sourcePage: formData.get("sourcePage"),
  });
  if (!parsed.success)
    return { ok: false, fieldErrors: toFieldErrors(parsed.error) };

  const turnstileValid = await verifyTurnstile(
    String(formData.get("cf-turnstile-response") ?? "").trim(),
  );
  if (!turnstileValid) {
    return {
      ok: false,
      error: "We couldn't verify that you're human. Please try the form again.",
    };
  }

  const requestHeaders = await headers();
  const forwardedFor = requestHeaders.get("x-forwarded-for");
  const ip = forwardedFor
    ? forwardedFor.split(",")[0].trim().slice(0, 45)
    : null;
  const userAgent =
    (requestHeaders.get("user-agent") ?? "").slice(0, 500) || null;

  const lead = await prisma.lead.create({
    data: {
      name: parsed.data.name,
      phone: parsed.data.phone,
      email: parsed.data.email || null,
      goal: parsed.data.goal || null,
      message: parsed.data.message || null,
      sourcePage: parsed.data.sourcePage || null,
      ip,
      userAgent,
      status: "NEW",
    },
  });

  await notifyNewLead({
    name: lead.name,
    phone: lead.phone,
    email: lead.email,
    goal: lead.goal,
    sourcePage: lead.sourcePage,
  });

  revalidatePath("/admin/leads");
  return {
    ok: true,
    message:
      "Thanks! Your request has been received — we'll contact you within one working day.",
  };
}

export async function updateLeadStatusAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await assertPermission("leads:write");
  const parsed = leadUpdateSchema.safeParse({
    id: formData.get("id"),
    status: formData.get("status"),
    notes: formData.get("notes"),
  });
  if (!parsed.success)
    return { ok: false, fieldErrors: toFieldErrors(parsed.error) };

  const existing = await prisma.lead.findUnique({
    where: { id: parsed.data.id },
  });
  if (!existing) return { ok: false, error: "That lead no longer exists." };

  await prisma.lead.update({
    where: { id: existing.id },
    data: {
      status: parsed.data.status,
      notes: parsed.data.notes || null,
    },
  });

  await recordAudit({
    userId: actor.id,
    action: "lead.updated",
    entity: "lead",
    entityId: existing.id,
    meta: { status: parsed.data.status },
  });

  revalidatePath("/admin/leads");
  return {
    ok: true,
    message: `Lead marked as ${parsed.data.status.toLowerCase()}.`,
  };
}

export async function deleteLeadAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await assertPermission("leads:write");
  const parsed = leadDeleteSchema.safeParse({ id: formData.get("id") });
  if (!parsed.success) return { ok: false, error: "Missing lead." };

  const existing = await prisma.lead.findUnique({
    where: { id: parsed.data.id },
  });
  if (!existing) return { ok: false, error: "That lead no longer exists." };

  await prisma.lead.delete({ where: { id: existing.id } });

  await recordAudit({
    userId: actor.id,
    action: "lead.deleted",
    entity: "lead",
    entityId: existing.id,
    meta: { name: existing.name },
  });

  revalidatePath("/admin/leads");
  return { ok: true, message: "Lead deleted." };
}
