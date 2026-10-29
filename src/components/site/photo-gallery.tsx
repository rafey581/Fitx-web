"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { galleryCategories, type GalleryCategory, type GalleryPhoto } from "@/lib/fitx/gallery";

type Filter = GalleryCategory | "all";

/** Gallery page: filter tabs, a masonry grid and a full-screen viewer (arrows, keys, swipe). */
export function PhotoGallery({ photos }: { photos: GalleryPhoto[] }) {
  const [filter, setFilter] = useState<Filter>("all");
  const [open, setOpen] = useState<number | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const lastTrigger = useRef<HTMLButtonElement | null>(null);
  const touchX = useRef<number | null>(null);

  const shown = filter === "all" ? photos : photos.filter((p) => p.category === filter);
  const tabs: { id: Filter; label: string; count: number }[] = [
    { id: "all", label: "All", count: photos.length },
    ...galleryCategories
      .map((c) => ({ ...c, count: photos.filter((p) => p.category === c.id).length }))
      .filter((c) => c.count > 0),
  ];

  const step = useCallback(
    (dir: number) => setOpen((i) => (i === null ? i : (i + dir + shown.length) % shown.length)),
    [shown.length],
  );

  useEffect(() => {
    if (open === null) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKey);
    document.documentElement.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.documentElement.style.overflow = "";
      lastTrigger.current?.focus();
    };
  }, [open, step]);

  const current = open === null ? null : shown[open];

  return (
    <>
      <div role="tablist" aria-label="Filter photos" className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={filter === tab.id}
            onClick={() => setFilter(tab.id)}
            className={`rounded-full border px-4 py-2 text-sm transition ${
              filter === tab.id
                ? "border-accent bg-accent text-white"
                : "border-white/20 text-white/75 hover:border-accent hover:text-white"
            }`}
          >
            {tab.label} <span className="opacity-60">{tab.count}</span>
          </button>
        ))}
      </div>

      {/* Tiles are buttons, not figures, so the page's scroll-in effect leaves them visible. */}
      <ul className="mt-8 columns-2 gap-3 sm:gap-4 lg:columns-3">
        {shown.map((photo, i) => (
          <li key={photo.src} className="mb-3 break-inside-avoid sm:mb-4">
            <button
              type="button"
              onClick={(e) => {
                lastTrigger.current = e.currentTarget;
                setOpen(i);
              }}
              className="group relative block w-full overflow-hidden rounded-brand border border-white/10 bg-white/5 transition hover:border-accent"
              aria-label={`Open photo: ${photo.alt}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.src}
                alt={photo.alt}
                width={photo.width}
                height={photo.height}
                loading={i < 6 ? "eager" : "lazy"}
                className="h-auto w-full transition duration-700 group-hover:scale-[1.04]"
              />
              <span className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-3 pt-8 pb-2.5 text-left text-xs text-white/90 opacity-0 transition group-hover:opacity-100">
                {photo.alt}
              </span>
            </button>
          </li>
        ))}
      </ul>

      {/* Portal to <body>: the page's scroll-in animation uses `translate`,
          which would otherwise trap this fixed overlay inside the section. */}
      {current && open !== null
        ? createPortal(
            <div
              role="dialog"
              aria-modal="true"
              aria-label={current.alt}
              className="fixed inset-0 z-[80] flex flex-col items-center justify-center bg-black/92 p-4 backdrop-blur-sm"
              onClick={(e) => e.target === e.currentTarget && setOpen(null)}
              onTouchStart={(e) => (touchX.current = e.touches[0]?.clientX ?? null)}
              onTouchEnd={(e) => {
                const start = touchX.current;
                const end = e.changedTouches[0]?.clientX;
                touchX.current = null;
                if (start !== null && end !== undefined && Math.abs(end - start) > 50) step(end < start ? 1 : -1);
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={current.src}
                alt={current.alt}
                className="max-h-[80svh] max-w-full rounded-brand object-contain"
              />
              <p className="mt-4 max-w-xl text-center text-sm text-white/80">{current.alt}</p>
              <button
                ref={closeRef}
                type="button"
                onClick={() => setOpen(null)}
                className="film-btn absolute top-5 right-5"
                style={{ color: "#fff", borderColor: "rgb(255 255 255 / 0.45)" }}
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => step(-1)}
                className="hero-arrow absolute top-1/2 left-3 -translate-y-1/2 sm:left-6"
                aria-label="Previous photo"
              >
                ←
              </button>
              <button
                type="button"
                onClick={() => step(1)}
                className="hero-arrow absolute top-1/2 right-3 -translate-y-1/2 sm:right-6"
                aria-label="Next photo"
              >
                →
              </button>
              <p className="film-mono absolute bottom-5 left-1/2 -translate-x-1/2 text-[11px] text-white/70">
                {String(open + 1).padStart(2, "0")} / {String(shown.length).padStart(2, "0")}
              </p>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
