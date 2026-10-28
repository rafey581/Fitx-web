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

function sample(KEYS: Key[], time: number, field: "pos" | "look", out: THREE.Vector3) {
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

export function cameraAt(time: number, pos: THREE.Vector3, look: THREE.Vector3, mobile = false) {
  const keys = mobile ? MOBILE_KEYS : KEYS;
  sample(keys, time, "pos", pos);
  sample(keys, time, "look", look);
}
