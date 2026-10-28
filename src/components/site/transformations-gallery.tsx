"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import type { Transformation } from "@/lib/fitx/transformations";

/** Masonry grid of before/after cards; any card opens full-size in a viewer. */
export function TransformationsGallery({ items }: { items: Transformation[] }) {
  const [open, setOpen] = useState<number | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const lastTrigger = useRef<HTMLButtonElement | null>(null);

  const step = useCallback(
    (dir: number) =>
      setOpen((i) =>
        i === null ? i : (i + dir + items.length) % items.length,
      ),
    [items.length],
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

  return (
    <>
      <ul className="columns-2 gap-4 md:columns-3 lg:columns-4">
        {items.map((item, i) => (
          <li key={item.src} className="mb-4 break-inside-avoid">
            <button
              type="button"
              onClick={(e) => {
                lastTrigger.current = e.currentTarget;
                setOpen(i);
              }}
              className="group block w-full overflow-hidden rounded-brand border border-line bg-black transition hover:border-accent"
              aria-label={`View transformation ${i + 1} of ${items.length}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.src}
                width={item.width}
                height={item.height}
                alt={`FITX client before and after, transformation ${i + 1}`}
                loading="lazy"
                className="h-auto w-full transition duration-500 group-hover:scale-[1.03]"
              />
            </button>
          </li>
        ))}
      </ul>

      {/* Portal to <body>: the page's scroll-in animation uses `translate`,
          which would otherwise trap this fixed overlay inside the section. */}
      {open !== null
        ? createPortal(
            <div
              role="dialog"
              aria-modal="true"
              aria-label={`Transformation ${open + 1} of ${items.length}`}
              className="fixed inset-0 z-[80] flex items-center justify-center bg-black/92 p-4 backdrop-blur-sm"
              onClick={(e) => e.target === e.currentTarget && setOpen(null)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={items[open].src}
                alt={`FITX client before and after, transformation ${open + 1}`}
                className="max-h-[86svh] max-w-full rounded-brand object-contain"
              />
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
                aria-label="Previous transformation"
              >
                ←
              </button>
              <button
                type="button"
                onClick={() => step(1)}
                className="hero-arrow absolute top-1/2 right-3 -translate-y-1/2 sm:right-6"
                aria-label="Next transformation"
              >
                →
              </button>
              <p className="film-mono absolute bottom-5 left-1/2 -translate-x-1/2 text-[11px] text-white/70">
                {String(open + 1).padStart(2, "0")} /{" "}
                {String(items.length).padStart(2, "0")}
              </p>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
