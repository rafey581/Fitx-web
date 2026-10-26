/**
 * Unit tests for the dependency-free helpers used across the app
 * (PRD Phase 6: "unit tests for validation / permission checks").
 *
 * Run with `npm test` (Node's built-in test runner + tsx, no extra deps).
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import { z } from "zod";

import { slugify, uniqueSlug } from "@/lib/slug";
import { formatDate, formatDateTime } from "@/lib/format";
import { isRasterMime, mediaSrc, mediaUrl } from "@/lib/media-url";
import { themeToCss } from "@/lib/theme/tokens";
import { csvCell } from "@/lib/csv";
import { serializeJsonLd } from "@/lib/seo";
import { toFieldErrors } from "@/lib/validation/errors";

test("slugify: lowercases, strips punctuation and collapses separators", () => {
  assert.equal(slugify("Who We Are"), "who-we-are");
  assert.equal(slugify("  Personal   Training  "), "personal-training");
  assert.equal(slugify("Don't Stop! Believ'n"), "dont-stop-believn");
  assert.equal(slugify("Success Stories — 2026"), "success-stories-2026");
});

test("slugify: falls back to a neutral token when nothing is usable", () => {
  assert.equal(slugify(""), "page");
  assert.equal(slugify("🎉🎉🎉"), "page");
  assert.equal(slugify("---"), "page");
});

test("slugify: caps length at 80 characters", () => {
  assert.equal(slugify("a".repeat(200)).length, 80);
});

test("uniqueSlug: returns the base when free, else -2, -3 …", async () => {
  const free = new Set<string>();
  assert.equal(await uniqueSlug("home", (c) => free.has(c)), "home");

  const taken = new Set(["home", "home-2"]);
  assert.equal(await uniqueSlug("home", (c) => taken.has(c)), "home-3");
});

test("uniqueSlug: accepts an async predicate", async () => {
  const taken = new Set(["a"]);
  const isTaken = async (c: string) => taken.has(c);
  assert.equal(await uniqueSlug("a", isTaken), "a-2");
});

test("formatDateTime/formatDate: fall back to an em dash on empty/invalid", () => {
  assert.equal(formatDateTime(null), "—");
  assert.equal(formatDateTime(undefined), "—");
  assert.equal(formatDateTime("not-a-date"), "—");
  assert.equal(formatDate(null), "—");
  assert.equal(formatDate("nonsense"), "—");
});

test("formatDateTime: renders dates in the studio timezone", () => {
  // 2026-01-02T18:30:00Z == 23:30 in Asia/Karachi (UTC+5).
  const rendered = formatDateTime("2026-01-02T18:30:00.000Z");
  assert.match(rendered, /2026/);
  assert.match(rendered, /23:30/);
});

test("mediaUrl: prefixes /uploads and strips leading slashes", () => {
  assert.equal(mediaUrl({ path: "2026/10/hero.webp" }), "/uploads/2026/10/hero.webp");
  assert.equal(mediaUrl({ path: "/2026/10/hero.webp" }), "/uploads/2026/10/hero.webp");
});

test("mediaSrc: picks the largest variant at or under the requested width", () => {
  const media = {
    path: "orig.webp",
    variants: { "480": "v480.webp", "960": "v960.webp", "1920": "v1920.webp" },
  };
  assert.deepEqual(mediaSrc(media, 960), { src: "/uploads/v960.webp", width: 960 });
  assert.deepEqual(mediaSrc(media, 1000), { src: "/uploads/v960.webp", width: 960 });
  // Wider than any variant -> the largest variant.
  assert.deepEqual(mediaSrc(media, 4000), { src: "/uploads/v1920.webp", width: 1920 });
  // Smaller than any variant -> the original, with the largest known width.
  assert.deepEqual(mediaSrc(media, 200), { src: "/uploads/orig.webp", width: 1920 });
});

test("mediaSrc: no variants means the original", () => {
  assert.deepEqual(mediaSrc({ path: "only.png" }, 960), {
    src: "/uploads/only.png",
    width: 0,
  });
});

test("isRasterMime: only the formats we generate variants for", () => {
  assert.equal(isRasterMime("image/jpeg"), true);
  assert.equal(isRasterMime("image/png"), true);
  assert.equal(isRasterMime("image/webp"), true);
  assert.equal(isRasterMime("image/avif"), true);
  assert.equal(isRasterMime("image/svg+xml"), false);
  assert.equal(isRasterMime("application/pdf"), false);
  assert.equal(isRasterMime("text/html"), false);
});

test("themeToCss: emits the default palette as :root custom properties", () => {
  const css = themeToCss({});
  assert.match(css, /^:root\{/);
  assert.ok(css.includes("--brand-accent:#FF4B00;"));
  assert.ok(css.includes("--brand-radius:0.5rem;"));
  assert.ok(css.endsWith("}"));
});

test("themeToCss: maps curated font names to the next/font variables", () => {
  const css = themeToCss({ headingFont: "Montserrat", bodyFont: "Inter" });
  assert.ok(css.includes("--brand-font-heading:var(--font-heading);"));
  assert.ok(css.includes("--brand-font-body:var(--font-body);"));
});

test("themeToCss: strips characters that could break out of a declaration", () => {
  const css = themeToCss({ accent: "#fff;}body{color:red" } as never);
  assert.ok(!css.includes("}body{"));
  assert.ok(!css.includes(";color:red"));
  // Semicolons/braces/quotes are removed before interpolation.
  assert.ok(css.includes("--brand-accent:#fffbodycolor:red;"));
});

test("csvCell: quotes cells and doubles embedded quotes (RFC 4180)", () => {
  assert.equal(csvCell("hello"), '"hello"');
  assert.equal(csvCell('say "hi"'), '"say ""hi"""');
  assert.equal(csvCell("a,b"), '"a,b"');
  assert.equal(csvCell("line\nbreak"), '"line\nbreak"');
  assert.equal(csvCell(null), '""');
  assert.equal(csvCell(undefined), '""');
});

test("csvCell: neutralises spreadsheet formula injection", () => {
  assert.equal(csvCell("=1+1"), "\"'=1+1\"");
  assert.equal(csvCell("+1+1"), "\"'+1+1\"");
  assert.equal(csvCell("-2+3"), "\"'-2+3\"");
  assert.equal(csvCell("@SUM(A1)"), "\"'@SUM(A1)\"");
  assert.equal(csvCell("\tcmd"), "\"'\tcmd\"");
  // A normal leading character is untouched.
  assert.equal(csvCell("Ali Raza"), "\"Ali Raza\"");
});

test("serializeJsonLd: escapes '<' so a field cannot close the script tag", () => {
  const payload = { name: "</script><img src=x onerror=alert(1)>" };
  const out = serializeJsonLd(payload);
  assert.ok(!out.includes("</script>"));
  assert.ok(out.includes("\\u003c/script"));
  // Still valid JSON that round-trips to the original value.
  assert.deepEqual(JSON.parse(out), payload);
});

test("serializeJsonLd: keeps ordinary objects intact", () => {
  const payload = { "@type": "Service", name: "Personal Training" };
  assert.equal(serializeJsonLd(payload), JSON.stringify(payload));
});

test("toFieldErrors: groups Zod issues by dot-path with a form fallback", () => {
  const schema = z.object({
    name: z.string().min(1, "Name is required"),
    nested: z.object({ email: z.string().min(1, "Email is required") }),
  });
  const parsed = schema.safeParse({ name: "", nested: { email: "" } });
  assert.equal(parsed.success, false);
  const errors = toFieldErrors(parsed.error!);
  assert.deepEqual(errors.name, ["Name is required"]);
  assert.deepEqual(errors["nested.email"], ["Email is required"]);
});

test("toFieldErrors: path-less issues land under 'form'", () => {
  const parsed = z.string().min(3).safeParse("a");
  assert.equal(parsed.success, false);
  assert.deepEqual(toFieldErrors(parsed.error!).form?.length, 1);
});
