"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Minimal accessible carousel shared by Hero Slider, Testimonials Slider and
 * Image Banner. The server passes fully-built slide nodes; this component only
 * does autoplay, arrows and dots. Keyboard: arrows move the slide, dots are
 * real buttons. `autoplayMs: 0` disables rotation.
 */
export function Slider({
  slides,
  autoplayMs = 0,
  arrows = false,
  dots = false,
  ariaLabel,
}: {
  slides: ReactNode[];
  autoplayMs?: number;
  arrows?: boolean;
  dots?: boolean;
  ariaLabel: string;
}) {
  const [index, setIndex] = useState(0);
  const count = slides.length;
  // Clamp during render instead of an effect: the displayed slide is always in
  // range even if the slide list shrinks between renders.
  const current = count === 0 ? 0 : index % count;
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (autoplayMs <= 0 || count <= 1) return;
    timerRef.current = setInterval(
      () => setIndex((previous) => (previous + 1) % count),
      autoplayMs,
    );
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [autoplayMs, count]);

  const go = (next: number) => setIndex(((next % count) + count) % count);

  if (count === 0) return null;

  return (
    <div className="relative">
      {slides.map((slide, position) => (
        <div
          key={position}
          role="group"
          aria-roledescription="slide"
          aria-hidden={position !== current}
          className={`${position === current ? "relative opacity-100" : "pointer-events-none absolute inset-0 opacity-0"} transition-opacity duration-700 motion-reduce:transition-none`}
        >
          {slide}
        </div>
      ))}

      {arrows && count > 1 ? (
        <>
          <button
            type="button"
            onClick={() => go(current - 1)}
            aria-label="Previous slide"
            className="absolute top-1/2 left-4 z-20 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-white/25 bg-black/30 text-white backdrop-blur transition hover:bg-black/50"
          >
            ←
          </button>
          <button
            type="button"
            onClick={() => go(current + 1)}
            aria-label="Next slide"
            className="absolute top-1/2 right-4 z-20 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-white/25 bg-black/30 text-white backdrop-blur transition hover:bg-black/50"
          >
            →
          </button>
        </>
      ) : null}

      {dots && count > 1 ? (
        <div
          role="tablist"
          aria-label={`${ariaLabel} slides`}
          className="absolute bottom-5 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2.5"
        >
          {slides.map((_, position) => (
            <button
              key={position}
              type="button"
              role="tab"
              aria-selected={position === current}
              aria-label={`Go to slide ${position + 1}`}
              onClick={() => go(position)}
              className={`h-2.5 rounded-full transition-all ${
                position === current
                  ? "w-6 bg-accent"
                  : "w-2.5 bg-white/50 hover:bg-white"
              }`}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
