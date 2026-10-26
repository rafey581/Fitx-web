import "server-only";

import type { Prisma } from "@/generated/prisma/client";

import { prisma } from "@/lib/db";

export type AuditInput = {
  userId?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  meta?: Prisma.InputJsonValue;
};

/**
 * Append-only audit trail (PRD 5.1). Never throws: a failed audit write must not
 * break the user-facing mutation it is describing.
 */
export async function recordAudit(input: AuditInput): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: input.userId ?? null,
        action: input.action,
        entity: input.entity,
        entityId: input.entityId ?? null,
        meta: input.meta ?? {},
      },
    });
  } catch (error) {
    console.error("[audit] failed to write audit log", error);
  }
}
