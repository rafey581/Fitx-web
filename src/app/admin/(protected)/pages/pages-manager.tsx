"use client";

import Link from "next/link";

import { ActionForm } from "@/components/ui/action-form";
import { Alert } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import {
  deletePageForeverAction,
  duplicatePageAction,
  restorePageAction,
  trashPageAction,
} from "@/server/actions/pages";

export type PageSummaryRow = {
  id: string;
  title: string;
  slug: string;
  href: string;
  isHome: boolean;
  status: "DRAFT" | "PUBLISHED" | "SCHEDULED";
  noindex: boolean;
  sectionCount: number;
  isTrashed: boolean;
  hasUnpublishedChanges: boolean;
  published: boolean;
  publishedAt: string | null;
  updatedAt: string;
};

const STATUS_META: Record<
  PageSummaryRow["status"],
  { label: string; className: string }
> = {
  DRAFT: { label: "Draft", className: "bg-stone-100 text-stone-600" },
  PUBLISHED: { label: "Live", className: "bg-emerald-100 text-emerald-700" },
  SCHEDULED: { label: "Scheduled", className: "bg-amber-100 text-amber-700" },
};

function StatusBadge({
  status,
  isTrashed,
}: {
  status: PageSummaryRow["status"];
  isTrashed: boolean;
}) {
  if (isTrashed) {
    return (
      <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-[0.65rem] font-bold text-red-700">
        Trashed
      </span>
    );
  }
  const meta = STATUS_META[status];
  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-[0.65rem] font-bold ${meta.className}`}
    >
      {meta.label}
    </span>
  );
}

function formatWhen(value: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

/**
 * One row's action forms. Each action is its own server-action form so success
 * and error messages stay next to the row they belong to.
 */
function RowActions({
  page,
  canWrite,
  canDelete,
}: {
  page: PageSummaryRow;
  canWrite: boolean;
  canDelete: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
      {!page.isTrashed ? (
        <>
          <Link
            href={`/admin/pages/${page.id}`}
            className="btn px-3 py-1.5 text-[0.65rem]"
          >
            Build
          </Link>
          {page.published && page.status === "PUBLISHED" ? (
            <a
              href={page.href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-semibold text-accent hover:underline"
            >
              View live ↗
            </a>
          ) : null}
          {canWrite ? (
            <ActionForm action={duplicatePageAction} className="contents">
              {(state) => (
                <>
                  <input type="hidden" name="pageId" value={page.id} />
                  <SubmitButton
                    variant="outline"
                    className="px-3 py-1.5 text-[0.65rem]"
                  >
                    Duplicate
                  </SubmitButton>
                  {state.message ? (
                    <span className="text-xs font-medium text-emerald-700">
                      {state.message}
                    </span>
                  ) : null}
                  {state.error ? (
                    <span className="text-xs font-medium text-red-600">
                      {state.error}
                    </span>
                  ) : null}
                </>
              )}
            </ActionForm>
          ) : null}
          {canDelete && !page.isHome ? (
            <ActionForm action={trashPageAction} className="contents">
              {(state) => (
                <>
                  <input type="hidden" name="pageId" value={page.id} />
                  <SubmitButton
                    variant="danger"
                    className="px-3 py-1.5 text-[0.65rem]"
                    confirm={`Move "${page.title}" to the trash?`}
                  >
                    Trash
                  </SubmitButton>
                  {state.error ? (
                    <span className="text-xs font-medium text-red-600">
                      {state.error}
                    </span>
                  ) : null}
                </>
              )}
            </ActionForm>
          ) : null}
        </>
      ) : null}
    </div>
  );
}

function TrashActions({ page }: { page: PageSummaryRow }) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <ActionForm action={restorePageAction} className="contents">
        {(state) => (
          <>
            <input type="hidden" name="pageId" value={page.id} />
            <SubmitButton
              variant="outline"
              className="px-3 py-1.5 text-[0.65rem]"
            >
              Restore
            </SubmitButton>
            {state.error ? (
              <span className="text-xs font-medium text-red-600">
                {state.error}
              </span>
            ) : null}
          </>
        )}
      </ActionForm>
      <ActionForm action={deletePageForeverAction} className="contents">
        {(state) => (
          <>
            <input type="hidden" name="pageId" value={page.id} />
            <SubmitButton
              variant="danger"
              className="px-3 py-1.5 text-[0.65rem]"
              confirm="Delete this page forever? This cannot be undone."
            >
              Delete forever
            </SubmitButton>
            {state.error ? (
              <span className="text-xs font-medium text-red-600">
                {state.error}
              </span>
            ) : null}
          </>
        )}
      </ActionForm>
    </div>
  );
}

function PageRow({
  page,
  canWrite,
  canDelete,
  isTrashed = false,
}: {
  page: PageSummaryRow;
  canWrite: boolean;
  canDelete: boolean;
  isTrashed?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-3 rounded-brand border border-black/10 bg-white px-5 py-4 shadow-sm">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="heading-display text-base text-ink">{page.title}</h3>
          {page.isHome ? (
            <span className="rounded-full bg-accent/15 px-2.5 py-0.5 text-[0.65rem] font-bold text-accent">
              Home
            </span>
          ) : null}
          <StatusBadge status={page.status} isTrashed={page.isTrashed} />
          {!page.isTrashed && page.published && page.hasUnpublishedChanges ? (
            <span
              title="There are unpublished draft changes on this page."
              className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[0.65rem] font-bold text-amber-700"
            >
              Unpublished changes
            </span>
          ) : null}
        </div>
        <p className="mt-1 text-xs text-muted">
          {page.isHome ? "/" : `/${page.slug}`}
          {page.noindex ? " · noindex" : ""}
          {" · "}
          {page.sectionCount} section{page.sectionCount === 1 ? "" : "s"}
          {" · updated "}
          {formatWhen(page.updatedAt)}
          {!page.isTrashed && page.publishedAt ? (
            <>
              {" · published "}
              {formatWhen(page.publishedAt)}
            </>
          ) : null}
        </p>
      </div>
      <div className="min-w-0">
        {isTrashed ? (
          <TrashActions page={page} />
        ) : (
          <RowActions page={page} canWrite={canWrite} canDelete={canDelete} />
        )}
      </div>
    </div>
  );
}

/**
 * The pages list. Live pages get Build / Duplicate / Trash actions; trashed
 * pages get Restore / Delete-forever. The "New page" flow lives at
 * /admin/pages/new.
 */
export function PagesManager({
  pages,
  canWrite,
  canDelete,
}: {
  pages: PageSummaryRow[];
  canWrite: boolean;
  canDelete: boolean;
}) {
  const live = pages.filter((page) => !page.isTrashed);
  const trashed = pages.filter((page) => page.isTrashed);

  return (
    <div className="space-y-8">
      {live.length === 0 ? (
        <div className="rounded-brand border border-dashed border-black/20 bg-white p-10 text-center">
          <p className="text-ink">No pages yet.</p>
          {canWrite ? (
            <Link
              href="/admin/pages/new"
              className="btn btn-accent mt-4 px-5 py-2.5 text-[0.7rem]"
            >
              Create your first page
            </Link>
          ) : null}
        </div>
      ) : (
        <ul className="space-y-3">
          {live.map((page) => (
            <li key={page.id}>
              <PageRow page={page} canWrite={canWrite} canDelete={canDelete} />
            </li>
          ))}
        </ul>
      )}

      {!canWrite ? (
        <Alert variant="info">
          Your role can view pages but not edit them.
        </Alert>
      ) : null}

      {trashed.length > 0 ? (
        <section aria-labelledby="trash-heading">
          <h2 id="trash-heading" className="eyebrow">
            Trash ({trashed.length})
          </h2>
          <ul className="mt-3 space-y-3">
            {trashed.map((page) => (
              <li key={page.id}>
                <PageRow
                  page={page}
                  canWrite={canWrite}
                  canDelete={canDelete}
                  isTrashed
                />
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
