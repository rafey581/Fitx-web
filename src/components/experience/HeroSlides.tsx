"use client";

import { useEffect, useState } from "react";

import { heroSlides } from "./content";

const INTERVAL = 5500;

/**
 * Opening photo slideshow: real studio photos crossfade with a slow zoom.
 * It sits in the Origin frame and fades out as the visitor scrolls (via the
 * frame loop's `data-sub` beat), handing over to the 3D emblem and tunnel.
 */
export function HeroSlides() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible")
        setIndex((i) => (i + 1) % heroSlides.length);
    }, INTERVAL);
    return () => window.clearInterval(timer);
  }, [paused]);

  const go = (i: number) =>
    setIndex((i + heroSlides.length) % heroSlides.length);

  return (
    <div
      data-sub="0,0.3"
      className="hero-slides absolute inset-0"
      aria-roledescription="carousel"
      aria-label="Inside the FITX studio"
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
    >
      {heroSlides.map((slide, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={slide.src}
          src={slide.src}
          alt={i === index ? slide.alt : ""}
          aria-hidden={i === index ? undefined : true}
          fetchPriority={i === 0 ? "high" : "low"}
          className={`hero-slide ${i === index ? "is-active" : ""}`}
          style={{ objectPosition: slide.position }}
        />
      ))}
      <div className="hero-scrim" aria-hidden="true" />

      <div className="absolute top-24 right-5 flex w-56 flex-col items-end gap-3 sm:top-28 sm:right-10 sm:w-72">
        <div className="flex items-center gap-3">
          <span className="film-mono text-[11px] text-white/70">
            <span className="text-accent">
              {String(index + 1).padStart(2, "0")}
            </span>{" "}
            / {String(heroSlides.length).padStart(2, "0")}
            <span className="ml-3 hidden text-white/50 sm:inline">
              {heroSlides[index].label}
            </span>
          </span>
          <button
            type="button"
            className="hero-arrow"
            onClick={() => go(index - 1)}
            aria-label="Previous photo"
          >
            ←
          </button>
          <button
            type="button"
            className="hero-arrow"
            onClick={() => go(index + 1)}
            aria-label="Next photo"
          >
            →
          </button>
        </div>

        <div className="flex w-full gap-1.5">
          {heroSlides.map((slide, i) => (
            <button
              key={slide.src}
              type="button"
              onClick={() => go(i)}
              aria-label={`Show photo ${i + 1}: ${slide.label}`}
              aria-current={i === index ? "true" : undefined}
              className="hero-dot"
            >
              <span
                className={
                  i === index
                    ? paused
                      ? "is-active is-paused"
                      : "is-active"
                    : ""
                }
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
