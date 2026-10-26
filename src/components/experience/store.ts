import { create } from "zustand";

/**
 * Per-frame film state. Mutated every scroll/frame, so it lives outside React
 * to avoid re-rendering the tree 60 times a second.
 *
 * `time` is "chapter time": the integer part is the chapter index and the
 * fraction is how far through that chapter the reader has scrolled. The DOM
 * overlays and the 3D camera both read it, which keeps text and picture in
 * lock-step no matter how tall each chapter is.
 */
export const film = {
  /** Chapter time the scroll position is asking for. */
  target: 0,
  /** Damped chapter time actually shown (eases towards `target`). */
  time: 0,
  /** Smoothed scroll velocity, roughly -1..1, used for motion effects. */
  velocity: 0,
  /** Pointer position in -1..1, used for subtle parallax. */
  pointer: { x: 0, y: 0 },
  /** Chapter scroll offsets in px (start of each chapter + end of film). */
  stops: [0] as number[],
};

type UiState = {
  loaded: boolean;
  chapter: number;
  menuOpen: boolean;
  setLoaded: (loaded: boolean) => void;
  setChapter: (chapter: number) => void;
  setMenuOpen: (open: boolean) => void;
};

export const useFilmUi = create<UiState>((set) => ({
  loaded: false,
  chapter: 0,
  menuOpen: false,
  setLoaded: (loaded) => set({ loaded }),
  setChapter: (chapter) => set({ chapter }),
  setMenuOpen: (menuOpen) => set({ menuOpen }),
}));

/** Smooth 0..1 ramp between `a` and `b`. */
export function ramp(v: number, a: number, b: number) {
  const t = Math.min(1, Math.max(0, (v - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

/** Local 0..1 progress through chapter `index` for a given chapter time. */
export function local(time: number, index: number) {
  return Math.min(1, Math.max(0, time - index));
}
