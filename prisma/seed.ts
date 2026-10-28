/**
 * FITX Gym Sahiwal — database seed (PRD 7: "Provide a Prisma seed script that
 * creates the Owner account, default settings, the default menu and the starter
 * Home page ...").
 *
 * Run with `npm run db:seed` (wired to `tsx prisma/seed.ts` in prisma7.config.ts).
 *
 * Notes:
 *  - This runs OUTSIDE Next.js, so it must not import anything that pulls in
 *    `server-only` (src/lib/env.ts, src/lib/db.ts, ...). It builds its own
 *    Prisma client from DATABASE_URL via the MariaDB driver adapter.
 *  - The script is idempotent: re-running it will not duplicate rows and will
 *    not overwrite content the owner has since edited in the admin.
 */
import "dotenv/config";

import bcrypt from "bcryptjs";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

import { coaches, fees, studio } from "../src/lib/fitx/knowledge";
import { googleReviews } from "../src/lib/fitx/reviews";
import { defaultTheme } from "../src/lib/theme/tokens";
import {
  LinkType,
  MenuLocation,
  PageStatus,
  PrismaClient,
  Role,
} from "../src/generated/prisma/client";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set — copy .env.example to .env first.");
}

const prisma = new PrismaClient({
  adapter: new PrismaMariaDb(connectionString),
});

const ownerName = process.env.OWNER_NAME ?? "FITX Owner";
const ownerEmail = (process.env.OWNER_EMAIL ?? "owner@fitx.pk").toLowerCase();
const ownerPassword = process.env.OWNER_PASSWORD ?? "ChangeMe123!";
const BCRYPT_ROUNDS = 12;

// ---------------------------------------------------------------------------
// Starter content
// ---------------------------------------------------------------------------

const settingsSeed: Array<{ key: string; group: string; value: unknown }> = [
  {
    key: "general",
    group: "general",
    value: {
      businessName: "FITX Personal Fitness Training Studio",
      tagline: "The most premium personal training program",
      address: studio.address,
      phone: studio.phones.join(" / "),
      whatsapp: studio.whatsapp,
      email: "info@fitx.pk",
      openingHours: studio.hoursSummary,
      mapEmbed: "",
      instagram: "",
      facebook: "",
      tiktok: "",
      youtube: "",
      logoLightId: null,
      logoDarkId: null,
      faviconId: null,
      announcementEnabled: false,
      announcementText: "",
      announcementHref: "",
      announcementStartsAt: null,
      announcementEndsAt: null,
      maintenanceMode: false,
    },
  },
  {
    key: "theme",
    group: "theme",
    value: { ...defaultTheme },
  },
  {
    key: "seo",
    group: "seo",
    value: {
      defaultTitle: "FITX Personal Fitness Training Studio | Sahiwal",
      defaultDescription:
        "Boutique personal training studio in Sahiwal offering personal training, boxing, yoga, family sessions and nutrition guidance.",
      ogImageId: null,
      robots: "index,follow",
      googleAnalyticsId: "",
      metaPixelId: "",
    },
  },
  {
    key: "email",
    group: "email",
    value: {
      smtpHost: "",
      smtpPort: 587,
      smtpUser: "",
      smtpPassword: "",
      notifyTo: "info@fitx.pk",
    },
  },
  {
    key: "scripts",
    group: "scripts",
    value: { headScripts: "", bodyScripts: "" },
  },
];

