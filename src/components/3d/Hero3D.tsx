"use client";

import { useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { Environment, Float, Lightformer, PerspectiveCamera } from "@react-three/drei";
import * as THREE from "three";

import { FitxWordmark } from "@/components/3d/FitxWordmark";

function Scene() {
  const chrome = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#eef0f3",
        metalness: 1,
        roughness: 0.12,
        envMapIntensity: 1.5,
      }),
    [],
  );
  const accent = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#FF4B00",
        metalness: 0.55,
        roughness: 0.25,
        emissive: "#FF4B00",
        emissiveIntensity: 0.18,
      }),
    [],
  );

  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 0, 5]} />
      <Environment resolution={256} frames={1}>
        <color attach="background" args={["#08070a"]} />
        <Lightformer form="rect" intensity={3} color="#ffffff" position={[0, 6, -4]} scale={[12, 1.2, 1]} />
        <Lightformer form="rect" intensity={6} color="#ffffff" position={[-6, 0, 2]} rotation-y={Math.PI / 2} scale={[8, 0.6, 1]} />
        <Lightformer form="rect" intensity={2} color="#cfd8ff" position={[6, 1, 2]} rotation-y={-Math.PI / 2} scale={[8, 1, 1]} />
        <Lightformer form="ring" intensity={2.5} color="#ffffff" position={[0, -4, 6]} scale={3} />
      </Environment>
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      <pointLight position={[-10, -10, -5]} intensity={0.5} color="#FF4B00" />

      <Float speed={2} rotationIntensity={1} floatIntensity={2}>
        <FitxWordmark chrome={chrome} accent={accent} position={[-2, 1, 0]} scale={0.6} />
      </Float>
      <Float speed={1.5} rotationIntensity={0.8} floatIntensity={1.5}>
        <FitxWordmark chrome={chrome} accent={accent} position={[2, -0.5, -1]} scale={0.6} />
      </Float>
      <Float speed={1.8} rotationIntensity={0.6} floatIntensity={1.8}>
        <FitxWordmark chrome={chrome} accent={accent} position={[0, -1.5, -2]} scale={0.6} />
      </Float>
    </>
  );
}

export function Hero3D() {
  return (
    <div className="absolute inset-0 -z-10">
      <Canvas>
        <Scene />
      </Canvas>
    </div>
  );
}
