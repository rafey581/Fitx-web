import "server-only";

import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";

import type { Role } from "@/generated/prisma/enums";

import { env } from "@/lib/env";

import { SESSION_COOKIE } from "./cookie";

export { SESSION_COOKIE };

const secret = new TextEncoder().encode(env.AUTH_SECRET);
const ttlSeconds = env.AUTH_SESSION_TTL_HOURS * 60 * 60;

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: Role;
};

export type SessionPayload = SessionUser & {
  iat: number;
  exp: number;
};

/**
 * Signed (HS256) session token stored in an httpOnly cookie.
 *
 * Decision: we use a stateless JWT session instead of NextAuth because it is a
 * good fit for a small internal admin, has no beta/Next-16 compatibility risk,
 * and keeps the dependency surface small. We still re-check `is_active` on every
 * request (see `getCurrentUser`), so deactivating a user takes effect at once.
 */
export async function createSession(user: SessionUser): Promise<void> {
  const token = await new SignJWT({ ...user })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${ttlSeconds}s`)
    .sign(secret);

  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: env.isProduction,
    path: "/",
    maxAge: ttlSeconds,
  });
}

/** Verify a raw cookie token. Returns null when missing/expired/tampered. */
export async function verifySessionToken(
  token: string,
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    if (
      typeof payload.id !== "string" ||
      typeof payload.email !== "string" ||
      typeof payload.name !== "string" ||
      typeof payload.role !== "string"
    ) {
      return null;
    }
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

/** Read and verify the current session from cookies. */
export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}
