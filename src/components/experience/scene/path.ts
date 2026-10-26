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
  coaches: { z: -262, xs: [-10, 0, 10] },
  floorY: -2.2,
  plans: { z: -292, xs: [-3.4, 0, 3.4] },
  finale: new THREE.Vector3(0, 0.9, -336),
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
  const t = 4.18 + k * 0.29;
  const z = WORLD.coaches.z;
  return [
    { t, pos: [x + 0.9, 0.7, z + 8.2] as V3, look: [x - 1.1, 0.55, z] as V3 },
    { t: t + 0.09, pos: [x + 0.75, 0.65, z + 7.6] as V3, look: [x - 1.15, 0.55, z] as V3 },
  ];
});

const KEYS: Key[] = [
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
  ...programKeys,
  { t: 3.0, pos: [0, 0, -168], look: [0, 0, -186] },
  // 3 · Studio — spiral through the gallery helix.
  { t: 3.5, pos: [0, 0, -202], look: [0, 0, -220] },
  { t: 3.93, pos: [0, 0.6, -240], look: [0, 0.5, -262] },
  // 4 · Coaches — visit each monolith.
  ...coachKeys,
  { t: 4.95, pos: [1.5, 2.6, -264], look: [0, -0.6, -292] },
  // 5 · Plans — rise over the pillars.
  { t: 5.3, pos: [0, 2.8, -277], look: [0, 0, -292] },
  { t: 5.65, pos: [0, 1.1, -282.5], look: [0, 0.4, -292] },
  { t: 5.98, pos: [0, 4.2, -300], look: [0, 1, -330] },
  // 6 · Join — settle in front of the final emblem.
  { t: 6.45, pos: [0, 1.0, -318], look: [0, -0.4, -336] },
  { t: 7, pos: [0, 0.6, -324], look: [0, -1.2, -336] },
];

function catmull(p0: number, p1: number, p2: number, p3: number, t: number) {
  const t2 = t * t;
  const t3 = t2 * t;
  return (
    0.5 *
    (2 * p1 +
      (-p0 + p2) * t +
      (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 +
      (-p0 + 3 * p1 - 3 * p2 + p3) * t3)
  );
}

function sample(time: number, field: "pos" | "look", out: THREE.Vector3) {
  const last = KEYS.length - 1;
  if (time <= KEYS[0].t) return out.set(...KEYS[0][field]);
  if (time >= KEYS[last].t) return out.set(...KEYS[last][field]);

  let i = 0;
  while (i < last - 1 && KEYS[i + 1].t < time) i++;
  const a = KEYS[Math.max(0, i - 1)][field];
  const b = KEYS[i][field];
  const c = KEYS[i + 1][field];
  const d = KEYS[Math.min(last, i + 2)][field];
  const raw = (time - KEYS[i].t) / (KEYS[i + 1].t - KEYS[i].t);
  const t = raw * raw * (3 - 2 * raw);
  return out.set(
    catmull(a[0], b[0], c[0], d[0], t),
    catmull(a[1], b[1], c[1], d[1], t),
    catmull(a[2], b[2], c[2], d[2], t),
  );
}

export function cameraAt(time: number, pos: THREE.Vector3, look: THREE.Vector3) {
  sample(time, "pos", pos);
  sample(time, "look", look);
}
