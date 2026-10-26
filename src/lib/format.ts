/** Shared, dependency-free formatters for server components. */

const DATE_TIME = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Karachi",
});

const DATE_ONLY = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "medium",
  timeZone: "Asia/Karachi",
});

/** "12 Oct 2026, 14:30" in the studio's timezone (Asia/Karachi). */
export function formatDateTime(
  value: Date | string | null | undefined,
): string {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "—";
  return DATE_TIME.format(date);
}

/** "12 Oct 2026" in the studio's timezone (Asia/Karachi). */
export function formatDate(value: Date | string | null | undefined): string {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "—";
  return DATE_ONLY.format(date);
}
