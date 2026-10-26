"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

import { film } from "../store";
import { WORLD } from "./path";

/** Small deterministic PRNG so the dust layout is stable between renders. */
function seeded(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Drifting chalk/dust motes that fill the whole length of the film. */
export function Dust({ count }: { count: number }) {
  const material = useRef<THREE.ShaderMaterial>(null);

  const geometry = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const seed = new Float32Array(count);
    const rand = seeded(count);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (rand() - 0.5) * 22;
      pos[i * 3 + 1] = (rand() - 0.5) * 12;
      pos[i * 3 + 2] = 14 - rand() * 370;
      seed[i] = rand();
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("aSeed", new THREE.BufferAttribute(seed, 1));
    return g;
  }, [count]);

  const uniforms = useMemo(
    () => ({ uTime: { value: 0 }, uVel: { value: 0 }, uPixel: { value: 1 } }),
    [],
  );

  useFrame(({ clock, gl }) => {
    const u = material.current?.uniforms;
    if (!u) return;
    u.uTime.value = clock.elapsedTime;
    u.uVel.value = THREE.MathUtils.lerp(u.uVel.value, film.velocity, 0.08);
    u.uPixel.value = gl.getPixelRatio();
  });

  return (
    <points geometry={geometry}>
      <shaderMaterial
        ref={material}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        vertexShader={/* glsl */ `
          uniform float uTime;
          uniform float uVel;
          uniform float uPixel;
          attribute float aSeed;
          varying float vSeed;
          varying float vFade;
          void main() {
            vSeed = aSeed;
            vec3 p = position;
            p.x += sin(uTime * 0.2 + aSeed * 40.0) * 0.4;
            p.y += cos(uTime * 0.15 + aSeed * 30.0) * 0.4;
            vec4 mv = modelViewMatrix * vec4(p, 1.0);
            float depth = -mv.z;
            vFade = smoothstep(0.3, 2.0, depth) * (1.0 - smoothstep(18.0, 40.0, depth));
            gl_PointSize = (1.2 + aSeed * 2.6 + abs(uVel) * 3.0) * uPixel * (14.0 / depth);
            gl_Position = projectionMatrix * mv;
          }
        `}
        fragmentShader={/* glsl */ `
          varying float vSeed;
          varying float vFade;
          void main() {
            float d = length(gl_PointCoord - 0.5);
            float a = smoothstep(0.5, 0.0, d);
            vec3 warm = vec3(1.0, 0.45, 0.12);
            vec3 white = vec3(0.9, 0.9, 0.95);
            vec3 col = vSeed > 0.86 ? warm * 1.6 : white * 0.7;
            gl_FragColor = vec4(col, a * vFade * 0.75);
          }
        `}
      />
    </points>
  );
}

/** Dark floor with a faint orange measuring grid under the last three chapters. */
export function Floor() {
  const uniforms = useMemo(() => ({ uTime: { value: 0 } }), []);
  const material = useRef<THREE.ShaderMaterial>(null);
  useFrame(({ clock }) => {
    if (material.current) material.current.uniforms.uTime.value = clock.elapsedTime;
  });
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, WORLD.floorY, -300]}>
      <planeGeometry args={[80, 140]} />
      <shaderMaterial
        ref={material}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        vertexShader={/* glsl */ `
          varying vec2 vPos;
          varying float vDepth;
          void main() {
            vPos = position.xy;
            vec4 mv = modelViewMatrix * vec4(position, 1.0);
            vDepth = -mv.z;
            gl_Position = projectionMatrix * mv;
          }
        `}
        fragmentShader={/* glsl */ `
          uniform float uTime;
          varying vec2 vPos;
          varying float vDepth;
          float grid(vec2 p, float size) {
            vec2 g = abs(fract(p / size - 0.5) - 0.5) / fwidth(p / size);
            return 1.0 - min(min(g.x, g.y), 1.0);
          }
          void main() {
            float fine = grid(vPos, 1.0) * 0.18;
            float coarse = grid(vPos, 5.0) * 0.45;
            float pulse = 0.6 + 0.4 * sin(vPos.y * 0.25 - uTime * 1.2);
            float edge = 1.0 - smoothstep(10.0, 34.0, length(vPos.x));
            float fade = (1.0 - smoothstep(10.0, 36.0, vDepth)) * edge;
            vec3 col = vec3(1.0, 0.36, 0.06) * (fine + coarse * pulse);
            gl_FragColor = vec4(col, (fine + coarse) * fade);
          }
        `}
      />
    </mesh>
  );
}