const starterPages: Array<{
  slug: string;
  title: string;
  status: PageStatus;
  isHome?: boolean;
  seoDescription: string;
}> = [
  {
    slug: "home",
    title: "Home",
    status: PageStatus.PUBLISHED,
    isHome: true,
    seoDescription:
      "FITX is Sahiwal's boutique personal training studio — one-on-one coaching, boxing, yoga and nutrition.",
  },
  {
    slug: "who-we-are",
    title: "Who We Are",
    status: PageStatus.PUBLISHED,
    seoDescription: "The story, philosophy and team behind FITX Sahiwal.",
  },
  {
    slug: "services",
    title: "Services",
    status: PageStatus.PUBLISHED,
    seoDescription:
      "Personal training, boxing, group sessions, yoga and nutrition coaching at FITX.",
  },
  {
    slug: "coaches",
    title: "Coaches",
    status: PageStatus.PUBLISHED,
    seoDescription: "Meet the FITX coaching team.",
  },
  {
    slug: "gallery",
    title: "Gallery",
    status: PageStatus.PUBLISHED,
    seoDescription: "Inside FITX — the studio, the sessions and the community.",
  },
  {
    slug: "success-stories",
    title: "Success Stories",
    status: PageStatus.PUBLISHED,
    seoDescription: "What FITX members say about training with us.",
  },
  {
    slug: "plans",
    title: "Plans",
    status: PageStatus.PUBLISHED,
    seoDescription: "Simple membership plans for every training goal.",
  },
  {
    slug: "timetable",
    title: "Timetable",
    status: PageStatus.PUBLISHED,
    seoDescription: "The weekly class schedule at FITX Sahiwal.",
  },
  {
    slug: "contact",
    title: "Contact",
    status: PageStatus.PUBLISHED,
    seoDescription: "Visit or book a consultation at FITX Sahiwal.",
  },
];

/**
 * Home page sections. Field names follow the section registry schemas that will
 * be introduced in Phase 3 (type + content + style). Images stay null until the
 * media library exists in Phase 2.
 */
const homeSections: Array<{
  type: string;
  content: Record<string, unknown>;
  style?: Record<string, unknown>;
}> = [
  {
    type: "hero-slider",
    content: {
      autoplayMs: 6000,
      overlayOpacity: 0.55,
      slides: [
        {
          eyebrow: "Sahiwal · Punjab",
          heading: "The most premium personal training program",
          subheading:
            "One-on-one coaching built around your body, your schedule and your goals.",
          ctaLabel: "Start training",
          ctaHref: "/contact",
          image: "",
        },
        {
          eyebrow: "Train with intent",
          heading: "Strength, boxing, yoga",
          subheading:
            "Every session is programmed and tracked, so progress is never left to chance.",
          ctaLabel: "Meet the coaches",
          ctaHref: "/coaches",
          image: "",
        },
      ],
    },
  },
  {
    type: "feature-cards",
    content: {
      eyebrow: "Why FITX",
      heading: "Programs built around you",
      items: [
        {
          icon: "dumbbell",
          title: "Personal training",
          text: "Private coaching with programming, progress tracking and form correction.",
        },
        {
          icon: "glove",
          title: "Boxing & conditioning",
          text: "Pad work, technique and fight-ready conditioning in a private studio.",
        },
        {
          icon: "lotus",
          title: "Yoga & mobility",
          text: "Recover, move better and reduce injury risk with guided mobility work.",
        },
      ],
    },
  },
  {
    type: "columns",
    content: {
      columns: [
        {
          key: "col-a",
          width: 6,
          blocks: [
            {
              key: "split-a",
              type: "split-content",
              content: {
                eyebrow: "Coaching",
                heading: "A plan, not a guess",
                text: "We assess movement, set measurable targets and adjust your program every few weeks.",
                image: "",
                imageSide: "left",
                bullets: [
                  "Baseline assessment and goal setting",
                  "Progressive, tracked programming",
                  "Nutrition guidance that fits your life",
                ],
                ctaLabel: "Book a consultation",
                ctaHref: "/contact",
              },
            },
          ],
        },
        {
          key: "col-b",
          width: 6,
          blocks: [
            {
              key: "split-b",
              type: "split-content",
              content: {
                eyebrow: "Community",
                heading: "Family-friendly studio",
                text: "Train solo, with a partner, or bring the family — sessions are scheduled around real life.",
                image: "",
                imageSide: "right",
                bullets: [
                  "Private and semi-private sessions",
                  "Women-only and family time slots",
                  "Flexible monthly memberships",
                ],
                ctaLabel: "See membership plans",
                ctaHref: "/services",
              },
            },
          ],
        },
      ],
    },
  },
  {
    type: "testimonials-slider",
    content: {
      eyebrow: "Success stories",
      heading: "What our clients say",
      source: "all",
      items: [],
    },
  },
];

