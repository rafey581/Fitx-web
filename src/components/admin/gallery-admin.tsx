"use client";

import Link from "next/link";
import { useActionState, useRef, useState } from "react";

import { SubmitButton } from "@/components/ui/submit-button";
import { cardClass, errorTextClass, hintTextClass, inputClass, labelClass } from "@/components/ui/styles";
import { galleryCategories } from "@/lib/fitx/gallery";
import { initialActionState, type ActionState } from "@/server/actions/types";

type Action = (state: ActionState, formData: FormData) => Promise<ActionState>;

/**
 * Phone photos are often 5–10 MB. Shrink each to at most 2000px (JPEG) in the
 * browser so several upload at once, quickly, within the server's size limit.
 */
async function shrink(file: File): Promise<File> {
  if (!file.type.startsWith("image/")) return file;
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    const scale = Math.min(1, 2000 / Math.max(bitmap.width, bitmap.height));
    if (scale === 1 && file.size < 1.5 * 1024 * 1024) return file;
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.86));
    if (!blob) return file;
    return new File([blob], file.name.replace(/\.\w+$/, "") + ".jpg", { type: "image/jpeg" });
  } catch {
    return file;
  }
}

function CategoryPicker({ value, onChange, name = "category" }: { value: string; onChange: (v: string) => void; name?: string }) {
  return (
    <div className="flex flex-wrap gap-2">
      {galleryCategories.map((c) => (
        <label
          key={c.id}
          className={`cursor-pointer rounded-full border px-4 py-2 text-sm transition ${
            value === c.id ? "border-accent bg-accent text-white" : "border-black/15 text-ink hover:border-accent"
          }`}
        >
          <input type="radio" name={name} value={c.id} checked={value === c.id} onChange={() => onChange(c.id)} className="sr-only" />
          {c.label}
        </label>
      ))}
    </div>
  );
}

/** Upload several photos at once into one category. */
export function GalleryUploader({ action }: { action: Action }) {
  const [state, formAction] = useActionState(action, initialActionState);
  const [category, setCategory] = useState("studio");
  const [previews, setPreviews] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const errors = state.fieldErrors ?? {};

  async function onPick(files: FileList | null) {
    if (!files?.length || !input.current) return;
    setBusy(true);
    const shrunk = await Promise.all(Array.from(files).map(shrink));
    const list = new DataTransfer();
    shrunk.forEach((f) => list.items.add(f));
    input.current.files = list.files;
    setPreviews(shrunk.map((f) => URL.createObjectURL(f)));
    setBusy(false);
  }

  return (
    <form action={formAction} className={`${cardClass} space-y-5`}>
      <h2 className="font-heading text-lg font-extrabold text-ink">Upload photos</h2>
      {state.error ? (
        <p role="alert" className="rounded-brand bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {state.message ? `${state.message} ` : ""}
          {state.error}
        </p>
      ) : null}
      <div>
        <p className={labelClass}>Category</p>
        <CategoryPicker value={category} onChange={setCategory} />
        {errors.category?.map((e) => (
          <p key={e} className={errorTextClass}>
            {e}
          </p>
        ))}
      </div>
      <div>
        <p className={labelClass}>Photos</p>
        <label className="btn btn-outline cursor-pointer">
          {previews.length ? "Choose different photos" : "Choose photos"}
          <input
            ref={input}
            type="file"
            name="photos"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="sr-only"
            onChange={(e) => onPick(e.target.files)}
          />
        </label>
        <p className={hintTextClass}>You can select several photos at once (JPG, PNG or WebP). Large photos are resized automatically.</p>
        {errors.photos?.map((e) => (
          <p key={e} className={errorTextClass}>
            {e}
          </p>
        ))}
        {busy ? <p className={hintTextClass}>Preparing photos…</p> : null}
        {previews.length ? (
          <ul className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-6">
            {previews.map((src) => (
              <li key={src}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="" className="aspect-square w-full rounded-brand object-cover" />
              </li>
            ))}
          </ul>
        ) : null}
      </div>
      <SubmitButton pendingLabel="Uploading…" disabled={busy || previews.length === 0}>
        {previews.length > 1 ? `Upload ${previews.length} photos` : "Upload photo"}
      </SubmitButton>
    </form>
  );
}

/** Edit one photo: caption, category and an optional replacement picture. */
export function GalleryPhotoForm({
  action,
  id,
  src,
  caption,
  category: initialCategory,
}: {
  action: Action;
  id: string;
  src: string;
  caption: string;
  category: string;
}) {
  const [state, formAction] = useActionState(action, initialActionState);
  const [category, setCategory] = useState(initialCategory);
  const [preview, setPreview] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const errors = state.fieldErrors ?? {};

  async function onPick(files: FileList | null) {
    const file = files?.[0];
    if (!file || !input.current) return;
    const small = await shrink(file);
    const list = new DataTransfer();
    list.items.add(small);
    input.current.files = list.files;
    setPreview(URL.createObjectURL(small));
  }

  return (
    <form action={formAction} className={`${cardClass} max-w-3xl space-y-6`}>
      <input type="hidden" name="id" value={id} />
      {state.error ? (
        <p role="alert" className="rounded-brand bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {state.error}
        </p>
      ) : null}
      <div className="flex flex-wrap items-end gap-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={preview ?? src} alt="" className="max-h-64 rounded-brand border border-black/10 object-contain" />
        <label className="btn btn-outline cursor-pointer">
          Replace photo
          <input
            ref={input}
            type="file"
            name="photo"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            onChange={(e) => onPick(e.target.files)}
          />
        </label>
      </div>
      {errors.photo?.map((e) => (
        <p key={e} className={errorTextClass}>
          {e}
        </p>
      ))}
      <div>
        <label htmlFor="caption" className={labelClass}>
          Caption (optional)
        </label>
        <input
          id="caption"
          name="caption"
          defaultValue={caption}
          maxLength={200}
          placeholder="e.g. Coached deadlifts on the studio floor"
          className={inputClass}
        />
        <p className={hintTextClass}>Shown when the photo is opened, and read by Google.</p>
        {errors.caption?.map((e) => (
          <p key={e} className={errorTextClass}>
            {e}
          </p>
        ))}
      </div>
      <div>
        <p className={labelClass}>Category</p>
        <CategoryPicker value={category} onChange={setCategory} />
      </div>
      <div className="flex flex-wrap gap-3 border-t border-black/10 pt-5">
        <SubmitButton pendingLabel="Saving…">Save changes</SubmitButton>
        <Link href="/admin/gallery" className="btn btn-outline">
          Cancel
        </Link>
      </div>
    </form>
  );
}
