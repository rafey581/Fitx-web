/**
 * One-time update for databases seeded before the studio's knowledge base
 * (src/lib/fitx/knowledge.ts) arrived: replaces the original placeholder fees,
 * contact details, founder name and demo timetable with the approved facts.
 *
 *   npm run db:sync-knowledge
 *
 * Safe to re-run. It only touches values that still equal the old seed
 * placeholders, so anything the owner already edited in the admin is kept.
 * Old placeholder rows are unpublished, not deleted.
 */
import "dotenv/config";

import { PrismaMariaDb } from "@prisma/adapter-mariadb";

import { fees, studio } from "../src/lib/fitx/knowledge";
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
  whatsapp: "",
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

async function syncFounder() {
  const result = await prisma.trainer.updateMany({
    where: { slug: "head-coach", name: "Head Coach" },
    data: { name: studio.founder, title: "Founder" },
  });
  console.info(
    result.count > 0 ? `• Coaches: "Head Coach" renamed to ${studio.founder}` : "• Coaches: founder already set",
  );
}

async function main() {
  console.info("Syncing FITX knowledge base into the database…");
  await syncSettings();
  await syncPlans();
  await syncTimetable();
  await syncFounder();
  await syncTestimonials();
  console.info("Done.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