/**
 * Phase 5 starter sections for the rest of the reference site. Each page
 * mirrors the reference structure (PRD §16): a story block, proof/module
 * blocks and a closing call-to-action, with the contact page ending in the
 * contact-information and lead-capture sections. Field names follow the
 * section registry schemas; images are left empty until the owner uploads
 * studio photos in the media library.
 */
const starterPageSections: Record<
  string,
  Array<{ type: string; content: Record<string, unknown>; style?: Record<string, unknown> }>
> = {
  "who-we-are": [
    {
      type: "rich-text",
      content: {
        eyebrow: "Our story",
        heading: "More than a gym",
        showAccentSlash: true,
        align: "left",
        paragraphs: [
          "FITX is a personal training studio in Shadman Town, Sahiwal. Every session is coached one-to-one and programmed around your body, your schedule and your goals.",
          "We keep our studio small on purpose, so every member gets coaching that is personal, honest and results-driven.",
        ],
      },
    },
    {
      type: "stats",
      content: {
        eyebrow: "",
        heading: "By the numbers",
        showAccentSlash: true,
        items: [
          { value: "500+", label: "Clients trained" },
          { value: "10", label: "Years coaching" },
          { value: "5", label: "Disciplines" },
        ],
      },
    },
    {
      type: "feature-cards",
      content: {
        eyebrow: "Why FITX",
        heading: "What makes us different",
        columns: 3,
        items: [
          {
            icon: "dumbbell",
            title: "Personal programming",
            text: "A plan built around your goals, with progress tracked every week.",
          },
          {
            icon: "glove",
            title: "Boxing & conditioning",
            text: "Pad work, footwork and fight-ready conditioning in a private studio.",
          },
          {
            icon: "lotus",
            title: "Yoga & mobility",
            text: "Move better, recover faster and stay injury free.",
          },
        ],
      },
    },
    {
      type: "cta-banner",
      content: {
        eyebrow: "",
        heading: "Start with a consultation",
        text: "Tell us about your goals and we will build the plan to reach them.",
        ctaLabel: "Book a consultation",
        ctaHref: "/contact",
        image: "",
        overlayOpacity: 0.6,
      },
    },
  ],
  services: [
    {
      type: "rich-text",
      content: {
        eyebrow: "Programs",
        heading: "What we do",
        showAccentSlash: true,
        align: "left",
        paragraphs: [
          "From private coaching to group sessions, every program at FITX is coached, tracked and adjusted as you progress.",
        ],
      },
    },
    {
      type: "services-grid",
      content: {
        eyebrow: "Programs",
        heading: "Training, guided",
        showAccentSlash: true,
        source: "all",
        serviceIds: [],
        columns: 3,
      },
    },
    {
      type: "cta-banner",
      content: {
        eyebrow: "",
        heading: "Not sure where to start?",
        text: "Book a free consultation and we will point you in the right direction.",
        ctaLabel: "Book a consultation",
        ctaHref: "/contact",
        image: "",
        overlayOpacity: 0.6,
      },
    },
  ],
  coaches: [
    {
      type: "rich-text",
      content: {
        eyebrow: "Meet the team",
        heading: "Your coaches",
        showAccentSlash: true,
        align: "left",
        paragraphs: [
          "Every FITX coach is a specialist in their discipline and certified to coach. Here is who you will be training with.",
        ],
      },
    },
    {
      type: "trainers-grid",
      content: {
        eyebrow: "Our coaches",
        heading: "Train with the best",
        showAccentSlash: true,
        source: "all",
        trainerIds: [],
      },
    },
  ],
  gallery: [
    {
      type: "rich-text",
      content: {
        eyebrow: "Gallery",
        heading: "Inside FITX",
        showAccentSlash: true,
        align: "left",
        paragraphs: [
          "The studio, the sessions and the community — straight from the floor.",
        ],
      },
    },
    {
      type: "gallery",
      content: {
        eyebrow: "Gallery",
        heading: "Inside the studio",
        showAccentSlash: true,
        layout: "grid",
        source: "all",
        itemIds: [],
        images: [],
      },
    },
  ],
  "success-stories": [
    {
      type: "rich-text",
      content: {
        eyebrow: "Success stories",
        heading: "Real results",
        showAccentSlash: true,
        align: "left",
        paragraphs: [
          "Our members put in the work; we keep them honest. Here is what they say about training at FITX.",
        ],
      },
    },
    {
      type: "testimonials-slider",
      content: {
        eyebrow: "Success stories",
        heading: "What our clients say",
        showAccentSlash: true,
        source: "all",
        items: [],
        autoplayMs: 5000,
        dots: true,
      },
    },
  ],
  plans: [
    {
      type: "rich-text",
      content: {
        eyebrow: "Plans",
        heading: "Fees",
        showAccentSlash: true,
        align: "left",
        paragraphs: [
          "Group or one-to-one coaching, with body-composition progress tracking. Three-month packages save 10%.",
        ],
      },
    },
    {
      type: "plans",
      content: {
        eyebrow: "Plans",
        heading: "Membership plans",
        showAccentSlash: true,
        source: "all",
        planIds: [],
      },
    },
  ],
  timetable: [
    {
      type: "rich-text",
      content: {
        eyebrow: "Weekly schedule",
        heading: "Session timings",
        showAccentSlash: true,
        align: "left",
        paragraphs: [
          "Separate male and female sessions, plus a Family Hour where the whole family can train together.",
        ],
      },
    },
    {
      type: "timetable",
      content: {
        eyebrow: "Weekly schedule",
        heading: "Class timetable",
        showAccentSlash: true,
        days: [],
      },
    },
  ],
  contact: [
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
    },
    {
      type: "lead-form",
      content: {
        eyebrow: "Book a consultation",
        heading: "Start your journey",
        showAccentSlash: true,
        text: "Tell us your goal and we will get back to you with the next available session.",
        submitLabel: "Send message",
      },
    },
  ],
};

