/*
 * FITX Phase 5 HTTP acceptance harness.
 *
 * Verifies the Phase 5 deliverables over the wire against the running build:
 *   - SEO suite: /robots.txt, /sitemap.xml, site-wide + detail JSON-LD
 *   - reference-site starter pages and their sections
 *   - the new `timetable` and `contact-info` section types (public render +
 *     through the real saveSections/publishPage server actions)
 *   - the rebuilt header menu with the "What We Do" dropdown
 */
import { actionIds } from "./action-ids.mjs";

const BASE = "http://localhost:3000";
const HOME_ID = "cmv4278hu00016wuafqyavaoc";
const CONTACT_ID = "cmv4278jj00056wua24o7xaq4";

const ACTIONS = actionIds("login", "saveSections", "publishPage");

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
    "User-Agent": "FitxPhase5Accept/1.0",
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

const CONTACT_SECTIONS = [
  {
    type: "rich-text",
    content: {
      eyebrow: "Contact",
      heading: "Visit us",
      showAccentSlash: true,
      align: "left",
      paragraphs: [
        "We are in Shadman Town on Faisalabad Road. Drop in, call ahead, or book a consultation online.",
      ],
    },
    isVisible: true,
    visibilityDevices: "all",
  },
  {
    type: "contact-info",
    content: {
      eyebrow: "Visit us",
      heading: "Find us in Sahiwal",
      showAccentSlash: true,
      text: "",
      showAddress: true,
      showPhone: true,
      showWhatsapp: true,
      showEmail: true,
      showHours: true,
      showMap: true,
    },
    isVisible: true,
    visibilityDevices: "all",
  },
  {
    type: "lead-form",
    content: {
      eyebrow: "Start your journey",
      heading: "Book a consultation",
      showAccentSlash: true,
      text: "Tell us a little about your goals and we'll call you back within one working day.",
      submitLabel: "Send my request",
    },
    isVisible: true,
    visibilityDevices: "all",
  },
];

async function get(path) {
  const res = await fetch(`${BASE}${path}`, { redirect: "manual" });
  return { status: res.status, body: await res.text() };
}

