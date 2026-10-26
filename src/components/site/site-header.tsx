import Link from "next/link";

import { prisma } from "@/lib/db";
import { mediaUrl } from "@/lib/media-url";
import {
  getMenuLinks,
  getSiteSettings,
} from "@/lib/site/settings";
import { MenuLocation } from "@/generated/prisma/enums";

import { MobileNav } from "./mobile-nav";

/**
 * Global site header (PRD 5.7): sticky bar with the logo, the header menu (one
 * level of dropdowns) and a call-to-action. Rendered server-side from settings,
 * so admin changes to the logo or menu appear immediately.
 */
export async function SiteHeader() {
  const settings = await getSiteSettings();
  const general = settings.general;
  const links = await getMenuLinks(MenuLocation.HEADER);

  let logo: { path: string; variants: Record<string, string> | null } | null =
    null;
  if (general.logoLightId) {
    const media = await prisma.media.findUnique({
      where: { id: general.logoLightId },
      select: { path: true, variants: true },
    });
    if (media) {
      logo = {
        path: media.path,
        variants: media.variants as Record<string, string> | null,
      };
    }
  }

  const phoneDigits = general.phone.replace(/[^+\d]/g, "");
  const phoneHref = phoneDigits ? `tel:${phoneDigits}` : "";

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-ink/95 text-white backdrop-blur">
      <div
        aria-hidden="true"
        className="h-1 w-full bg-gradient-to-r from-accent via-accent-soft to-transparent"
      />
      <div className="relative mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-3">
          {logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={mediaUrl(logo)}
              alt={`${general.businessName} logo`}
              className="h-10 w-auto max-w-48 object-contain"
            />
          ) : (
            <span className="heading-display text-lg tracking-wide sm:text-xl">
              {general.businessName || "FITX"}
            </span>
          )}
        </Link>

        <nav
          aria-label="Main navigation"
          className="hidden items-center gap-6 lg:flex"
        >
          {links.map((link) =>
            link.children.length > 0 ? (
              <div key={link.id} className="group relative">
                <button type="button" className="nav-link flex items-center gap-1.5">
                  {link.label}
                  <svg
                    viewBox="0 0 24 24"
                    className="h-3.5 w-3.5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    aria-hidden="true"
                  >
                    <path d="M6 9l6 6 6-6" strokeLinecap="round" />
                  </svg>
                </button>
                <div className="invisible absolute top-full left-1/2 -translate-x-1/2 pt-4 opacity-0 transition group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
                  <ul className="w-60 overflow-hidden rounded-brand border border-white/10 bg-ink py-2 shadow-2xl">
                    {link.children.map((child) => (
                      <li key={child.id}>
                        <a
                          href={child.href}
                          target={child.newTab ? "_blank" : undefined}
                          rel={child.newTab ? "noopener noreferrer" : undefined}
                          className="block px-4 py-2 text-sm text-white/70 transition hover:bg-white/5 hover:text-accent"
                        >
                          {child.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <a
                key={link.id}
                href={link.href}
                target={link.newTab ? "_blank" : undefined}
                rel={link.newTab ? "noopener noreferrer" : undefined}
                className="nav-link"
              >
                {link.label}
              </a>
            ),
          )}
          <Link href="/blog" className="nav-link">
            Blog
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          {phoneHref ? (
            <a
              href={phoneHref}
              className="hidden items-center gap-2 text-sm font-semibold text-white/80 transition hover:text-accent xl:flex"
            >
              <svg
                viewBox="0 0 24 24"
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2Z" />
              </svg>
              {general.phone}
            </a>
          ) : null}
          <Link
            href="/contact"
            className="btn btn-accent hidden shrink-0 sm:inline-flex"
          >
            Join now
          </Link>
          <MobileNav links={links} />
        </div>
      </div>
    </header>
  );
}
