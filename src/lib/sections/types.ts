/**
 * Section (block) registry — single source of truth (PRD §6, §15.4).
 *
 * A section is stored as `type` (plain String) + `content` (JSON) + `style`
 * (JSON). This module defines the schema, defaults and human-facing metadata
 * for every block type. The admin form for a type lives in
 * `src/components/sections/forms.tsx` (client) and the public renderer in
 * `src/components/sections/renderers.tsx` (server). Adding a new block type
 * needs only: a Zod schema + defaults here, a form definition and a renderer —
 * never a database migration.
 *
 * Content objects are validated with `z.looseObject`, so unknown keys are kept:
 * a newer admin may persist fields an older schema does not know about yet, and
 * we must not throw them away on the next save.
 */
import { z } from "zod";

// ---------------------------------------------------------------------------
// Small shared value builders
// ---------------------------------------------------------------------------

/** Optional free-text field: empty string or a trimmed short string. */
const optStr = (max: number) =>
  z.union([z.string().trim().max(max), z.literal("")]).optional();

/** A media-library id, or "" for "none". */
const mediaId = () =>
  z.union([z.string().trim().max(120), z.literal("")]).optional();

const safeHref = z
  .string()
  .max(500)
  .refine((value) => !/^\s*javascript:/i.test(value), {
    message: "That link is not allowed.",
  });

/** A link target; "" hides the button/link. */
const hrefOrEmpty = z.union([z.literal(""), safeHref]).optional();

const boolDefault = (value: boolean) => z.boolean().default(value);

// ---------------------------------------------------------------------------
// Heading + style fragments
// ---------------------------------------------------------------------------

/** Eyebrow + heading + optional orange slash — the shared reference heading. */
// (Kept out of the registry schemas: those inline their heading fields.)

/** Per-section styling (PRD "per-section styling" in the builder). */
export const sectionStyleSchema = z.looseObject({
  background: z
    .union([z.string().trim().max(40), z.literal("")])
    .optional()
    .default(""),
  textColor: z
    .union([z.string().trim().max(40), z.literal("")])
    .optional()
    .default(""),
  paddingY: z.enum(["none", "sm", "md", "lg"]).default("md"),
  maxWidth: z.enum(["narrow", "default", "wide"]).default("default"),
});

export type SectionStyle = z.infer<typeof sectionStyleSchema>;

/** Parsing `{}` yields every defaulted style field — used when style is absent. */
const sectionStyleDefault = sectionStyleSchema.parse({});

// ---------------------------------------------------------------------------
// Per-type content schemas (PRD §6 + §16.4)
// ---------------------------------------------------------------------------

const heroSlide = z.looseObject({
  image: mediaId(),
  logoImage: mediaId(),
  eyebrow: optStr(120),
  heading: optStr(240),
  subheading: optStr(400),
  ctaLabel: optStr(80),
  ctaHref: hrefOrEmpty,
  ctaPosition: z.enum(["right", "center"]).default("right"),
});

const heroSliderSchema = z.looseObject({
  autoplayMs: z.number().int().min(0).max(30000).default(6000),
  overlayOpacity: z.number().min(0).max(1).default(0.55),
  height: z.enum(["full", "short"]).default("full"),
  arrows: boolDefault(true),
  dots: boolDefault(true),
  slides: z.array(heroSlide).min(1).max(12),
});

const featureCard = z.looseObject({
  icon: z
    .enum([
      "none",
      "dumbbell",
      "glove",
      "lotus",
      "heart",
      "shield",
      "star",
      "flame",
    ])
    .default("none"),
  eyebrow: optStr(80),
  title: optStr(120),
  text: optStr(500),
  link: hrefOrEmpty,
  image: mediaId(),
});

const featureCardsSchema = z.looseObject({
  eyebrow: optStr(120),
  heading: optStr(200),
  columns: z.number().int().min(2).max(4).default(3),
  items: z.array(featureCard).min(1).max(12),
});

const splitContentSchema = z.looseObject({
  eyebrow: optStr(120),
  heading: optStr(200),
  showAccentSlash: boolDefault(true),
  lead: optStr(300),
  text: optStr(4000),
  bullets: z.array(optStr(300)).max(20).default([]),
  image: mediaId(),
  imageAlt: optStr(300),
  imageSide: z.enum(["left", "right"]).default("left"),
  ctaLabel: optStr(80),
  ctaHref: hrefOrEmpty,
});

