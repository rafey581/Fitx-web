import "server-only";

import { cache } from "react";

import { redirect } from "next/navigation";

import { prisma } from "@/lib/db";

import { roleHasPermission, type Permission } from "./permissions";
import { getSession } from "./session";

/** Thrown by `assertPermission` inside server actions (which cannot redirect). */
export class ForbiddenError extends Error {
  constructor(message = "You do not have permission to do that.") {
    super(message);
    this.name = "ForbiddenError";
  }
}

/**
 * Resolve the current admin user from the session, re-checking `is_active` so a
 * deactivated account loses access immediately. Cached per request.
 */
export const getCurrentUser = cache(async () => {
  const session = await getSession();
  if (!session) return null;

  const user = await prisma.user.findUnique({ where: { id: session.id } });
  if (!user || !user.isActive) return null;

  return user;
});

/** For pages: redirect anonymous visitors to the login screen. */
export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/admin/login");
  return user;
}

/** For pages: redirect to a friendly 403 when the role lacks a permission. */
export async function requirePermission(permission: Permission) {
  const user = await requireUser();
  if (!roleHasPermission(user.role, permission)) {
    redirect(`/admin/forbidden?missing=${encodeURIComponent(permission)}`);
  }
  return user;
}

/** For server actions: throw when the role lacks a permission. */
export async function assertPermission(permission: Permission) {
  const user = await getCurrentUser();
  if (!user) throw new ForbiddenError("Your session has expired.");
  if (!roleHasPermission(user.role, permission)) {
    throw new ForbiddenError();
  }
  return user;
}

/** For server actions: require an authenticated user without a specific permission. */
export async function assertUser() {
  const user = await getCurrentUser();
  if (!user) throw new ForbiddenError("Your session has expired.");
  return user;
}
