"use client";

import Link from "next/link";
import { useActionState, useState } from "react";

import { SubmitButton } from "@/components/ui/submit-button";
import { cardClass, errorTextClass, hintTextClass, inputClass, labelClass } from "@/components/ui/styles";
import { initialActionState, type ActionState } from "@/server/actions/types";

export type SimpleFormProps = {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  /** Existing item id when editing. */
  id?: string;
  backHref: string;
  heading: { name: string; label: string; value: string; placeholder?: string };
  text: { name: string; label: string; value: string; rows: number; hint?: string; placeholder?: string };
  /** `removable: false` for a built-in picture that cannot be removed here. */
  photo: { label: string; current: string | null; hint?: string; round?: boolean; removable?: boolean };
  submitLabel: string;
};

/** Heading + text + picture: the whole admin form for a testimonial or a blog post. */
export function SimpleForm({ action, id, backHref, heading, text, photo, submitLabel }: SimpleFormProps) {
  const [state, formAction] = useActionState(action, initialActionState);
  const [preview, setPreview] = useState<string | null>(null);
  const [removed, setRemoved] = useState(false);
  const errors = state.fieldErrors ?? {};
  const shown = preview ?? (removed ? null : photo.current);

  return (
    <form action={formAction} className={`${cardClass} max-w-3xl space-y-6`}>
      {id ? <input type="hidden" name="id" value={id} /> : null}

      {state.error ? (
        <p role="alert" className="rounded-brand bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {state.error}
        </p>
      ) : null}

      <div>
        <label htmlFor={heading.name} className={labelClass}>
          {heading.label}
        </label>
        <input
          id={heading.name}
          name={heading.name}
          defaultValue={heading.value}
          placeholder={heading.placeholder}
          required
          className={`${inputClass} text-base`}
        />
        {errors[heading.name]?.map((e) => (
          <p key={e} className={errorTextClass}>
            {e}
          </p>
        ))}
      </div>

      <div>
        <label htmlFor={text.name} className={labelClass}>
          {text.label}
        </label>
        <textarea
          id={text.name}
          name={text.name}
          defaultValue={text.value}
          placeholder={text.placeholder}
          rows={text.rows}
          required
          className={`${inputClass} text-base leading-relaxed`}
        />
        {text.hint ? <p className={hintTextClass}>{text.hint}</p> : null}
        {errors[text.name]?.map((e) => (
          <p key={e} className={errorTextClass}>
            {e}
          </p>
        ))}
      </div>

      <div>
        <p className={labelClass}>{photo.label}</p>
        <div className="flex flex-wrap items-center gap-4">
          {shown ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={shown}
              alt=""
              className={`border border-black/10 object-cover ${photo.round ? "h-24 w-24 rounded-full" : "h-28 w-44 rounded-brand"}`}
            />
          ) : (
            <span
              className={`grid place-items-center border border-dashed border-black/20 text-xs text-muted ${photo.round ? "h-24 w-24 rounded-full" : "h-28 w-44 rounded-brand"}`}
            >
              No picture
            </span>
          )}
          <div className="space-y-2">
            <label className="btn btn-outline cursor-pointer">
              {shown ? "Change picture" : "Choose picture"}
              <input
                type="file"
                name="photo"
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  setPreview(file ? URL.createObjectURL(file) : null);
                  if (file) setRemoved(false);
                }}
              />
            </label>
            {photo.current && photo.removable !== false && !preview ? (
              <label className="flex items-center gap-2 text-sm text-muted">
                <input type="checkbox" name="removePhoto" checked={removed} onChange={(e) => setRemoved(e.target.checked)} />
                Remove picture
              </label>
            ) : null}
          </div>
        </div>
        {photo.hint ? <p className={hintTextClass}>{photo.hint}</p> : null}
        {errors.photo?.map((e) => (
          <p key={e} className={errorTextClass}>
            {e}
          </p>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3 border-t border-black/10 pt-5">
        <SubmitButton pendingLabel="Saving…">{submitLabel}</SubmitButton>
        <Link href={backHref} className="btn btn-outline">
          Cancel
        </Link>
      </div>
    </form>
  );
}