/** A block nested inside a Columns wrapper. */
const nestedBlockSchema = z.looseObject({
  key: z.string().trim().max(60).optional().default(""),
  type: z.string().trim().min(1).max(60),
  content: z.looseObject({}).default({}),
  style: sectionStyleSchema.optional(),
  isVisible: boolDefault(true),
});

const columnsColumnSchema = z.looseObject({
  key: z.string().trim().max(60).optional().default(""),
  width: z.number().int().min(1).max(12).default(6),
  blocks: z.array(nestedBlockSchema).max(8).default([]),
});

const columnsSchema = z.looseObject({
  columns: z.array(columnsColumnSchema).min(1).max(4),
});

const testimonialItem = z.looseObject({
  name: optStr(120),
  quote: optStr(1000),
  rating: z.number().int().min(1).max(5).default(5),
  photo: mediaId(),
});

const testimonialsSliderSchema = z.looseObject({
  eyebrow: optStr(120),
  heading: optStr(200),
  showAccentSlash: boolDefault(true),
  source: z.enum(["all", "selection"]).default("all"),
  items: z.array(testimonialItem).max(30).default([]),
  autoplayMs: z.number().int().min(0).max(30000).default(5000),
  dots: boolDefault(true),
});

const richTextSchema = z.looseObject({
  eyebrow: optStr(120),
  heading: optStr(200),
  showAccentSlash: boolDefault(true),
  align: z.enum(["left", "center"]).default("left"),
  paragraphs: z.array(z.string().trim().max(6000)).min(1).max(20),
});

const servicesGridSchema = z.looseObject({
  eyebrow: optStr(120),
  heading: optStr(200),
  showAccentSlash: boolDefault(true),
  source: z.enum(["all", "selection"]).default("all"),
  serviceIds: z.array(z.string().trim().min(1).max(120)).max(40).default([]),
  columns: z.number().int().min(1).max(4).default(3),
});

const trainersGridSchema = z.looseObject({
  eyebrow: optStr(120),
  heading: optStr(200),
  showAccentSlash: boolDefault(true),
  source: z.enum(["all", "selection"]).default("all"),
  trainerIds: z.array(z.string().trim().min(1).max(120)).max(40).default([]),
});

const plansSchema = z.looseObject({
  eyebrow: optStr(120),
  heading: optStr(200),
  showAccentSlash: boolDefault(true),
  source: z.enum(["all", "selection"]).default("all"),
  planIds: z.array(z.string().trim().min(1).max(120)).max(20).default([]),
});

const galleryImageSchema = z.looseObject({
  image: mediaId().refine(
    (value) => value !== "" && value !== undefined,
    "Pick an image for every gallery slide.",
  ),
  caption: optStr(200),
  link: hrefOrEmpty,
});

/**
 * Gallery source (Phase 4): "all" / "selection" pull from the gallery module;
 * images kept for hand-picked sections and legacy content. An explicit source
 * of "" means "hand-picked images in `images`" (legacy representation).
 */
const gallerySchema = z.looseObject({
  eyebrow: optStr(120),
  heading: optStr(200),
  showAccentSlash: boolDefault(true),
  layout: z.enum(["grid", "masonry"]).default("grid"),
  source: z.enum(["all", "selection"]).optional(),
  itemIds: z.array(z.string().trim().min(1).max(120)).max(60).default([]),
  images: z.array(galleryImageSchema).max(60).default([]),
});

/** Contact / consultation lead-capture block (Phase 4). */
const leadFormSchema = z.looseObject({
  eyebrow: optStr(120),
  heading: optStr(200),
  showAccentSlash: boolDefault(true),
  text: optStr(1000),
  submitLabel: optStr(80),
});

const statItemSchema = z.looseObject({
  value: optStr(40),
  label: optStr(120),
});

const statsSchema = z.looseObject({
  eyebrow: optStr(120),
  heading: optStr(200),
  showAccentSlash: boolDefault(true),
  items: z.array(statItemSchema).min(1).max(8),
});

const ctaBannerSchema = z.looseObject({
  eyebrow: optStr(120),
  heading: optStr(200),
  text: optStr(500),
  ctaLabel: optStr(80),
  ctaHref: hrefOrEmpty,
  image: mediaId(),
  overlayOpacity: z.number().min(0).max(1).default(0.6),
});

const faqItemSchema = z.looseObject({
  question: optStr(300),
  answer: optStr(4000),
});