async function main() {
  // ---- SEO: robots.txt ----
  const robots = await get("/robots.txt");
  check("robots.txt returns 200", robots.status === 200, `status=${robots.status}`);
  check("robots.txt blocks /admin/", robots.body.includes("Disallow: /admin/"));
  check("robots.txt advertises the sitemap", robots.body.includes(`Sitemap: ${BASE}/sitemap.xml`));

  // ---- SEO: sitemap.xml ----
  const sitemap = await get("/sitemap.xml");
  check("sitemap.xml returns 200", sitemap.status === 200, `status=${sitemap.status}`);
  const expectInSitemap = [
    `${BASE}/who-we-are`,
    `${BASE}/services`,
    `${BASE}/coaches`,
    `${BASE}/gallery`,
    `${BASE}/success-stories`,
    `${BASE}/plans`,
    `${BASE}/timetable`,
    `${BASE}/contact`,
    `${BASE}/services/personal-training`,
    `${BASE}/trainers/head-coach`,
  ];
  const missing = expectInSitemap.filter((url) => !sitemap.body.includes(`<loc>${url}</loc>`));
  check("sitemap lists published pages + module detail URLs", missing.length === 0, missing.join(", "));
  check(
    "sitemap excludes draft pages (about / trainers)",
    !sitemap.body.includes(`<loc>${BASE}/about</loc>`) && !sitemap.body.includes(`<loc>${BASE}/trainers</loc>`),
  );

  // ---- Reference starter pages all render ----
  const pages = ["/", "/who-we-are", "/services", "/coaches", "/gallery", "/success-stories", "/plans", "/timetable", "/contact"];
  const pageBodies = {};
  for (const path of pages) {
    const res = await get(path);
    pageBodies[path] = res.body;
    check(`page ${path} renders`, res.status === 200, `status=${res.status}`);
  }

  // ---- Site-wide JSON-LD + home content ----
  const home = pageBodies["/"];
  check(
    "home ships HealthClub/LocalBusiness JSON-LD",
    home.includes("application/ld+json") && home.includes("HealthClub") && home.includes("LocalBusiness"),
  );
  check(
    "home still renders the hero and the Trainers section",
    home.includes("The most premium personal training program") && home.includes("Usman Ali") && home.includes("Meet the team"),
  );

  // ---- New section types render on the seeded pages ----
  check("who-we-are renders its story sections", pageBodies["/who-we-are"].includes("More than a gym") && pageBodies["/who-we-are"].includes("What makes us different"));
  check("services renders the services grid", pageBodies["/services"].includes("Training, guided") && pageBodies["/services"].includes("Personal Training"));
  check("coaches renders the trainers grid", pageBodies["/coaches"].includes("Train with the best") && pageBodies["/coaches"].includes("/trainers/head-coach"));
  check("gallery page renders a gallery section", pageBodies["/gallery"].includes("Inside FITX"));
  check("success-stories renders testimonials", pageBodies["/success-stories"].includes("Ayesha K.") && pageBodies["/success-stories"].includes("Training at FITX"));
  check("plans page renders the plan cards", pageBodies["/plans"].includes("Starter") && pageBodies["/plans"].includes("Commit"));
  const timetable = pageBodies["/timetable"];
  check(
    "timetable section renders the weekly schedule",
    timetable.includes("Class timetable") &&
      timetable.includes("Strength") &&
      timetable.includes("Boxing") &&
      timetable.includes("Yoga &amp; Mobility") &&
      timetable.includes("Monday") &&
      timetable.includes("Wednesday") &&
      timetable.includes("Friday"),
  );

  // ---- Detail-page JSON-LD ----
  const service = await get("/services/personal-training");
  const trainer = await get("/trainers/head-coach");
  check("service detail ships Service JSON-LD", service.status === 200 && service.body.includes('"@type":"Service"'));
  check("trainer detail ships Person JSON-LD", trainer.status === 200 && trainer.body.includes('"@type":"Person"'));

  // ---- Header menu rebuilt with the What We Do dropdown ----
  check(
    "header menu shows the reference items",
    home.includes("Who We Are") && home.includes("What We Do") && home.includes("Success Stories") && home.includes("Contact Us"),
  );
  check("header dropdown links to a service detail page", home.includes("/services/personal-training"));

  // ---- Admin: the section builder offers the new block types ----
  const cookie = await login();
  check("login sets a session cookie", Boolean(cookie));
  const builderRes = await fetch(`${BASE}/admin/pages/${HOME_ID}`, { headers: { Cookie: cookie } });
  const builder = await builderRes.text();
  check(
    "page builder lists the Class timetable and Contact information blocks",
    builderRes.status === 200 && builder.includes("Class timetable") && builder.includes("Contact information"),
    `status=${builderRes.status}`,
  );

  // ---- contact-info through the real saveSections + publish actions ----
  const save = await dispatch(
    `${BASE}/admin/pages/${CONTACT_ID}`,
    ACTIONS.saveSections,
    { pageId: CONTACT_ID, sections: JSON.stringify(CONTACT_SECTIONS) },
    cookie,
    ["admin", "pages", CONTACT_ID],
  );
  const saveBody = await save.text();
  check("saveSections accepts the new contact-info block", save.status === 200 && !actionFailed(saveBody), `status=${save.status}`);

  const publish = await dispatch(
    `${BASE}/admin/pages/${CONTACT_ID}`,
    ACTIONS.publishPage,
    { pageId: CONTACT_ID },
    cookie,
    ["admin", "pages", CONTACT_ID],
  );
  check("publishPageAction completes for contact", publish.status === 200 || publish.status === 303, `status=${publish.status}`);

  const contact = await get("/contact");
  check(
    "contact page renders the new contact-info block",
    contact.body.includes("Find us in Sahiwal") &&
      contact.body.includes("Sahiwal, Punjab, Pakistan") &&
      contact.body.includes("+92 300 0000000") &&
      contact.body.includes("info@fitx.pk") &&
      contact.body.includes("6:00am"),
  );
  check("contact page keeps the lead form", contact.body.includes("Book a consultation") || contact.body.includes("Start your journey"));

  // ---- Unauthenticated admin still redirects ----
  const adminRes = await fetch(`${BASE}/admin/pages/${HOME_ID}`, { redirect: "manual" });
  check("unauthenticated admin access redirects to login", adminRes.status === 307 && (adminRes.headers.get("location") ?? "").includes("/admin/login"), `status=${adminRes.status}`);

  const passed = results.filter((r) => r.ok).length;
  console.log(`\n${passed}/${results.length} Phase 5 checks passed`);
  if (passed !== results.length) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
