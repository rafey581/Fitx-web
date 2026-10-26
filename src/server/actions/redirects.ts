"use server";

import { revalidatePath } from "next/cache";

import { recordAudit } from "@/lib/audit";
import { assertPermission } from "@/lib/auth/server";
import { prisma } from "@/lib/db";
import { toFieldErrors } from "@/lib/validation/errors";
import {
  redirectSchema,
  updateRedirectSchema,
} from "@/lib/validation/settings";
import type { ActionState } from "./types";

const normalizeCode = (value: FormDataEntryValue | null): string =>
  String(value ?? "301").trim() || "301";

export async function createRedirectAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await assertPermission("navigation:write");

  const parsed = redirectSchema.safeParse({
    fromPath: String(formData.get("fromPath") ?? "").trim(),
    toPath: String(formData.get("toPath") ?? "").trim(),
    code: normalizeCode(formData.get("code")),
  });
  if (!parsed.success) {
    return {
      ok: false,
      error: "Please fix the highlighted fields.",
      fieldErrors: toFieldErrors(parsed.error),
    };
  }

  const existing = await prisma.redirect.findUnique({
    where: { fromPath: parsed.data.fromPath },
  });
  if (existing) {
    return {
      ok: false,
      error: `"${parsed.data.fromPath}" is already being redirected. Edit it instead.`,
      fieldErrors: { fromPath: ["This path already has a redirect."] },
    };
  }

  const redirect = await prisma.redirect.create({
    data: {
      fromPath: parsed.data.fromPath,
      toPath: parsed.data.toPath,
      code: Number(parsed.data.code),
    },
  });

  await recordAudit({
    userId: actor.id,
    action: "redirects.created",
    entity: "redirects",
    entityId: redirect.id,
    meta: { from: redirect.fromPath, to: redirect.toPath, code: redirect.code },
  });
  revalidatePath("/admin/redirects");

  return {
    ok: true,
    message: `Redirect created: ${redirect.fromPath} → ${redirect.toPath}`,
  };
}

export async function updateRedirectAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await assertPermission("navigation:write");

  const parsed = updateRedirectSchema.safeParse({
    id: String(formData.get("id") ?? ""),
    fromPath: String(formData.get("fromPath") ?? "").trim(),
    toPath: String(formData.get("toPath") ?? "").trim(),
    code: normalizeCode(formData.get("code")),
  });
  if (!parsed.success) {
    return {
      ok: false,
      error: "Please fix the highlighted fields.",
      fieldErrors: toFieldErrors(parsed.error),
    };
  }

  const redirect = await prisma.redirect.findUnique({
    where: { id: parsed.data.id },
  });
  if (!redirect) return { ok: false, error: "That redirect no longer exists." };

  const clash = await prisma.redirect.findUnique({
    where: { fromPath: parsed.data.fromPath },
  });
  if (clash && clash.id !== redirect.id) {
    return {
      ok: false,
      error: `"${parsed.data.fromPath}" is already used by another redirect.`,
      fieldErrors: { fromPath: ["This path already has a redirect."] },
    };
  }

  const updated = await prisma.redirect.update({
    where: { id: redirect.id },
    data: {
      fromPath: parsed.data.fromPath,
      toPath: parsed.data.toPath,
      code: Number(parsed.data.code),
    },
  });

  await recordAudit({
    userId: actor.id,
    action: "redirects.updated",
    entity: "redirects",
    entityId: updated.id,
    meta: { from: updated.fromPath, to: updated.toPath, code: updated.code },
  });
  revalidatePath("/admin/redirects");

  return { ok: true, message: "Redirect updated." };
}

export async function deleteRedirectAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await assertPermission("navigation:write");

  const id = String(formData.get("id") ?? "");
  const redirect = await prisma.redirect.findUnique({ where: { id } });
  if (!redirect) return { ok: false, error: "That redirect no longer exists." };

  await prisma.redirect.delete({ where: { id } });

  await recordAudit({
    userId: actor.id,
    action: "redirects.deleted",
    entity: "redirects",
    entityId: id,
    meta: { from: redirect.fromPath },
  });
  revalidatePath("/admin/redirects");

  return { ok: true, message: `Redirect for ${redirect.fromPath} deleted.` };
}