const faqSchema = z.looseObject({
  eyebrow: optStr(120),
  heading: optStr(200),
  showAccentSlash: boolDefault(true),
  items: z.array(faqItemSchema).min(1).max(20),
});

const videoSchema = z.looseObject({
  eyebrow: optStr(120),
  heading: optStr(200),
  // Empty is allowed so a freshly added block can be saved as a draft; the
  // renderer simply shows nothing until a URL is entered.
  url: optStr(500),
  poster: mediaId(),
  caption: optStr(300),
});

const bannerImageSchema = z.looseObject({
  // Empty image is allowed for draft saves; the renderer shows a placeholder.
  image: mediaId(),
  caption: optStr(300),
  link: hrefOrEmpty,
});

const imageBannerSchema = z.looseObject({
  images: z.array(bannerImageSchema).min(1).max(10),
  autoplayMs: z.number().int().min(0).max(30000).default(5000),
  height: z.enum(["auto", "short", "tall"]).default("auto"),
});

const spacerSchema = z.looseObject({
  height: z.number().int().min(8).max(320).default(64),
  showLine: boolDefault(false),
});

/**
 * Weekly class timetable (Phase 5): pulls published entries from the timetable
 * module and groups them by day. `days` is an optional whitelist of weekdays
 * (0 = Sunday … 6 = Saturday); an empty/absent array means every day.
 */
const timetableSchema = z.looseObject({
  eyebrow: optStr(120),
  heading: optStr(200),
  showAccentSlash: boolDefault(true),
  days: z.array(z.number().int().min(0).max(6)).max(7).optional(),
});

/**
 * Contact information block (PRD §6 "Map + Contact Info"): renders the address,
 * phone, WhatsApp, email, opening hours and map embed from the global general
 * settings. The toggles let an editor hide individual rows on a given page.
 */
const contactInfoSchema = z.looseObject({
  eyebrow: optStr(120),
  heading: optStr(200),
  showAccentSlash: boolDefault(true),
  text: optStr(1000),
  showAddress: boolDefault(true),
  showPhone: boolDefault(true),
  showWhatsapp: boolDefault(true),
  showEmail: boolDefault(true),
  showHours: boolDefault(true),
  showMap: boolDefault(true),
});

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

export const SECTION_TYPES = [
  "hero-slider",
  "feature-cards",
  "columns",
  "split-content",
  "rich-text",
  "services-grid",
  "trainers-grid",
  "plans",
  "gallery",
  "timetable",
  "testimonials-slider",
  "stats",
  "cta-banner",
  "faq",
  "video",
  "image-banner",
  "spacer",
  "lead-form",
  "contact-info",
] as const;

export type SectionTypeValue = (typeof SECTION_TYPES)[number];

export type SectionGroup =
  | "Layout"
  | "Hero & banners"
  | "Text & media"
  | "Lists & proof"
  | "Modules"
  | "Utilities";

export type SectionMeta = {
  type: SectionTypeValue;
  label: string;
  description: string;
  group: SectionGroup;
  /** Layout wrappers render other blocks and cannot appear on their own. */
  isLayout?: boolean;
  /** May this type sit inside a Columns wrapper? */
  nestable: boolean;
};

