import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export const metadata = { title: "Health check" };

/**
 * Simple readiness page: confirms the app boots and MySQL is reachable.
 * Phase 0 acceptance criterion.
 */
export default async function HealthPage() {
  let database = "down";
  let detail = "";

  try {
    await prisma.$queryRaw`SELECT 1`;
    database = "up";
  } catch (error) {
    detail = error instanceof Error ? error.message : String(error);
  }

  const rows: Array<[string, string]> = [
    ["App", "ok"],
    ["Database", database],
  ];

  return (
    <main className="mx-auto w-full max-w-xl px-6 py-16 font-body">
      <h1 className="heading-display text-2xl">FITX health check</h1>
      <dl className="mt-6 divide-y divide-black/10 rounded-brand border border-black/10">
        {rows.map(([label, value]) => (
          <div
            key={label}
            className="flex items-center justify-between px-4 py-3"
          >
            <dt className="text-sm text-muted">{label}</dt>
            <dd
              className={
                value === "ok" || value === "up"
                  ? "text-sm font-semibold text-green-600"
                  : "text-sm font-semibold text-red-600"
              }
            >
              {value}
            </dd>
          </div>
        ))}
      </dl>
      {detail ? (
        <pre className="mt-4 overflow-auto rounded-brand bg-ink/5 p-4 text-xs text-red-700">
          {detail}
        </pre>
      ) : null}
    </main>
  );
}
