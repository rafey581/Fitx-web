"use client";

import { useState, type ReactNode } from "react";

import {
  MediaPicker,
  type MediaPickerItem,
} from "@/components/admin/media-picker";
import { ActionForm } from "@/components/ui/action-form";
import { Alert, Field } from "@/components/ui/field";
import { cardClass, inputClass } from "@/components/ui/styles";
import { SubmitButton } from "@/components/ui/submit-button";
import type { ActionState } from "@/server/actions/types";

/**
 * Config-driven CRUD surface shared by the Phase 4 content modules (trainers,
 * services, plans, testimonials, gallery, timetable). Each admin page fetches
 * rows and hands this component a field spec + the server actions it may call;
 * the actions themselves re-check `content:write` on the server.
 */
export type ServerAction = (
  prev: ActionState,
  formData: FormData,
) => Promise<ActionState>;

export type { MediaPickerItem } from "@/components/admin/media-picker";

export type ModuleField =
  | {
      kind: "text";
      name: string;
      label: string;
      required?: boolean;
      placeholder?: string;
      maxLength?: number;
      hint?: string;
      wide?: boolean;
    }
  | {
      kind: "textarea";
      name: string;
      label: string;
      rows?: number;
      maxLength?: number;
      hint?: string;
      wide?: boolean;
    }
  | { kind: "number"; name: string; label: string; min?: number; max?: number }
  | { kind: "checkbox"; name: string; label: string; wide?: boolean }
  | {
      kind: "select";
      name: string;
      label: string;
      options: { value: string; label: string }[];
    }
  | { kind: "media"; name: string; label: string; hint?: string }
  | { kind: "list"; name: string; label: string; hint?: string; wide?: boolean }
  | {
      kind: "mediaMulti";
      name: string;
      label: string;
      hint?: string;
      wide?: boolean;
    };

export type ModuleRow = {
  id: string;
  values: Record<string, string | number | boolean | string[] | null>;
  title: string;
  subtitle?: string;
  thumb?: string | null;
  published: boolean;
  viewHref?: string;
};

const DAY_OPTIONS = [
  { value: "1", label: "Monday" },
  { value: "2", label: "Tuesday" },
  { value: "3", label: "Wednesday" },
  { value: "4", label: "Thursday" },
  { value: "5", label: "Friday" },
  { value: "6", label: "Saturday" },
  { value: "0", label: "Sunday" },
];

export const dayOptions = DAY_OPTIONS;