export const SECTION_REGISTRY: Record<SectionTypeValue, SectionMeta> = {
  "hero-slider": {
    type: "hero-slider",
    label: "Hero slider",
    description: "Full-width photo slides with headline and button.",
    group: "Hero & banners",
    nestable: false,
  },
  "image-banner": {
    type: "image-banner",
    label: "Image banner",
    description: "Auto-rotating images with caption and optional link.",
    group: "Hero & banners",
    nestable: true,
  },
  "cta-banner": {
    type: "cta-banner",
    label: "CTA banner",
    description: "Full-width call to action over a background image.",
    group: "Hero & banners",
    nestable: true,
  },
  columns: {
    type: "columns",
    label: "Columns",
    description: "1–4 columns, each holding other blocks.",
    group: "Layout",
    isLayout: true,
    nestable: false,
  },
  "split-content": {
    type: "split-content",
    label: "Split content",
    description: "Text and image side by side, with bullets and a button.",
    group: "Text & media",
    nestable: true,
  },
  "rich-text": {
    type: "rich-text",
    label: "Rich text",
    description: "Heading and paragraphs of body text.",
    group: "Text & media",
    nestable: true,
  },
  video: {
    type: "video",
    label: "Video",
    description: "YouTube, Vimeo or direct .mp4 embed with a poster.",
    group: "Text & media",
    nestable: true,
  },
  "feature-cards": {
    type: "feature-cards",
    label: "Feature cards",
    description: "Cards with an icon or photo, title and text.",
    group: "Lists & proof",
    nestable: false,
  },
  stats: {
    type: "stats",
    label: "Stats / counters",
    description: "A row of big numbers with labels.",
    group: "Lists & proof",
    nestable: true,
  },
  "testimonials-slider": {
    type: "testimonials-slider",
    label: "Testimonials slider",
    description: "Rotating client quotes, from the module or hand-picked.",
    group: "Lists & proof",
    nestable: false,
  },
  faq: {
    type: "faq",
    label: "FAQ accordion",
    description: "Expandable questions and answers.",
    group: "Lists & proof",
    nestable: true,
  },
  "services-grid": {
    type: "services-grid",
    label: "Services grid",
    description:
      "Cards from the Services module. Good with a page list layout.",
    group: "Modules",
    nestable: false,
  },
  "trainers-grid": {
    type: "trainers-grid",
    label: "Trainers showcase",
    description: "Coach cards from the Trainers module.",
    group: "Modules",
    nestable: false,
  },
  plans: {
    type: "plans",
    label: "Plans / pricing",
    description: "Membership plan cards from the Plans module.",
    group: "Modules",
    nestable: false,
  },
  gallery: {
    type: "gallery",
    label: "Gallery",
    description: "A grid of hand-picked images with optional captions.",
    group: "Modules",
    nestable: false,
  },
  timetable: {
    type: "timetable",
    label: "Class timetable",
    description: "The weekly class schedule from the Timetable module.",
    group: "Modules",
    nestable: false,
  },
  "lead-form": {
    type: "lead-form",
    label: "Contact / lead form",
    description: "A consultation form that saves enquiries to the Leads inbox.",
    group: "Modules",
    nestable: true,
  },
  "contact-info": {
    type: "contact-info",
    label: "Contact information",
    description:
      "Address, phone, WhatsApp, email, opening hours and map from Settings.",
    group: "Modules",
    nestable: true,
  },
  spacer: {
    type: "spacer",
    label: "Spacer / divider",
    description: "Vertical breathing room, optionally with a line.",
    group: "Utilities",
    nestable: true,
  },
};

export const SECTION_SCHEMAS: Record<SectionTypeValue, z.ZodType> = {
  "hero-slider": heroSliderSchema,
  "feature-cards": featureCardsSchema,
  columns: columnsSchema,
  "split-content": splitContentSchema,
  "rich-text": richTextSchema,
  "services-grid": servicesGridSchema,
  "trainers-grid": trainersGridSchema,
  plans: plansSchema,
  gallery: gallerySchema,
  timetable: timetableSchema,
  "testimonials-slider": testimonialsSliderSchema,
  stats: statsSchema,
  "cta-banner": ctaBannerSchema,
  faq: faqSchema,
  video: videoSchema,
  "image-banner": imageBannerSchema,
  spacer: spacerSchema,
  "lead-form": leadFormSchema,
  "contact-info": contactInfoSchema,
};

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

