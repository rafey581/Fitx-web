import { roleHasPermission } from "@/lib/auth/permissions";
import { getSession } from "@/lib/auth/session";
import { csvCell } from "@/lib/csv";
import { prisma } from "@/lib/db";

/**
 * CSV export of the leads inbox (`/admin/leads/export`). Route handlers do not
 * run inside layouts, so auth is enforced here on every request: the session
 * cookie is resolved and `leads:read` is checked against the live user row.
 */
export async function GET() {
  const session = await getSession();
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }
  const user = await prisma.user.findUnique({ where: { id: session.id } });
  if (!user || !user.isActive || !roleHasPermission(user.role, "leads:read")) {
    return new Response("Forbidden", { status: 403 });
  }

  const leads = await prisma.lead.findMany({ orderBy: { createdAt: "desc" } });

  const header = [
    "id",
    "created_at",
    "name",
    "phone",
    "email",
    "goal",
    "message",
    "source_page",
    "status",
    "notes",
    "ip",
    "user_agent",
  ];

  const lines = [
    header.map(csvCell).join(","),
    ...leads.map((lead) =>
      [
        lead.id,
        lead.createdAt.toISOString(),
        lead.name,
        lead.phone,
        lead.email,
        lead.goal,
        lead.message,
        lead.sourcePage,
        lead.status,
        lead.notes,
        lead.ip,
        lead.userAgent,
      ]
        .map(csvCell)
        .join(","),
    ),
  ];

  const csv = `\uFEFF${lines.join("\r\n")}`;
  const stamp = new Date().toISOString().slice(0, 10);

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="leads-${stamp}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
