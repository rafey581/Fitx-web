"use client";

import { useEffect, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import { Bloom, EffectComposer, Vignette } from "@react-three/postprocessing";
import * as THREE from "three";

import { film } from "../store";
import { Dust } from "./Atmosphere";
import { Emblem } from "./Emblem";

/**
 * Ambient 3D world behind every inner page: the FITX emblem hangs off to one
 * side and turns as the page scrolls, glow rings drift behind it and dust
 * fills the depth. Cheaper than the home film (no textures, light effects),
 * so it can sit under long content pages.
 *
 * `film.target` is the page's scroll progress (0..1) here, set by FilmShell.
 */

const BG = "#050407";

function Rig({ mobile }: { mobile: boolean }) {
  const camera = useThree((s) => s.camera);
  const emblem = useRef<THREE.Group>(null);
  const rings = useRef<THREE.Group>(null);

  useFrame(({ clock }, delta) => {
    film.time += (film.target - film.time) * (1 - Math.exp(-delta * 3));
    film.velocity *= 0.92;
    const p = film.time;
    const t = clock.elapsedTime;

    camera.position.set(film.pointer.x * 0.35, 0.2 - p * 1.6 + film.pointer.y * 0.2, 9);
    camera.lookAt(0, -p * 1.6, 0);

    if (emblem.current) {
      emblem.current.rotation.y = p * Math.PI * 2.2 + Math.sin(t * 0.3) * 0.15;
      emblem.current.rotation.z = Math.sin(p * Math.PI) * 0.25;
      emblem.current.position.y = -p * 1.6 + (mobile ? 2.1 : 0.2);
    }
    if (rings.current) {
      rings.current.position.y = -p * 1.6;
      rings.current.children.forEach((c, i) => {
        c.rotation.z = t * (0.06 + i * 0.03) * (i % 2 ? -1 : 1) + p * (i + 1);
      });
    }
  });

  return (
    <>
      <group ref={emblem} position={mobile ? [0, 2.1, -2] : [3.6, 0.2, 0]}>
        <Emblem scale={mobile ? 0.62 : 0.9} shards={mobile ? 14 : 26} />
      </group>
      <group ref={rings} position={[mobile ? 0 : 3.6, 0, -6]}>
        {[3.2, 4.4, 5.8, 7.4].map((r, i) => (
          <mesh key={r}>
            <torusGeometry args={[r, 0.012, 8, 220, Math.PI * (1.1 + i * 0.22)]} />
            <meshBasicMaterial color={[2.4, 0.7, 0.12]} transparent opacity={0.65 - i * 0.12} toneMapped={false} />
          </mesh>
        ))}
      </group>
    </>
  );
}

export default function Backdrop() {
  const [mobile] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(max-width: 768px)").matches,
  );
  const [reduced] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );

  // Pause rendering while the tab is hidden.
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const onVis = () => setVisible(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  return (
    <Canvas
      frameloop={visible ? "always" : "never"}
      dpr={mobile ? [1, 1.25] : [1, 1.5]}
      gl={{ antialias: false, powerPreference: "high-performance", alpha: false }}
      camera={{ fov: mobile ? 55 : 42, near: 0.1, far: 80, position: [0, 0.2, 9] }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
      }}
    >
      <color attach="background" args={[BG]} />
      <fog attach="fog" args={[BG, 8, 30]} />
      <Environment resolution={128} frames={1}>
        <Lightformer form="rect" intensity={3} color="#ffffff" position={[0, 6, -4]} scale={[12, 1.2, 1]} />
        <Lightformer form="rect" intensity={6} color="#ff5a12" position={[-6, 0, 2]} rotation-y={Math.PI / 2} scale={[8, 0.6, 1]} />
        <Lightformer form="rect" intensity={2} color="#cfd8ff" position={[6, 1, 2]} rotation-y={-Math.PI / 2} scale={[8, 1, 1]} />
      </Environment>
      <ambientLight intensity={0.15} />
      <pointLight position={[5, 3, 5]} intensity={30} distance={20} color="#ffe2cc" />
      <Rig mobile={mobile} />
      <Dust count={mobile ? 700 : 1600} />
      {reduced ? null : (
        <EffectComposer multisampling={0}>
          <Bloom mipmapBlur luminanceThreshold={0.85} intensity={0.9} radius={0.7} />
          <Vignette offset={0.25} darkness={0.8} />
        </EffectComposer>
      )}
    </Canvas>
  );
}
