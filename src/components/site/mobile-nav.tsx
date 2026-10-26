"use client";

import Link from "next/link";
import { useState } from "react";

import type { PublicMenuLink } from "@/lib/site/settings";

/**
 * Mobile navigation for the public header. Server-rendered links are passed in
 * and rendered inside a disclosure, so no client data fetching is needed.
 */
export function MobileNav({ links }: { links: PublicMenuLink[] }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-label={open ? "Close menu" : "Open menu"}
        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/20 text-white transition hover:border-accent hover:text-accent"
      >
        <svg
          viewBox="0 0 24 24"
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          aria-hidden="true"
        >
          {open ? (
            <>
              <path d="M6 6l12 12" />
              <path d="M18 6L6 18" />
            </>
          ) : (
            <>
              <path d="M4 7h16" />
              <path d="M4 12h16" />
              <path d="M4 17h16" />
            </>
          )}
        </svg>
      </button>

      {open ? (
        <div className="absolute inset-x-0 top-full border-t border-white/10 bg-ink shadow-xl">
          <nav aria-label="Mobile" className="mx-auto max-w-6xl px-5 py-4">
            <ul className="divide-y divide-white/10">
              {links.map((link) => (
                <li key={link.id} className="py-1">
                  <a
                    href={link.href}
                    target={link.newTab ? "_blank" : undefined}
                    rel={link.newTab ? "noopener noreferrer" : undefined}
                    onClick={() => setOpen(false)}
                    className="block py-2 text-sm font-semibold tracking-wide text-white/90 uppercase transition hover:text-accent"
                  >
                    {link.label}
                  </a>
                  {link.children.length > 0 ? (
                    <ul className="ml-3 border-l border-white/10 pl-3">
                      {link.children.map((child) => (
                        <li key={child.id}>
                          <a
                            href={child.href}
                            target={child.newTab ? "_blank" : undefined}
                            rel={
                              child.newTab ? "noopener noreferrer" : undefined
                            }
                            onClick={() => setOpen(false)}
                            className="block py-1.5 text-sm text-white/60 transition hover:text-white"
                          >
                            {child.label}
                          </a>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </li>
              ))}
              <li className="py-1">
                <Link
                  href="/blog"
                  onClick={() => setOpen(false)}
                  className="block py-2 text-sm font-semibold tracking-wide text-white/90 uppercase transition hover:text-accent"
                >
                  Blog
                </Link>
              </li>
            </ul>
            <Link
              href="/contact"
              onClick={() => setOpen(false)}
              className="btn btn-accent mt-4 w-full"
            >
              Join FITX
            </Link>
          </nav>
        </div>
      ) : null}
    </div>
  );
}
