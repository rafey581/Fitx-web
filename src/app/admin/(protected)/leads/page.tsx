import type { Metadata } from "next";

import { roleHasPermission } from "@/lib/auth/permissions";
import { requirePermission } from "@/lib/auth/server";
import { prisma } from "@/lib/db";

import { LeadsManager, type LeadRow } from "./leads-manager";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Leads" };

export default async function AdminLeadsPage() {
  const user = await requirePermission("leads:read");
  const canWrite = roleHasPermission(user.role, "leads:write");

  const leads = await prisma.lead.findMany({ orderBy: { createdAt: "desc" } });

  const rows: LeadRow[] = leads.map((lead) => ({
    id: lead.id,
    name: lead.name,
    phone: lead.phone,
    email: lead.email,
    goal: lead.goal,
    message: lead.message,
    sourcePage: lead.sourcePage,
    status: lead.status,
    notes: lead.notes,
    ip: lead.ip,
    userAgent: lead.userAgent,
    createdAt: lead.createdAt.toISOString(),
  }));

  return <LeadsManager leads={rows} canWrite={canWrite} />;
}
