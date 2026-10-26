import "server-only";

import { z } from "zod";

/**
 * Server-only environment access.
 *
 * Importing this module from a Client Component fails at build time thanks to
 * `server-only`, which keeps secrets out of the browser bundle.
 *
 * `.env` files are not auto-loaded for app code in the same way the Prisma CLI
 * loads them, but Next.js itself loads `.env`, `.env.local`, `.env.development`
 * and friends, so `process.env` is already populated here.
 */
const schema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),

  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),

  APP_URL: z.string().min(1).default("http://localhost:3000"),

  AUTH_SECRET: z.string().min(32, "AUTH_SECRET must be at least 32 characters"),
  AUTH_SESSION_TTL_HOURS: z.coerce.number().int().positive().default(72),

  OWNER_NAME: z.string().default("FITX Owner"),
  OWNER_EMAIL: z.string().default("owner@fitx.pk"),
  OWNER_PASSWORD: z.string().min(8).default("ChangeMe123!"),

  UPLOAD_DIR: z.string().default("uploads"),
  UPLOAD_MAX_MB: z.coerce.number().int().positive().default(25),

  SMTP_HOST: z.string().default(""),
  SMTP_PORT: z.coerce.number().int().positive().default(587),
  SMTP_USER: z.string().default(""),
  SMTP_PASSWORD: z.string().default(""),
  SMTP_FROM: z.string().default("FITX <no-reply@fitx.pk>"),
  LEAD_NOTIFY_TO: z.string().default(""),

  TURNSTILE_SECRET_KEY: z.string().default(""),
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: z.string().default(""),
});

function buildEnv() {
  const parsed = schema.safeParse(process.env);

  if (!parsed.success) {
    const issues = parsed.error.issues
      .map(
        (issue) => `  - ${issue.path.join(".") || "(root)"}: ${issue.message}`,
      )
      .join("\n");
    throw new Error(`Invalid environment variables:\n${issues}`);
  }

  return {
    ...parsed.data,
    isDevelopment: parsed.data.NODE_ENV === "development",
    isProduction: parsed.data.NODE_ENV === "production",
  };
}

export const env = buildEnv();
export type Env = typeof env;
