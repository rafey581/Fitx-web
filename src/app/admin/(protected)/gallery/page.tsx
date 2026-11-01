import type { Metadata } from "next";
import Link from "next/link";

import { GalleryUploader } from "@/components/admin/gallery-admin";
import { SubmitButton } from "@/components/ui/submit-button";
import { cardClass } from "@/components/ui/styles";
import { requirePermission } from "@/lib/auth/server";
import { galleryCategories, type GalleryCategory } from "@/lib/fitx/gallery";
import { galleryRows } from "@/lib/fitx/gallery-data";
import { deleteGalleryPhotoAction, uploadGalleryPhotosAction } from "@/server/actions/simple-content";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Gallery" };

const label = (c: GalleryCategory) => galleryCategories.find((x) => x.id === c)?.label ?? c;

export default async function AdminGalleryPage(props: PageProps<"/admin/gallery">) {
  await requirePermission("content:write");
  const params = await props.searchParams;
  const filter = typeof params.category === "string" ? params.category : "all";
  const photos = await galleryRows({ all: true });
  const shown = filter === "all" ? photos : photos.filter((p) => p.category === filter);
  const added = Number(params.added ?? 0);
  const notice = added
    ? `Added ${added} photo${added === 1 ? "" : "s"}. ${added === 1 ? "It is" : "They are"} now live on the Gallery page.`
    : params.saved
      ? "Photo saved. It is now live on the Gallery page."
      : params.deleted
        ? "The photo was deleted from the website."
        : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-extrabold text-ink">Gallery</h1>
          <p className="mt-1 text-sm text-muted">Photos on the website’s Gallery page. Newest are shown first.</p>
        </div>
        <Link href="/gallery" target="_blank" className="btn btn-outline">
          View on website ↗
        </Link>
      </div>

      {notice ? (
        <p role="status" className="rounded-brand bg-green-50 px-4 py-3 text-sm font-medium text-green-800">
          {notice}
        </p>
      ) : null}

      <GalleryUploader action={uploadGalleryPhotosAction} />

      <div className="flex flex-wrap gap-2">
        {[{ id: "all", label: "All" }, ...galleryCategories].map((c) => {
          const count = c.id === "all" ? photos.length : photos.filter((p) => p.category === c.id).length;
          return (
            <Link
              key={c.id}
              href={c.id === "all" ? "/admin/gallery" : `/admin/gallery?category=${c.id}`}
              className={`rounded-full border px-4 py-2 text-sm ${
                filter === c.id ? "border-accent bg-accent text-white" : "border-black/15 bg-white text-ink"
              }`}
            >
              {c.label} <span className="opacity-60">{count}</span>
            </Link>
          );
        })}
      </div>

      {shown.length === 0 ? (
        <div className={`${cardClass} text-center text-sm text-muted`}>No photos here yet. Upload some above.</div>
      ) : (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {shown.map((photo) => (
            <li key={photo.id} className={`${cardClass} flex flex-col gap-3 p-3`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photo.src} alt="" loading="lazy" className="aspect-square w-full rounded-brand object-cover" />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold tracking-wide text-accent uppercase">{label(photo.category)}</p>
                <p className="mt-1 line-clamp-2 text-sm text-ink">{photo.alt}</p>
              </div>
              <div className="flex flex-col gap-2">
                <Link href={`/admin/gallery/${photo.id}`} className="btn btn-outline w-full justify-center px-3! py-2!">
                  Edit
                </Link>
                <form action={deleteGalleryPhotoAction}>
                  <input type="hidden" name="id" value={photo.id} />
                  <SubmitButton
                    variant="danger"
                    pendingLabel="…"
                    confirm="Delete this photo? It will be removed from the website."
                    className="w-full justify-center px-3! py-2!"
                  >
                    Delete
                  </SubmitButton>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
