import "server-only";

import bcrypt from "bcryptjs";

const BCRYPT_ROUNDS = 12;

/** Hash a plaintext password with bcrypt (cost 12). */
export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, BCRYPT_ROUNDS);
}

/** Constant-time-ish verification via bcrypt. Returns false on any error. */
export async function verifyPassword(
  plain: string,
  hash: string,
): Promise<boolean> {
  try {
    return await bcrypt.compare(plain, hash);
  } catch {
    return false;
  }
}

/**
 * Burn a little time when the account does not exist so that login responses
 * take a similar amount of time whether or not the email is registered.
 */
export async function fakeVerifyPassword(): Promise<void> {
  await bcrypt.compare(
    "not-a-real-password",
    "$2a$12$0000000000000000000000000000000000000000000000000000",
  );
}