const servicesSeed = [
  {
    slug: "personal-training",
    title: "Personal Training",
    shortDescription: "One-on-one coaching programmed around your goals.",
    sortOrder: 1,
  },
  {
    slug: "boxing-conditioning",
    title: "Boxing & Conditioning",
    shortDescription: "Technique, pad work and fight-ready conditioning.",
    sortOrder: 2,
  },
  {
    slug: "group-training",
    title: "Group Training",
    shortDescription: "Small-group sessions with big accountability.",
    sortOrder: 3,
  },
  {
    slug: "yoga-mobility",
    title: "Yoga & Mobility",
    shortDescription: "Move better, recover faster, stay injury free.",
    sortOrder: 4,
  },
  {
    slug: "nutrition-coaching",
    title: "Nutrition Coaching",
    shortDescription: "Sustainable eating plans that fit your routine.",
    sortOrder: 5,
  },
];

// Coaches as published by the studio (src/lib/fitx/knowledge.ts). Specialties
// and certifications are left empty until the studio confirms them.
const trainersSeed = coaches.map((member, index) => ({
  slug: member.slug,
  name: member.name,
  title: member.role,
  bio: member.bio || null,
  specialties: member.focus ?? [],
  certifications: member.credentials ?? [],
  sortOrder: index + 1,
}));

// The studio's Google reviews, word for word (src/lib/fitx/reviews.ts). Star
// ratings were not supplied, so none are stored.
const testimonialsSeed = googleReviews.map((review, index) => ({
  name: review.name,
  quote: review.text,
  rating: null,
  sortOrder: index + 1,
}));

