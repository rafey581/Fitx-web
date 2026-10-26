/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useRef, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

interface Immersive3DProps {
  className?: string;
  children: React.ReactNode;
}

export function Immersive3D({ className, children }: Immersive3DProps) {
  const sceneRef = useRef<THREE.Scene>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera>(null);
  const rendererRef = useRef<THREE.WebGLRenderer>(null);

  useEffect(() => {
    // Create immersive background scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0d0a10);
    scene.fog = new THREE.Fog(0x0d0a10, 10, 100);

    // Animated gradient background
    const gradient = new THREE.Object3D();
    scene.add(gradient);

    // Create moving light beams
    const light1 = new THREE.DirectionalLight(0xff4b00, 2);
    light1.position.set(5, 5, 5);
    scene.add(light1);

    const light2 = new THREE.DirectionalLight(0x1e2330, 1);
    light2.position.set(-5, -5, -5);
    scene.add(light2);

    // Animated cube grid
    const numCubes = 30;
    const cubes: THREE.Mesh[] = [];

    for (let i = 0; i < numCubes; i++) {
      const geometry = new THREE.BoxGeometry(
        Math.random() * 2 + 0.5,
        Math.random() * 2 + 0.5,
        Math.random() * 2 + 0.5
      );
      const material = new THREE.MeshStandardMaterial({
        color: [
          0xff4b00,
          0x1e2330,
          0x0d0a10,
          0xffd700,
        ][Math.floor(Math.random() * 4)],
        metalness: 0.3 + Math.random() * 0.5,
        roughness: 0.4 + Math.random() * 0.4,
      });
      const cube = new THREE.Mesh(geometry, material);
      cube.position.set(
        (Math.random() - 0.5) * 30,
        (Math.random() - 0.5) * 30,
        (Math.random() - 0.5) * 30
      );
      cube.userData.speed = {
        x: (Math.random() - 0.5) * 0.01,
        y: (Math.random() - 0.5) * 0.01,
        z: (Math.random() - 0.5) * 0.01,
      };
      cube.userData.rotateSpeed = Math.random() * 0.01 + 0.005;
      scene.add(cube);
      cubes.push(cube);
    }

    // Floor
    const floorGeometry = new THREE.PlaneGeometry(50, 50);
    const floorMaterial = new THREE.MeshStandardMaterial({
      color: 0x1e2330,
      roughness: 0.8,
      metalness: 0.2,
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.5;
    scene.add(floor);

    // Camera
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 15;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    rendererRef.current = renderer;

    // Animation loop
    const clock = new THREE.Clock();
    let rafId = 0;

    function animate() {
      const elapsed = clock.getElapsedTime();

      // Rotate cubes
      cubes.forEach((cube) => {
        cube.rotation.x += cube.userData.rotateSpeed;
        cube.rotation.y += cube.userData.rotateSpeed;
        cube.position.x += cube.userData.speed.x;
        cube.position.y += cube.userData.speed.y;
        cube.position.z += cube.userData.speed.z;

        // Loop cubes
        if (cube.position.x > 15) cube.position.x = -15;
        if (cube.position.y > 15) cube.position.y = -15;
        if (cube.position.z > 15) cube.position.z = -15;
      });

      // Subtle camera movement based on time
      camera.position.x = Math.sin(elapsed * 0.3) * 0.5;
      camera.position.y = Math.cos(elapsed * 0.2) * 0.3;

      renderer.render(scene, camera);

      rafId = requestAnimationFrame(animate);
    }

    animate();

    // Handle resize
    const handleResize = () => {
      renderer.setSize(window.innerWidth, window.innerHeight);
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
    };
    window.addEventListener("resize", handleResize);

    // Scroll-driven animations
    gsap.registerPlugin(ScrollTrigger);

    // Sections will add their own ScrollTriggers, but set up base here
    ScrollTrigger.defaults({ scroller: window });

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", handleResize);
      gsap.killTweensOf("*");
      ScrollTrigger.getAll().forEach((st) => st.kill());
    };
  }, []);

  return (
    <Canvas
      gl={{ antialias: true, alpha: true }}
      camera={{ position: [0, 0, 15], fov: 60 }}
      shadows
    >
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      <directionalLight position={[-10, -10, -5]} intensity={0.5} color="#FF4B00" />

      {children}

      {/* Moving gradient overlay */}
      <group rotation={[0.1, 0.2, 0]}>
        <mesh>
          <planeGeometry />
          <meshStandardMaterial
            transparent
            opacity={0.03}
            color={0xff4b00}
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>

      {/* Grid floor pattern */}
      <group>
        <mesh receiveShadow={true}>
          <planeGeometry />
          <meshStandardMaterial
            color={0x1e2330}
            roughness={0.8}
            metalness={0.2}
            opacity={0.3}
          />
        </mesh>
      </group>
    </Canvas>
  );
}