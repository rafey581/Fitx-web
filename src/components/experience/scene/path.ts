import * as THREE from "three";

/**
 * World layout + camera "shot list" for the film.
 *
 * Everything lives in one continuous world laid out along -Z, so scrolling
 * feels like a single unbroken camera move rather than separate slides.
 * Keyframe `t` is chapter time (see `film.time` in ../store.ts).
 */

export const WORLD = {
  emblem: new THREE.Vector3(0, 0, 0),
  tunnel: { start: -4, count: 24, gap: 2.35 },
  programs: { z0: -74, step: -20, x: 2.4 },
  studio: { z0: -176, step: -5.2, radius: 4.4 },
  coaches: { z: -262, xs: [-15, -5, 5, 15] },
  floorY: -2.2,
  progress: new THREE.Vector3(2.7, 0.5, -300),
  plans: { z: -332, xs: [-3.4, 0, 3.4], pair: [-2.2, 2.2] },
  finale: new THREE.Vector3(0, 0.9, -376),
};

type V3 = [number, number, number];
type Key = { t: number; pos: V3; look: V3 };

const programKeys: Key[] = [0, 1, 2, 3, 4].flatMap((k) => {
  const z = WORLD.programs.z0 + WORLD.programs.step * k;
  const t = 2.1 + k * 0.185;
  // Hold on each panel for a beat, then glide to the next one.
  return [
    { t, pos: [-1.5, 0.15, z + 6.4] as V3, look: [1.0, 0, z] as V3 },
    { t: t + 0.07, pos: [-1.35, 0.1, z + 5.6] as V3, look: [1.1, 0, z] as V3 },
  ];
});

const coachKeys: Key[] = WORLD.coaches.xs.flatMap((x, k) => {
  const t = 4.12 + k * 0.22;
  const z = WORLD.coaches.z;
  return [
    { t, pos: [x + 0.9, 0.7, z + 8.2] as V3, look: [x - 1.1, 0.55, z] as V3 },
    { t: t + 0.09, pos: [x + 0.75, 0.65, z + 7.6] as V3, look: [x - 1.15, 0.55, z] as V3 },
  ];
});

/**
 * Phones: text sits under the picture, so instead of the angled desktop shots
 * the camera faces each program/coach photo head-on, centred and fully on
 * screen. `d` is the viewing distance along the photo's own facing direction.
 */
const facing = (x: number, y: number, z: number, turn: number, d: number) =>
  [x + Math.sin(turn) * d, y, z + Math.cos(turn) * d] as V3;

const mobileProgramKeys: Key[] = [0, 1, 2, 3, 4].flatMap((k) => {
  const z = WORLD.programs.z0 + WORLD.programs.step * k;
  const x = WORLD.programs.x;
  const t = 2.1 + k * 0.185;
  return [
    { t, pos: facing(x, 0, z, -0.32, 8.2), look: [x, 0, z] as V3 },
    { t: t + 0.07, pos: facing(x, 0, z, -0.32, 7.8), look: [x, 0, z] as V3 },
  ];
});

const mobileCoachKeys: Key[] = WORLD.coaches.xs.flatMap((x, k) => {
  const t = 4.12 + k * 0.22;
  const z = WORLD.coaches.z;
  const turn = -x * 0.033;
  return [
    { t, pos: facing(x, 0.7, z, turn, 7.6), look: [x, 0.7, z] as V3 },
    { t: t + 0.09, pos: facing(x, 0.7, z, turn, 7.3), look: [x, 0.7, z] as V3 },
  ];
});

const buildKeys = (mobile: boolean): Key[] => [
  // 0 · Origin — orbit the emblem, then dive through its ring.
  { t: 0, pos: [0, 0.15, 9.5], look: [0, 0, 0] },
  { t: 0.3, pos: [3.4, 1.0, 6.8], look: [0, 0.1, 0] },
  { t: 0.62, pos: [-2.2, 0.5, 4.6], look: [0, 0, -1] },
  { t: 0.9, pos: [0, 0.05, 1.6], look: [0, 0, -10] },
  // 1 · Forge — fly down the tunnel of plates.
  { t: 1.15, pos: [0, 0, -8], look: [0, 0, -24] },
  { t: 1.55, pos: [0.35, -0.25, -28], look: [0, 0, -44] },
  { t: 1.95, pos: [-0.2, 0.1, -54], look: [0.6, 0, -70] },
  // 2 · Programs — glide past each discipline.
  ...(mobile ? mobileProgramKeys : programKeys),
  { t: 3.0, pos: [0, 0, -168], look: [0, 0, -186] },
  // 3 · Studio — spiral through the gallery helix.
  { t: 3.5, pos: [0, 0, -202], look: [0, 0, -220] },
  { t: 3.93, pos: [0, 0.6, -240], look: [0, 0.5, -262] },
  // 4 · Coaches — visit each monolith.
  ...(mobile ? mobileCoachKeys : coachKeys),
  { t: 4.95, pos: [1.2, 1.6, -268], look: [2.2, 0.6, -300] },
  // 5 · Progress — drift up to the holographic tracking dashboard.
  { t: 5.35, pos: [0.4, 0.7, -292], look: [2.2, 0.5, -300] },
  { t: 5.7, pos: [0.5, 0.6, -294], look: [2.3, 0.5, -300] },
  { t: 5.98, pos: [0, 2.4, -306], look: [0, 0.2, -332] },
  // 6 · Fees — rise over the pillars.
  { t: 6.3, pos: [0, 2.8, -317], look: [0, 0, -332] },
  { t: 6.65, pos: [0, 1.1, -322.5], look: [0, 0.4, -332] },
  { t: 6.98, pos: [0, 4.2, -340], look: [0, 1, -370] },
  // 7 · Join — settle in front of the final emblem.
  { t: 7.45, pos: [0, 1.0, -358], look: [0, -0.4, -376] },
  { t: 8, pos: [0, 0.6, -364], look: [0, -1.2, -376] },
];

