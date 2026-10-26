"use client";

import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, PerspectiveCamera } from "@react-three/drei";
import * as THREE from "three";

function Dumbbell({ position }: { position: [number, number, number] }) {
  const meshRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.5) * 0.2;
      meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.3;
    }
  });

  return (
    <group ref={meshRef} position={position}>
      <mesh position={[-0.5, 0, 0]}>
        <cylinderGeometry args={[0.15, 0.15, 0.1, 32]} />
        <meshStandardMaterial color="#FF4B00" metalness={0.8} roughness={0.2} />
      </mesh>
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[0.08, 0.08, 0.8, 32]} />
        <meshStandardMaterial color="#1E2330" metalness={0.7} roughness={0.3} />
      </mesh>
      <mesh position={[0.5, 0, 0]}>
        <cylinderGeometry args={[0.15, 0.15, 0.1, 32]} />
        <meshStandardMaterial color="#FF4B00" metalness={0.8} roughness={0.2} />
      </mesh>
    </group>
  );
}

function Scene() {
  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 0, 5]} />
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      <pointLight position={[-10, -10, -5]} intensity={0.5} color="#FF4B00" />
      
      <Float speed={2} rotationIntensity={1} floatIntensity={2}>
        <Dumbbell position={[-2, 1, 0]} />
      </Float>
      <Float speed={1.5} rotationIntensity={0.8} floatIntensity={1.5}>
        <Dumbbell position={[2, -0.5, -1]} />
      </Float>
      <Float speed={1.8} rotationIntensity={0.6} floatIntensity={1.8}>
        <Dumbbell position={[0, -1.5, -2]} />
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
