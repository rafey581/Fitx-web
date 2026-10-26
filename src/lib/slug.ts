/**
 * URL slug helpers (PRD 5.3: slugs are auto-generated from titles).
 *
 * Kept conservative on purpose: slugs stay lowercase latin + digits + hyphens
 * so they survive any URL/cache layer. If a title contains no usable
 * characters (for example pure emoji or a different script), we fall back to
 * a neutral token rather than producing an empty slug.
 */
export function slugify(input: string): string {
  const raw = input
    .trim()
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return raw || "page";
}

/**
 * Ensure `base` is unique against `isTaken` by appending -2, -3, … within a
 * small bound, then falling back to a timestamped suffix. Used for page slugs
 * and "copy of" titles.
 */
export async function uniqueSlug(
  base: string,
  isTaken: (candidate: string) => boolean | Promise<boolean>,
): Promise<string> {
  if (!(await isTaken(base))) return base;
  for (let index = 2; index <= 100; index += 1) {
    const candidate = `${base}-${index}`;
    if (!(await isTaken(candidate))) return candidate;
  }
  return `${base}-${Date.now()}`;
}
