import type { Metadata } from "next";
import Link from "next/link";

import { requireUser } from "@/lib/auth/server";

export const metadata: Metadata = {
  title: "Access denied",
  robots: { index: false },
};

export default async function ForbiddenPage(
  props: PageProps<"/admin/forbidden">,
) {
  // Must not call requirePermission here, or a restricted user would loop.
  await requireUser();

  const { missing } = await props.searchParams;
  const permission = typeof missing === "string" ? missing : null;

  return (
    <div className="mx-auto w-full max-w-xl py-10 text-center">
      <p className="eyebrow">403</p>
      <h1 className="heading-display mt-3 text-3xl text-ink">Access denied</h1>
      <p className="mt-4 text-sm text-muted">
        Your role does not have permission to open this section.
        {permission ? (
          <>
            {" "}
            Required permission:{" "}
            <code className="rounded bg-black/5 px-1.5 py-0.5 text-ink">
              {permission}
            </code>
            .
          </>
        ) : null}
      </p>
      <div className="mt-8 flex justify-center">
        <Link href="/admin" className="btn btn-accent">
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}