// Fees and timings come from the studio's approved knowledge base
// (src/lib/fitx/knowledge.ts) so the site, chatbot and seed never disagree.
const plansSeed = fees.map((fee, index) => ({
  name: fee.name,
  price: String(fee.monthly),
  billingPeriod: "per month",
  features: fee.features,
  isHighlighted: fee.highlighted,
  sortOrder: index + 1,
}));

// No weekly class grid yet: the timetable page shows the session timings from
// the knowledge base until real classes are added in the admin.
const timetableSeed: Array<{
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  title: string;
  sortOrder: number;
}> = [];

// ---------------------------------------------------------------------------
// Seed steps
// ---------------------------------------------------------------------------

async function seedOwner(): Promise<void> {
  const existing = await prisma.user.findUnique({
    where: { email: ownerEmail },
  });

  if (existing) {
    await prisma.user.update({
      where: { id: existing.id },
      data: { name: ownerName, role: Role.OWNER, isActive: true },
    });
    console.info(
      `• Owner already exists: ${ownerEmail} (password left unchanged)`,
    );
    return;
  }

  await prisma.user.create({
    data: {
      name: ownerName,
      email: ownerEmail,
      role: Role.OWNER,
      passwordHash: await bcrypt.hash(ownerPassword, BCRYPT_ROUNDS),
    },
  });
  console.info(`• Created owner: ${ownerEmail}`);
}

async function seedSettings(): Promise<void> {
  for (const setting of settingsSeed) {
    await prisma.setting.upsert({
      where: { key: setting.key },
      update: {},
      create: {
        key: setting.key,
        group: setting.group,
        value: setting.value as never,
      },
    });
  }
  console.info(`• Settings ready (${settingsSeed.length} keys)`);
}

async function seedPages(): Promise<Record<string, string>> {
  const ids: Record<string, string> = {};

  for (const page of starterPages) {
    const existing = await prisma.page.findUnique({
      where: { slug: page.slug },
    });

    if (existing) {
      ids[page.slug] = existing.id;
      continue;
    }

    const created = await prisma.page.create({
      data: {
        title: page.title,
        slug: page.slug,
        status: page.status,
        isHome: page.isHome ?? false,
        seoTitle: page.title,
        seoDescription: page.seoDescription,
        publishedAt: page.status === PageStatus.PUBLISHED ? new Date() : null,
      },
    });
    ids[page.slug] = created.id;
  }

  console.info(`• Pages ready (${Object.keys(ids).length})`);
  return ids;
}

async function seedPageSections(
  pageId: string,
  sections: Array<{
    type: string;
    content: Record<string, unknown>;
    style?: Record<string, unknown>;
  }>,
  pageSlug: string,
): Promise<void> {
  const existing = await prisma.section.count({ where: { pageId } });
  if (existing > 0) {
    console.info(`• ${pageSlug} page already has sections (left untouched)`);
    return;
  }

  await prisma.section.createMany({
    data: sections.map((section, index) => ({
      pageId,
      type: section.type,
      sortOrder: index,
      content: section.content as never,
      style: (section.style ?? {}) as never,
      isVisible: true,
    })),
  });
  console.info(`• ${pageSlug} page sections created (${sections.length})`);
}

async function seedStarterSections(pageIds: Record<string, string>): Promise<void> {
  for (const [slug, sections] of Object.entries(starterPageSections)) {
    const pageId = pageIds[slug];
    if (!pageId) continue;
    await seedPageSections(pageId, sections, slug);
  }
}

