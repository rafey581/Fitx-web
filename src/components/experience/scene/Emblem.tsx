"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

import { film, ramp } from "../store";

/**
 * The FITX logo mark rebuilt in 3D: a split chrome ring around an orange
 * dumbbell, orbited by a cloud of chrome shards. In the opening shot the
 * dumbbell lifts out and the ring opens up so the camera can fly through it.
 */

const RING_R = 2.2;
const ARC = Math.PI * 0.8;

export function chromeMaterial() {
  return new THREE.MeshStandardMaterial({
    color: "#d9dadf",
    metalness: 1,
    roughness: 0.14,
    envMapIntensity: 1.35,
  });
}

export function orangeMaterial() {
  return new THREE.MeshPhysicalMaterial({
    color: "#ff5a0a",
    metalness: 0.55,
    roughness: 0.22,
    clearcoat: 1,
    clearcoatRoughness: 0.12,
    emissive: "#ff3a00",
    emissiveIntensity: 0.45,
  });
}

function Dumbbell({ material }: { material: THREE.Material }) {
  const bar = (y: number, length: number, radius: number) => (
    <mesh position={[0, y, 0]} rotation={[0, 0, Math.PI / 2]} material={material}>
      <capsuleGeometry args={[radius, length, 8, 24]} />
    </mesh>
  );
  return (
    <group>
      <mesh material={material}>
        <cylinderGeometry args={[0.085, 0.085, 1.25, 24]} />
      </mesh>
      {bar(0.56, 0.95, 0.12)}
      {bar(0.86, 0.62, 0.105)}
      {bar(-0.56, 0.95, 0.12)}
      {bar(-0.86, 0.62, 0.105)}
    </group>
  );
}

const _dummy = new THREE.Object3D();

function Shards({ count, chrome }: { count: number; chrome: THREE.Material }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const seeds = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        radius: 3 + ((i * 7919) % 100) / 100 * 3.2,
        angle: (i / count) * Math.PI * 2,
        y: (((i * 104729) % 100) / 100 - 0.5) * 4.2,
        speed: 0.05 + ((i * 31) % 10) / 100,
        scale: 0.05 + ((i * 17) % 10) / 70,
        spin: ((i * 13) % 10) / 10,
      })),
    [count],
  );

  useFrame(({ clock }) => {
    const mesh = ref.current;
    if (!mesh) return;
    const t = clock.elapsedTime;
    const burst = ramp(film.time, 0.45, 1.0);
    seeds.forEach((s, i) => {
      const a = s.angle + t * s.speed;
      const r = s.radius * (1 + burst * 1.6);
      _dummy.position.set(Math.cos(a) * r, s.y * (1 + burst), Math.sin(a) * r * 0.6 - burst * 3);
      _dummy.rotation.set(t * s.spin, t * (s.spin + 0.2), a);
      _dummy.scale.setScalar(s.scale * (1 - burst * 0.5));
      _dummy.updateMatrix();
      mesh.setMatrixAt(i, _dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={ref} args={[undefined, chrome, count]}>
      <octahedronGeometry args={[1, 0]} />
    </instancedMesh>
  );
}

export function Emblem({
  position = [0, 0, 0] as [number, number, number],
  scale = 1,
  intro = false,
  shards = 40,
}: {
  position?: [number, number, number];
  scale?: number;
  /** Opening-shot behaviour: dumbbell lifts away, ring opens for the fly-through. */
  intro?: boolean;
  shards?: number;
}) {
  const group = useRef<THREE.Group>(null);
  const ring = useRef<THREE.Group>(null);
  const bell = useRef<THREE.Group>(null);
  const halo = useRef<THREE.MeshBasicMaterial>(null);
  const chrome = useMemo(() => chromeMaterial(), []);
  const orange = useMemo(() => orangeMaterial(), []);

  useFrame(({ clock }, delta) => {
    const t = clock.elapsedTime;
    const g = group.current;
    if (!g || !ring.current || !bell.current) return;

    const lift = intro ? ramp(film.time, 0.5, 0.95) : 0;
    const open = intro ? ramp(film.time, 0.6, 1.0) : 0;

    // Idle sway + pointer parallax; damped so it never snaps.
    const targetY = Math.sin(t * 0.35) * 0.35 + film.pointer.x * 0.25;
    const targetX = Math.sin(t * 0.27) * 0.12 - film.pointer.y * 0.15;
    g.rotation.y = THREE.MathUtils.damp(g.rotation.y, targetY * (1 - open), 3, delta);
    g.rotation.x = THREE.MathUtils.damp(g.rotation.x, targetX * (1 - open), 3, delta);
    g.position.y = position[1] + Math.sin(t * 0.8) * 0.08;

    // Sway rather than spin, so the openings stay left/right like the logo.
    ring.current.rotation.z = Math.sin(t * 0.3) * 0.08 + open * 0.6;
    ring.current.scale.setScalar(1 + open * 0.55);

    bell.current.position.y = lift * 5;
    // Roll around its own length so it always reads as a horizontal dumbbell.
    bell.current.rotation.x = t * 0.5 + lift * 3;
    bell.current.rotation.z = lift * 0.9;
    bell.current.scale.setScalar(1 - lift * 0.4);

    if (halo.current) halo.current.opacity = 0.75 * (1 - open) + 0.25;
  });

  return (
    <group position={position} scale={scale}>
      <group ref={group}>
        <group ref={ring}>
          {/* Openings on the left and right, as in the logo. */}
          <mesh rotation={[0, 0, Math.PI / 2 - ARC / 2]} material={chrome}>
            <torusGeometry args={[RING_R, 0.24, 32, 96, ARC]} />
          </mesh>
          <mesh rotation={[0, 0, (3 * Math.PI) / 2 - ARC / 2]} material={chrome}>
            <torusGeometry args={[RING_R, 0.24, 32, 96, ARC]} />
          </mesh>
          {/* Thin glowing inner line — picked up by bloom. */}
          <mesh>
            <torusGeometry args={[RING_R - 0.42, 0.012, 8, 160]} />
            <meshBasicMaterial ref={halo} color={[3, 0.9, 0.15]} transparent toneMapped={false} />
          </mesh>
        </group>
        <group ref={bell}>
          {/* Built upright, laid horizontal to match the logo. */}
          <group rotation={[0, 0, Math.PI / 2]}>
            <Dumbbell material={orange} />
          </group>
        </group>
      </group>
      {shards > 0 ? <Shards count={shards} chrome={chrome} /> : null}
    </group>
  );
}
