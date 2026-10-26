"use client";

import { Alert } from "@/components/ui/field";
import { ActionForm } from "@/components/ui/action-form";
import { inputClass } from "@/components/ui/styles";
import { SubmitButton } from "@/components/ui/submit-button";
import { formatDateTime } from "@/lib/format";
import {
  deleteMediaAction,
  updateMediaAction,
  uploadMediaAction,
} from "@/server/actions/media";

export type MediaRow = {
  id: string;
  filename: string;
  mime: string;
  size: number;
  width: number | null;
  height: number | null;
  alt: string | null;
  caption: string | null;
  folder: string;
  createdAt: string;
  thumb: string;
  thumb480: string;
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function UploadForm({
  canWrite,
  maxUploadMb,
  folders,
}: {
  canWrite: boolean;
  maxUploadMb: number;
  folders: string[];
}) {
  if (!canWrite) return null;
  return (
    <ActionForm action={uploadMediaAction} className="space-y-4">
      {(state) => (
        <>
          {state.error ? <Alert variant="error">{state.error}</Alert> : null}
          {state.message ? (
            <Alert variant="success">{state.message}</Alert>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-[1fr_220px_auto]">
            <input
              type="file"
              name="files[]"
              multiple
              accept="image/jpeg,image/png,image/webp,image/gif,image/avif,image/svg+xml,video/mp4"
              className="block w-full text-sm"
              required
            />
            <input
              type="text"
              name="folder"
              list="media-folders"
              defaultValue="general"
              aria-label="Folder"
              placeholder="Folder (e.g. trainers)"
              className={inputClass}
            />
            <datalist id="media-folders">
              {folders.map((folder) => (
                <option key={folder} value={folder} />
              ))}
            </datalist>
            <SubmitButton pendingLabel="Uploading…">Upload</SubmitButton>
          </div>
          <p className="text-xs text-muted">
            JPG, PNG, WebP, GIF, AVIF, SVG or MP4 · max {maxUploadMb} MB per
            file. Photos are automatically converted to responsive WebP sizes.
            SVG files containing scripts are rejected for safety.
          </p>
        </>
      )}
    </ActionForm>
  );
}

function MediaCard({
  media,
  canEdit,
  canDelete,
  folders,
}: {
  media: MediaRow;
  canEdit: boolean;
  canDelete: boolean;
  folders: string[];
}) {
  return (
    <li className="overflow-hidden rounded-brand border border-black/10 bg-white shadow-sm">
      <div className="grid aspect-[4/3] place-items-center overflow-hidden bg-black/[0.03]">
        {media.mime.startsWith("image/") ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={media.thumb480}
            alt={media.alt ?? media.filename}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="text-xs font-semibold text-muted uppercase">
            Video
          </span>
        )}
      </div>

      <div className="space-y-3 p-4">
        <div>
          <p
            className="truncate text-sm font-semibold text-ink"
            title={media.filename}
          >
            {media.filename}
          </p>
          <p className="mt-0.5 text-xs text-muted">
            {media.width && media.height
              ? `${media.width}×${media.height} · `
              : ""}
            {formatBytes(media.size)} · {media.folder}
          </p>
          <p className="text-xs text-muted">
            {formatDateTime(media.createdAt)}
          </p>
        </div>

        {canEdit ? (
          <ActionForm action={updateMediaAction} className="space-y-2">
            {(state) => (
              <>
                {state.error ? (
                  <Alert variant="error">{state.error}</Alert>
                ) : null}
                {state.message ? (
                  <Alert variant="success">{state.message}</Alert>
                ) : null}
                <input type="hidden" name="id" value={media.id} />
                <input
                  type="text"
                  name="alt"
                  defaultValue={media.alt ?? ""}
                  placeholder="Alt text"
                  aria-label="Alt text"
                  className={inputClass}
                />
                <input
                  type="text"
                  name="caption"
                  defaultValue={media.caption ?? ""}
                  placeholder="Caption"
                  aria-label="Caption"
                  className={inputClass}
                />
                <div className="flex gap-2">
                  <input
                    type="text"
                    name="folder"
                    list={`folders-${media.id}`}
                    defaultValue={media.folder}
                    aria-label="Folder"
                    className={inputClass}
                  />
                  <datalist id={`folders-${media.id}`}>
                    {folders.map((folder) => (
                      <option key={folder} value={folder} />
                    ))}
                  </datalist>
                  <SubmitButton variant="outline" pendingLabel="Saving…">
                    Save
                  </SubmitButton>
                </div>
              </>
            )}
          </ActionForm>
        ) : null}

        {canDelete ? (
          <ActionForm action={deleteMediaAction}>
            {(state) => (
              <>
                {state.error ? (
                  <Alert variant="error">{state.error}</Alert>
                ) : null}
                <input type="hidden" name="id" value={media.id} />
                <SubmitButton
                  variant="danger"
                  pendingLabel="Deleting…"
                  confirm={`Delete ${media.filename}? This cannot be undone.`}
                  className="w-full"
                >
                  Delete
                </SubmitButton>
              </>
            )}
          </ActionForm>
        ) : null}
      </div>
    </li>
  );
}

export function MediaManager({
  rows,
  folders,
  maxUploadMb,
  canWrite,
  canDelete,
}: {
  rows: MediaRow[];
  folders: string[];
  maxUploadMb: number;
  canWrite: boolean;
  canDelete: boolean;
}) {
  const canEdit = canWrite;

  return (
    <div className="space-y-8">
      <section className="rounded-brand border border-black/10 bg-white p-6 shadow-sm">
        <h2 className="font-heading text-lg font-bold text-ink">
          Upload media
        </h2>
        <div className="mt-5">
          <UploadForm
            canWrite={canWrite}
            maxUploadMb={maxUploadMb}
            folders={folders}
          />
        </div>
      </section>

      <section>
        <h2 className="mb-4 font-heading text-lg font-bold text-ink">
          Library ({rows.length})
        </h2>
        {rows.length === 0 ? (
          <p className="rounded-brand border border-dashed border-black/20 p-8 text-center text-sm text-muted">
            No media yet — upload a logo or photo above.
          </p>
        ) : (
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {rows.map((media) => (
              <MediaCard
                key={media.id}
                media={media}
                canEdit={canEdit}
                canDelete={canDelete}
                folders={folders}
              />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