async function seedMenu(pageIds: Record<string, string>): Promise<void> {
  const existing = await prisma.menuItem.count();
  if (existing > 0) {
    console.info("• Menu already configured (left untouched)");
    return;
  }

  // PRD §16.2 menu: Home, Who We Are, What We Do (dropdown of the five
  // services), Gallery, Success Stories, Contact Us.
  const header: Array<{
    label: string;
    sortOrder: number;
    linkType: LinkType;
    pageSlug?: string;
    href?: string;
    children?: Array<{ label: string; href: string }>;
  }> = [
    { label: "Home", sortOrder: 1, linkType: LinkType.PAGE, pageSlug: "home" },
    {
      label: "Who We Are",
      sortOrder: 2,
      linkType: LinkType.PAGE,
      pageSlug: "who-we-are",
    },
    {
      label: "What We Do",
      sortOrder: 3,
      linkType: LinkType.PAGE,
      pageSlug: "services",
      children: servicesSeed.map((service) => ({
        label: service.title,
        href: `/services/${service.slug}`,
      })),
    },
    {
      label: "Gallery",
      sortOrder: 4,
      linkType: LinkType.PAGE,
      pageSlug: "gallery",
    },
    {
      label: "Success Stories",
      sortOrder: 5,
      linkType: LinkType.PAGE,
      pageSlug: "success-stories",
    },
    {
      label: "Contact Us",
      sortOrder: 6,
      linkType: LinkType.PAGE,
      pageSlug: "contact",
    },
  ];

  for (const menu of [MenuLocation.HEADER, MenuLocation.FOOTER]) {
    for (const item of header) {
      const parent = await prisma.menuItem.create({
        data: {
          menu,
          label: item.label,
          linkType: item.linkType,
          pageId: item.pageSlug ? pageIds[item.pageSlug] ?? null : null,
          url: item.href ?? null,
          sortOrder: item.sortOrder,
          newTab: false,
        },
      });

      if (item.children && menu === MenuLocation.HEADER) {
        await prisma.menuItem.createMany({
          data: item.children.map((child, index) => ({
            menu,
            label: child.label,
            linkType: LinkType.URL,
            url: child.href,
            parentId: parent.id,
            sortOrder: index + 1,
            newTab: false,
          })),
        });
      }
    }
  }

  console.info("• Header and footer menus created (What We Do dropdown included)");
}

async function seedContentModules(): Promise<void> {
  for (const service of servicesSeed) {
    await prisma.service.upsert({
      where: { slug: service.slug },
      update: {},
      create: {
        slug: service.slug,
        title: service.title,
        shortDescription: service.shortDescription,
        sortOrder: service.sortOrder,
        isPublished: true,
      },
    });
  }

  for (const trainer of trainersSeed) {
    await prisma.trainer.upsert({
      where: { slug: trainer.slug },
      update: {},
      create: {
        slug: trainer.slug,
        name: trainer.name,
        title: trainer.title,
        bio: trainer.bio,
        specialties: trainer.specialties as never,
        certifications: trainer.certifications as never,
        sortOrder: trainer.sortOrder,
        isPublished: true,
      },
    });
  }

  const [testimonials, plans, timetable] = await Promise.all([
    prisma.testimonial.count(),
    prisma.plan.count(),
    prisma.timetableEntry.count(),
  ]);

  if (testimonials === 0 && testimonialsSeed.length > 0) {
    await prisma.testimonial.createMany({
      data: testimonialsSeed.map((item) => ({ ...item, isPublished: true })),
    });
  }
  if (plans === 0) {
    await prisma.plan.createMany({
      data: plansSeed.map((item) => ({ ...item, isPublished: true })),
    });
  }
  if (timetable === 0 && timetableSeed.length > 0) {
    await prisma.timetableEntry.createMany({
      data: timetableSeed.map((item) => ({ ...item, isPublished: true })),
    });
  }

  console.info(
    "• Content modules ready (services, trainers, testimonials, plans, timetable)",
  );
}

async function main(): Promise<void> {
  console.info("Seeding FITX database…");
  await seedOwner();
  await seedSettings();
  const pageIds = await seedPages();
  await seedPageSections(pageIds.home, homeSections, "home");
  await seedStarterSections(pageIds);
  await seedMenu(pageIds);
  await seedContentModules();
  console.info("Seed complete.");
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
