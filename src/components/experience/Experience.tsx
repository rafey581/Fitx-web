"use client";

import { Component, useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import dynamic from "next/dynamic";
import Lenis from "lenis";

import { Chapters } from "./Chapters";
import { CHAPTERS, PHOTOS, type FilmContent } from "./content";
import { Hud, Loader, Menu } from "./Chrome";
import { film, ramp, useFilmUi } from "./store";

const World = dynamic(() => import("./scene/World"), { ssr: false });

/** If WebGL is unavailable or a scene asset fails, keep the story readable. */
class SceneBoundary extends Component<{ children: ReactNode; onFail: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    this.props.onFail();
  }
  render() {
    if (this.state.failed) {
      return (
        <div
          className="absolute inset-0 bg-cover bg-center opacity-35"
          style={{ backgroundImage: `url(${PHOTOS.floorWide})` }}
        />
      );
    }
    return this.props.children;
  }
}

type Beat = { el: HTMLElement; center: number; width: number; highlight: boolean };

const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&/+-";

/** Decode-style text reveal used whenever a chapter comes on screen. */
export function scramble(el: HTMLElement) {
  const final = el.dataset.text ?? el.textContent ?? "";
  el.dataset.text = final;
  const start = performance.now();
  const duration = 520 + final.length * 22;
  const tick = (now: number) => {
    const p = Math.min(1, (now - start) / duration);
    const settled = Math.floor(final.length * p);
    let out = final.slice(0, settled);
    for (let i = settled; i < final.length; i++) {
      out += final[i] === " " ? " " : GLYPHS[(Math.random() * GLYPHS.length) | 0];
    }
    el.textContent = out;
    if (p < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

export function Experience({ content }: { content: FilmContent }) {
  const lenisRef = useRef<Lenis | null>(null);
  const spacers = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const loaded = useFilmUi((s) => s.loaded);
  const setLoaded = useFilmUi((s) => s.setLoaded);
  const chapter = useFilmUi((s) => s.chapter);
  const menuOpen = useFilmUi((s) => s.menuOpen);
  const [introDone, setIntroDone] = useState(false);

  const onProgress = useCallback((p: number) => setProgress(p), []);

  useEffect(() => {
    const t = window.setTimeout(() => setLoaded(true), 15000);
    return () => window.clearTimeout(t);
  }, [setLoaded]);
  const onFail = useCallback(() => {
    setProgress(100);
    setLoaded(true);
  }, [setLoaded]);

  // Smooth scroll + the single frame loop that syncs DOM overlays to film time.
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.history.scrollRestoration = "manual";
    window.scrollTo(0, 0);
    film.target = film.time = film.velocity = 0;

    const lenis = new Lenis({ lerp: reduced ? 1 : 0.08, smoothWheel: !reduced, wheelMultiplier: 0.9 });
    lenisRef.current = lenis;
    lenis.stop();

    const measure = () => {
      const nodes = spacers.current?.children;
      if (!nodes) return;
      const stops = Array.from(nodes).map((n) => (n as HTMLElement).offsetTop);
      stops.push(Math.max(1, document.documentElement.scrollHeight - window.innerHeight));
      film.stops = stops;
    };
    measure();
    window.addEventListener("resize", measure);

    const toTime = (y: number) => {
      const s = film.stops;
      for (let i = 0; i < s.length - 1; i++) {
        if (y < s[i + 1] || i === s.length - 2) {
          return i + Math.min(1, Math.max(0, (y - s[i]) / Math.max(1, s[i + 1] - s[i])));
        }
      }
      return 0;
    };

    lenis.on("scroll", (l: Lenis) => {
      film.target = toTime(l.scroll);
      film.velocity = Math.max(-1, Math.min(1, l.velocity / 60));
    });

    const frames = Array.from(document.querySelectorAll<HTMLElement>("[data-frame]"));
    const beats: Beat[][] = frames.map((f) =>
      Array.from(f.querySelectorAll<HTMLElement>("[data-sub],[data-sub-highlight]")).map((el) => {
        const highlight = el.hasAttribute("data-sub-highlight");
        const [center, width] = (el.dataset.sub ?? el.dataset.subHighlight ?? "0,1").split(",").map(Number);
        return { el, center, width, highlight };
      }),
    );
    const last = frames.length - 1;
    let shownChapter = -1;

    let raf = 0;
    const loop = (time: number) => {
      lenis.raf(time);
      const t = film.time;
      frames.forEach((frame, i) => {
        const l = t - i;
        const fadeIn = i === 0 ? 1 : ramp(l, 0.02, 0.14);
        const fadeOut = i === last ? 1 : 1 - ramp(l, 0.86, 0.98);
        const o = fadeIn * fadeOut;
        frame.style.opacity = o.toFixed(3);
        frame.style.visibility = o < 0.01 ? "hidden" : "visible";
        frame.style.transform = `translate3d(0, ${((1 - fadeIn) * 30 - (1 - fadeOut) * 30).toFixed(1)}px, 0)`;
        frame.dataset.active = o > 0.5 ? "true" : "false";
        if (o > 0.01) {
          for (const b of beats[i]) {
            const d = Math.abs(l - b.center);
            const bo = 1 - ramp(d, b.width, b.width + 0.06);
            if (b.highlight) {
              b.el.style.color = bo > 0.5 ? "var(--brand-accent)" : "";
            } else {
              b.el.style.opacity = bo.toFixed(3);
              b.el.style.visibility = bo < 0.01 ? "hidden" : "visible";
              b.el.style.transform = `translate3d(0, ${((1 - bo) * 18 * Math.sign(l - b.center)).toFixed(1)}px, 0)`;
            }
          }
        }
      });
      const current = Math.min(last, Math.floor(t + 0.15));
      if (current !== shownChapter) {
        shownChapter = current;
        useFilmUi.getState().setChapter(current);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    const onPointer = (e: PointerEvent) => {
      film.pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      film.pointer.y = -((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener("pointermove", onPointer);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", measure);
      window.removeEventListener("pointermove", onPointer);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  // Scramble the headline of each chapter as it arrives.
  useEffect(() => {
    if (!introDone) return;
    document
      .querySelectorAll<HTMLElement>(`[data-frame="${chapter}"] [data-scramble]`)
      .forEach((el) => scramble(el));
  }, [chapter, introDone]);

  // Unlock scrolling once the loader has finished; pause it under the menu.
  useEffect(() => {
    const lenis = lenisRef.current;
    if (!lenis) return;
    if (introDone && !menuOpen) lenis.start();
    else lenis.stop();
  }, [introDone, menuOpen]);

  const goTo = useCallback((index: number) => {
    const y = film.stops[index] ?? 0;
    lenisRef.current?.scrollTo(index === 0 ? 0 : y + window.innerHeight * 0.35, { duration: 2.4, force: true });
  }, []);

  return (
    <div className="film-root">
      <div className="film-canvas" aria-hidden="true">
        <SceneBoundary onFail={onFail}>
          <World content={content} onProgress={onProgress} />
        </SceneBoundary>
      </div>

      <Chapters content={content} />

      {/* Invisible spacers: their heights are the film's running time. */}
      <div ref={spacers} aria-hidden="true">
        {CHAPTERS.map((c) => (
          <div key={c.id} style={{ height: `${c.vh}svh` }} />
        ))}
      </div>

      <Hud content={content} onJump={goTo} visible={introDone} />
      <Menu content={content} onJump={goTo} />
      <Loader progress={progress} ready={loaded} onDone={() => setIntroDone(true)} />
    </div>
  );
}
