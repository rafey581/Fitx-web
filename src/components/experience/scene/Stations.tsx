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
  const { z } = WORLD.plans;
  const shown = plans.slice(0, 3);
  const xs = shown.length === 2 ? WORLD.plans.pair : WORLD.plans.xs;
  const heights = shown.length === 2 ? [3.0, 3.8] : [2.6, 3.8, 3.2];
  const glow = useRef<THREE.MeshBasicMaterial[]>([]);

  useFrame(({ clock }) => {
    const rise = ramp(film.time, 5.85, 6.45);
    glow.current.forEach((m, i) => {
      if (!m) return;
      m.opacity = (0.6 + Math.sin(clock.elapsedTime * 2 + i) * 0.25) * rise;
    });
  });

  return (
    <group>
      {shown.map((p, k) => {
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

/**
 * Chapter 5 — a holographic progress dashboard: weekly bars rise, a body-fat
 * trend line draws itself and a gauge ring fills as the chapter plays.
 * Illustrative only: no client data is shown.
 */
const BARS = [0.55, 0.62, 0.6, 0.7, 0.74, 0.8, 0.86, 0.93];
const TREND = [0.92, 0.86, 0.88, 0.78, 0.74, 0.69, 0.62, 0.58, 0.55, 0.5];

export function Progress() {
  const { x, y, z } = WORLD.progress;
  const bars = useRef<THREE.Group>(null);
  const line = useRef<THREE.Line>(null);
  const gauge = useRef<THREE.Mesh>(null);

  const lineGeometry = useMemo(() => {
    const pts = TREND.map((v, i) => new THREE.Vector3(-1.9 + (i / (TREND.length - 1)) * 3.8, -0.2 + v * 1.4, 0.05));
    const curve = new THREE.CatmullRomCurve3(pts);
    return new THREE.BufferGeometry().setFromPoints(curve.getPoints(120));
  }, []);

  const trendLine = useMemo(
    () =>
      new THREE.Line(
        lineGeometry,
        new THREE.LineBasicMaterial({ color: new THREE.Color(2.6, 2.6, 2.7), toneMapped: false }),
      ),
    [lineGeometry],
  );

  const frame = useMemo(() => {
    const w = 2.3;
    const h = 1.45;
    const g = new THREE.BufferGeometry();
    const grid: number[] = [];
    for (let i = 0; i <= 4; i++) {
      const yy = -h + (i / 4) * 2 * h;
      grid.push(-w, yy, 0, w, yy, 0);
    }
    g.setAttribute("position", new THREE.Float32BufferAttribute(grid, 3));
    return g;
  }, []);

  useFrame(({ clock }) => {
    const play = ramp(film.time, 4.92, 5.22);
    const t = clock.elapsedTime;
    bars.current?.children.forEach((bar, i) => {
      const h = BARS[i] * 1.6 * ramp(play, i * 0.04, 0.55 + i * 0.04) + Math.sin(t * 1.5 + i) * 0.02;
      bar.scale.y = Math.max(0.001, h);
      bar.position.y = -1.3 + bar.scale.y / 2;
    });
    if (line.current) line.current.geometry.setDrawRange(0, Math.floor(121 * ramp(play, 0.25, 1)));
    if (gauge.current) {
      const m = gauge.current.material as THREE.MeshBasicMaterial;
      m.opacity = 0.9 * play;
      gauge.current.rotation.z = t * 0.2;
    }
  });

  return (
    <group position={[x, y, z]} rotation={[0, -0.5, 0]} scale={1.15}>
      {/* Glass backplate */}
      <mesh position={[0, 0, -0.06]}>
        <planeGeometry args={[5, 3.3]} />
        <meshBasicMaterial color="#120a07" transparent opacity={0.55} />
      </mesh>
      <lineSegments geometry={frame}>
        <lineBasicMaterial color={[0.8, 0.8, 0.85]} transparent opacity={0.18} toneMapped={false} />
      </lineSegments>
      <group ref={bars}>
        {BARS.map((_, i) => (
          <mesh key={i} position={[-1.9 + i * 0.5 + 0.12, -1.3, 0]}>
            <boxGeometry args={[0.24, 1, 0.08]} />
            <meshBasicMaterial color={i === BARS.length - 1 ? [3, 0.9, 0.15] : [1.1, 0.4, 0.12]} toneMapped={false} />
          </mesh>
        ))}
      </group>
      <primitive object={trendLine} ref={line} />
      <mesh ref={gauge} position={[2.95, 0.9, 0.1]}>
        <torusGeometry args={[0.5, 0.035, 8, 96, Math.PI * 1.45]} />
        <meshBasicMaterial color={[3, 0.9, 0.15]} transparent opacity={0} toneMapped={false} />
      </mesh>
      <mesh position={[2.95, 0.9, 0.08]}>
        <torusGeometry args={[0.5, 0.012, 8, 96]} />
        <meshBasicMaterial color={[0.6, 0.6, 0.65]} transparent opacity={0.35} toneMapped={false} />
      </mesh>
    </group>
  );
}