export function sectionDefaults(
  type: SectionTypeValue,
): Record<string, unknown> {
  switch (type) {
    case "hero-slider":
      return {
        autoplayMs: 6000,
        overlayOpacity: 0.55,
        height: "full",
        arrows: true,
        dots: true,
        slides: [
          {
            image: "",
            logoImage: "",
            eyebrow: "",
            heading: "A striking headline",
            subheading: "",
            ctaLabel: "Start now",
            ctaHref: "/contact",
            ctaPosition: "right",
          },
        ],
      };
    case "feature-cards":
      return {
        eyebrow: "Why FITX",
        heading: "Programs built around you",
        columns: 3,
        items: [
          {
            icon: "dumbbell",
            eyebrow: "",
            title: "Personal training",
            text: "",
            link: "",
            image: "",
          },
          {
            icon: "glove",
            eyebrow: "",
            title: "Boxing & conditioning",
            text: "",
            link: "",
            image: "",
          },
          {
            icon: "lotus",
            eyebrow: "",
            title: "Yoga & mobility",
            text: "",
            link: "",
            image: "",
          },
        ],
      };
    case "columns":
      return {
        columns: [
          {
            key: "col-a",
            width: 6,
            blocks: [],
          },
          {
            key: "col-b",
            width: 6,
            blocks: [],
          },
        ],
      };
    case "split-content":
      return {
        eyebrow: "Eyebrow",
        heading: "A heading",
        showAccentSlash: true,
        lead: "",
        text: "",
        bullets: [],
        image: "",
        imageAlt: "",
        imageSide: "left",
        ctaLabel: "",
        ctaHref: "",
      };
    case "rich-text":
      return {
        eyebrow: "",
        heading: "A heading",
        showAccentSlash: true,
        align: "left",
        paragraphs: ["Write your paragraph here."],
      };
    case "services-grid":
      return {
        eyebrow: "",
        heading: "What we do",
        showAccentSlash: true,
        source: "all",
        serviceIds: [],
        columns: 3,
      };
    case "trainers-grid":
      return {
        eyebrow: "",
        heading: "Our coaches",
        showAccentSlash: true,
        source: "all",
        trainerIds: [],
      };
    case "plans":
      return {
        eyebrow: "",
        heading: "Membership plans",
        showAccentSlash: true,
        source: "all",
        planIds: [],
      };
    case "gallery":
      return {
        eyebrow: "",
        heading: "Gallery",
        showAccentSlash: true,
        layout: "grid",
        itemIds: [],
        images: [],
      };
    case "timetable":
      return {
        eyebrow: "Weekly schedule",
        heading: "Class timetable",
        showAccentSlash: true,
        days: [],
      };
    case "testimonials-slider":
      return {
        eyebrow: "Success stories",
        heading: "What our clients say",
        showAccentSlash: true,
        source: "all",
        items: [],
        autoplayMs: 5000,
        dots: true,
      };
    case "stats":
      return {
        eyebrow: "",
        heading: "By the numbers",
        showAccentSlash: true,
        items: [
          { value: "500+", label: "Clients trained" },
          { value: "10", label: "Years coaching" },
          { value: "5", label: "Disciplines" },
        ],
      };
    case "cta-banner":
      return {
        eyebrow: "",
        heading: "Start your journey",
        text: "",
        ctaLabel: "Join now",
        ctaHref: "/contact",
        image: "",
        overlayOpacity: 0.6,
      };
    case "faq":
      return {
        eyebrow: "FAQ",
        heading: "Common questions",
        showAccentSlash: true,
        items: [{ question: "A question?", answer: "An answer." }],
      };
    case "video":
      return { eyebrow: "", heading: "", url: "", poster: "", caption: "" };
    case "image-banner":
      return {
        images: [{ image: "", caption: "", link: "" }],
        autoplayMs: 5000,
        height: "auto",
      };
    case "spacer":
      return { height: 64, showLine: false };
    case "lead-form":
      return {
        eyebrow: "Book a consultation",
        heading: "Start your journey",
        showAccentSlash: true,
        text: "Tell us your goal and we'll get back to you with the next available session.",
        submitLabel: "Send message",
      };
    case "contact-info":
      return {
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
      };
  }
}

// ---------------------------------------------------------------------------
// Reading helpers for renderers (content arrives as unknown JSON)
// ---------------------------------------------------------------------------

export const pickStr = (
  value: Record<string, unknown>,
  key: string,
  fallback = "",
): string => {
  const entry = value[key];
  if (typeof entry === "string") return entry;
  if (typeof entry === "number") return String(entry);
  return fallback;
};

export const pickBool = (
  value: Record<string, unknown>,
  key: string,
  fallback: boolean,
): boolean => {
  const entry = value[key];
  return typeof entry === "boolean" ? entry : fallback;
};

