/**
 * SEO helpers shared by the public routes (Phase 5/6).
 */

/**
 * Serialise a JSON-LD object for embedding inside a `<script
 * type="application/ld+json">` tag.
 *
 * `JSON.stringify` alone is not safe here: a CMS field containing the literal
 * `</script>` would close the tag early and let the rest be parsed as markup
 * (a stored-XSS vector). Escaping every `<` as the JSON escape `\u003c` keeps
 * the output valid JSON while making an early close impossible. We also escape
 * the two line separators that are legal in JSON strings but break some
 * script-parsing contexts.
 */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}
