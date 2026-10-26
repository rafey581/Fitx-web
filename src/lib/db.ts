import "server-only";

import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import type { PoolConfig } from "mariadb";

import { PrismaClient } from "@/generated/prisma/client";

import { env } from "./env";

/**
 * Prisma client singleton.
 *
 * Prisma 7 talks to MySQL through a driver adapter (the Rust query engine is
 * gone). In development the client is cached on `globalThis` so Next.js' hot
 * reload does not open a new pool on every change.
 */
const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

/**
 * Parse `DATABASE_URL` into MariaDB pool options.
 *
 * We pass an explicit options object rather than the raw connection string so
 * we can set `allowPublicKeyRetrieval`. Accounts created by `mysql_native_*`
 * tooling default to the `caching_sha2_password` plugin; over a non-TLS
 * connection the server answers with the fast-auth cache, but right after a
 * MySQL restart that cache is cold and the client must fetch the server's RSA
 * public key. Without this flag the driver throws `ER_CANNOT_RETRIEVE_RSA_KEY`,
 * which Prisma surfaces as a misleading 10s "pool timeout" and every page 500s.
 */
function databaseConfig(databaseUrl: string): PoolConfig {
  const url = new URL(databaseUrl);

  return {
    host: url.hostname,
    port: url.port ? Number(url.port) : 3306,
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: decodeURIComponent(url.pathname.replace(/^\//, "")),
    allowPublicKeyRetrieval: true,
  };
}

function createPrismaClient(): PrismaClient {
  const adapter = new PrismaMariaDb(databaseConfig(env.DATABASE_URL));

  return new PrismaClient({
    adapter,
    log: env.isDevelopment ? ["warn", "error"] : ["error"],
  });
}

export const prisma: PrismaClient =
  globalForPrisma.prisma ?? createPrismaClient();

if (!env.isProduction) {
  globalForPrisma.prisma = prisma;
}
