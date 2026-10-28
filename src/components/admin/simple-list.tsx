import Link from "next/link";

import { SubmitButton } from "@/components/ui/submit-button";
import { cardClass } from "@/components/ui/styles";

export type SimpleListItem = {
  id: string;
  title: string;
  subtitle: string;
  thumb: string | null;
  editHref: string;
  viewHref?: string;
};

type SimpleListProps = {
  heading: string;
  intro: string;
  addHref: string;
  addLabel: string;
  items: SimpleListItem[];
  emptyText: string;
  deleteAction: (formData: FormData) => Promise<void>;
  deleteConfirm: (title: string) => string;
  /** Confirmation banner after a save or delete (from the URL). */
  notice?: string | null;
  round?: boolean;
};

export function SimpleList({
  heading,
  intro,
  addHref,
  addLabel,
  items,
  emptyText,
  deleteAction,
  deleteConfirm,
  notice,
  round,
}: SimpleListProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-extrabold text-ink">{heading}</h1>
          <p className="mt-1 text-sm text-muted">{intro}</p>
        </div>
        <Link href={addHref} className="btn btn-accent">
          + {addLabel}
        </Link>
      </div>

      {notice ? (
        <p role="status" className="rounded-brand bg-green-50 px-4 py-3 text-sm font-medium text-green-800">
          {notice}
        </p>
      ) : null}

      {items.length === 0 ? (
        <div className={`${cardClass} text-center text-sm text-muted`}>{emptyText}</div>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => (
            <li key={item.id} className={`${cardClass} flex flex-col gap-4 p-4 sm:flex-row sm:items-center`}>
              {item.thumb ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.thumb}
                  alt=""
                  className={`shrink-0 object-cover ${round ? "h-14 w-14 rounded-full" : "h-16 w-24 rounded-brand"}`}
                />
              ) : (
                <span
                  aria-hidden="true"
                  className={`grid shrink-0 place-items-center bg-accent/10 text-sm font-semibold text-accent ${round ? "h-14 w-14 rounded-full" : "h-16 w-24 rounded-brand"}`}
                >
                  {item.title.slice(0, 1).toUpperCase()}
                </span>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-ink">{item.title}</p>
                <p className="mt-0.5 line-clamp-2 text-sm text-muted">{item.subtitle}</p>
              </div>
              <div className="flex shrink-0 flex-wrap gap-2">
                {item.viewHref ? (
                  <Link href={item.viewHref} target="_blank" className="btn btn-outline">
                    View
                  </Link>
                ) : null}
                <Link href={item.editHref} className="btn btn-outline">
                  Edit
                </Link>
                <form action={deleteAction}>
                  <input type="hidden" name="id" value={item.id} />
                  <SubmitButton variant="danger" pendingLabel="Deleting…" confirm={deleteConfirm(item.title)}>
                    Delete
                  </SubmitButton>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Banner text from `?saved=…` / `?deleted=1` after a redirect. */
export function noticeFrom(params: Record<string, string | string[] | undefined>, noun: string): string | null {
  const saved = typeof params.saved === "string" ? params.saved : null;
  if (saved) return `Saved “${saved}”. It is now live on the website.`;
  if (params.deleted) return `The ${noun} was deleted from the website.`;
  return null;
}
