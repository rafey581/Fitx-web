"use client";

import { useEffect } from "react";
import * as THREE from "three";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";

export function Background3D() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Setup Lenis smooth scroll
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: "vertical",
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 2,
    });

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    // Create Three.js scene directly
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0d0a10);
    scene.fog = new THREE.Fog(0x0d0a10, 10, 100);

    // Lights
    const light1 = new THREE.DirectionalLight(0xff4b00, 2);
    light1.position.set(5, 5, 5);
    scene.add(light1);

    const light2 = new THREE.DirectionalLight(0x1e2330, 1);
    light2.position.set(-5, -5, -5);
    scene.add(light2);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
    scene.add(ambientLight);

    // Animated cubes
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
      (cube as any).userData = {
        speed: {
          x: (Math.random() - 0.5) * 0.01,
          y: (Math.random() - 0.5) * 0.01,
          z: (Math.random() - 0.5) * 0.01,
        },
        rotateSpeed: Math.random() * 0.01 + 0.005,
      };
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
    const camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.z = 15;

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;

    const canvasElement = document.createElement("canvas");
    canvasElement.style.position = "fixed";
    canvasElement.style.top = "0";
    canvasElement.style.left = "0";
    canvasElement.style.zIndex = "-1";
    canvasElement.style.width = "100%";
    canvasElement.style.height = "100%";
    document.body.appendChild(canvasElement);
    renderer.domElement.replaceWith(canvasElement);
    renderer.setAnimationLoop(() => {
      const elapsed = Date.now() * 0.001;

      cubes.forEach((cube) => {
        cube.rotation.x += (cube as any).userData.rotateSpeed;
        cube.rotation.y += (cube as any).userData.rotateSpeed;
        cube.position.x += (cube as any).userData.speed.x;
        cube.position.y += (cube as any).userData.speed.y;
        cube.position.z += (cube as any).userData.speed.z;

        if (cube.position.x > 15) cube.position.x = -15;
        if (cube.position.y > 15) cube.position.y = -15;
        if (cube.position.z > 15) cube.position.z = -15;
      });

      camera.position.x = Math.sin(elapsed * 0.3) * 0.5;
      camera.position.y = Math.cos(elapsed * 0.2) * 0.3;

      renderer.render(scene, camera);
    });

    // Scroll-driven camera animation
    gsap.registerPlugin(ScrollTrigger);
    gsap.to(camera.position, {
      x: -2,
      y: 1,
      z: 7,
      scrollTrigger: {
        trigger: "body",
        start: "top top",
        end: "bottom bottom",
        scrub: 1,
      },
      duration: 1,
    });

    // Handle resize
    const handleResize = () => {
      renderer.setSize(window.innerWidth, window.innerHeight);
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
    };
    window.addEventListener("resize", handleResize);

    return () => {
      gsap.killTweensOf(camera.position);
      ScrollTrigger.getAll().forEach((st) => st.kill());
      window.removeEventListener("resize", handleResize);
      if (canvasElement.parentNode) {
        canvasElement.parentNode.removeChild(canvasElement);
      }
      lenis.destroy();
    };
  }, []);

  return null;
}