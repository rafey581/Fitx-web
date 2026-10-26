"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Image from "next/image";
import Link from "next/link";
import { Hero3D } from "@/components/3d/Hero3D";

gsap.registerPlugin(ScrollTrigger);

export default function Home3D() {
  const heroRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!heroRef.current || !textRef.current) return;

    gsap.fromTo(
      textRef.current.children,
      { y: 100, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 1,
        stagger: 0.2,
        ease: "power3.out",
      }
    );

    gsap.to(heroRef.current, {
      scrollTrigger: {
        trigger: heroRef.current,
        start: "top top",
        end: "bottom top",
        scrub: 1,
      },
      opacity: 0.5,
      scale: 1.1,
    });
  }, []);

  return (
    <main>
      <section ref={heroRef} className="relative min-h-screen overflow-hidden bg-ink">
        <Hero3D />
        <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-b from-ink/50 via-ink/80 to-ink" />
        <div className="relative z-10 flex min-h-screen items-center">
          <div ref={textRef} className="mx-auto max-w-7xl px-4 sm:px-6">
            <p className="eyebrow eyebrow-bar text-accent">Sahiwal · Punjab</p>
            <h1 className="heading-display mt-6 max-w-5xl text-5xl text-white sm:text-7xl lg:text-8xl">
              THE MOST PREMIUM
              <br />
              <span className="text-gradient">PERSONAL TRAINING</span>
              <br />
              PROGRAM
            </h1>
            <p className="mt-8 max-w-2xl text-xl text-white/75">
              One-on-one coaching built around your body, your schedule and your goals.
            </p>
            <div className="mt-12 flex flex-wrap gap-4">
              <Link href="/contact" className="btn btn-accent">
                Start Training <span aria-hidden="true">→</span>
              </Link>
              <Link href="/coaches" className="btn btn-outline text-white">
                Meet The Coaches
              </Link>
            </div>
          </div>
        </div>
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce">
          <svg className="h-6 w-6 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </section>

      <section className="relative bg-ink py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <p className="eyebrow eyebrow-bar text-accent">Why FITX</p>
              <h2 className="heading-display mt-6 text-4xl text-white sm:text-5xl lg:text-6xl">
                BUILT FOR <span className="text-gradient">RESULTS</span>
              </h2>
              <p className="mt-6 text-lg text-white/75">
                Every session is programmed and tracked, so progress is never left to chance.
              </p>
            </div>
            <div className="relative aspect-square overflow-hidden rounded-brand">
              <Image
                src="/images/fitx/PHOTO-2026-09-30-13-32-52.jpg"
                alt="FITX Gym"
                fill
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="relative bg-gradient-to-b from-ink to-black py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mb-16 text-center">
            <p className="eyebrow eyebrow-bar justify-center text-accent">Gallery</p>
            <h2 className="heading-display mt-6 text-4xl text-white sm:text-5xl lg:text-6xl">
              INSIDE <span className="text-gradient">FITX</span>
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {[
              "PHOTO-2026-09-30-13-38-58.jpg",
              "PHOTO-2026-09-30-13-40-02.jpg",
              "PHOTO-2026-09-30-13-41-22.jpg",
              "PHOTO-2026-09-30-13-42-32.jpg",
              "PHOTO-2026-09-30-13-45-10.jpg",
              "PHOTO-2026-09-30-13-53-32.jpg",
              "PHOTO-2026-09-30-13-54-53.jpg",
              "PHOTO-2026-09-30-14-08-35.jpg",
            ].map((img, i) => (
              <div key={i} className="group relative aspect-square overflow-hidden rounded-brand">
                <Image
                  src={`/images/fitx/${img}`}
                  alt={`FITX Gallery ${i + 1}`}
                  fill
                  className="object-cover transition duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink/80 to-transparent opacity-0 transition group-hover:opacity-100" />
              </div>
            ))}
          </div>
          <div className="mt-12 text-center">
            <Link href="/gallery" className="btn btn-accent">
              View Full Gallery <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
