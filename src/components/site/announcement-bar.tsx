import { getSiteSettings } from "@/lib/site/settings";

/**
 * Announcement bar (PRD 5.10) — a slim accent strip above the header shown when
 * enabled and within its optional date range. `today` (YYYY-MM-DD) is passed
 * from the layout so the component stays pure.
 */
export async function AnnouncementBar({ today }: { today: string }) {
  const general = (await getSiteSettings()).general;

  if (!general.announcementEnabled) return null;

  const startsAt = general.announcementStartsAt;
  const endsAt = general.announcementEndsAt;
  if ((startsAt && startsAt > today) || (endsAt && endsAt < today)) {
    return null;
  }

  const text = general.announcementText.trim();
  if (!text) return null;

  const body = (
    <div className="mx-auto flex w-full max-w-7xl items-center justify-center gap-3 px-4 py-2.5 text-center">
      <p className="text-xs font-bold tracking-[0.15em] text-white uppercase sm:text-sm">
        {text}
      </p>
      {general.announcementHref ? <span aria-hidden="true">→</span> : null}
    </div>
  );

  return (
    <div className="bg-gradient-to-r from-accent-deep via-accent to-accent-soft text-white">
      {general.announcementHref ? (
        <a
          href={general.announcementHref}
          className="block transition hover:brightness-110"
          target={
            general.announcementHref.startsWith("http") ? "_blank" : undefined
          }
          rel={
            general.announcementHref.startsWith("http")
              ? "noopener noreferrer"
              : undefined
          }
        >
          {body}
        </a>
      ) : (
        body
      )}
    </div>
  );
}
