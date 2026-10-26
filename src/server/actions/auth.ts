"use server";

import { createHash, randomBytes } from "node:crypto";

import { redirect } from "next/navigation";

import { recordAudit } from "@/lib/audit";
import {
  fakeVerifyPassword,
  hashPassword,
  verifyPassword,
} from "@/lib/auth/password";
import { createSession, destroySession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { sendMail } from "@/lib/email";
import { env } from "@/lib/env";
import {
  forgotPasswordSchema,
  loginSchema,
  resetPasswordSchema,
} from "@/lib/validation/auth";
import { toFieldErrors } from "@/lib/validation/errors";

import type { ActionState } from "./types";

const MAX_FAILED_LOGINS = 5;
const LOCK_MINUTES = 15;
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

/** Only allow post-login redirects back into the admin area. */
function safeNextPath(value: FormDataEntryValue | null): string {
  const next = typeof value === "string" ? value : "";
  return next.startsWith("/admin") && !next.startsWith("//") ? next : "/admin";
}

export async function loginAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = loginSchema.safeParse({
    email: String(formData.get("email") ?? "")
      .trim()
      .toLowerCase(),
    password: String(formData.get("password") ?? ""),
  });

  if (!parsed.success) {
    return { ok: false, fieldErrors: toFieldErrors(parsed.error) };
  }

  const { email, password } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    await fakeVerifyPassword();
    return { ok: false, error: "Invalid email or password." };
  }

  if (!user.isActive) {
    return { ok: false, error: "This account has been disabled." };
  }

  if (user.lockedUntil && user.lockedUntil.getTime() > Date.now()) {
    const minutes = Math.ceil(
      (user.lockedUntil.getTime() - Date.now()) / 60_000,
    );
    return {
      ok: false,
      error: `Too many failed attempts. Try again in ${minutes} minute(s).`,
    };
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    const failedCount = user.failedLoginCount + 1;
    const shouldLock = failedCount >= MAX_FAILED_LOGINS;

    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginCount: shouldLock ? 0 : failedCount,
        lockedUntil: shouldLock
          ? new Date(Date.now() + LOCK_MINUTES * 60_000)
          : null,
      },
    });
    await recordAudit({
      userId: user.id,
      action: "login.failed",
      entity: "user",
      entityId: user.id,
    });

    return {
      ok: false,
      error: shouldLock
        ? `Too many failed attempts. This account is locked for ${LOCK_MINUTES} minutes.`
        : "Invalid email or password.",
    };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { failedLoginCount: 0, lockedUntil: null, lastLoginAt: new Date() },
  });

  await createSession({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  });
  await recordAudit({
    userId: user.id,
    action: "login.success",
    entity: "user",
    entityId: user.id,
  });

  redirect(safeNextPath(formData.get("next")));
}

export async function logoutAction(): Promise<void> {
  const { getCurrentUser } = await import("@/lib/auth/server");
  const user = await getCurrentUser();

  if (user) {
    await recordAudit({
      userId: user.id,
      action: "logout",
      entity: "user",
      entityId: user.id,
    });
  }

  await destroySession();
  redirect("/admin/login");
}

export async function forgotPasswordAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = forgotPasswordSchema.safeParse({
    email: String(formData.get("email") ?? "")
      .trim()
      .toLowerCase(),
  });

  if (!parsed.success) {
    return { ok: false, fieldErrors: toFieldErrors(parsed.error) };
  }

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email },
  });

  // Always report the same result to avoid revealing which emails exist.
  if (user && user.isActive) {
    const token = randomBytes(32).toString("hex");
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetTokenHash: sha256(token),
        resetTokenExpiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
      },
    });

    const url = `${env.APP_URL}/admin/reset-password?token=${token}`;
    await sendMail({
      to: user.email,
      subject: "Reset your FITX admin password",
      text: `Use this link to reset your FITX admin password (valid for 1 hour):\n\n${url}\n\nIf you did not request this, you can ignore this email.`,
    });
    await recordAudit({
      userId: user.id,
      action: "password.reset_requested",
      entity: "user",
      entityId: user.id,
    });
  }

  return {
    ok: true,
    message:
      "If that email address is registered, a password reset link is on its way.",
  };
}

export async function resetPasswordAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = resetPasswordSchema.safeParse({
    token: String(formData.get("token") ?? ""),
    password: String(formData.get("password") ?? ""),
    confirmPassword: String(formData.get("confirmPassword") ?? ""),
  });

  if (!parsed.success) {
    return { ok: false, fieldErrors: toFieldErrors(parsed.error) };
  }

  const user = await prisma.user.findFirst({
    where: {
      resetTokenHash: sha256(parsed.data.token),
      resetTokenExpiresAt: { gt: new Date() },
    },
  });

  if (!user) {
    return { ok: false, error: "This reset link is invalid or has expired." };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash: await hashPassword(parsed.data.password),
      resetTokenHash: null,
      resetTokenExpiresAt: null,
      failedLoginCount: 0,
      lockedUntil: null,
    },
  });

  await recordAudit({
    userId: user.id,
    action: "password.reset",
    entity: "user",
    entityId: user.id,
  });

  return {
    ok: true,
    message: "Your password has been updated. You can sign in now.",
  };
}
