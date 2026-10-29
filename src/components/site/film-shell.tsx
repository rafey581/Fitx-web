"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Lenis from "lenis";

import { film } from "@/components/experience/store";

const Backdrop = dynamic(() => import("@/components/experience/scene/Backdrop"), { ssr: false });

export type ShellLink = { label: string; href: string; children: { label: string; href: string }[] };

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * Chrome shared by every inner page: the ambient 3D backdrop, HUD header,
 * full-screen menu, smooth scrolling, scroll-in reveals and pointer tilt on
 * cards. The page content itself stays server-rendered underneath.
 */
export function FilmShell({
  links,
  businessName,
  address,
  phone,
  email,
}: {
  links: ShellLink[];
  businessName: string;
  address: string;
  phone: string;
  email: string;
}) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const lenisRef = useRef<Lenis | null>(null);
  const bar = useRef<HTMLSpanElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  const current =
    links.flatMap((l) => [l, ...l.children]).find((l) => l.href === pathname)?.label ??
    pathname.split("/").filter(Boolean).at(-1)?.replace(/-/g, " ") ??
    "";

  // Smooth scroll + scroll progress for the backdrop and HUD bar.
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const lenis = new Lenis({ lerp: reduced ? 1 : 0.1, smoothWheel: !reduced });
    lenisRef.current = lenis;
    film.target = film.time = film.velocity = 0;

    lenis.on("scroll", (l: Lenis) => {
      const max = Math.max(1, l.limit);
      film.target = Math.min(1, l.scroll / max);
      film.velocity = Math.max(-1, Math.min(1, l.velocity / 60));
      if (bar.current) bar.current.style.transform = `scaleY(${film.target})`;
      setScrolled(l.scroll > 40);
    });

    let raf = 0;
    const loop = (time: number) => {
      lenis.raf(time);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    const onPointer = (e: PointerEvent) => {
      film.pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      film.pointer.y = -((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener("pointermove", onPointer);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onPointer);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  // Reveal sections and cards as they scroll in; re-scan on every navigation.
  useEffect(() => {
    lenisRef.current?.scrollTo(0, { immediate: true, force: true });
    const targets = document.querySelectorAll<HTMLElement>(
      "#main-content section, #main-content .card, #main-content figure, #main-content [data-reveal]",
    );
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            observer.unobserve(entry.target);
          }
        }
      },
      // Any visible part reveals it: a ratio would never be reached by a
      // section taller than the screen (e.g. the gallery on a phone).
      { rootMargin: "0px 0px -8% 0px", threshold: 0 },
    );
    targets.forEach((el) => {
      if (el.classList.contains("is-in")) return;
      // Stagger siblings in a grid so cards cascade in.
      const index = el.parentElement ? Array.prototype.indexOf.call(el.parentElement.children, el) : 0;
      el.style.setProperty("--reveal-delay", `${Math.min(index, 6) * 70}ms`);
      el.classList.add("reveal");
      observer.observe(el);
    });
    return () => observer.disconnect();
  }, [pathname]);

  // Pointer tilt for cards and gallery tiles (event delegation, one listener).
  useEffect(() => {
    if (window.matchMedia("(hover: none)").matches) return;
    let active: HTMLElement | null = null;
    const reset = (el: HTMLElement | null) => {
      if (!el) return;
      el.style.setProperty("--rx", "0deg");
      el.style.setProperty("--ry", "0deg");
    };
    const onMove = (e: PointerEvent) => {
      const el = (e.target as HTMLElement | null)?.closest<HTMLElement>(".card-hover, #main-content figure");
      if (el !== active) {
        reset(active);
        active = el ?? null;
      }
      if (!el) return;
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      el.style.setProperty("--rx", `${(-y * 8).toFixed(2)}deg`);
      el.style.setProperty("--ry", `${(x * 10).toFixed(2)}deg`);
      el.style.setProperty("--mx", `${((x + 0.5) * 100).toFixed(1)}%`);
      el.style.setProperty("--my", `${((y + 0.5) * 100).toFixed(1)}%`);
    };
    window.addEventListener("pointermove", onMove);
    return () => {
      window.removeEventListener("pointermove", onMove);
      reset(active);
    };
  }, []);

  // Menu: pause scrolling, focus the close button, close on Escape / navigation.
  useEffect(() => {
    const lenis = lenisRef.current;
    if (menuOpen) {
      lenis?.stop();
      closeRef.current?.focus();
      const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenuOpen(false);
      window.addEventListener("keydown", onKey);
      return () => window.removeEventListener("keydown", onKey);
    }
    lenis?.start();
  }, [menuOpen]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- close the menu when the route changes
    setMenuOpen(false);
  }, [pathname]);

  return (
    <>
      <div className="film-canvas" aria-hidden="true">
        <Backdrop />
        <div className="film-scrim" />
      </div>

      <header className={`film-site-header ${scrolled ? "is-scrolled" : ""}`} inert={menuOpen}>
        <Link href="/" className="flex items-center gap-3" aria-label={`${businessName} home`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/fitx/3d/logo-horizontal.png" alt="FITX" width={417} height={160} className="h-8 w-auto sm:h-9" />
        </Link>
        <p className="film-mono hidden text-[11px] text-white/60 capitalize md:block">
          <span className="text-accent">/</span> {current}
        </p>
        <div className="flex items-center gap-2">
          <Link href="/contact" className="film-btn film-btn-hot hidden sm:inline-flex">
            Book
          </Link>
          <button type="button" className="film-btn" onClick={() => setMenuOpen(true)} aria-haspopup="dialog">
            Menu
          </button>
        </div>
      </header>

      <div className="film-progress" aria-hidden="true">
        <span ref={bar} />
      </div>

      <div
        className={`film-menu ${menuOpen ? "is-open" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        hidden={!menuOpen}
      >
        <div className="flex items-center justify-between px-5 py-5 sm:px-10">
          <p className="film-mono text-[11px] text-white/50">Index</p>
          <button ref={closeRef} type="button" className="film-btn" onClick={() => setMenuOpen(false)}>
            Close
          </button>
        </div>
        <div className="grid gap-10 px-5 pb-10 sm:px-10 md:grid-cols-[1fr_auto]">
          <ol className="space-y-1">
            {links.map((l, i) => (
              <li key={l.href + i}>
                <Link
                  href={l.href}
                  className={`film-menu-link inline-block ${l.href === pathname ? "text-accent" : ""}`}
                  aria-current={l.href === pathname ? "page" : undefined}
                >
                  <span className="film-mono mr-4 align-middle text-[11px] text-accent">{pad(i)}</span>
                  {l.label}
                </Link>
                {l.children.length > 0 ? (
                  <ul className="mt-2 mb-4 ml-10 flex flex-wrap gap-x-5 gap-y-1.5 text-[15px]">
                    {l.children.map((c) => (
                      <li key={c.href}>
                        <Link href={c.href} className="footer-link">
                          {c.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </li>
            ))}
          </ol>
          <div className="space-y-2 border-t border-white/15 pt-6 text-[15px] text-white/80 md:w-72 md:border-t-0 md:pt-0">
            <p className="footer-label">Visit</p>
            <p>{address}</p>
            <p>
              {phone.split(/[/·,|]/).map((n) => n.trim()).filter(Boolean).map((n) => (
              <a key={n} href={`tel:+${n.replace(/\D/g, "").replace(/^0/, "92")}`} className="footer-link mr-4">
                {n}
              </a>
            ))}
            </p>
            <a href={`mailto:${email}`} className="footer-link">
              {email}
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