const KEYS = buildKeys(false);
const MOBILE_KEYS = buildKeys(true);

/** Resolution of the baked camera track, in chapter time. */
const STEP = 0.002;
/** Half-width of each smoothing pass, in track samples (~24 ms a pass). */
const SMOOTH = 12;

/** Straight-line read of the shot list at `time`. */
function lerpAxis(keys: Key[], time: number, field: "pos" | "look", axis: number) {
  const last = keys.length - 1;
  if (time <= keys[0].t) return keys[0][field][axis];
  if (time >= keys[last].t) return keys[last][field][axis];
  let i = 0;
  while (i < last - 1 && keys[i + 1].t < time) i++;
  const b = keys[i];
  const c = keys[i + 1];
  const u = (time - b.t) / (c.t - b.t);
  return b[field][axis] + (c[field][axis] - b[field][axis]) * u;
}

/** Moving average of `src`, O(n) per channel via a prefix sum. */
function boxFilter(src: Float32Array, n: number, channels: number) {
  const out = new Float32Array(src.length);
  const prefix = new Float64Array(n + 1);
  for (let c = 0; c < channels; c++) {
    for (let i = 0; i < n; i++) prefix[i + 1] = prefix[i] + src[i * channels + c];
    for (let i = 0; i < n; i++) {
      const a = Math.max(0, i - SMOOTH);
      const b = Math.min(n, i + SMOOTH + 1);
      out[i * channels + c] = (prefix[b] - prefix[a]) / (b - a);
    }
  }
  return out;
}

/**
 * Bakes the shot list into a track and runs two smoothing passes over it.
 *
 * Easing the camera into each keyframe stops it dead on arrival, so scrolling
 * through the panels went surge–halt–surge and the film felt like it was
 * bumping over the photos. Reading a slightly smoothed track instead keeps the
 * shots where they were framed but carries the camera's speed smoothly across
 * the keyframes; the two passes give the motion a continuous, T-round-eased
 * velocity rather than a stop at every key.
 */
function buildTrack(keys: Key[]) {
  const t0 = keys[0].t;
  const n = Math.round((keys[keys.length - 1].t - t0) / STEP) + 1;
  let track = new Float32Array(n * 6);
  for (let i = 0; i < n; i++) {
    const time = t0 + i * STEP;
    for (let a = 0; a < 3; a++) {
      track[i * 6 + a] = lerpAxis(keys, time, "pos", a);
      track[i * 6 + 3 + a] = lerpAxis(keys, time, "look", a);
    }
  }
  track = boxFilter(track, n, 6);
  track = boxFilter(track, n, 6);
  return { t0, n, track };
}

const TRACK = buildTrack(KEYS);
const MOBILE_TRACK = buildTrack(MOBILE_KEYS);

export function cameraAt(time: number, pos: THREE.Vector3, look: THREE.Vector3, mobile = false) {
  const { t0, n, track } = mobile ? MOBILE_TRACK : TRACK;
  const f = Math.min(n - 1, Math.max(0, (time - t0) / STEP));
  const i = Math.min(n - 2, Math.floor(f));
  const u = Math.min(1, Math.max(0, f - i));
  const a = i * 6;
  const b = a + 6;
  pos.set(
    track[a] + (track[b] - track[a]) * u,
    track[a + 1] + (track[b + 1] - track[a + 1]) * u,
    track[a + 2] + (track[b + 2] - track[a + 2]) * u,
  );
  look.set(
    track[a + 3] + (track[b + 3] - track[a + 3]) * u,
    track[a + 4] + (track[b + 4] - track[a + 4]) * u,
    track[a + 5] + (track[b + 5] - track[a + 5]) * u,
  );
}
