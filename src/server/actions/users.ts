"use server";

import { createHash, randomBytes } from "node:crypto";

import { revalidatePath } from "next/cache";

import { z } from "zod";

import { recordAudit } from "@/lib/audit";
import { hashPassword } from "@/lib/auth/password";
import { assertPermission } from "@/lib/auth/server";
import { prisma } from "@/lib/db";
import { sendMail } from "@/lib/email";
import { env } from "@/lib/env";
import { createUserSchema, updateUserSchema } from "@/lib/validation/auth";
import { toFieldErrors } from "@/lib/validation/errors";

import type { ActionState } from "./types";

const setPasswordSchema = z.object({
  id: z.string().min(1),
  password: z.string().min(8, "Use at least 8 characters").max(200),
});

async function countActiveOwners(): Promise<number> {
  return prisma.user.count({ where: { role: "OWNER", isActive: true } });
}

export async function createUserAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await assertPermission("users:write");

  const parsed = createUserSchema.safeParse({
    name: String(formData.get("name") ?? "").trim(),
    email: String(formData.get("email") ?? "")
      .trim()
      .toLowerCase(),
    password: String(formData.get("password") ?? ""),
    role: String(formData.get("role") ?? ""),
  });

  if (!parsed.success) {
    return { ok: false, fieldErrors: toFieldErrors(parsed.error) };
  }

  const existing = await prisma.user.findUnique({
    where: { email: parsed.data.email },
  });
  if (existing) {
    return {
      ok: false,
      fieldErrors: { email: ["An account with that email already exists."] },
    };
  }

  const user = await prisma.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      role: parsed.data.role,
      passwordHash: await hashPassword(parsed.data.password),
    },
  });

  await recordAudit({
    userId: actor.id,
    action: "user.created",
    entity: "user",
    entityId: user.id,
    meta: { email: user.email, role: user.role },
  });

  revalidatePath("/admin/users");
  return { ok: true, message: `Created ${user.name}.` };
}

export async function updateUserAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await assertPermission("users:write");

  const parsed = updateUserSchema.safeParse({
    id: String(formData.get("id") ?? ""),
    name: String(formData.get("name") ?? "").trim(),
    email: String(formData.get("email") ?? "")
      .trim()
      .toLowerCase(),
    role: String(formData.get("role") ?? ""),
    isActive: formData.get("isActive") === "on",
  });

  if (!parsed.success) {
    return { ok: false, fieldErrors: toFieldErrors(parsed.error) };
  }

  const target = await prisma.user.findUnique({
    where: { id: parsed.data.id },
  });
  if (!target) {
    return { ok: false, error: "That user no longer exists." };
  }

  const emailTaken = await prisma.user.findFirst({
    where: { email: parsed.data.email, id: { not: target.id } },
  });
  if (emailTaken) {
    return {
      ok: false,
      fieldErrors: { email: ["Another account already uses that email."] },
    };
  }

  // Safety rails: never let the last active owner lock themselves out.
  const demotingOwner =
    target.role === "OWNER" &&
    (parsed.data.role !== "OWNER" || !parsed.data.isActive);
  if (demotingOwner && (await countActiveOwners()) <= 1) {
    return {
      ok: false,
      error: "You cannot deactivate or demote the last active owner.",
    };
  }

  await prisma.user.update({
    where: { id: target.id },
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      role: parsed.data.role,
      isActive: parsed.data.isActive,
    },
  });

  await recordAudit({
    userId: actor.id,
    action: "user.updated",
    entity: "user",
    entityId: target.id,
    meta: {
      role: parsed.data.role,
      isActive: parsed.data.isActive,
    },
  });

  revalidatePath("/admin/users");
  return { ok: true, message: `Saved ${parsed.data.name}.` };
}

export async function setUserPasswordAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await assertPermission("users:write");

  const parsed = setPasswordSchema.safeParse({
    id: String(formData.get("id") ?? ""),
    password: String(formData.get("password") ?? ""),
  });

  if (!parsed.success) {
    return { ok: false, fieldErrors: toFieldErrors(parsed.error) };
  }

  const target = await prisma.user.findUnique({
    where: { id: parsed.data.id },
  });
  if (!target) {
    return { ok: false, error: "That user no longer exists." };
  }

  await prisma.user.update({
    where: { id: target.id },
    data: {
      passwordHash: await hashPassword(parsed.data.password),
      resetTokenHash: null,
      resetTokenExpiresAt: null,
      failedLoginCount: 0,
      lockedUntil: null,
    },
  });

  await recordAudit({
    userId: actor.id,
    action: "user.password_set",
    entity: "user",
    entityId: target.id,
  });

  return { ok: true, message: `Password updated for ${target.name}.` };
}

export async function sendUserResetLinkAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await assertPermission("users:write");

  const id = String(formData.get("id") ?? "");
  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) {
    return { ok: false, error: "That user no longer exists." };
  }

  const token = randomBytes(32).toString("hex");
  await prisma.user.update({
    where: { id: target.id },
    data: {
      resetTokenHash: createHash("sha256").update(token).digest("hex"),
      resetTokenExpiresAt: new Date(Date.now() + 60 * 60 * 1000),
    },
  });

  const url = `${env.APP_URL}/admin/reset-password?token=${token}`;
  await sendMail({
    to: target.email,
    subject: "Reset your FITX admin password",
    text: `An administrator started a password reset for your account. Use this link within 1 hour:\n\n${url}`,
  });

  await recordAudit({
    userId: actor.id,
    action: "user.reset_link_sent",
    entity: "user",
    entityId: target.id,
  });

  return {
    ok: true,
    message: `Password reset link sent to ${target.email}.`,
  };
}

export async function deleteUserAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await assertPermission("users:write");
  const id = String(formData.get("id") ?? "");

  if (id === actor.id) {
    return { ok: false, error: "You cannot delete your own account." };
  }

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) {
    return { ok: false, error: "That user no longer exists." };
  }

  if (target.role === "OWNER" && (await countActiveOwners()) <= 1) {
    return { ok: false, error: "You cannot delete the last active owner." };
  }

  await prisma.user.delete({ where: { id: target.id } });

  await recordAudit({
    userId: actor.id,
    action: "user.deleted",
    entity: "user",
    entityId: target.id,
    meta: { email: target.email },
  });

  revalidatePath("/admin/users");
  return { ok: true, message: `Deleted ${target.name}.` };
}
