"use client";

import { useEffect, useRef, useState } from "react";

import { hintTextClass, labelClass } from "@/components/ui/styles";

export type MediaPickerItem = {
  id: string;
  thumb: string;
  filename: string;
};

/**
 * Image picker for admin forms. Renders a hidden input (so it works inside
 * server-action forms), a preview of the current selection and a dialog with
 * the media library grid.
 */
export function MediaPicker({
  name,
  value,
  media,
  label,
  hint,
  onChange,
}: {
  name: string;
  value: string | null;
  media: MediaPickerItem[];
  label: string;
  hint?: string;
  /** Optional callback for controlled parents (e.g. the section builder). */
  onChange?: (id: string) => void;
}) {
  const [selected, setSelected] = useState(value ?? "");
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const chosen = media.find((item) => item.id === selected) ?? null;

  // Close the picker dialog on Escape and return focus to the trigger, so the
  // media picker is usable from the keyboard alone.
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const close = () => {
    setOpen(false);
    triggerRef.current?.focus();
  };

  const apply = (id: string) => {
    setSelected(id);
    onChange?.(id);
  };

  return (
    <div>
      <span className={labelClass}>{label}</span>
      <input type="hidden" name={name} value={selected} />
      <div className="flex items-center gap-3">
        {chosen ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={chosen.thumb}
            alt=""
            className="h-14 w-14 rounded-brand border border-black/10 object-cover"
          />
        ) : (
          <span
            aria-hidden="true"
            className="grid h-14 w-14 place-items-center rounded-brand border border-dashed border-black/30 text-lg text-muted"
          >
            —
          </span>
        )}
        <div className="flex flex-col gap-1.5">
          <button
            ref={triggerRef}
            type="button"
            onClick={() => setOpen(true)}
            aria-label={`${label}: ${chosen ? "change image" : "choose image"}`}
            className="btn btn-outline px-3 py-1.5 text-[0.7rem]"
          >
            {chosen ? "Change image" : "Choose image"}
          </button>
          {chosen ? (
            <button
              type="button"
              onClick={() => apply("")}
              className="text-left text-xs font-medium text-red-600 hover:underline"
            >
              Remove
            </button>
          ) : null}
        </div>
      </div>
      {hint ? <p className={hintTextClass}>{hint}</p> : null}

      {open ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Choose ${label.toLowerCase()}`}
          className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4"
          onClick={close}
        >
          <div
            className="flex max-h-[85vh] w-full max-w-3xl flex-col rounded-brand bg-white p-5 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between gap-4">
              <h3 className="font-heading text-base font-bold text-ink">
                Choose an image
              </h3>
              <button
                type="button"
                onClick={close}
                autoFocus
                aria-label="Close"
                className="grid h-9 w-9 place-items-center rounded-full text-muted hover:bg-black/5 hover:text-ink"
              >
                ✕
              </button>
            </div>

            {media.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted">
                The library is empty — upload media first.
              </p>
            ) : (
              <ul className="grid flex-1 auto-rows-min grid-cols-3 gap-3 overflow-y-auto sm:grid-cols-5">
                {media.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => {
                        apply(item.id);
                        close();
                      }}
                      aria-label={`Select ${item.filename}`}
                      className={`flex w-full flex-col overflow-hidden rounded-brand border text-left ${
                        item.id === selected
                          ? "border-accent ring-2 ring-accent/30"
                          : "border-black/10 hover:border-accent/50"
                      }`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.thumb}
                        alt=""
                        loading="lazy"
                        className="aspect-[4/3] w-full object-cover"
                      />
                      <span className="truncate px-2 py-1.5 text-[0.65rem] text-muted">
                        {item.filename}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