export const pickNum = (
  value: Record<string, unknown>,
  key: string,
  fallback: number,
): number => {
  const entry = value[key];
  if (typeof entry === "number" && Number.isFinite(entry)) return entry;
  if (typeof entry === "string" && entry.trim() !== "") {
    const parsed = Number(entry);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
};

export const pickArr = (
  value: Record<string, unknown>,
  key: string,
): unknown[] => (Array.isArray(value[key]) ? (value[key] as unknown[]) : []);

export const pickObj = (
  value: Record<string, unknown>,
  key: string,
): Record<string, unknown> => {
  const entry = value[key];
  return entry && typeof entry === "object" && !Array.isArray(entry)
    ? (entry as Record<string, unknown>)
    : {};
};

// ---------------------------------------------------------------------------
// Draft validation (used by the save server action)
// ---------------------------------------------------------------------------

export type VisibilityDevices = "all" | "desktop" | "mobile";

export type ValidatedDraftSection = {
  key?: string;
  type: SectionTypeValue;
  content: Record<string, unknown>;
  style: Record<string, unknown>;
  isVisible: boolean;
  visibilityDevices: VisibilityDevices;
};

export type DraftValidation =
  | { ok: true; sections: ValidatedDraftSection[] }
  | { ok: false; error: string };

const draftSectionSchema = z.looseObject({
  key: z.string().trim().max(60).optional().default(""),
  type: z.string().trim().min(1).max(60),
  content: z.looseObject({}).default({}),
  style: sectionStyleSchema.optional(),
  isVisible: boolDefault(true),
  visibilityDevices: z.enum(["all", "desktop", "mobile"]).default("all"),
});

/**
 * Validate an array of draft sections (as submitted by the builder). Rejects
 * unknown types, invalid content, layout-inside-layout nesting and non-nestable
 * blocks inside Columns. Returns normalized sections safe to persist.
 */
export function validateDraftSections(raw: unknown): DraftValidation {
  if (!Array.isArray(raw)) {
    return {
      ok: false,
      error: "The section data is not a list. Reload and retry.",
    };
  }
  if (raw.length > 80) {
    return { ok: false, error: "A page can contain at most 80 sections." };
  }

  const sections: ValidatedDraftSection[] = [];
  for (const entry of raw) {
    const parsedShape = draftSectionSchema.safeParse(entry);
    if (!parsedShape.success) {
      return {
        ok: false,
        error: `One of the sections is malformed (${firstIssue(parsedShape.error)}).`,
      };
    }
    const shape = parsedShape.data;
    const meta = sectionMetaFor(shape.type);
    if (!meta) {
      return { ok: false, error: `Unknown section type "${shape.type}".` };
    }

    const contentResult = validateContent(shape.type, shape.content);
    if (!contentResult.ok) return contentResult;

    sections.push({
      key: shape.key || undefined,
      type: shape.type as SectionTypeValue,
      content: contentResult.data,
      style: shape.style ?? sectionStyleDefault,
      isVisible: shape.isVisible,
      visibilityDevices: shape.visibilityDevices as VisibilityDevices,
    });
  }

  return { ok: true, sections };
}

function firstIssue(error: z.ZodError): string {
  const issue = error.issues[0];
  if (!issue) return "invalid data";
  const path = issue.path.length > 0 ? ` at "${issue.path.join(".")}"` : "";
  return `${issue.message}${path}`;
}

/**
 * Validate a type's content object against its registry schema, recursing into
 * nested blocks for the Columns wrapper.
 */
function validateContent(
  type: string,
  content: Record<string, unknown>,
): { ok: true; data: Record<string, unknown> } | { ok: false; error: string } {
  const schema = SECTION_SCHEMAS[type as SectionTypeValue];
  if (!schema) return { ok: false, error: `Unknown section type "${type}".` };

  const parsed = schema.safeParse(content ?? {});
  if (!parsed.success) {
    const label = sectionMetaFor(type)?.label ?? type;
    return {
      ok: false,
      error: `The "${label}" section has invalid content (${firstIssue(parsed.error)}).`,
    };
  }

  if (type === "columns") {
    const data = parsed.data as { columns?: Array<{ blocks?: unknown[] }> };
    const columns = data.columns ?? [];
    for (const column of columns) {
      for (const block of column.blocks ?? []) {
        const nestedShape = nestedBlockSchema.safeParse(block);
        if (!nestedShape.success) {
          return {
            ok: false,
            error: `A block inside Columns is malformed (${firstIssue(nestedShape.error)}).`,
          };
        }
        const nested = nestedShape.data;
        const nestedMeta = sectionMetaFor(nested.type);
        if (!nestedMeta) {
          return {
            ok: false,
            error: `Unknown block type "${nested.type}" inside Columns.`,
          };
        }
        if (nestedMeta.isLayout || !nestedMeta.nestable) {
          return {
            ok: false,
            error: `"${nestedMeta.label}" cannot be placed inside Columns.`,
          };
        }
        const nestedResult = validateContent(nested.type, nested.content ?? {});
        if (!nestedResult.ok) return nestedResult;
      }
    }
  }

  return { ok: true, data: parsed.data as Record<string, unknown> };
}

/** Registry lookup tolerant of unknown/legacy type strings. */
export function sectionMetaFor(type: string): SectionMeta | null {
  return SECTION_REGISTRY[type as SectionTypeValue] ?? null;
}
