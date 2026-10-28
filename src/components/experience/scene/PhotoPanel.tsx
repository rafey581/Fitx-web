"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";

import { film, ramp } from "../store";

/**
 * A studio photo floating in space. Far away it is a cold, desaturated slab;
 * as the camera approaches it warms into full colour. Scroll velocity bends
 * the plane and splits its RGB channels, which gives fast scrolling a
 * cinematic, motion-blurred feel.
 */

const vertex = /* glsl */ `
  uniform float uVel;
  uniform float uTime;
  uniform float uReveal;
  varying vec2 vUv;
  varying float vDepth;
  void main() {
    vUv = uv;
    vec3 p = position;
    float bend = sin(uv.x * 3.14159);
    p.z += bend * uVel * 0.4;
    p.z += sin(uv.y * 4.0 + uTime * 0.8) * 0.04 * (1.0 - uReveal);
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    vDepth = -mv.z;
    gl_Position = projectionMatrix * mv;
  }
`;

const fragment = /* glsl */ `
  uniform sampler2D uMap;
  uniform float uImgAspect;
  uniform float uPlaneAspect;
  uniform float uVel;
  uniform float uReveal;
  uniform float uOpacity;
  uniform vec3 uFog;
  uniform float uFogNear;
  uniform float uFogFar;
  varying vec2 vUv;
  varying float vDepth;

  void main() {
    vec2 s = uPlaneAspect > uImgAspect
      ? vec2(1.0, uImgAspect / uPlaneAspect)
      : vec2(uPlaneAspect / uImgAspect, 1.0);
    vec2 uv = (vUv - 0.5) * s * (1.0 - 0.06 * uReveal) + 0.5;

    float shift = uVel * 0.008 + (1.0 - uReveal) * 0.002;
    vec3 col = vec3(
      texture2D(uMap, uv + vec2(shift, 0.0)).r,
      texture2D(uMap, uv).g,
      texture2D(uMap, uv - vec2(shift, 0.0)).b
    );

    float gray = dot(col, vec3(0.299, 0.587, 0.114));
    vec3 cold = vec3(gray) * vec3(0.78, 0.8, 0.88) * 0.55;
    col = mix(cold, col, uReveal);

    // Soft inner vignette + fine scanlines for a lens/monitor texture.
    vec2 e = smoothstep(vec2(0.0), vec2(0.06), vUv) * smoothstep(vec2(0.0), vec2(0.06), 1.0 - vUv);
    col *= mix(0.55, 1.0, e.x * e.y);
    col *= 0.965 + 0.035 * sin(vUv.y * 900.0);

    float fog = smoothstep(uFogNear, uFogFar, vDepth);
    col = mix(col, uFog, fog);
    float far = 1.0 - smoothstep(15.0, 24.0, vDepth);
    gl_FragColor = vec4(col, uOpacity * far);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

function cornerLines(w: number, h: number, len: number) {
  const x = w / 2 + 0.12;
  const y = h / 2 + 0.12;
  const pts: number[] = [];
  for (const [sx, sy] of [
    [-1, -1],
    [1, -1],
    [1, 1],
    [-1, 1],
  ]) {
    pts.push(sx * x, sy * y, 0, sx * (x - len), sy * y, 0);
    pts.push(sx * x, sy * y, 0, sx * x, sy * (y - len), 0);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
  return g;
}

const _worldPos = new THREE.Vector3();

function prepare(texture: THREE.Texture) {
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
}

export function PhotoPanel({
  url,
  width,
  height,
  position,
  rotation,
  lookAtAxis = false,
  revealNear = 5,
  revealFar = 15,
  accent = false,
}: {
  url: string;
  width: number;
  /** Omit to size the panel from the photo's own aspect ratio. */
  height?: number;
  position: [number, number, number];
  rotation?: [number, number, number];
  /** Turn the panel to face the film's central axis (used by the helix). */
  lookAtAxis?: boolean;
  revealNear?: number;
  revealFar?: number;
  accent?: boolean;
}) {
  const texture = useTexture(url, prepare);
  const material = useRef<THREE.ShaderMaterial>(null);
  const group = useRef<THREE.Group>(null);
  const image = texture.image as { width: number; height: number } | undefined;
  const imgAspect = image ? image.width / image.height : 1;
  const h = height ?? width / imgAspect;

  const uniforms = useMemo(
    () => ({
      uMap: { value: texture },
      uImgAspect: { value: imgAspect },
      uPlaneAspect: { value: width / h },
      uVel: { value: 0 },
      uTime: { value: 0 },
      uReveal: { value: 0 },
      uOpacity: { value: 1 },
      uFog: { value: new THREE.Color("#050407") },
      uFogNear: { value: 14 },
      uFogFar: { value: 46 },
    }),
    [texture, imgAspect, width, h],
  );

  const corners = useMemo(() => cornerLines(width, h, 0.35), [width, h]);

  useLayoutEffect(() => {
    if (lookAtAxis && group.current) {
      group.current.lookAt(0, position[1], position[2]);
    }
  }, [lookAtAxis, position]);

  useFrame(({ camera, clock }) => {
    const u = material.current?.uniforms;
    if (!group.current || !u) return;
    group.current.getWorldPosition(_worldPos);
    const d = camera.position.distanceTo(_worldPos);
    u.uReveal.value = 1 - ramp(d, revealNear, revealFar);
    u.uVel.value = THREE.MathUtils.lerp(u.uVel.value, film.velocity, 0.1);
    u.uTime.value = clock.elapsedTime;
  });

  return (
    <group ref={group} position={position} rotation={rotation}>
      <mesh>
        <planeGeometry args={[width, h, 24, 24]} />
        <shaderMaterial
          ref={material}
          vertexShader={vertex}
          fragmentShader={fragment}
          uniforms={uniforms}
          transparent
          side={THREE.DoubleSide}
        />
      </mesh>
      <lineSegments geometry={corners}>
        <lineBasicMaterial
          color={accent ? [2.4, 0.7, 0.12] : [0.9, 0.9, 0.9]}
          transparent
          opacity={accent ? 1 : 0.55}
          toneMapped={false}
        />
      </lineSegments>
    </group>
  );
}
