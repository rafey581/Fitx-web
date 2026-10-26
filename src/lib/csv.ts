/**
 * CSV cell encoding (Phase 6 hardening).
 */

/**
 * Encode one value as a CSV cell.
 *
 * Two concerns are handled together:
 *  1. RFC 4180 quoting — every cell is wrapped in double quotes and embedded
 *     quotes are doubled, so commas/newlines in a lead message cannot shift
 *     columns.
 *  2. Spreadsheet formula injection — Excel/Sheets evaluate a cell that begins
 *     with `=`, `+`, `-`, `@`, a tab or a carriage return. The leads inbox is
 *     publicly writable, so we prefix such values with an apostrophe to force
 *     them to be treated as text (OWASP recommendation).
 */
export function csvCell(value: unknown): string {
  let text = String(value ?? "");
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}
