"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

import { CHAPTERS, type FilmContent } from "./content";
import { film, useFilmUi } from "./store";

const pad = (n: number, w = 2) => String(Math.round(n)).padStart(w, "0");

/** Opening card: counts to 100 while textures load, then wipes away. */
export function Loader({ progress, ready, onDone }: { progress: number; ready: boolean; onDone: () => void }) {
  const [shown, setShown] = useState(0);
  const [gone, setGone] = useState(false);
  const target = useRef(0);
  const doneRef = useRef(onDone);

  useEffect(() => {
    target.current = ready ? 100 : Math.min(96, progress);
    doneRef.current = onDone;
  }, [ready, progress, onDone]);

  useEffect(() => {
    let raf = 0;
    let value = 0;
    const started = performance.now();
    const tick = (now: number) => {
      // Never faster than ~1.6s, so the intro reads as a deliberate title card.
      const cap = Math.min(100, ((now - started) / 1600) * 100);
      value += (Math.min(cap, target.current) - value) * 0.08;
      if (target.current === 100 && cap >= 100 && value > 99.5) value = 100;
      setShown(value);
      if (value < 100) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const leaving = shown >= 100;
  useEffect(() => {
    if (!leaving) return;
    const a = setTimeout(() => doneRef.current(), 500);
    const b = setTimeout(() => setGone(true), 1400);
    return () => {
      clearTimeout(a);
      clearTimeout(b);
    };
  }, [leaving]);

  if (gone) return null;
  return (
    <div className={`film-loader ${leaving ? "is-leaving" : ""}`} role="status" aria-live="polite">
      <div className="film-mono absolute left-5 top-6 text-[11px] text-white/50 sm:left-10">FITX / Sahiwal</div>
      <div className="film-mono absolute right-5 top-6 text-[11px] text-white/50 sm:right-10">Personal training studio</div>
      <div className="flex flex-col items-center">
        <p className="film-display text-[22vw] leading-none md:text-[12vw]">
          FIT<span className="text-accent">X</span>
        </p>
        <div className="mt-6 h-px w-48 overflow-hidden bg-white/15">
          <div className="h-full bg-accent" style={{ width: `${shown}%` }} />
        </div>
        <p className="film-mono mt-4 text-[11px] text-white/60">
          Loading the studio <span className="text-white">{pad(shown, 3)}%</span>
        </p>
      </div>
    </div>
  );
}

/** Fixed HUD: logo, current chapter, menu, location readout, chapter rail. */
export function Hud({
  content,
  onJump,
  visible,
}: {
  content: FilmContent;
  onJump: (i: number) => void;
  visible: boolean;
}) {
  const chapter = useFilmUi((s) => s.chapter);
  const menuOpen = useFilmUi((s) => s.menuOpen);
  const setMenuOpen = useFilmUi((s) => s.setMenuOpen);
  const percent = useRef<HTMLSpanElement>(null);
  const bar = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const p = Math.min(1, film.time / CHAPTERS.length);
      if (percent.current) percent.current.textContent = pad(p * 100, 3);
      if (bar.current) bar.current.style.transform = `scaleX(${p})`;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className={`film-hud ${visible ? "is-visible" : ""}`} inert={menuOpen}>
      <header className="pointer-events-auto absolute inset-x-0 top-0 flex items-center justify-between px-5 py-5 sm:px-10">
        <button type="button" onClick={() => onJump(0)} className="flex items-center gap-3" aria-label="Back to start">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/fitx/3d/logo-horizontal.png" alt="FITX" width={417} height={160} className="h-8 w-auto sm:h-9" />
        </button>
        <p className="film-mono hidden text-[11px] text-white/60 md:block">
          <span className="text-accent">{pad(chapter)}</span> — {CHAPTERS[chapter]?.label}
        </p>
        <div className="flex items-center gap-2">
          <Link href="/contact" className="film-btn film-btn-hot hidden sm:inline-flex">
            Book
          </Link>
          <button type="button" className="film-btn" onClick={() => setMenuOpen(true)} aria-haspopup="dialog">
            Menu
          </button>
        </div>
      </header>

      <div className="film-mono absolute bottom-6 left-5 hidden text-[10px] leading-relaxed text-white/45 sm:left-10 md:block">
        <p>30.6682° N · 73.1114° E</p>
        <p>{content.hours}</p>
      </div>

      <nav
        aria-label="Chapters"
        className="pointer-events-auto absolute bottom-6 left-5 right-24 flex items-center gap-4 sm:left-auto sm:right-28"
      >
        <ol className="flex gap-1.5">
          {CHAPTERS.map((c, i) => (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => onJump(i)}
                aria-label={`Go to ${c.label}`}
                aria-current={i === chapter ? "step" : undefined}
                className={`film-tick ${i === chapter ? "is-active" : ""} ${i < chapter ? "is-past" : ""}`}
              />
            </li>
          ))}
        </ol>
        <span className="film-mono text-[10px] text-white/60">
          <span ref={percent}>000</span>%
        </span>
        <span className="relative hidden h-px w-24 overflow-hidden bg-white/15 sm:block">
          <span ref={bar} className="absolute inset-0 origin-left bg-accent" style={{ transform: "scaleX(0)" }} />
        </span>
      </nav>
    </div>
  );
}

/** Full-screen menu: every page of the site plus quick contact. */
export function Menu({ content, onJump }: { content: FilmContent; onJump: (i: number) => void }) {
  const open = useFilmUi((s) => s.menuOpen);
  const setOpen = useFilmUi((s) => s.setMenuOpen);
  const close = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    close.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, setOpen]);

  return (
    <div className={`film-menu ${open ? "is-open" : ""}`} role="dialog" aria-modal="true" aria-label="Menu" hidden={!open}>
      <div className="flex items-center justify-between px-5 py-5 sm:px-10">
        <p className="film-mono text-[11px] text-white/50">Index</p>
        <button ref={close} type="button" className="film-btn" onClick={() => setOpen(false)}>
          Close
        </button>
      </div>
      <div className="grid gap-10 px-5 pb-10 sm:px-10 md:grid-cols-[1fr_auto]">
        <ol className="space-y-1">
          {CHAPTERS.map((c, i) => (
            <li key={c.id}>
              <button
                type="button"
                className="film-menu-link"
                onClick={() => {
                  setOpen(false);
                  // Jump after the scroller is re-enabled (its restart resets motion).
                  window.setTimeout(() => onJump(i), 80);
                }}
              >
                <span className="film-mono mr-4 align-middle text-[11px] text-accent">{pad(i)}</span>
                {c.label}
              </button>
            </li>
          ))}
        </ol>
        <div className="film-mono space-y-6 text-[11px] text-white/60 md:w-72">
          <ul className="grid grid-cols-2 gap-x-6 gap-y-2 md:grid-cols-1">
            {content.nav.map((n) => (
              <li key={n.href}>
                <Link href={n.href} className="hover:text-accent">
                  {n.label}
                </Link>
              </li>
            ))}
          </ul>
          <div className="space-y-1 border-t border-white/15 pt-6">
            <p>{content.address}</p>
            <p>{content.phone}</p>
            <p>{content.email}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
