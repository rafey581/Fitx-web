"use client";

import type { ReactNode } from "react";

import { MediaPicker } from "@/components/admin/media-picker";
import { hintTextClass, inputClass, labelClass } from "@/components/ui/styles";

/**
 * Small client-side field primitives shared by every section admin form
 * (src/components/sections/forms.tsx). They are controlled components: the
 * builder owns the draft-content state and hands each field a value + updater.
 */

export function TextField({
  label,
  value,
  onChange,
  placeholder,
  hint,
  textarea = false,
  rows = 3,
  maxLength,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  hint?: string;
  textarea?: boolean;
  rows?: number;
  maxLength?: number;
}) {
  return (
    <label className="block">
      <span className={labelClass}>{label}</span>
      {textarea ? (
        <textarea
          value={value}
          maxLength={maxLength}
          rows={rows}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
          className={inputClass}
        />
      ) : (
        <input
          type="text"
          value={value}
          maxLength={maxLength}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
          className={inputClass}
        />
      )}
      {hint ? <span className={hintTextClass}>{hint}</span> : null}
    </label>
  );
}

export function Toggle({
  label,
  checked,
  onChange,
  hint,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  hint?: string;
}) {
  return (
    <label className="flex items-start gap-2.5">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-0.5 h-4 w-4"
      />
      <span>
        <span className="block text-sm font-medium text-ink">{label}</span>
        {hint ? <span className={hintTextClass}>{hint}</span> : null}
      </span>
    </label>
  );
}

export type SelectOption = { value: string; label: string };

export function SelectField({
  label,
  value,
  options,
  onChange,
  hint,
}: {
  label: string;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className={labelClass}>{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={inputClass}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {hint ? <span className={hintTextClass}>{hint}</span> : null}
    </label>
  );
}

export function NumberField({
  label,
  value,
  onChange,
  min,
  max,
  hint,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className={labelClass}>{label}</span>
      <input
        type="number"
        value={Number.isFinite(value) ? value : 0}
        min={min}
        max={max}
        onChange={(event) => onChange(event.target.valueAsNumber)}
        className={inputClass}
      />
      {hint ? <span className={hintTextClass}>{hint}</span> : null}
    </label>
  );
}

/** Image picker backed by the media library. */
export function MediaField({
  label,
  value,
  onChange,
  media,
  hint,
  name,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  media: { id: string; thumb: string; filename: string }[];
  hint?: string;
  /** Hidden-input name (only matters inside a real server-action form). */
  name?: string;
}) {
  return (
    <MediaPicker
      name={name ?? `media-${label}`}
      value={value || null}
      media={media}
      label={label}
      hint={hint}
      onChange={onChange}
    />
  );
}

/**
 * Generic additive list editor. `minItems` protects required rows (the remove
 * button disappears once the minimum is reached).
 */
export function Repeater<T>({
  items,
  onChange,
  newItem,
  addLabel,
  renderItem,
  minItems = 1,
}: {
  items: T[];
  onChange: (items: T[]) => void;
  newItem: () => T;
  addLabel: string;
  renderItem: (
    item: T,
    index: number,
    updaters: {
      /** Merge a partial patch into the item (object items). */
      update: (patch: Partial<T>) => void;
      /** Replace the whole item (e.g. string items like bullets). */
      set: (next: T) => void;
      remove: () => void;
    },
  ) => ReactNode;
  minItems?: number;
}) {
  const update = (index: number, patch: Partial<T>) =>
    onChange(
      items.map((item, i) =>
        i === index ? ({ ...item, ...patch } as T) : item,
      ),
    );

  const set = (index: number, next: T) =>
    onChange(items.map((item, i) => (i === index ? next : item)));

  const remove = (index: number) =>
    onChange(items.filter((_, i) => i !== index));

  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <div
          key={index}
          className="rounded-brand border border-black/10 bg-black/[0.02] p-3"
        >
          {renderItem(item, index, {
            update: (patch) => update(index, patch),
            set: (next) => set(index, next),
            remove:
              items.length > minItems ? () => remove(index) : () => undefined,
          })}
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...items, newItem()])}
        className="btn btn-outline px-4 py-2 text-[0.7rem]"
      >
        {addLabel}
      </button>
    </div>
  );
}
