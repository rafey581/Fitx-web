/*
 * FITX Phase 7 acceptance harness — the client handover checklist, automated.
 *
 * Mirrors the PRD Phase 7 acceptance: "client independently completes a
 * checklist: edit text, replace an image, add a section, add a page, add a
 * trainer, publish and read leads." Each step drives the REAL Next.js server
 * actions over the wire against the running production build, then cleans up
 * after itself so the database is left exactly as it was found.
 *
 * Run: node accept7.mjs
 */
import { execFileSync } from "node:child_process";

import { actionIds } from "./action-ids.mjs";

const BASE = process.env.FITX_BASE_URL ?? "http://localhost:3000";

// The harness drives the real HTTP server actions for behaviour, but resolves
// entity ids for CLEANUP from the local database by their unique key (slug,
// email, filename). Scraping ids out of the admin HTML is brittle and — as we
// learned the hard way — can resolve the wrong row and delete live data.
const MYSQL =
  process.env.FITX_MYSQL_BIN ??
  "C:\\Program Files\\MySQL\\MySQL Server 8.4\\bin\\mysql.exe";
const MYSQL_ARGS = (process.env.FITX_MYSQL_ARGS ?? "-uroot -pFitxDev!2026 fitx").split(" ");
function queryId(sql) {
  try {
    return execFileSync(MYSQL, [...MYSQL_ARGS, "-N", "-B", "-e", sql], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return "";
  }
}

const ACT = actionIds(
  "login",
  "createPage",
  "saveSections",
  "publishPage",
  "trashPage",
  "deletePageForever",
  "uploadMedia",
  "deleteMedia",
  "createTrainer",
  "deleteModuleItem",
  "createLead",
  "updateLeadStatus",
  "deleteLead",
);

const STAMP = Math.floor(Math.random() * 1e6);
const SLUG = `phase7-accept-${STAMP}`;
const TEXT_MARKER = `Phase 7 acceptance text ${STAMP}`;
const BLOCK_MARKER = `Phase 7 added section ${STAMP}`;
const COACH_NAME = `Phase 7 Coach ${STAMP}`;
const COACH_SLUG = `phase7-coach-${STAMP}`;
const LEAD_EMAIL = `phase7.lead.${STAMP}@example.com`;
const MEDIA_NAME = `phase7-accept-${STAMP}.png`;

// 1x1 transparent PNG.
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
  "base64",
);

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
/** Send a server action. `files` is an optional [{ field, filename, type, bytes }]. */
async function dispatch(url, actionId, fields, cookie, segments, files = []) {
  const b = boundary();
  const chunks = [];
  const push = (s) => chunks.push(Buffer.from(s, "utf8"));
  for (const [k, v] of Object.entries(fields)) {
    push(`--${b}\r\nContent-Disposition: form-data; name="_1_${k}"\r\n\r\n${v}\r\n`);
  }
  for (const f of files) {
    push(`--${b}\r\nContent-Disposition: form-data; name="_1_${f.field}"; filename="${f.filename}"\r\nContent-Type: ${f.type}\r\n\r\n`);
    chunks.push(Buffer.from(f.bytes));
    push("\r\n");
  }
  push(`--${b}\r\nContent-Disposition: form-data; name="0"\r\n\r\n${JSON.stringify([{ ok: false }, "$K1"])}\r\n`);
  push(`--${b}--`);
  const headers = {
    "Next-Action": actionId,
    Accept: "text/x-component",
    Origin: BASE,
    "Content-Type": `multipart/form-data; boundary=${b}`,
    "Next-Router-State-Tree": routerTree(segments),
    "User-Agent": "FitxPhase7Accept/1.0",
  };
  if (cookie) headers["Cookie"] = cookie;
  return fetch(url, { method: "POST", redirect: "manual", headers, body: Buffer.concat(chunks) });
}
async function login() {
  const res = await dispatch(`${BASE}/admin/login`, ACT.login, { email: "owner@fitx.pk", password: "Fitx1c28232efd68!" }, null, ["admin", "login"]);
  let cookie = "";
  for (const [name, value] of res.headers.entries()) {
    if (name.toLowerCase() === "set-cookie" && value.startsWith("fitx_session=")) cookie = value.split(";")[0];
  }
  return cookie;
}
async function get(path, cookie) {
  const res = await fetch(`${BASE}${path}`, { redirect: "manual", headers: cookie ? { Cookie: cookie } : {} });
  return { status: res.status, body: await res.text() };
}

