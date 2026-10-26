"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

import { film } from "../store";
import { WORLD } from "./path";

/**
 * "Forge": a tunnel of iron weight plates the camera flies down. Every third
 * plate carries a glowing orange ring so bloom paints light rhythmically past
 * the lens; the plates spin faster the harder the visitor scrolls.
 */
const _dummy = new THREE.Object3D();

export function Tunnel() {
  const { start, count, gap } = WORLD.tunnel;
  const plates = useRef<THREE.InstancedMesh>(null);
  const glows = useRef<THREE.InstancedMesh>(null);
  const spin = useRef(0);

  const plateGeometry = useMemo(() => {
    const shape = new THREE.Shape();
    shape.absarc(0, 0, 3.3, 0, Math.PI * 2, false);
    const hole = new THREE.Path();
    hole.absarc(0, 0, 2.55, 0, Math.PI * 2, true);
    shape.holes.push(hole);
    const geometry = new THREE.ExtrudeGeometry(shape, {
      depth: 0.32,
      bevelEnabled: true,
      bevelSize: 0.06,
      bevelThickness: 0.06,
      bevelSegments: 3,
      curveSegments: 72,
    });
    geometry.center();
    return geometry;
  }, []);

  const glowCount = Math.ceil(count / 3);

  useFrame((_, delta) => {
    spin.current += delta * (0.12 + Math.abs(film.velocity) * 2.5);
    const p = plates.current;
    const g = glows.current;
    if (!p || !g) return;
    for (let i = 0; i < count; i++) {
      const dir = i % 2 === 0 ? 1 : -1;
      _dummy.position.set(0, 0, start - i * gap);
      _dummy.rotation.set(0, 0, spin.current * dir * (0.6 + (i % 5) * 0.12) + i * 0.4);
      const s = 1 + Math.sin(i * 1.7) * 0.05;
      _dummy.scale.set(s, s, 1);
      _dummy.updateMatrix();
      p.setMatrixAt(i, _dummy.matrix);
      if (i % 3 === 0) {
        _dummy.position.z += 0.25;
        _dummy.scale.setScalar(s);
        _dummy.updateMatrix();
        g.setMatrixAt(i / 3, _dummy.matrix);
      }
    }
    p.instanceMatrix.needsUpdate = true;
    g.instanceMatrix.needsUpdate = true;
  });

  return (
    <group>
      <instancedMesh ref={plates} args={[plateGeometry, undefined, count]}>
        <meshStandardMaterial color="#2a2b31" metalness={0.92} roughness={0.32} envMapIntensity={1.1} />
      </instancedMesh>
      <instancedMesh ref={glows} args={[undefined, undefined, glowCount]}>
        <torusGeometry args={[2.62, 0.022, 8, 160]} />
        <meshBasicMaterial color={[3, 0.85, 0.12]} toneMapped={false} />
      </instancedMesh>
    </group>
  );
}
