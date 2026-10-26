"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import dynamic from "next/dynamic";

gsap.registerPlugin(ScrollTrigger);

const Hero3D = dynamic(() => import("@/components/3d/Hero3D").then(mod => ({ default: mod.Hero3D })), { ssr: false });

export function Home3DHero() {
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!heroRef.current) return;

    gsap.to(heroRef.current, {
      scrollTrigger: {
        trigger: heroRef.current,
        start: "top top",
        end: "bottom top",
        scrub: 1,
      },
      scale: 1.05,
      opacity: 0.8,
    });
  }, []);

  return (
    <div ref={heroRef} className="relative h-[40vh] w-full overflow-hidden">
      <Hero3D />
      <div className="absolute inset-0 bg-gradient-to-b from-ink/60 via-ink/40 to-ink" />
    </div>
  );
}
