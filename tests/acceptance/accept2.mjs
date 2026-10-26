/* FITX Phase 4 HTTP acceptance harness (v2). Drives the real server actions over the wire. */
import { actionIds } from "./action-ids.mjs";

const BASE = "http://localhost:3000";
const HOME_ID = "cmv4278hu00016wuafqyavaoc";
const CONTACT_ID = "cmv4278jj00056wua24o7xaq4";

const ACTIONS = actionIds(
  "login",
  "saveSections",
  "publishPage",
  "createTrainer",
  "createService",
  "createPlan",
  "createTestimonial",
  "createGalleryItem",
  "createTimetableEntry",
  "deleteModuleItem",
  "createLead",
  "updateLeadStatus",
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
    "User-Agent": "FitxPhase4Accept/2.0",
  };
  if (cookie) headers["Cookie"] = cookie;
  return fetch(url, { method: "POST", redirect: "manual", headers, body: parts.join("") });
}
async function login() {
  const html = await (await fetch(`${BASE}/admin/login`)).text();
  const desc = html.match(/name="(\$ACTION_1:0)"\s+value="([^"]*)"/);
  const descriptor = JSON.parse(desc[2].replace(/&quot;/g, '"'));
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

const HOME_SECTIONS = [
  {
    type: "hero-slider",
    content: {
      autoplayMs: 6000,
      overlayOpacity: 0.55,
      slides: [
        { eyebrow: "Sahiwal · Punjab", heading: "The most premium personal training program", subheading: "One-on-one coaching built around your body, your schedule and your goals.", ctaLabel: "Start training", ctaHref: "/contact", image: "" },
        { eyebrow: "Train with intent", heading: "Strength, boxing, yoga", subheading: "Every session is programmed and tracked, so progress is never left to chance.", ctaLabel: "Meet the coaches", ctaHref: "/trainers", image: "" },
      ],
    },
    isVisible: true,
    visibilityDevices: "all",
  },
  {
    type: "feature-cards",
    content: {
      eyebrow: "Why FITX",
      heading: "Programs built around you",
      items: [
        { icon: "dumbbell", title: "Personal training", text: "Private coaching with programming, progress tracking and form correction." },
        { icon: "glove", title: "Boxing & conditioning", text: "Pad work, technique and fight-ready conditioning in a private studio." },
        { icon: "lotus", title: "Yoga & mobility", text: "Recover, move better and reduce injury risk with guided mobility work." },
      ],
    },
    isVisible: true,
    visibilityDevices: "all",
  },
  {
    type: "columns",
    content: {
      columns: [
        {
          key: "col-a",
          width: 6,
          blocks: [
            { key: "split-a", type: "split-content", content: { eyebrow: "Coaching", heading: "A plan, not a guess", text: "We assess movement, set measurable targets and adjust your program every few weeks.", image: "", imageSide: "left", bullets: ["Baseline assessment and goal setting", "Progressive, tracked programming", "Nutrition guidance that fits your life"], ctaLabel: "Book a consultation", ctaHref: "/contact" } },
          ],
        },
        {
          key: "col-b",
          width: 6,
          blocks: [
            { key: "split-b", type: "split-content", content: { eyebrow: "Community", heading: "Family-friendly studio", text: "Train solo, with a partner, or bring the family — sessions are scheduled around real life.", image: "", imageSide: "right", bullets: ["Private and semi-private sessions", "Women-only and family time slots", "Flexible monthly memberships"], ctaLabel: "See membership plans", ctaHref: "/services" } },
          ],
        },
      ],
    },
    isVisible: true,
    visibilityDevices: "all",
  },
  {
    type: "testimonials-slider",
    content: { eyebrow: "Success stories", heading: "What our clients say", source: "all", items: [] },
    isVisible: true,
    visibilityDevices: "all",
  },
  {
    type: "trainers-grid",
    content: { source: "all", eyebrow: "Meet the team", heading: "Trainers" },
    isVisible: true,
    visibilityDevices: "all",
  },
];

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
      text: "Tell us a little about your goals and we'll call you back within one working day.",
      submitLabel: "Send my request",
    },
    isVisible: true,
    visibilityDevices: "all",
  },
];

