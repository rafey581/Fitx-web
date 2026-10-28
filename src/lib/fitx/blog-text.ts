/**
 * Blog posts are written in the admin as plain text, so the admin never sees
 * HTML or formatting codes:
 *   - a blank line starts a new paragraph;
 *   - a short line on its own (no full stop at the end) becomes a subheading;
 *   - lines starting with "•", "-" or "*" become a bullet list.
 */
export type BlogBlock =
  | { kind: "heading"; text: string }
  | { kind: "paragraph"; text: string }
  | { kind: "list"; items: string[] };

const BULLET = /^\s*[•\-*]\s+/;

export function blogBlocks(content: string): BlogBlock[] {
  return content
    .replace(/\r\n/g, "\n")
    .split(/\n\s*\n/)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part): BlogBlock => {
      const lines = part.split("\n").map((l) => l.trim()).filter(Boolean);
      if (lines.every((l) => BULLET.test(l))) {
        return { kind: "list", items: lines.map((l) => l.replace(BULLET, "")) };
      }
      if (lines.length === 1 && part.length <= 80 && !/[.!?,;:)"”’]$/.test(part)) {
        return { kind: "heading", text: part };
      }
      return { kind: "paragraph", text: lines.join("\n") };
    });
}

/** Short summary for cards and search results: the first paragraph, trimmed. */
export function blogExcerpt(content: string, max = 180): string {
  const first = blogBlocks(content).find((b) => b.kind === "paragraph");
  const text = first && first.kind === "paragraph" ? first.text.replace(/\s+/g, " ") : "";
  if (text.length <= max) return text;
  return `${text.slice(0, max).replace(/\s+\S*$/, "")}…`;
}

/** URL-safe slug from a title: "5 Benefits of Training!" → "5-benefits-of-training". */
export function slugify(title: string): string {
  return (
    title
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[^\w\s-]/g, "")
      .trim()
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "post"
  );
}
