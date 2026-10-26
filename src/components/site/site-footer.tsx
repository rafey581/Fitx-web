import Link from "next/link";

import { MenuLocation } from "@/generated/prisma/enums";

import { getMenuLinks, getSiteSettings } from "@/lib/site/settings";

/** Resolve a social handle to a profile URL (blank means hidden). */
function profileUrl(id: string, kind: string): string {
  if (!id) return "";
  if (/^https?:\/\//.test(id)) return id;
  const prefixes: Record<string, string> = {
    instagram: "https://instagram.com/",
    facebook: "https://facebook.com/",
    tiktok: "https://tiktok.com/@",
    youtube: "https://youtube.com/",
  };
  return `${prefixes[kind] ?? ""}${id.replace(/^@/, "")}`;
}

/** Global footer (PRD 5.7): contact block, footer menu, socials, copyright. */
export async function SiteFooter() {
  const settings = await getSiteSettings();
  const general = settings.general;
  const links = await getMenuLinks(MenuLocation.FOOTER);

  const socials = [
    { key: "instagram", label: "Instagram" },
    { key: "facebook", label: "Facebook" },
    { key: "tiktok", label: "TikTok" },
    { key: "youtube", label: "YouTube" },
  ]
    .map((social) => ({
      ...social,
      href: profileUrl(
        general[social.key as keyof typeof general] as string,
        social.key,
      ),
    }))
    .filter((social) => social.href);

  const contactRows: Array<[string, string]> = [
    ["Call", general.phone],
    ["WhatsApp", general.whatsapp],
    ["Email", general.email],
    ["Hours", general.openingHours],
  ].filter(([, value]) => value) as Array<[string, string]>;

  return (
    <footer className="film-footer relative mt-24 overflow-hidden">
      <div className="mx-auto w-full max-w-7xl px-5 pt-20 pb-10 sm:px-10">
        <p className="film-mono text-[11px] text-white/50">
          <span className="text-accent">[ ∞ ]</span> Your move
        </p>
        <Link href="/contact" className="group mt-6 block">
          <span className="film-display block text-[15vw] leading-[0.85] md:text-[8vw]">
            Start <span className="whitespace-nowrap text-accent">
              training
              <span
                aria-hidden="true"
                className="ml-[0.2em] inline-block text-[0.6em] align-middle transition-transform duration-500 group-hover:translate-x-4"
              >
                →
              </span>
            </span>
          </span>
        </Link>

        <div className="film-mono mt-16 grid gap-10 border-t border-white/10 pt-10 text-[11px] text-white/60 md:grid-cols-4">
          <div>
            <p className="text-white/30">Studio</p>
            <p className="mt-2 text-white/80">{general.businessName}</p>
            {general.tagline ? <p className="mt-2 normal-case tracking-normal">{general.tagline}</p> : null}
          </div>

          <nav aria-label="Footer">
            <p className="text-white/30">Index</p>
            <ul className="mt-2 space-y-1.5">
              {links.map((link) => (
                <li key={link.id}>
                  <a
                    href={link.href}
                    target={link.newTab ? "_blank" : undefined}
                    rel={link.newTab ? "noopener noreferrer" : undefined}
                    className="transition hover:text-accent"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <address className="not-italic">
            <p className="text-white/30">Find us</p>
            {general.address ? <p className="mt-2">{general.address}</p> : null}
            {contactRows.map(([label, value]) => (
              <p key={label} className="mt-1.5">
                <span className="text-white/35">{label} · </span>
                {value}
              </p>
            ))}
          </address>

          <div>
            <p className="text-white/30">Follow</p>
            {socials.length > 0 ? (
              <ul className="mt-2 space-y-1.5">
                {socials.map((social) => (
                  <li key={social.key}>
                    <a href={social.href} target="_blank" rel="noopener noreferrer" className="transition hover:text-accent">
                      {social.label} ↗
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2">30.6682° N · 73.1114° E</p>
            )}
          </div>
        </div>

        <div className="film-mono mt-12 flex flex-wrap items-center justify-between gap-2 text-[10px] text-white/35">
          <p>
            © {new Date().getFullYear()} {general.businessName}
          </p>
          <Link href="/admin" className="transition hover:text-accent">
            Staff login
          </Link>
        </div>
      </div>
    </footer>
  );
}
