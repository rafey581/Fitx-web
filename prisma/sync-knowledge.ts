/**
 * One-time update for databases seeded before the studio's knowledge base
 * (src/lib/fitx/knowledge.ts) arrived: replaces the original placeholder fees,
 * contact details, coaches and demo timetable with the approved facts.
 *
 *   npm run db:sync-knowledge
 *
 * Safe to re-run. It only touches values that still equal the old seed
 * placeholders, so anything the owner already edited in the admin is kept.
 * Old placeholder rows are unpublished, not deleted.
 */
import "dotenv/config";

import { PrismaMariaDb } from "@prisma/adapter-mariadb";

import { coaches, fees, studio } from "../src/lib/fitx/knowledge";
import { PrismaClient } from "../src/generated/prisma/client";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set — copy .env.example to .env first.");
}

const prisma = new PrismaClient({ adapter: new PrismaMariaDb(connectionString) });

const OLD_GENERAL: Record<string, string> = {
  address: "Sahiwal, Punjab, Pakistan",
  phone: "+92 300 0000000",
  whatsapp: "+92 300 0000000",
  openingHours: "Mon–Sat · 6:00am – 10:00pm",
};

const NEW_GENERAL: Record<string, string> = {
  address: studio.address,
  phone: studio.phones.join(" / "),
  whatsapp: studio.whatsapp,
  openingHours: studio.hoursSummary,
};

const OLD_PLANS = ["Starter", "Commit", "Transform"];

const OLD_TIMETABLE = [
  { dayOfWeek: 1, startTime: "06:00", title: "Strength" },
  { dayOfWeek: 1, startTime: "18:00", title: "Boxing" },
  { dayOfWeek: 3, startTime: "06:00", title: "Conditioning" },
  { dayOfWeek: 3, startTime: "19:00", title: "Yoga & Mobility" },
  { dayOfWeek: 5, startTime: "18:00", title: "Boxing" },
];

async function syncSettings() {
  const row = await prisma.setting.findUnique({ where: { key: "general" } });
  const current = (row?.value ?? {}) as Record<string, unknown>;
  const changes: Record<string, string> = {};
  for (const [field, value] of Object.entries(NEW_GENERAL)) {
    const now = typeof current[field] === "string" ? (current[field] as string) : "";
    if (now === value) continue;
    if (now === "" || now === OLD_GENERAL[field]) {
      changes[field] = value;
    } else {
      console.info(`  · kept general.${field} (edited in admin): ${now}`);
    }
  }
  if (Object.keys(changes).length === 0) return console.info("• Settings: nothing to update");
  await prisma.setting.upsert({
    where: { key: "general" },
    update: { value: { ...current, ...changes } as never },
    create: { key: "general", group: "general", value: changes as never },
  });
  console.info(`• Settings updated: ${Object.keys(changes).join(", ")}`);
}

async function syncPlans() {
  const plans = await prisma.plan.findMany({ where: { isPublished: true } });
  const names = plans.map((p) => p.name).sort();
  const isPlaceholderSet =
    names.length === OLD_PLANS.length && [...OLD_PLANS].sort().every((n, i) => n === names[i]);
  if (!isPlaceholderSet) {
    return console.info(`• Plans: kept as-is (${names.join(", ") || "none"}) — not the old placeholders`);
  }
  await prisma.$transaction([
    prisma.plan.updateMany({ where: { name: { in: OLD_PLANS } }, data: { isPublished: false } }),
    ...fees.map((fee, index) =>
      prisma.plan.create({
        data: {
          name: fee.name,
          price: String(fee.monthly),
          currency: "PKR",
          billingPeriod: "per month",
          features: fee.features,
          isHighlighted: fee.highlighted,
          ctaLabel: "Enquire",
          ctaUrl: "/contact",
          sortOrder: index + 1,
          isPublished: true,
        },
      }),
    ),
  ]);
  console.info(`• Plans: unpublished ${OLD_PLANS.join("/")}, added ${fees.map((f) => f.name).join(" + ")}`);
}

async function syncTimetable() {
  let count = 0;
  for (const entry of OLD_TIMETABLE) {
    const result = await prisma.timetableEntry.updateMany({
      where: { ...entry, isPublished: true },
      data: { isPublished: false },
    });
    count += result.count;
  }
  console.info(
    count > 0
      ? `• Timetable: unpublished ${count} demo classes (page now shows the session timings)`
      : "• Timetable: no demo classes to unpublish",
  );
}

// Placeholder reviews from the original seed: not real clients.
const PLACEHOLDER_TESTIMONIALS = [
  { name: "Ayesha K.", quote: "Training at FITX completely changed how I feel. The coaching is personal and the results are real." },
  { name: "Bilal R.", quote: "The boxing sessions are the highlight of my week. My fitness and confidence are the best they have ever been." },
  { name: "Hira S.", quote: "Yoga and mobility work fixed the aches I had carried for years. Highly recommended." },
];

async function syncTestimonials() {
  let count = 0;
  for (const t of PLACEHOLDER_TESTIMONIALS) {
    const result = await prisma.testimonial.updateMany({
      where: { name: t.name, quote: t.quote, isPublished: true },
      data: { isPublished: false },
    });
    count += result.count;
  }
  console.info(
    count > 0
      ? `• Testimonials: unpublished ${count} placeholder reviews (add real ones in Admin → Testimonials)`
      : "• Testimonials: no placeholder reviews to unpublish",
  );
}

const OLD_FOUNDER_NAMES = ["Head Coach", "Zohaib Munir Ali"];
const OLD_FOUNDER_BIO = "Strength and conditioning specialist with a decade of coaching experience.";
const PLACEHOLDER_COACHES = [
  { slug: "boxing-coach", name: "Boxing Coach" },
  { slug: "yoga-coach", name: "Yoga Coach" },
];

/** The studio's real coaches replace the placeholder ones. */
async function syncTeam() {
  const founder = coaches[0];

  // Old databases keep the founder at /trainers/head-coach; move it to the real name.
  const taken = await prisma.trainer.findUnique({ where: { slug: founder.slug }, select: { id: true } });
  if (!taken) {
    const moved = await prisma.trainer.updateMany({
      where: { slug: "head-coach", name: { in: OLD_FOUNDER_NAMES } },
      data: { slug: founder.slug },
    });
    if (moved.count) console.info(`• Coaches: /trainers/head-coach moved to /trainers/${founder.slug}`);
  }
  const named = await prisma.trainer.updateMany({
    where: { slug: founder.slug, name: { in: OLD_FOUNDER_NAMES } },
    data: { name: founder.name, title: founder.role },
  });
  const profiled = await prisma.trainer.updateMany({
    where: { slug: founder.slug, bio: OLD_FOUNDER_BIO },
    data: { bio: founder.bio, specialties: [], certifications: [] },
  });
  console.info(
    named.count || profiled.count
      ? `• Coaches: ${founder.name}'s name, role and profile updated`
      : `• Coaches: ${founder.name} already up to date`,
  );

  let hidden = 0;
  for (const coach of PLACEHOLDER_COACHES) {
    const result = await prisma.trainer.updateMany({
      where: { slug: coach.slug, name: coach.name, isPublished: true },
      data: { isPublished: false },
    });
    hidden += result.count;
  }
  console.info(
    hidden ? `• Coaches: unpublished ${hidden} placeholder coaches` : "• Coaches: no placeholder coaches to unpublish",
  );
}

async function main() {
  console.info("Syncing FITX knowledge base into the database…");
  await syncSettings();
  await syncPlans();
  await syncTimetable();
  await syncTeam();
  await syncTestimonials();
  console.info("Done.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
