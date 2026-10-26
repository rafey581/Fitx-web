"use client";

import { ActionForm } from "@/components/ui/action-form";
import { Field } from "@/components/ui/field";
import { inputClass } from "@/components/ui/styles";
import { SubmitButton } from "@/components/ui/submit-button";
import { createPageAction } from "@/server/actions/pages";

/**
 * Create-page form. Submitting creates a DRAFT page and redirects into the
 * block builder for it. `copyFrom` clones another page's draft sections so a
 * new page can start from a familiar layout.
 */
export function NewPageForm({
  pages,
}: {
  pages: { id: string; title: string; sectionCount: number }[];
}) {
  return (
    <ActionForm action={createPageAction} className="space-y-5">
      {(state) => (
        <>
          <Field
            label="Page name"
            htmlFor="page-title"
            error={state.fieldErrors?.title?.[0]}
          >
            <input
              id="page-title"
              name="title"
              required
              maxLength={200}
              placeholder="e.g. Offers"
              className={inputClass}
            />
          </Field>

          <Field
            label="Web address (slug)"
            htmlFor="page-slug"
            hint="Leave blank to auto-generate from the name — e.g. /offers"
          >
            <input
              id="page-slug"
              name="slug"
              maxLength={80}
              placeholder="offers"
              className={inputClass}
            />
          </Field>

          <Field
            label="Start from an existing page"
            htmlFor="page-copy"
            hint="Copies its sections as a starting draft (the original is untouched)."
          >
            <select id="page-copy" name="copyFrom" className={inputClass}>
              <option value="">Empty page</option>
              {pages.map((page) => (
                <option key={page.id} value={page.id}>
                  {page.title} ({page.sectionCount} section
                  {page.sectionCount === 1 ? "" : "s"})
                </option>
              ))}
            </select>
          </Field>

          {state.message ? (
            <p role="status" className="text-sm font-medium text-emerald-700">
              {state.message}
            </p>
          ) : null}
          {state.error ? (
            <p role="alert" className="text-sm font-medium text-red-600">
              {state.error}
            </p>
          ) : null}

          <div className="flex flex-wrap gap-3 pt-2">
            <SubmitButton className="px-5 py-2.5 text-[0.7rem]">
              Create & open builder
            </SubmitButton>
          </div>
        </>
      )}
    </ActionForm>
  );
}
