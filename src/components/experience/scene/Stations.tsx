"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Edges } from "@react-three/drei";
import * as THREE from "three";

import type { FilmContent } from "../content";
import { film, ramp } from "../store";
import { PhotoPanel } from "./PhotoPanel";
import { WORLD } from "./path";

/** Chapter 2 — one floating panel per program, staggered down the right side. */
export function Programs({ services }: { services: FilmContent["services"] }) {
  const { z0, step, x } = WORLD.programs;
  return (
    <group>
      {services.slice(0, 5).map((s, k) => (
        <PhotoPanel
          key={s.title}
          url={s.image}
          width={3.2}
          height={4}
          position={[x, 0, z0 + step * k]}
          rotation={[0, -0.32, 0]}
          revealNear={8.5}
          revealFar={15}
          accent
        />
      ))}
    </group>
  );
}

/** Chapter 3 — the studio gallery wrapped into a helix around the camera. */
export function Studio({ gallery }: { gallery: string[] }) {
  const { z0, step, radius } = WORLD.studio;
  const spin = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (spin.current) spin.current.rotation.z += delta * 0.03;
  });
  return (
    <group ref={spin}>
      {gallery.slice(0, 12).map((url, i) => {
        const a = i * ((Math.PI * 2) / 5.3) + 0.6;
        return (
          <PhotoPanel
            key={url + i}
            url={url}
            width={2.6}
            position={[Math.cos(a) * radius, Math.sin(a) * radius * 0.75, z0 + step * i]}
            lookAtAxis
            revealNear={6}
            revealFar={13}
          />
        );
      })}
    </group>
  );
}

/** Chapter 4 — a black monolith per coach with their portrait set into it. */
export function Coaches({ coaches }: { coaches: FilmContent["coaches"] }) {
  const { z, xs } = WORLD.coaches;
  const slabHeight = 5.6;
  return (
    <group>
      {coaches.slice(0, 3).map((c, k) => {
        const x = xs[k];
        const turn = -x * 0.05;
        return (
          <group key={c.name + k} position={[x, 0, z]} rotation={[0, turn, 0]}>
            <mesh position={[0, WORLD.floorY + slabHeight / 2, -0.2]}>
              <boxGeometry args={[3, slabHeight, 0.3]} />
              <meshStandardMaterial color="#0e0e12" metalness={0.85} roughness={0.35} />
              <Edges color="#ff5a12" threshold={15} />
            </mesh>
            <PhotoPanel
              url={c.image}
              width={2.5}
              height={3.6}
              position={[0, 0.7, 0]}
              revealNear={9.5}
              revealFar={16}
            />
          </group>
        );
      })}
    </group>
  );
}

/** Chapter 5 — three pillars, one per plan; the highlighted plan glows. */
export function Plans({ plans }: { plans: FilmContent["plans"] }) {
  const { z, xs } = WORLD.plans;
  const heights = [2.6, 3.8, 3.2];
  const glow = useRef<THREE.MeshBasicMaterial[]>([]);

  useFrame(({ clock }) => {
    const rise = ramp(film.time, 4.85, 5.45);
    glow.current.forEach((m, i) => {
      if (!m) return;
      m.opacity = (0.6 + Math.sin(clock.elapsedTime * 2 + i) * 0.25) * rise;
    });
  });

  return (
    <group>
      {plans.slice(0, 3).map((p, k) => {
        const h = heights[k] ?? 3;
        return (
          <group key={p.name + k} position={[xs[k], WORLD.floorY, z]}>
            <mesh position={[0, h / 2, 0]}>
              <boxGeometry args={[1.5, h, 1.5]} />
              <meshStandardMaterial
                color={p.highlighted ? "#1c0d06" : "#121216"}
                metalness={0.9}
                roughness={0.25}
              />
              <Edges color={p.highlighted ? "#ff6a1a" : "#8a8a96"} threshold={15} />
            </mesh>
            {/* Light cap on top of each pillar. */}
            <mesh position={[0, h + 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[1.5, 1.5]} />
              <meshBasicMaterial
                ref={(m) => {
                  if (m) glow.current[k] = m;
                }}
                color={p.highlighted ? [3, 0.9, 0.15] : [1.2, 1.2, 1.3]}
                transparent
                toneMapped={false}
              />
            </mesh>
            {p.highlighted ? (
              <pointLight position={[0, h + 1.2, 0]} color="#ff5a12" intensity={18} distance={9} />
            ) : null}
          </group>
        );
      })}
    </group>
  );
}

/** Rotating beacon ring behind the final emblem. */
export function FinaleHalo() {
  const ref = useRef<THREE.Group>(null);
  const rings = useMemo(() => [2.6, 3.3, 4.2], []);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    ref.current.children.forEach((c, i) => {
      c.rotation.z = clock.elapsedTime * (0.1 + i * 0.05) * (i % 2 ? -1 : 1);
    });
  });
  return (
    <group ref={ref} position={[WORLD.finale.x, WORLD.finale.y, WORLD.finale.z - 1.5]}>
      {rings.map((r, i) => (
        <mesh key={r}>
          <torusGeometry args={[r, 0.012, 8, 200, Math.PI * (1.2 + i * 0.25)]} />
          <meshBasicMaterial color={[2.6, 0.75, 0.12]} transparent opacity={0.8 - i * 0.2} toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
}
