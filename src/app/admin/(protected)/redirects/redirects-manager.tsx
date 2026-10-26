"use client";

import { Alert, Field } from "@/components/ui/field";
import { ActionForm } from "@/components/ui/action-form";
import { inputClass, cardClass } from "@/components/ui/styles";
import { SubmitButton } from "@/components/ui/submit-button";
import {
  createRedirectAction,
  deleteRedirectAction,
  updateRedirectAction,
} from "@/server/actions/redirects";

export type RedirectRow = {
  id: string;
  fromPath: string;
  toPath: string;
  code: string;
};

const CODE_OPTIONS = ["301", "302", "307", "308"];

function CodeSelect({
  name,
  defaultValue,
}: {
  name: string;
  defaultValue?: string;
}) {
  return (
    <select name={name} defaultValue={defaultValue} className={inputClass}>
      {CODE_OPTIONS.map((code) => (
        <option key={code} value={code}>
          {code}
        </option>
      ))}
    </select>
  );
}

function CreateForm() {
  return (
    <ActionForm
      action={createRedirectAction}
      className="grid gap-4 sm:grid-cols-2"
    >
      {(state) => (
        <>
          {state.error ? (
            <div className="sm:col-span-2">
              <Alert variant="error">{state.error}</Alert>
            </div>
          ) : null}
          {state.message ? (
            <div className="sm:col-span-2">
              <Alert variant="success">{state.message}</Alert>
            </div>
          ) : null}

          <Field
            label="From (old path)"
            htmlFor="new-fromPath"
            error={state.fieldErrors?.fromPath?.[0]}
          >
            <input
              id="new-fromPath"
              name="fromPath"
              className={inputClass}
              placeholder="/old-page"
              required
            />
          </Field>
          <Field
            label="To (destination)"
            htmlFor="new-toPath"
            error={state.fieldErrors?.toPath?.[0]}
          >
            <input
              id="new-toPath"
              name="toPath"
              className={inputClass}
              placeholder="/new-page or https://…"
              required
            />
          </Field>
          <Field label="Status code" htmlFor="new-code">
            <CodeSelect name="code" defaultValue="301" />
          </Field>
          <div className="flex items-end">
            <SubmitButton pendingLabel="Creating…">Add redirect</SubmitButton>
          </div>
        </>
      )}
    </ActionForm>
  );
}

function RedirectCard({ row }: { row: RedirectRow }) {
  return (
    <li className={cardClass}>
      <ActionForm
        action={updateRedirectAction}
        className="grid gap-3 lg:grid-cols-[1fr_auto_160px_1fr_auto] lg:items-end"
      >
        {(state) => (
          <>
            {state.error ? (
              <div className="lg:col-span-5">
                <Alert variant="error">{state.error}</Alert>
              </div>
            ) : null}
            {state.message ? (
              <div className="lg:col-span-5">
                <Alert variant="success">{state.message}</Alert>
              </div>
            ) : null}
            <input type="hidden" name="id" value={row.id} />
            <Field label="From" htmlFor={`from-${row.id}`}>
              <input
                id={`from-${row.id}`}
                name="fromPath"
                defaultValue={row.fromPath}
                className={`${inputClass} font-mono text-xs`}
                required
              />
            </Field>
            <span className="hidden pb-2 text-sm text-muted lg:block">→</span>
            <Field label="Code" htmlFor={`code-${row.id}`}>
              <CodeSelect name="code" defaultValue={row.code} />
            </Field>
            <Field label="To" htmlFor={`to-${row.id}`}>
              <input
                id={`to-${row.id}`}
                name="toPath"
                defaultValue={row.toPath}
                className={`${inputClass} font-mono text-xs`}
                required
              />
            </Field>
            <div className="flex gap-2 pb-0.5">
              <SubmitButton variant="outline" pendingLabel="Saving…">
                Save
              </SubmitButton>
            </div>
          </>
        )}
      </ActionForm>

      <div className="mt-3 border-t border-black/5 pt-3">
        <ActionForm action={deleteRedirectAction}>
          {(state) => (
            <>
              {state.error ? (
                <Alert variant="error">{state.error}</Alert>
              ) : null}
              {state.message ? (
                <Alert variant="success">{state.message}</Alert>
              ) : null}
              <input type="hidden" name="id" value={row.id} />
              <SubmitButton
                variant="danger"
                pendingLabel="Deleting…"
                confirm={`Delete the redirect for ${row.fromPath}?`}
              >
                Delete
              </SubmitButton>
            </>
          )}
        </ActionForm>
      </div>
    </li>
  );
}

export function RedirectsManager({ rows }: { rows: RedirectRow[] }) {
  return (
    <div className="space-y-8">
      <section className={cardClass}>
        <h2 className="font-heading text-lg font-bold text-ink">
          Add a redirect
        </h2>
        <p className="mt-1 text-sm text-muted">
          Permanently (301) or temporarily (302) point an old URL at a new one.
          Applied on the public site before the page renders.
        </p>
        <div className="mt-5">
          <CreateForm />
        </div>
      </section>

      <section>
        <h2 className="mb-4 font-heading text-lg font-bold text-ink">
          Redirects ({rows.length})
        </h2>
        {rows.length === 0 ? (
          <p className="rounded-brand border border-dashed border-black/20 p-8 text-center text-sm text-muted">
            No redirects yet.
          </p>
        ) : (
          <ul className="space-y-4">
            {rows.map((row) => (
              <RedirectCard key={row.id} row={row} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
