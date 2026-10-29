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

import { coaches, fees, owners, studio } from "../src/lib/fitx/knowledge";
import { legacyPosts } from "../src/lib/fitx/legacy-blog";
import { googleReviews } from "../src/lib/fitx/reviews";
import { PrismaClient } from "../src/generated/prisma/client";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set — copy .env.example to .env first.");
}

const prisma = new PrismaClient({ adapter: new PrismaMariaDb(connectionString) });

// Earlier placeholder or synced values that may be replaced (anything else was
// typed in the admin and is kept).
const OLD_GENERAL: Record<string, string[]> = {
  address: ["Sahiwal, Punjab, Pakistan"],
  phone: ["+92 300 0000000"],
  whatsapp: ["+92 300 0000000"],
  openingHours: ["Mon–Sat · 6:00am – 10:00pm", "Sessions 8:00 AM – 11:30 PM"],
};

const NEW_GENERAL: Record<string, string> = {
  address: studio.address,
  phone: studio.phones.join(" / "),
  whatsapp: studio.whatsapp,
  openingHours: studio.hoursSummary,
  facebook: studio.social.facebook,
  instagram: studio.social.instagram,
  mapEmbed: studio.mapEmbed,
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
    if (now === "" || OLD_GENERAL[field]?.includes(now)) {
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
  // Add confirmed credentials to a profile that has none yet.
  const current = await prisma.trainer.findUnique({ where: { slug: founder.slug }, select: { certifications: true } });
  const credentialed =
    current && Array.isArray(current.certifications) && current.certifications.length === 0 && founder.credentials?.length
      ? await prisma.trainer.update({ where: { slug: founder.slug }, data: { certifications: founder.credentials } })
      : null;
  console.info(
    named.count || profiled.count || credentialed
      ? `• Coaches: ${founder.name}'s name, role, profile or credentials updated`
      : `• Coaches: ${founder.name} already up to date`,
  );

  await syncCoachRoster();

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

/** First name, ignoring titles: "Trainer Malik Muazam" → "muazam". */
function firstName(name: string) {
  const words = name.toLowerCase().replace(/[^a-z\s]/g, " ").split(/\s+/).filter(Boolean);
  return words.find((w) => !["trainer", "coach", "miss", "mr", "mrs", "sir", "malik", "rana", "hafiz"].includes(w)) ?? "";
}

/**
 * Makes the published coaches match the studio's roster (knowledge.ts), even
 * when coaches were entered in the admin by hand: each roster coach is found by
 * slug or first name (or created), published in roster order with the
 * roster's name and role; duplicates and owners who are not coaches are
 * unpublished. Other coaches added in the admin stay, listed after them.
 */
async function syncCoachRoster() {
  const rows = await prisma.trainer.findMany({ orderBy: { sortOrder: "asc" } });
  const used = new Set<string>();

  for (const [index, member] of coaches.entries()) {
    const matches = rows.filter((r) => r.slug === member.slug || firstName(r.name) === firstName(member.name));
    const keep =
      matches.find((r) => r.slug === member.slug) ?? matches.find((r) => r.isPublished) ?? matches[0];
    if (!keep) {
      await prisma.trainer.create({
        data: {
          slug: member.slug,
          name: member.name,
          title: member.role,
          bio: member.bio || null,
          specialties: member.focus ?? [],
          certifications: member.credentials ?? [],
          sortOrder: index + 1,
          isPublished: true,
        },
      });
      console.info(`• Coaches: added ${member.name}`);
      continue;
    }
    used.add(keep.id);
    const slugFree = keep.slug === member.slug || !rows.some((r) => r.slug === member.slug);
    await prisma.trainer.update({
      where: { id: keep.id },
      data: {
        slug: slugFree ? member.slug : keep.slug,
        name: member.name,
        title: member.role,
        sortOrder: index + 1,
        isPublished: true,
        // Fill the profile once; text edited in the admin afterwards is kept.
        ...(keep.bio ? {} : { bio: member.bio || null }),
        ...(Array.isArray(keep.specialties) && keep.specialties.length ? {} : { specialties: member.focus ?? [] }),
      },
    });
    for (const extra of matches.filter((r) => r.id !== keep.id && r.isPublished)) {
      used.add(extra.id);
      await prisma.trainer.update({ where: { id: extra.id }, data: { isPublished: false } });
      console.info(`• Coaches: unpublished duplicate "${extra.name}" (/trainers/${extra.slug})`);
    }
  }
  console.info(`• Coaches: published ${coaches.map((c) => c.name).join(", ")}`);

  // Owners who are not coaches belong on Who We Are, not in the coaches list.
  const ownerOnly = owners.filter((o) => !coaches.some((c) => c.slug === o.slug));
  for (const row of rows) {
    if (used.has(row.id) || !row.isPublished) continue;
    if (ownerOnly.some((o) => firstName(o.name) === firstName(row.name))) {
      await prisma.trainer.update({ where: { id: row.id }, data: { isPublished: false } });
      console.info(`• Coaches: unpublished owner "${row.name}" (shown on Who We Are instead)`);
    } else if (row.sortOrder <= coaches.length) {
      await prisma.trainer.update({ where: { id: row.id }, data: { sortOrder: coaches.length + 1 + row.sortOrder } });
    }
  }
}

// One-time imports are remembered here, so content the admin deletes later is
// never brought back by a re-run.
const IMPORTS_KEY = "sync-imports";

async function importDone(name: string): Promise<boolean> {
  const row = await prisma.setting.findUnique({ where: { key: IMPORTS_KEY } });
  return Boolean((row?.value as Record<string, unknown> | undefined)?.[name]);
}

async function markImported(name: string): Promise<void> {
  const row = await prisma.setting.findUnique({ where: { key: IMPORTS_KEY } });
  const value = { ...((row?.value as Record<string, unknown> | undefined) ?? {}), [name]: new Date().toISOString() };
  await prisma.setting.upsert({
    where: { key: IMPORTS_KEY },
    update: { value: value as never },
    create: { key: IMPORTS_KEY, group: "system", value: value as never },
  });
}

/** Imports the Google reviews once; afterwards they are managed in Admin → Testimonials. */
async function syncGoogleReviews() {
  if (await importDone("googleReviews")) return console.info("• Testimonials: Google reviews already imported");
  const already = await prisma.testimonial.count({ where: { name: { in: googleReviews.map((r) => r.name) } } });
  if (already === 0) {
    await prisma.testimonial.createMany({
      data: googleReviews.map((review, index) => ({
        name: review.name,
        quote: review.text,
        rating: null,
        sortOrder: index + 1,
        isPublished: true,
      })),
    });
  }
  await markImported("googleReviews");
  console.info(
    already === 0 ? `• Testimonials: imported ${googleReviews.length} Google reviews` : "• Testimonials: Google reviews already imported",
  );
}

/** Imports the site's original blog posts once, if the blog is empty. */
async function syncLegacyBlog() {
  if (await importDone("legacyBlog")) return console.info("• Blog: original posts already imported");
  const existing = await prisma.blogPost.count();
  if (existing === 0) {
    await prisma.blogPost.createMany({
      data: legacyPosts.map((post) => ({
        slug: post.slug,
        title: post.title,
        excerpt: post.excerpt,
        content: post.content,
        status: "PUBLISHED" as const,
        publishedAt: new Date(`${post.date}T09:00:00Z`),
      })),
    });
  }
  await markImported("legacyBlog");
  console.info(existing === 0 ? `• Blog: imported ${legacyPosts.length} original posts` : "• Blog: posts already present");
}

async function main() {
  console.info("Syncing FITX knowledge base into the database…");
  await syncSettings();
  await syncPlans();
  await syncTimetable();
  await syncTeam();
  await syncTestimonials();
  await syncGoogleReviews();
  await syncLegacyBlog();
  console.info("Done.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
