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

/** Render a contact value as tap-to-call / WhatsApp / email links where possible. */
function contactLinks(label: string, value: string) {
  if (label === "Hours") return <span className="text-white/85">{value}</span>;
  if (label === "Email") {
    return (
      <a href={`mailto:${value}`} className="footer-link">
        {value}
      </a>
    );
  }
  // Several numbers may be listed ("0322-… / 0300-…"): link each one.
  const numbers = value.split(/[/·,|]/).map((n) => n.trim()).filter(Boolean);
  return (
    <span className="flex flex-wrap gap-x-4 gap-y-1">
      {numbers.map((n) => {
        const digits = n.replace(/\D/g, "").replace(/^0(?=3)/, "92");
        const href = label === "WhatsApp" ? `https://wa.me/${digits}` : `tel:+${digits.replace(/^\+/, "")}`;
        return (
          <a key={n} href={href} className="footer-link" {...(label === "WhatsApp" ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
            {n}
          </a>
        );
      })}
    </span>
  );
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
          <span className="film-display block type-cta leading-[0.9]">
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

        <div className="mt-16 grid gap-10 border-t border-white/10 pt-10 text-[15px] leading-relaxed text-white/80 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="footer-label">Studio</p>
            <p className="mt-3 font-semibold text-white">{general.businessName}</p>
            {general.tagline ? <p className="mt-2 text-white/65">{general.tagline}</p> : null}
          </div>

          <nav aria-label="Footer">
            <p className="footer-label">Explore</p>
            <ul className="mt-3 space-y-2">
              {[
                ...links,
                ...(links.some((l) => l.href === "/transformations")
                  ? []
                  : [{ id: "transformations", label: "Transformations", href: "/transformations", newTab: false, children: [] }]),
              ].map((link) => (
                <li key={link.id}>
                  <Link
                    href={link.href}
                    target={link.newTab ? "_blank" : undefined}
                    rel={link.newTab ? "noopener noreferrer" : undefined}
                    className="footer-link"
                  >
                    {link.label}
                    <span aria-hidden="true" className="footer-link-arrow">
                      →
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <address className="not-italic">
            <p className="footer-label">Find us</p>
            {general.address ? <p className="mt-3">{general.address}</p> : null}
            <ul className="mt-3 space-y-2">
              {contactRows.map(([label, value]) => (
                <li key={label}>
                  <span className="block text-xs text-white/55">{label}</span>
                  {contactLinks(label, value)}
                </li>
              ))}
            </ul>
          </address>

          <div>
            <p className="footer-label">Follow</p>
            {socials.length > 0 ? (
              <ul className="mt-3 space-y-2">
                {socials.map((social) => (
                  <li key={social.key}>
                    <a href={social.href} target="_blank" rel="noopener noreferrer" className="footer-link">
                      {social.label}
                      <span aria-hidden="true" className="footer-link-arrow">
                        ↗
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-white/65">Social links coming soon.</p>
            )}
          </div>
        </div>

        <div className="mt-12 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-6 text-sm text-white/60">
          <p>
            © {new Date().getFullYear()} {general.businessName}
          </p>
          <Link href="/admin" className="footer-link text-sm">
            Staff login
          </Link>
        </div>
      </div>
    </footer>
  );
}
