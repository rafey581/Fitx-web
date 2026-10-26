/*
 * FITX Phase 6 HTTP acceptance harness (QA / security / hardening).
 *
 * Verifies the Phase 6 hardening over the wire against the running build:
 *   - accessibility chrome: skip link, main landmark, lang attribute
 *   - SEO routes + JSON-LD still intact after the safe serializer change
 *   - admin route/boundary enforcement (unauthenticated export is refused)
 *   - CSV export is authenticated, UTF-8 BOM framed, and neutralises
 *     spreadsheet formula injection on a real public submission
 *
 * Run: node accept6.mjs
 */
import { actionIds } from "./action-ids.mjs";

const BASE = "http://localhost:3000";

const ACTIONS = actionIds("login", "createLead", "deleteLead");

const results = [];
function check(name, ok, detail = "") {
  results.push({ name, ok });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? `  —  ${detail}` : ""}`);
}
const actionFailed = (body) => body.includes('"ok":false');

function boundary() {
  let s = "";
  while (s.length < 28) s += Math.random().toString(36).slice(2);
  return s.slice(0, 28);
}
function routerTree(segments) {
  return JSON.stringify([
    "",
    { children: [segments[0], { children: [...segments.slice(1), "__PAGE__"], styles: [], scripts: [] }] },
    null,
    null,
    true,
  ]);
}
async function dispatch(url, actionId, fields, cookie, segments) {
  const b = boundary();
  const parts = [];
  for (const [k, v] of Object.entries(fields)) {
    parts.push(`--${b}\r\nContent-Disposition: form-data; name="_1_${k}"\r\n\r\n${v}\r\n`);
  }
  parts.push(`--${b}\r\nContent-Disposition: form-data; name="0"\r\n\r\n${JSON.stringify([{ ok: false }, "$K1"])}\r\n`);
  parts.push(`--${b}--`);
  const headers = {
    "Next-Action": actionId,
    Accept: "text/x-component",
    Origin: BASE,
    "Content-Type": `multipart/form-data; boundary=${b}`,
    "Next-Router-State-Tree": routerTree(segments),
    "User-Agent": "FitxPhase6Accept/1.0",
  };
  if (cookie) headers["Cookie"] = cookie;
  return fetch(url, { method: "POST", redirect: "manual", headers, body: parts.join("") });
}
async function login() {
  const res = await dispatch(
    `${BASE}/admin/login`,
    ACTIONS.login,
    { email: "owner@fitx.pk", password: "Fitx1c28232efd68!" },
    null,
    ["admin", "login"],
  );
  let cookie = "";
  for (const [name, value] of res.headers.entries()) {
    if (name.toLowerCase() === "set-cookie" && value.startsWith("fitx_session=")) cookie = value.split(";")[0];
  }
  return cookie;
}
async function get(path, cookie) {
  const res = await fetch(`${BASE}${path}`, {
    redirect: "manual",
    headers: cookie ? { Cookie: cookie } : {},
  });
  return { status: res.status, body: await res.text(), headers: res.headers };
}

async function main() {
  const cookie = await login();
  check("login sets a session cookie", Boolean(cookie));

  // ---- Accessibility chrome ----
  const home = await get("/");
  check("home returns 200", home.status === 200, `status=${home.status}`);
  check("home declares a language on <html>", /<html[^>]*lang="en"/.test(home.body));
  check("home offers a skip-to-content link", home.body.includes('href="#main-content"'));
  check("home defines the #main-content landmark target", home.body.includes('id="main-content"'));

  // ---- SEO routes + JSON-LD survive the safe serializer ----
  const robots = await get("/robots.txt");
  check("robots.txt returns 200", robots.status === 200, `status=${robots.status}`);
  check(
    "robots.txt disallows the admin area and advertises the sitemap",
    /Disallow:\s*\/admin\//.test(robots.body) && /Sitemap:\s*https?:\/\//.test(robots.body),
  );

  const sitemap = await get("/sitemap.xml");
  check(
    "sitemap.xml returns a urlset",
    sitemap.status === 200 && sitemap.body.includes("<urlset"),
    `status=${sitemap.status}`,
  );

  check(
    "home ships HealthClub JSON-LD",
    home.body.includes('type="application/ld+json"') && home.body.includes('"HealthClub"'),
  );

  const service = await get("/services/personal-training");
  check(
    "service detail ships Service JSON-LD",
    service.status === 200 && service.body.includes('"@type":"Service"'),
    `status=${service.status}`,
  );

  const trainer = await get("/trainers/head-coach");
  check(
    "trainer detail ships Person JSON-LD",
    trainer.status === 200 && trainer.body.includes('"@type":"Person"'),
    `status=${trainer.status}`,
  );

  // ---- Admin boundary ----
  const exportAnon = await get("/admin/leads/export");
  check(
    "leads CSV export refuses anonymous callers",
    exportAnon.status === 307 || exportAnon.status === 401 || exportAnon.status === 403,
    `status=${exportAnon.status}`,
  );

  // ---- CSV: authenticated, BOM framed ----
  const exportAuth = await get("/admin/leads/export", cookie);
  check(
    "leads CSV export requires auth and returns text/csv",
    exportAuth.status === 200 && (exportAuth.headers.get("content-type") || "").includes("text/csv"),
    `status=${exportAuth.status}`,
  );
  // `Response.text()` strips a leading UTF-8 BOM while decoding, so inspect the
  // raw bytes to confirm the export really is BOM framed for Excel.
  const exportRaw = new Uint8Array(
    await (await fetch(`${BASE}/admin/leads/export`, { headers: { Cookie: cookie } })).arrayBuffer(),
  );
  check(
    "leads CSV export is UTF-8 BOM framed",
    exportRaw[0] === 0xef && exportRaw[1] === 0xbb && exportRaw[2] === 0xbf,
    `bytes=${exportRaw[0]},${exportRaw[1]},${exportRaw[2]}`,
  );

  // ---- CSV: formula-injection neutralised on a real public submission ----
  const payload = "=cmd|'/C calc'!A0";
  const submitted = await dispatch(
    `${BASE}/contact`,
    ACTIONS.createLead,
    {
      name: payload,
      phone: "+92 300 7654321",
      email: "phase6.formula@example.com",
      goal: "Phase 6 acceptance check",
      message: "Verifying CSV formula-injection hardening.",
      sourcePage: "/contact",
    },
    null,
    ["contact"],
  );
  const submittedBody = await submitted.text();
  check(
    "public lead form accepts a formula-looking name",
    submitted.status === 200 && !actionFailed(submittedBody),
    `status=${submitted.status}`,
  );

  const exportAfter = await get("/admin/leads/export", cookie);
  const csv = exportAfter.body;
  const row = csv.split("\r\n").find((line) => line.includes("=cmd"));
  check(
    "CSV prefixes the dangerous cell so spreadsheets treat it as text",
    Boolean(row) && row.includes('"\'=cmd'),
    row ? "found neutralised cell" : "row missing",
  );

  // ---- Clean up the acceptance lead via the real delete action ----
  const leadId = row ? row.match(/^"([^"]+)"/)?.[1] ?? "" : "";
  check("acceptance lead id resolvable from the export", Boolean(leadId), leadId);
  if (leadId) {
    const del = await dispatch(
      `${BASE}/admin/leads`,
      ACTIONS.deleteLead,
      { id: leadId },
      cookie,
      ["admin", "leads"],
    );
    await del.text();
    const inbox = await get("/admin/leads", cookie);
    check(
      "deleteLeadAction removes the acceptance lead",
      del.status === 200 && !inbox.body.includes("phase6.formula@example.com"),
      `status=${del.status}`,
    );
  }

  const passed = results.filter((r) => r.ok).length;
  const total = results.length;
  console.log(`\n${passed}/${total} Phase 6 checks passed`);
  if (passed !== total) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
