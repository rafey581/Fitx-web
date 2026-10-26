"use client";

import { useState } from "react";

import Link from "next/link";

import { ActionForm } from "@/components/ui/action-form";
import { Alert, Field } from "@/components/ui/field";
import { cardClass, inputClass } from "@/components/ui/styles";
import { SubmitButton } from "@/components/ui/submit-button";
import { LeadStatus } from "@/generated/prisma/enums";
import { formatDateTime } from "@/lib/format";
import {
  deleteLeadAction,
  updateLeadStatusAction,
} from "@/server/actions/leads";

export type LeadRow = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  goal: string | null;
  message: string | null;
  sourcePage: string | null;
  status: LeadStatus;
  notes: string | null;
  ip: string | null;
  userAgent: string | null;
  createdAt: string;
};

export const LEAD_STATUSES: LeadStatus[] = [
  LeadStatus.NEW,
  LeadStatus.CONTACTED,
  LeadStatus.CONVERTED,
  LeadStatus.CLOSED,
];

const STATUS_COLORS: Record<LeadStatus, string> = {
  [LeadStatus.NEW]: "bg-blue-100 text-blue-700",
  [LeadStatus.CONTACTED]: "bg-amber-100 text-amber-700",
  [LeadStatus.CONVERTED]: "bg-green-100 text-green-700",
  [LeadStatus.CLOSED]: "bg-gray-200 text-gray-600",
};

export function LeadsManager({
  leads,
  canWrite,
}: {
  leads: LeadRow[];
  canWrite: boolean;
}) {
  const [filter, setFilter] = useState<LeadStatus | "ALL">("ALL");
  const visible =
    filter === "ALL" ? leads : leads.filter((lead) => lead.status === filter);

  return (
    <div className="mx-auto w-full max-w-5xl space-y-8">
      <header>
        <p className="eyebrow">Content</p>
        <h1 className="heading-display mt-2 text-3xl text-ink">Leads</h1>
        <p className="mt-2 text-sm text-muted">
          Enquiries from the contact / consultation form, with status tracking.
        </p>
      </header>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {(["ALL", ...LEAD_STATUSES] as const).map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setFilter(status)}
              className={`rounded-full px-3 py-1 text-xs font-bold uppercase transition ${
                filter === status
                  ? "bg-navy text-white"
                  : "border border-black/15 text-muted hover:bg-black/[0.04]"
              }`}
            >
              {status === "ALL" ? `All (${leads.length})` : status}
            </button>
          ))}
        </div>
        <Link
          href="/admin/leads/export"
          className="rounded-brand border border-black/15 px-3 py-1.5 text-sm font-semibold text-ink hover:bg-black/[0.04]"
        >
          Download CSV
        </Link>
      </div>

      {visible.length === 0 ? (
        <p className={cardClass}>
          No leads yet — the form on the site fills this inbox.
        </p>
      ) : (
        <ul className="space-y-4">
          {visible.map((lead) => (
            <li key={lead.id} className={cardClass}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-ink">
                    {lead.name}{" "}
                    <span
                      className={`ml-2 rounded-full px-2 py-0.5 text-[0.65rem] font-bold uppercase ${STATUS_COLORS[lead.status]}`}
                    >
                      {lead.status}
                    </span>
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    {formatDateTime(lead.createdAt)}
                  </p>
                </div>
                {canWrite ? (
                  <ActionForm action={deleteLeadAction}>
                    {() => (
                      <>
                        <input type="hidden" name="id" value={lead.id} />
                        <SubmitButton
                          variant="danger"
                          confirm={`Delete this lead from ${lead.name}?`}
                        >
                          Delete
                        </SubmitButton>
                      </>
                    )}
                  </ActionForm>
                ) : null}
              </div>

              <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-xs font-semibold text-muted uppercase">
                    Phone
                  </dt>
                  <dd className="mt-0.5">
                    <a
                      href={`tel:${lead.phone.replace(/\s/g, "")}`}
                      className="hover:underline"
                    >
                      {lead.phone}
                    </a>
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold text-muted uppercase">
                    Email
                  </dt>
                  <dd className="mt-0.5">{lead.email ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold text-muted uppercase">
                    Interested in
                  </dt>
                  <dd className="mt-0.5">{lead.goal ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold text-muted uppercase">
                    From page
                  </dt>
                  <dd className="mt-0.5">{lead.sourcePage ?? "—"}</dd>
                </div>
                {lead.message ? (
                  <div className="sm:col-span-2">
                    <dt className="text-xs font-semibold text-muted uppercase">
                      Message
                    </dt>
                    <dd className="mt-0.5 whitespace-pre-wrap text-muted">
                      {lead.message}
                    </dd>
                  </div>
                ) : null}
                {lead.notes ? (
                  <div className="sm:col-span-2">
                    <dt className="text-xs font-semibold text-muted uppercase">
                      Staff notes
                    </dt>
                    <dd className="mt-0.5 whitespace-pre-wrap text-muted">
                      {lead.notes}
                    </dd>
                  </div>
                ) : null}
                <div className="sm:col-span-2">
                  <dt className="text-xs font-semibold text-muted uppercase">
                    Source details
                  </dt>
                  <dd className="mt-0.5 truncate text-xs text-muted">
                    {[lead.ip && `IP ${lead.ip}`, lead.userAgent]
                      .filter(Boolean)
                      .join(" · ") || "—"}
                  </dd>
                </div>
              </dl>

              {canWrite ? (
                <div className="mt-4 border-t border-black/5 pt-4">
                  <ActionForm action={updateLeadStatusAction}>
                    {(state) => (
                      <div className="space-y-3">
                        {state.error ? (
                          <Alert variant="error">{state.error}</Alert>
                        ) : null}
                        {state.ok && state.message ? (
                          <Alert variant="success">{state.message}</Alert>
                        ) : null}
                        <input type="hidden" name="id" value={lead.id} />
                        <div className="grid gap-3 sm:grid-cols-3">
                          <div>
                            <label
                              htmlFor={`status-${lead.id}`}
                              className="mb-1 block text-xs font-semibold tracking-wide text-muted uppercase"
                            >
                              Status
                            </label>
                            <select
                              id={`status-${lead.id}`}
                              name="status"
                              defaultValue={lead.status}
                              className={inputClass}
                            >
                              {LEAD_STATUSES.map((status) => (
                                <option key={status} value={status}>
                                  {status}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="sm:col-span-2">
                            <Field
                              label="Notes (overwrites previous notes)"
                              htmlFor={`notes-${lead.id}`}
                            >
                              <textarea
                                id={`notes-${lead.id}`}
                                name="notes"
                                rows={2}
                                defaultValue={lead.notes ?? ""}
                                className={inputClass}
                                placeholder="What was discussed, next steps, …"
                              />
                            </Field>
                          </div>
                        </div>
                        <SubmitButton>Save status</SubmitButton>
                      </div>
                    )}
                  </ActionForm>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