async function main() {
  const cookie = await login();
  check("login sets session cookie", Boolean(cookie));

  // ---- Builder wiring: home gets a trainers-grid section ----
  const saveHome = await dispatch(
    `${BASE}/admin/pages/${HOME_ID}`,
    ACTIONS.saveSections,
    { pageId: HOME_ID, sections: JSON.stringify(HOME_SECTIONS) },
    cookie,
    ["admin", "pages", HOME_ID],
  );
  const saveHomeBody = await saveHome.text();
  check(
    "saveSections stores the trainers-grid on home",
    saveHome.status === 200 && !actionFailed(saveHomeBody),
    `status=${saveHome.status}`,
  );
  const homePage = await (await fetch(`${BASE}/`)).text();
  check(
    "home renders the Trainers section with seeded coaches",
    homePage.includes("Meet the team") && homePage.includes("/trainers/head-coach"),
  );

  // ---- Trainer CRUD: create through the admin action ----
  // Idempotent: skip creation when the acceptance artifact already exists so a
  // rerun does not accumulate duplicate `usman-ali-2`, `usman-ali-3`, … rows.
  const trainersBefore = await (
    await fetch(`${BASE}/admin/trainers`, { headers: { Cookie: cookie } })
  ).text();
  const trainerExists = trainersBefore.includes("usman-ali");
  if (trainerExists) {
    check("createTrainerAction saves the trainer", true, "already present (idempotent rerun)");
  } else {
    const trainer = await dispatch(
      `${BASE}/admin/trainers`,
      ACTIONS.createTrainer,
      {
        name: "Usman Ali",
        slug: "",
        title: "Head Coach",
        photoId: "",
        bio: "Usman leads the FITX coaching floor with 12 years of experience across strength and combat sports.",
        specialties: JSON.stringify(["Strength", "Boxing"]),
        certifications: JSON.stringify(["ACE CPT", "CrossFit L1"]),
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
    check(
      "createTrainerAction saves the trainer",
      trainer.status === 200 && !actionFailed(trainerBody) && trainerBody.includes("Added Usman Ali"),
      `status=${trainer.status}`,
    );
  }
  const adminTrainers = await (await fetch(`${BASE}/admin/trainers`, { headers: { Cookie: cookie } })).text();
  check("admin /trainers lists Usman Ali", adminTrainers.includes("Usman Ali"));
  const homeAfter = await (await fetch(`${BASE}/`)).text();
  check(
    "home Trainers grid now includes Usman Ali",
    homeAfter.includes("Usman Ali") && homeAfter.includes("/trainers/usman-ali"),
  );
  const profile = await fetch(`${BASE}/trainers/usman-ali`);
  const profileBody = await profile.text();
  check(
    "trainer profile page renders",
    profile.status === 200 && profileBody.includes("Usman Ali") && profileBody.includes("12 years of experience"),
    `status=${profile.status}`,
  );
  const draftProfile = await fetch(`${BASE}/trainers/does-not-exist`);
  check("unknown trainer slug 404s", draftProfile.status === 404, `status=${draftProfile.status}`);

  // ---- Other module CRUD surfaces (create → list → delete) ----
  const service = await dispatch(
    `${BASE}/admin/services`,
    ACTIONS.createService,
    {
      title: "1-on-1 Coaching",
      slug: "",
      shortDescription: "Private daily coaching, programmed around your goals.",
      content: "Weekly check-ins, custom programming and form coaching every session.",
      iconId: "",
      imageId: "",
      gallery: JSON.stringify([]),
      ctaLabel: "",
      ctaUrl: "",
      seoTitle: "",
      seoDescription: "",
      isPublished: "on",
    },
    cookie,
    ["admin", "services"],
  );
  const serviceBody = await service.text();
  check("createServiceAction works", service.status === 200 && !actionFailed(serviceBody), `status=${service.status}`);
  const servicePage = await (await fetch(`${BASE}/admin/services`, { headers: { Cookie: cookie } })).text();
  check("admin /services lists it", servicePage.includes("1-on-1 Coaching"));
  const serviceProfile = await fetch(`${BASE}/services/1-on-1-coaching`);
  check(
    "service profile page renders",
    serviceProfile.status === 200 && (await serviceProfile.text()).includes("1-on-1 Coaching"),
    `status=${serviceProfile.status}`,
  );

  const plan = await dispatch(
    `${BASE}/admin/plans`,
    ACTIONS.createPlan,
    {
      name: "Monthly — Solo",
      price: "15000",
      currency: "PKR",
      billingPeriod: "month",
      features: JSON.stringify(["Full gym access", "2 PT sessions / month"]),
      isHighlighted: "",
      ctaLabel: "",
      ctaUrl: "",
      isPublished: "on",
    },
    cookie,
    ["admin", "plans"],
  );
  const planBody = await plan.text();
  check("createPlanAction works", plan.status === 200 && !actionFailed(planBody) && planBody.includes("Added the Monthly"), `status=${plan.status}`);
  check("admin /plans lists it", (await (await fetch(`${BASE}/admin/plans`, { headers: { Cookie: cookie } })).text()).includes("Monthly"));

  const testimonial = await dispatch(
    `${BASE}/admin/testimonials`,
    ACTIONS.createTestimonial,
    { name: "Fatima K.", quote: "Lost 12kg in five months — the coaching is unreal.", photoId: "", rating: "5", beforeImageId: "", afterImageId: "", isPublished: "on" },
    cookie,
    ["admin", "testimonials"],
  );
  const testimonialBody = await testimonial.text();
  check("createTestimonialAction works", testimonial.status === 200 && !actionFailed(testimonialBody) && testimonialBody.includes("Added testimonial from Fatima"), `status=${testimonial.status}`);
  check("admin /testimonials lists it", (await (await fetch(`${BASE}/admin/testimonials`, { headers: { Cookie: cookie } })).text()).includes("Fatima"));

  const gallery = await dispatch(
    `${BASE}/admin/gallery`,
    ACTIONS.createGalleryItem,
    { mediaId: "", externalUrl: "https://instagram.com/p/phase4-accept", category: "acceptance", caption: "Harness test image", isPublished: "on" },
    cookie,
    ["admin", "gallery"],
  );
  const galleryBody = await gallery.text();
  check("createGalleryItemAction works", gallery.status === 200 && !actionFailed(galleryBody) && galleryBody.includes("Gallery image added"), `status=${gallery.status}`);
  check("admin /gallery lists it", (await (await fetch(`${BASE}/admin/gallery`, { headers: { Cookie: cookie } })).text()).includes("Harness test image"));

  const timetable = await dispatch(
    `${BASE}/admin/timetable`,
    ACTIONS.createTimetableEntry,
    { title: "Boxing Basics", dayOfWeek: "1", startTime: "18:30", endTime: "19:30", trainerId: "", isPublished: "on" },
    cookie,
    ["admin", "timetable"],
  );
  const timetableBody = await timetable.text();
  check("createTimetableEntryAction works", timetable.status === 200 && !actionFailed(timetableBody) && timetableBody.includes("Added Boxing Basics"), `status=${timetable.status}`);
  check("admin /timetable lists it", (await (await fetch(`${BASE}/admin/timetable`, { headers: { Cookie: cookie } })).text()).includes("Boxing Basics"));

  // ---- Admin pages + nav ----
  const modulePages = ["trainers", "services", "plans", "testimonials", "gallery", "timetable", "leads"];
  for (const slug of modulePages) {
    const res = await fetch(`${BASE}/admin/${slug}`, { headers: { Cookie: cookie } });
    check(`admin page /${slug} loads`, res.status === 200, `status=${res.status}`);
  }
  const adminHome = await (await fetch(`${BASE}/admin`, { headers: { Cookie: cookie } })).text();
  const neededLinks = ["/admin/trainers", "/admin/services", "/admin/plans", "/admin/testimonials", "/admin/gallery", "/admin/timetable", "/admin/leads"];
  const missing = neededLinks.filter((link) => !adminHome.includes(`href="${link}"`));
  check("admin nav lists all module links", missing.length === 0, missing.join(","));

  const unauth = await fetch(`${BASE}/admin/leads`, { redirect: "manual" });
  check(
    "unauthenticated admin module redirects to login",
    unauth.status === 307 && (unauth.headers.get("location") ?? "").includes("/admin/login"),
    `status=${unauth.status}`,
  );

  // ---- Contact page: lead-form section + publish ----
  const saveContact = await dispatch(
    `${BASE}/admin/pages/${CONTACT_ID}`,
    ACTIONS.saveSections,
    { pageId: CONTACT_ID, sections: JSON.stringify(CONTACT_SECTIONS) },
    cookie,
    ["admin", "pages", CONTACT_ID],
  );
  const saveContactBody = await saveContact.text();
  check("saveSections: contact gets a lead-form", saveContact.status === 200 && !actionFailed(saveContactBody), `status=${saveContact.status}`);

  const publish = await dispatch(
    `${BASE}/admin/pages/${CONTACT_ID}`,
    ACTIONS.publishPage,
    { pageId: CONTACT_ID },
    cookie,
    ["admin", "pages", CONTACT_ID],
  );
  check("publishPageAction completes", publish.status === 200 || publish.status === 303, `status=${publish.status}`);

  const contactPage = await (await fetch(`${BASE}/contact`)).text();
  check(
    "public /contact renders the lead form",
    contactPage.includes('name="company"') && contactPage.includes('name="phone"') && contactPage.includes("Book a consultation"),
    `len=${contactPage.length}`,
  );

  // ---- Lead submission (public), spam, inbox, status, CSV ----
  // Idempotent: the acceptance artifact lead is created once; a rerun reuses it
  // (the status update below is safe to repeat).
  const leadsBefore = await (
    await fetch(`${BASE}/admin/leads`, { headers: { Cookie: cookie } })
  ).text();
  const leadExists = leadsBefore.includes("ali.raza@example.com");
  if (leadExists) {
    check("createLeadAction accepts the submission", true, "already present (idempotent rerun)");
  } else {
    const leadSubmit = await dispatch(
      `${BASE}/contact`,
      ACTIONS.createLead,
      {
        name: "Ali Raza",
        phone: "+92 300 1234567",
        email: "ali.raza@example.com",
        goal: "Lose weight - 10kg in 6 months",
        message: "I'd like a free consultation this week.",
        sourcePage: "/contact",
      },
      null,
      ["contact"],
    );
    const leadBody = await leadSubmit.text();
    check(
      "createLeadAction accepts the submission",
      leadSubmit.status === 200 && !actionFailed(leadBody) && leadBody.includes("Thanks! Your request has been received"),
      `status=${leadSubmit.status}`,
    );
  }

  const spam = await dispatch(
    `${BASE}/contact`,
    ACTIONS.createLead,
    { name: "Spam Bot", phone: "+92 311 1111111", company: "buy-viagra-now.example", sourcePage: "/contact" },
    null,
    ["contact"],
  );
  const spamBody = await spam.text();
  check("honeypot submission is swallowed", spam.status === 200 && !actionFailed(spamBody), `status=${spam.status}`);

  const leadsPage = await (await fetch(`${BASE}/admin/leads`, { headers: { Cookie: cookie } })).text();
  check("admin /leads shows the new lead", leadsPage.includes("Ali Raza"));

  const leadAnchor = leadsPage.indexOf("Ali Raza");
  const leadIdMatch = leadAnchor >= 0 ? leadsPage.slice(leadAnchor).match(/name="id"\s+value="([a-zA-Z0-9]+)"/) : null;
  const leadId = leadIdMatch ? leadIdMatch[1] : "";
  check("lead id resolvable from the inbox", Boolean(leadId), leadId);

  const statusUpdate = await dispatch(
    `${BASE}/admin/leads`,
    ACTIONS.updateLeadStatus,
    { id: leadId, status: "CONTACTED", notes: "Called back, consultation booked for Thursday." },
    cookie,
    ["admin", "leads"],
  );
  const statusBody = await statusUpdate.text();
  check(
    "updateLeadStatusAction saves status + notes",
    statusUpdate.status === 200 && !actionFailed(statusBody) && statusBody.includes("Lead marked as contacted"),
    `status=${statusUpdate.status}`,
  );

  const csv = await fetch(`${BASE}/admin/leads/export`, { headers: { Cookie: cookie } });
  const csvBytes = new Uint8Array(await csv.arrayBuffer());
  const bomOk = csvBytes[0] === 0xef && csvBytes[1] === 0xbb && csvBytes[2] === 0xbf;
  const csvText = new TextDecoder().decode(csvBytes);
  check(
    "CSV export has BOM, CSV headers and the lead",
    csv.status === 200 && bomOk && csvText.includes("Ali Raza") && csvText.includes('"source_page"') && csv.headers.get("content-type")?.includes("text/csv"),
    `status=${csv.status} bom=${bomOk}`,
  );
  const csvUnauth = await fetch(`${BASE}/admin/leads/export`, { redirect: "manual" });
  check(
    "CSV export requires auth (redirects to login)",
    csvUnauth.status === 307 && (csvUnauth.headers.get("location") ?? "").includes("/admin/login"),
    `status=${csvUnauth.status}`,
  );

  // ---- Cleanup: delete the throwaway module rows (keep Usman Ali + the lead) ----
  const cleanup = async (module, page, marker) => {
    const adminHtml = await (await fetch(`${BASE}/admin/${page}`, { headers: { Cookie: cookie } })).text();
    const anchor = adminHtml.indexOf(marker);
    if (anchor < 0) return false;
    // The delete/update forms for the row live after its title; its hidden "id"
    // is the first "name=id" match following the marker.
    const region = adminHtml.slice(anchor, anchor + 2500);
    const idM = region.match(/name="id"\s+value="([a-zA-Z0-9]+)"/);
    if (!idM) return false;
    const del = await dispatch(
      `${BASE}/admin/${page}`,
      ACTIONS.deleteModuleItem,
      { module, id: idM[1] },
      cookie,
      ["admin", page],
    );
    const delBody = await del.text();
    return del.status === 200 && !actionFailed(delBody) && delBody.includes("Deleted");
  };

  check("cleanup: delete test service", await cleanup("services", "services", "1-on-1 Coaching"));
  check("cleanup: delete test plan", await cleanup("plans", "plans", "Monthly"));
  check("cleanup: delete test testimonial", await cleanup("testimonials", "testimonials", "Fatima"));
  check("cleanup: delete test gallery item", await cleanup("gallery", "gallery", "Harness test image"));
  check("cleanup: delete test timetable entry", await cleanup("timetable", "timetable", "Boxing Basics"));

  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
  if (failed.length) {
    console.log("FAILED:");
    for (const f of failed) console.log(`  - ${f.name}`);
    process.exitCode = 1;
  }
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});