async function main() {
  const cookie = await login();
  check("login: owner signs in", Boolean(cookie));
  if (!cookie) return finish();

  // ---- Add a page (client checklist item) ----
  const created = await dispatch(`${BASE}/admin/pages`, ACT.createPage, { title: `Phase 7 Acceptance ${STAMP}`, slug: SLUG }, cookie, ["admin", "pages"]);
  const redirect = created.headers.get("x-action-redirect") || "";
  const pageId = (redirect.match(/\/admin\/pages\/([a-z0-9]+)/) || [])[1] || "";
  check("add a page: createPageAction routes to the new builder", created.status === 200 && Boolean(pageId), pageId || `status=${created.status}`);

  // ---- Edit text: first draft (one rich-text block) ----
  const textSection = {
    type: "rich-text",
    content: { eyebrow: "", heading: "Acceptance", showAccentSlash: true, align: "left", paragraphs: [TEXT_MARKER] },
    isVisible: true,
    visibilityDevices: "all",
  };
  const save1 = await dispatch(`${BASE}/admin/pages/${pageId}`, ACT.saveSections, { pageId, sections: JSON.stringify([textSection]) }, cookie, ["admin", "pages", pageId]);
  check("edit text: saveSections stores the draft", save1.status === 200 && !actionFailed(await save1.text()), `status=${save1.status}`);

  const pub1 = await dispatch(`${BASE}/admin/pages/${pageId}`, ACT.publishPage, { pageId }, cookie, ["admin", "pages", pageId]);
  await pub1.text();
  check("publish: publishPageAction completes", pub1.status === 200 || pub1.status === 303, `status=${pub1.status}`);

  const live1 = await get(`/${SLUG}`);
  check("publish: the edited text is live", live1.status === 200 && live1.body.includes(TEXT_MARKER), `status=${live1.status}`);

  // ---- Add a section: second draft (rich-text + cta-banner) ----
  const bannerSection = {
    type: "cta-banner",
    content: { eyebrow: "", heading: BLOCK_MARKER, text: "", ctaLabel: "Join now", ctaHref: "/contact", image: "", overlayOpacity: 0.6 },
    isVisible: true,
    visibilityDevices: "all",
  };
  const save2 = await dispatch(`${BASE}/admin/pages/${pageId}`, ACT.saveSections, { pageId, sections: JSON.stringify([textSection, bannerSection]) }, cookie, ["admin", "pages", pageId]);
  check("add a section: saveSections accepts the new block", save2.status === 200 && !actionFailed(await save2.text()), `status=${save2.status}`);
  const pub2 = await dispatch(`${BASE}/admin/pages/${pageId}`, ACT.publishPage, { pageId }, cookie, ["admin", "pages", pageId]);
  await pub2.text();
  const live2 = await get(`/${SLUG}`);
  check("add a section: both blocks render after publishing", live2.body.includes(TEXT_MARKER) && live2.body.includes(BLOCK_MARKER));

  // ---- Replace an image: upload a new file to the media library ----
  const upload = await dispatch(
    `${BASE}/admin/media`,
    ACT.uploadMedia,
    { folder: "general" },
    cookie,
    ["admin", "media"],
    [{ field: "files[]", filename: MEDIA_NAME, type: "image/png", bytes: PNG }],
  );
  const uploadBody = await upload.text();
  check("replace an image: uploadMediaAction accepts a file", upload.status === 200 && !actionFailed(uploadBody), `status=${upload.status}`);

  const mediaList = await get("/admin/media", cookie);
  check("replace an image: the upload appears in the library", mediaList.body.includes(MEDIA_NAME));
  const mediaId = queryId(`SELECT id FROM media WHERE filename='${MEDIA_NAME}' LIMIT 1`);
  check("replace an image: media id resolvable", Boolean(mediaId), mediaId);
  if (mediaId) {
    const delMedia = await dispatch(`${BASE}/admin/media`, ACT.deleteMedia, { id: mediaId }, cookie, ["admin", "media"]);
    await delMedia.text();
    const mediaList2 = await get("/admin/media", cookie);
    check("replace an image: media can be removed again", !mediaList2.body.includes(MEDIA_NAME));
  }

  // ---- Add a trainer (published, then shown on /coaches) ----
  const trainer = await dispatch(
    `${BASE}/admin/trainers`,
    ACT.createTrainer,
    {
      name: COACH_NAME,
      slug: COACH_SLUG,
      title: "Guest Coach",
      photoId: "",
      bio: "Phase 7 acceptance coach.",
      specialties: JSON.stringify(["Acceptance"]),
      certifications: JSON.stringify([]),
      facebookUrl: "",
      instagramUrl: "",
      twitterUrl: "",
      youtubeUrl: "",
      seoTitle: "",
      seoDescription: "",
      isPublished: "on",
    },
    cookie,
    ["admin", "trainers"],
  );
  const trainerBody = await trainer.text();
  check("add a trainer: createTrainerAction saves it", trainer.status === 200 && !actionFailed(trainerBody), `status=${trainer.status}`);

  const coaches = await get("/coaches");
  check("add a trainer: the coach appears publicly", coaches.body.includes(COACH_NAME));

  const trainersAdmin = await get("/admin/trainers", cookie);
  check("add a trainer: admin lists the coach", trainersAdmin.body.includes(COACH_NAME));
  const trainerId = queryId(`SELECT id FROM trainers WHERE slug='${COACH_SLUG}' LIMIT 1`);
  check("add a trainer: trainer id resolvable", Boolean(trainerId), trainerId);
  if (trainerId) {
    const delTrainer = await dispatch(`${BASE}/admin/trainers`, ACT.deleteModuleItem, { module: "trainers", id: trainerId }, cookie, ["admin", "trainers"]);
    await delTrainer.text();
    const coaches2 = await get("/coaches");
    check("add a trainer: removing the coach clears it publicly", !coaches2.body.includes(COACH_NAME));
  }

  // ---- Read leads: submit, see it, work it, export, delete ----
  const lead = await dispatch(
    `${BASE}/contact`,
    ACT.createLead,
    { name: `Phase 7 Lead ${STAMP}`, phone: "+92 300 1112222", email: LEAD_EMAIL, goal: "Handover check", message: "Phase 7 acceptance.", sourcePage: "/contact" },
    null,
    ["contact"],
  );
  check("read leads: public form accepts a submission", lead.status === 200 && !actionFailed(await lead.text()), `status=${lead.status}`);

  const inbox = await get("/admin/leads", cookie);
  check("read leads: the enquiry lands in the inbox", inbox.body.includes(LEAD_EMAIL));
  const leadId = queryId(`SELECT id FROM leads WHERE email='${LEAD_EMAIL}' LIMIT 1`);
  check("read leads: lead id resolvable", Boolean(leadId), leadId);

  if (leadId) {
    const upd = await dispatch(`${BASE}/admin/leads`, ACT.updateLeadStatus, { id: leadId, status: "CONTACTED", notes: "Phase 7 acceptance follow-up." }, cookie, ["admin", "leads"]);
    await upd.text();
    const inbox2 = await get("/admin/leads", cookie);
    check("read leads: status can be updated", inbox2.body.includes("CONTACTED"));

    const csv = await get("/admin/leads/export", cookie);
    check("read leads: CSV export includes the enquiry", csv.body.includes(LEAD_EMAIL));

    const delLead = await dispatch(`${BASE}/admin/leads`, ACT.deleteLead, { id: leadId }, cookie, ["admin", "leads"]);
    await delLead.text();
    const inbox3 = await get("/admin/leads", cookie);
    check("read leads: enquiry can be deleted", !inbox3.body.includes(LEAD_EMAIL));
  }

  // ---- Cleanup: trash then permanently delete the acceptance page ----
  const trash = await dispatch(`${BASE}/admin/pages/${pageId}`, ACT.trashPage, { pageId }, cookie, ["admin", "pages", pageId]);
  await trash.text();
  const purge = await dispatch(`${BASE}/admin/pages/${pageId}`, ACT.deletePageForever, { pageId }, cookie, ["admin", "pages", pageId]);
  await purge.text();
  const gone = await get(`/${SLUG}`);
  check("cleanup: the acceptance page is removed", gone.status === 404, `status=${gone.status}`);

  finish();
}

function finish() {
  const passed = results.filter((r) => r.ok).length;
  const total = results.length;
  console.log(`\n${passed}/${total} Phase 7 checks passed`);
  if (passed !== total) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
