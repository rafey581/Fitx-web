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
    <footer className="relative overflow-hidden bg-footer text-white">
      <div aria-hidden="true" className="footer-glow absolute inset-0" />
      <div
        aria-hidden="true"
        className="bg-grid-overlay absolute inset-0 opacity-25"
      />
      <div className="relative mx-auto w-full max-w-7xl px-4 py-16 sm:px-6">
        <div className="grid gap-12 md:grid-cols-3">
          <div>
            <p className="heading-display text-2xl">{general.businessName}</p>
            {general.tagline ? (
              <p className="mt-4 max-w-sm font-serif text-sm leading-relaxed text-white/60">
                {general.tagline}
              </p>
            ) : null}
            {socials.length > 0 ? (
              <ul className="mt-6 flex flex-wrap gap-2.5">
                {socials.map((social) => (
                  <li key={social.key}>
                    <a
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center rounded-full border border-white/15 px-3.5 py-1.5 text-xs font-semibold tracking-wide text-white/75 uppercase transition hover:border-accent hover:text-accent"
                    >
                      {social.label}
                    </a>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          <div>
            <p className="eyebrow eyebrow-bar">Quick links</p>
            <ul className="mt-5 space-y-2.5">
              {links.map((link) => (
                <li key={link.id}>
                  <a
                    href={link.href}
                    target={link.newTab ? "_blank" : undefined}
                    rel={link.newTab ? "noopener noreferrer" : undefined}
                    className="text-sm text-white/70 transition hover:text-accent"
                  >
                    {link.label}
                  </a>
                  {link.children.map((child) => (
                    <span key={child.id}>
                      {" "}
                      ·{" "}
                      <a
                        href={child.href}
                        className="text-sm text-white/40 transition hover:text-accent"
                      >
                        {child.label}
                      </a>
                    </span>
                  ))}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="eyebrow eyebrow-bar">Find us</p>
            <address className="mt-5 space-y-3 text-sm text-white/70 not-italic">
              {general.address ? <p>{general.address}</p> : null}
              {contactRows.map(([label, value]) => (
                <p key={label}>
                  <span className="font-semibold text-white/90">{label}:</span>{" "}
                  {value}
                </p>
              ))}
            </address>
          </div>
        </div>
      </div>

      <div className="relative border-t border-white/10">
        <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-5 text-xs text-white/40 sm:px-6">
          <p>
            © {new Date().getFullYear()} {general.businessName}. All rights
            reserved.
          </p>
          <Link href="/admin" className="transition hover:text-accent">
            Staff login
          </Link>
        </div>
      </div>
    </footer>
  );
}
