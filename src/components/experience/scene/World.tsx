"use client";

import { Suspense, useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import {
  Bloom,
  ChromaticAberration,
  EffectComposer,
  Noise,
  Vignette,
} from "@react-three/postprocessing";
import { BlendFunction, type ChromaticAberrationEffect } from "postprocessing";
import * as THREE from "three";

import type { FilmContent } from "../content";
import { film, local, useFilmUi } from "../store";
import { Dust, Floor } from "./Atmosphere";
import { Emblem } from "./Emblem";
import { cameraAt, WORLD } from "./path";
import { Coaches, FinaleHalo, Plans, Programs, Studio } from "./Stations";
import { Tunnel } from "./Tunnel";

const BG = "#050407";

// Per-frame scratch objects (module scope: mutated every frame, never rendered).
const _pos = new THREE.Vector3();
const _look = new THREE.Vector3();
const _caOffset = new THREE.Vector2(0, 0);

/** Drives the camera along the shot list and carries the key light with it. */
function CameraRig({ reduced }: { reduced: boolean }) {
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);
  const light = useRef<THREE.PointLight>(null);

  // Portrait screens anchor text to the bottom, so lift the picture into the
  // top half by shifting the projection rather than re-framing every shot.
  useEffect(() => {
    const cam = camera as THREE.PerspectiveCamera;
    if (size.width < size.height) {
      cam.setViewOffset(size.width, size.height, 0, size.height * 0.16, size.width, size.height);
    } else {
      cam.clearViewOffset();
    }
    return () => cam.clearViewOffset();
  }, [camera, size.width, size.height]);

  useFrame((_, delta) => {
    // Ease the shown time towards the scrolled time: this damping is what
    // makes scroll feel like scrubbing a film rather than jumping slides.
    const k = reduced ? 1 : 1 - Math.exp(-delta * 3.2);
    film.time += (film.target - film.time) * k;
    film.velocity *= 0.92;

    cameraAt(film.time, _pos, _look);
    _pos.x += film.pointer.x * 0.22;
    _pos.y += film.pointer.y * 0.14;
    camera.position.copy(_pos);
    camera.lookAt(_look);

    // Banking: a gentle roll down the tunnel, a full swirl through the helix.
    const roll =
      Math.sin(Math.PI * local(film.time, 1)) * 0.28 +
      Math.sin(Math.PI * local(film.time, 3)) * 0.85;
    camera.rotateZ(roll);

    if (light.current) {
      light.current.position.set(_pos.x + 1.5, _pos.y + 2, _pos.z - 1);
    }
  });

  return <pointLight ref={light} color="#ffe2cc" intensity={30} distance={22} decay={1.6} />;
}

/** Feeds scroll velocity into chromatic aberration for a motion-blur kick. */
function Effects() {
  const ca = useRef<ChromaticAberrationEffect>(null);
  useFrame(() => {
    const v = Math.min(1, Math.abs(film.velocity));
    _caOffset.set(v * 0.004, v * 0.002);
    if (ca.current) ca.current.offset = _caOffset;
  });
  return (
    <EffectComposer multisampling={0}>
      <Bloom mipmapBlur luminanceThreshold={0.85} luminanceSmoothing={0.2} intensity={1.1} radius={0.75} />
      <ChromaticAberration
        ref={ca}
        offset={_caOffset}
        radialModulation={false}
        modulationOffset={0}
        blendFunction={BlendFunction.NORMAL}
      />
      <Noise opacity={0.35} blendFunction={BlendFunction.OVERLAY} />
      <Vignette offset={0.22} darkness={0.85} />
    </EffectComposer>
  );
}

/** Procedural studio lighting for chrome reflections — no HDR download. */
function Studiolights() {
  return (
    <Environment resolution={256} frames={1}>
      <color attach="background" args={["#08070a"]} />
      <Lightformer form="rect" intensity={3} color="#ffffff" position={[0, 6, -4]} scale={[12, 1.2, 1]} />
      <Lightformer form="rect" intensity={6} color="#ff5a12" position={[-6, 0, 2]} rotation-y={Math.PI / 2} scale={[8, 0.6, 1]} />
      <Lightformer form="rect" intensity={2} color="#cfd8ff" position={[6, 1, 2]} rotation-y={-Math.PI / 2} scale={[8, 1, 1]} />
      <Lightformer form="ring" intensity={2.5} color="#ffffff" position={[0, -4, 6]} scale={3} />
    </Environment>
  );
}

/** Reports texture/asset loading to the DOM loader. */
function ProgressBridge({ onProgress }: { onProgress: (p: number) => void }) {
  useEffect(() => {
    // Loader callbacks can fire while React is rendering a suspended texture,
    // so hand the value over on the next tick instead of setting state inline.
    const manager = THREE.DefaultLoadingManager;
    let timer = 0;
    const report = (p: number) => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => onProgress(p), 0);
    };
    manager.onProgress = (_url, loaded, total) => report((loaded / Math.max(1, total)) * 100);
    manager.onLoad = () => report(100);
    return () => {
      window.clearTimeout(timer);
      manager.onProgress = () => {};
      manager.onLoad = () => {};
    };
  }, [onProgress]);
  return null;
}

function Scene({ content, mobile }: { content: FilmContent; mobile: boolean }) {
  const setLoaded = useFilmUi((s) => s.setLoaded);
  useEffect(() => {
    // Rendered inside <Suspense>: mounting means every texture has resolved.
    setLoaded(true);
  }, [setLoaded]);

  return (
    <>
      <Studiolights />
      <ambientLight intensity={0.12} />
      <directionalLight position={[4, 6, 6]} intensity={0.8} color="#ffffff" />
      <Emblem intro position={[WORLD.emblem.x, WORLD.emblem.y, WORLD.emblem.z]} shards={mobile ? 22 : 44} />
      <Tunnel />
      <Programs services={content.services} />
      <Studio gallery={content.gallery} />
      <Coaches coaches={content.coaches} />
      <Plans plans={content.plans} />
      <Floor />
      <Emblem position={[WORLD.finale.x, WORLD.finale.y, WORLD.finale.z]} scale={0.85} shards={mobile ? 16 : 30} />
      <FinaleHalo />
      <pointLight position={[0, 4, WORLD.finale.z + 4]} color="#ff5a12" intensity={25} distance={14} />
    </>
  );
}

export default function World({
  content,
  onProgress,
}: {
  content: FilmContent;
  onProgress: (p: number) => void;
}) {
  const [mobile, reduced] = useMemo(() => {
    if (typeof window === "undefined") return [false, false];
    return [
      window.matchMedia("(max-width: 768px)").matches,
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    ];
  }, []);

  return (
    <Canvas
      dpr={mobile ? [1, 1.5] : [1, 1.75]}
      gl={{ antialias: false, powerPreference: "high-performance", alpha: false }}
      camera={{ fov: mobile ? 58 : 45, near: 0.1, far: 140, position: [0, 0.15, 9.5] }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.05;
      }}
    >
      <color attach="background" args={[BG]} />
      <fog attach="fog" args={[BG, 12, 44]} />
      <ProgressBridge onProgress={onProgress} />
      <CameraRig reduced={reduced} />
      <Dust count={mobile ? 1400 : 3600} />
      <Suspense fallback={null}>
        <Scene content={content} mobile={mobile} />
      </Suspense>
      {reduced ? null : <Effects />}
    </Canvas>
  );
}