/** Editable list of short strings, serialised to a hidden JSON input. */
function StringListInput({
  name,
  label,
  hint,
  items,
  id,
}: {
  name: string;
  label: string;
  hint?: string;
  items: string[];
  id: string;
}) {
  const [list, setList] = useState<string[]>(items);
  const [draft, setDraft] = useState("");

  const add = () => {
    const value = draft.trim();
    if (!value || list.includes(value)) return;
    setList([...list, value]);
    setDraft("");
  };

  return (
    <div>
      <span className="mb-1 block text-xs font-semibold tracking-wide text-muted uppercase">
        {label}
      </span>
      <input type="hidden" name={name} value={JSON.stringify(list)} />
      <div className="flex gap-2">
        <input
          id={id}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              add();
            }
          }}
          className={inputClass}
          placeholder="Type and press Enter"
        />
        <button
          type="button"
          onClick={add}
          className="rounded-brand border border-black/20 px-3 text-sm font-semibold text-ink hover:bg-black/[0.04]"
        >
          Add
        </button>
      </div>
      {list.length > 0 ? (
        <ul className="mt-2 flex flex-wrap gap-2">
          {list.map((item) => (
            <li
              key={item}
              className="inline-flex items-center gap-2 rounded-full bg-black/5 px-3 py-1 text-xs font-semibold text-ink"
            >
              {item}
              <button
                type="button"
                aria-label={`Remove ${item}`}
                onClick={() => setList(list.filter((entry) => entry !== item))}
                className="text-muted hover:text-red-600"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      {hint ? <p className="mt-1 text-xs text-muted">{hint}</p> : null}
    </div>
  );
}

function toArray(value: ModuleRow["values"][string] | undefined): string[] {
  if (Array.isArray(value)) return value.map((entry) => String(entry));
  return [];
}

/** Multi-image picker (used by the services gallery): hidden JSON list input. */
function MediaMultiSelect({
  name,
  label,
  hint,
  items,
  selected,
  id,
}: {
  name: string;
  label: string;
  hint?: string;
  items: MediaPickerItem[];
  selected: string[];
  id: string;
}) {
  const [picked, setPicked] = useState<string[]>(selected);
  const toggle = (mediaId: string) => {
    setPicked((current) =>
      current.includes(mediaId)
        ? current.filter((entry) => entry !== mediaId)
        : [...current, mediaId],
    );
  };
  return (
    <div>
      <span className="mb-1 block text-xs font-semibold tracking-wide text-muted uppercase">
        {label}
      </span>
      <input type="hidden" name={name} value={JSON.stringify(picked)} />
      <p className="mb-2" id={`${id}-hint`}>
        <span className="text-xs text-muted">{hint}</span>
      </p>
      {items.length === 0 ? (
        <p className="text-xs text-muted">
          Upload images in the Media library first.
        </p>
      ) : (
        <ul className="grid max-h-56 grid-cols-3 gap-2 overflow-y-auto rounded-brand border border-black/10 p-2 sm:grid-cols-4">
          {items.map((item) => {
            const on = picked.includes(item.id);
            return (
              <li key={item.id}>
                <label
                  className={`block cursor-pointer overflow-hidden rounded-brand border-2 ${
                    on ? "border-accent" : "border-transparent"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.thumb}
                    alt={item.filename}
                    className="h-16 w-full object-cover"
                  />
                  <span className="flex items-center justify-center bg-black/5 py-0.5 text-[0.65rem] font-semibold">
                    {on ? "✓ Selected" : "Select"}
                  </span>
                  <input
                    type="checkbox"
                    checked={on}
                    onChange={() => toggle(item.id)}
                    className="sr-only"
                  />
                </label>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function FormFields({
  fields,
  media,
  row,
  state,
  idPrefix,
}: {
  fields: ModuleField[];
  media: MediaPickerItem[];
  row?: ModuleRow;
  state: ActionState;
  idPrefix: string;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {fields.map((field) => {
        const raw = row?.values[field.name];
        const id = `${idPrefix}-${field.name}`;
        const error =
          field.kind === "list" ||
          field.kind === "checkbox" ||
          field.kind === "mediaMulti"
            ? undefined
            : state.fieldErrors?.[field.name]?.[0];
        const wide =
          ("wide" in field && field.wide) ||
          field.kind === "textarea" ||
          field.kind === "list" ||
          field.kind === "mediaMulti";

        let control: ReactNode;
        switch (field.kind) {
          case "text":
            control = (
              <Field
                label={field.label}
                htmlFor={id}
                error={error}
                hint={field.hint}
              >
                <input
                  id={id}
                  name={field.name}
                  defaultValue={typeof raw === "string" ? raw : ""}
                  className={inputClass}
                  required={field.required}
                  placeholder={field.placeholder}
                  maxLength={field.maxLength}
                />
              </Field>
            );
            break;
          case "textarea":
            control = (
              <Field
                label={field.label}
                htmlFor={id}
                error={error}
                hint={field.hint}
              >
                <textarea
                  id={id}
                  name={field.name}
                  defaultValue={typeof raw === "string" ? raw : ""}
                  rows={field.rows ?? 4}
                  className={inputClass}
                  maxLength={field.maxLength}
                />
              </Field>
            );
            break;
          case "number":
            control = (
              <Field label={field.label} htmlFor={id} error={error}>
                <input
                  id={id}
                  name={field.name}
                  type="number"
                  min={field.min}
                  max={field.max}
                  defaultValue={
                    typeof raw === "number" ? raw : Number(raw ?? 0) || 0
                  }
                  className={inputClass}
                />
              </Field>
            );
            break;
          case "checkbox":
            control = (
              <label className="mt-6 flex items-center gap-2 text-sm font-medium text-ink">
                <input
                  type="checkbox"
                  name={field.name}
                  defaultChecked={row ? Boolean(row.values[field.name]) : true}
                  className="h-4 w-4"
                />
                {field.label}
              </label>
            );
            break;
          case "select":
            control = (
              <Field label={field.label} htmlFor={id} error={error}>
                <select
                  id={id}
                  name={field.name}
                  defaultValue={
                    typeof raw === "string" || typeof raw === "number"
                      ? String(raw)
                      : ""
                  }
                  className={inputClass}
                >
                  {field.options.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </Field>
            );
            break;
          case "media":
            control = (
              <MediaPicker
                name={field.name}
                value={typeof raw === "string" ? raw : ""}
                media={media}
                label={field.label}
                hint={field.hint}
              />
            );
            break;
          case "list":
            control = (
              <StringListInput
                id={id}
                name={field.name}
                label={field.label}
                hint={field.hint}
                items={toArray(raw)}
              />
            );
            break;
          case "mediaMulti":
            control = (
              <MediaMultiSelect
                id={id}
                name={field.name}
                label={field.label}
                hint={field.hint}
                items={media}
                selected={toArray(raw)}
              />
            );
            break;
        }

        return (
          <div key={field.name} className={wide ? "sm:col-span-2" : undefined}>
            {control}
          </div>
        );
      })}
    </div>
  );
}

function MoveForm({
  module,
  id,
  moveAction,
}: {
  module: string;
  id: string;
  moveAction: ServerAction;
}) {
  return (
    <ActionForm action={moveAction}>
      {() => (
        <>
          <input type="hidden" name="module" value={module} />
          <input type="hidden" name="id" value={id} />
          <div className="flex gap-1">
            <button
              type="submit"
              name="direction"
              value="up"
              className="rounded-brand border border-black/15 px-2 py-1 text-xs font-semibold text-ink hover:bg-black/[0.04]"
              aria-label="Move up"
            >
              ↑
            </button>
            <button
              type="submit"
              name="direction"
              value="down"
              className="rounded-brand border border-black/15 px-2 py-1 text-xs font-semibold text-ink hover:bg-black/[0.04]"
              aria-label="Move down"
            >
              ↓
            </button>
          </div>
        </>
      )}
    </ActionForm>
  );
}

export function ModuleManager({
  module,
  heading,
  intro,
  createLabel,
  fields,
  rows,
  media,
  createAction,
  updateAction,
  deleteAction,
  moveAction,
  canWrite,
}: {
  module: string;
  heading: string;
  intro: string;
  createLabel: string;
  fields: ModuleField[];
  rows: ModuleRow[];
  media: MediaPickerItem[];
  createAction: ServerAction;
  updateAction: ServerAction;
  deleteAction: ServerAction;
  moveAction: ServerAction;
  canWrite: boolean;
}) {
  return (
    <div className="mx-auto w-full max-w-5xl space-y-8">
      <header>
        <p className="eyebrow">Content</p>
        <h1 className="heading-display mt-2 text-3xl text-ink">{heading}</h1>
        <p className="mt-2 text-sm text-muted">{intro}</p>
      </header>

      {canWrite ? (
        <section className={cardClass}>
          <h2 className="font-heading text-lg font-bold text-ink">
            {createLabel}
          </h2>
          <div className="mt-4">
            <ActionForm action={createAction}>
              {(state) => (
                <div className="space-y-4">
                  {state.error ? (
                    <Alert variant="error">{state.error}</Alert>
                  ) : null}
                  {state.ok && state.message ? (
                    <Alert variant="success">{state.message}</Alert>
                  ) : null}
                  <FormFields
                    fields={fields}
                    media={media}
                    state={state}
                    idPrefix="new"
                  />
                  <SubmitButton>Add</SubmitButton>
                </div>
              )}
            </ActionForm>
          </div>
        </section>
      ) : null}

      <section className="space-y-3">
        <h2 className="font-heading text-lg font-bold text-ink">
          {rows.length} {rows.length === 1 ? "item" : "items"}
        </h2>
        {rows.length === 0 ? (
          <p className={cardClass}>Nothing here yet.</p>
        ) : (
          <ul className="space-y-3">
            {rows.map((row) => (
              <li key={row.id} className={cardClass}>
                <div className="flex flex-wrap items-center gap-4">
                  {row.thumb ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={row.thumb}
                      alt=""
                      className="h-12 w-12 rounded-brand object-cover"
                    />
                  ) : null}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-ink">
                      {row.title}
                    </p>
                    {row.subtitle ? (
                      <p className="truncate text-xs text-muted">
                        {row.subtitle}
                      </p>
                    ) : null}
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[0.65rem] font-bold uppercase ${
                      row.published
                        ? "bg-green-100 text-green-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {row.published ? "Published" : "Draft"}
                  </span>
                  {row.viewHref ? (
                    <a
                      href={row.viewHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-semibold text-accent hover:underline"
                    >
                      View
                    </a>
                  ) : null}
                  {canWrite ? (
                    <MoveForm
                      module={module}
                      id={row.id}
                      moveAction={moveAction}
                    />
                  ) : null}
                </div>

                {canWrite ? (
                  <details className="mt-4">
                    <summary className="cursor-pointer text-xs font-semibold text-muted uppercase">
                      Edit
                    </summary>
                    <div className="mt-4">
                      <ActionForm action={updateAction}>
                        {(state) => (
                          <div className="space-y-4">
                            {state.error ? (
                              <Alert variant="error">{state.error}</Alert>
                            ) : null}
                            {state.ok && state.message ? (
                              <Alert variant="success">{state.message}</Alert>
                            ) : null}
                            <input type="hidden" name="id" value={row.id} />
                            <input
                              type="hidden"
                              name="sortOrder"
                              value={
                                typeof row.values.sortOrder === "number"
                                  ? row.values.sortOrder
                                  : 0
                              }
                            />
                            <FormFields
                              fields={fields}
                              media={media}
                              row={row}
                              state={state}
                              idPrefix={row.id}
                            />
                            <div className="flex items-center gap-3">
                              <SubmitButton>Save</SubmitButton>
                            </div>
                          </div>
                        )}
                      </ActionForm>

                      <ActionForm action={deleteAction}>
                        {(state) => (
                          <div className="mt-4 border-t border-black/5 pt-4">
                            {state.error ? (
                              <Alert variant="error">{state.error}</Alert>
                            ) : null}
                            <input type="hidden" name="module" value={module} />
                            <input type="hidden" name="id" value={row.id} />
                            <SubmitButton
                              variant="danger"
                              confirm={`Delete “${row.title}”? This cannot be undone.`}
                            >
                              Delete
                            </SubmitButton>
                          </div>
                        )}
                      </ActionForm>
                    </div>
                  </details>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
