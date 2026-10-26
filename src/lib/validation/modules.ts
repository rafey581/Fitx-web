/**
 * Zod validation for the content modules (trainers, services, plans,
 * testimonials, gallery, timetable) and leads — Phase 4 (PRD §5.6, §5.7).
 *
 * Every admin action and the public lead form validate through these schemas;
 * field names here are the canonical FormData names used by the admin forms in
 * src/components/admin/*. List-shaped JSON columns (specialties, features, …)
 * are submitted as JSON strings and preprocessed back into arrays.
 */
import { z } from "zod";

/** Accept a JSON-stringified array (from a hidden input) or a real array. */
function jsonStringArray(item: z.ZodTypeAny, max: number) {
  return z.preprocess((value) => {
    if (typeof value === "string") {
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    }
    return value;
  }, z.array(item).max(max));
}

const optString = (max: number) =>
  z.string().trim().max(max).optional().default("");
const mediaId = () => optString(120);
const aliasList = (max: number) =>
  jsonStringArray(z.string().trim().min(1).max(80), max);
const time24h = z
  .string()
  .trim()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use 24-hour time, e.g. 18:30");

const urlField = () =>
  z
    .string()
    .trim()
    .max(500)
    .optional()
    .default("")
    .refine((value) => {
      if (!value) return true;
      return !/^\s*javascript:/i.test(value) && !/^\s*vbscript:/i.test(value);
    }, "That URL is not allowed.");

// ---------------------------------------------------------------------------
// Trainers
// ---------------------------------------------------------------------------

export const trainerSchema = z.object({
  id: z.string().trim().max(120).optional().default(""),
  name: z.string().trim().min(1, "Name is required").max(160),
  slug: optString(120),
  title: optString(160),
  photoId: mediaId(),
  bio: optString(10000),
  specialties: aliasList(20),
  certifications: aliasList(20),
  facebookUrl: urlField(),
  instagramUrl: urlField(),
  twitterUrl: urlField(),
  youtubeUrl: urlField(),
  seoTitle: optString(160),
  seoDescription: optString(500),
  sortOrder: z.coerce.number().int().min(0).max(100000).default(0),
  isPublished: z.boolean().default(true),
});

// ---------------------------------------------------------------------------
// Services
// ---------------------------------------------------------------------------

export const serviceSchema = z.object({
  id: z.string().trim().max(120).optional().default(""),
  title: z.string().trim().min(1, "Title is required").max(160),
  slug: optString(120),
  shortDescription: optString(300),
  content: optString(20000),
  iconId: mediaId(),
  imageId: mediaId(),
  gallery: jsonStringArray(z.string().trim().max(120), 40),
  ctaLabel: optString(80),
  ctaUrl: urlField(),
  seoTitle: optString(160),
  seoDescription: optString(500),
  sortOrder: z.coerce.number().int().min(0).max(100000).default(0),
  isPublished: z.boolean().default(true),
});

// ---------------------------------------------------------------------------
// Plans
// ---------------------------------------------------------------------------

export const planSchema = z.object({
  id: z.string().trim().max(120).optional().default(""),
  name: z.string().trim().min(1, "Plan name is required").max(120),
  price: z
    .string()
    .trim()
    .max(20)
    .optional()
    .default("")
    .refine(
      (value) => value === "" || /^\d{1,8}(\.\d{1,2})?$/.test(value),
      "Enter a valid price without the currency symbol (e.g. 15000).",
    ),
  currency: z.string().trim().min(1).max(10).default("PKR"),
  billingPeriod: optString(60),
  features: aliasList(40),
  isHighlighted: z.boolean().default(false),
  ctaLabel: optString(80),
  ctaUrl: urlField(),
  sortOrder: z.coerce.number().int().min(0).max(100000).default(0),
  isPublished: z.boolean().default(true),
});

// ---------------------------------------------------------------------------
// Testimonials
// ---------------------------------------------------------------------------

export const testimonialSchema = z.object({
  id: z.string().trim().max(120).optional().default(""),
  name: z.string().trim().min(1, "Name is required").max(120),
  quote: z.string().trim().min(1, "Quote is required").max(2000),
  photoId: mediaId(),
  rating: z.coerce.number().int().min(1).max(5).default(5),
  beforeImageId: mediaId(),
  afterImageId: mediaId(),
  sortOrder: z.coerce.number().int().min(0).max(100000).default(0),
  isPublished: z.boolean().default(true),
});

// ---------------------------------------------------------------------------
// Gallery items
// ---------------------------------------------------------------------------

export const galleryItemSchema = z.object({
  id: z.string().trim().max(120).optional().default(""),
  mediaId: mediaId(),
  externalUrl: urlField(),
  category: z
    .string()
    .trim()
    .min(1, "Category is required")
    .max(80)
    .default("general"),
  caption: optString(200),
  sortOrder: z.coerce.number().int().min(0).max(100000).default(0),
  isPublished: z.boolean().default(true),
});

// ---------------------------------------------------------------------------
// Timetable
// ---------------------------------------------------------------------------

export const timetableEntrySchema = z.object({
  id: z.string().trim().max(120).optional().default(""),
  dayOfWeek: z.coerce.number().int().min(0).max(6),
  startTime: time24h,
  endTime: time24h,
  title: z.string().trim().min(1, "Class title is required").max(160),
  trainerId: mediaId(),
  sortOrder: z.coerce.number().int().min(0).max(100000).default(0),
  isPublished: z.boolean().default(true),
});

// ---------------------------------------------------------------------------
// Reordering (shared by all module managers)
// ---------------------------------------------------------------------------

export const CONTENT_MODULES = [
  "trainers",
  "services",
  "plans",
  "testimonials",
  "gallery",
  "timetable",
] as const;

export type ContentModule = (typeof CONTENT_MODULES)[number];

export const moduleMoveSchema = z.object({
  module: z.enum(CONTENT_MODULES),
  id: z.string().trim().min(1),
  direction: z.enum(["up", "down"]),
});

export const moduleDeleteSchema = z.object({
  module: z.enum(CONTENT_MODULES),
  id: z.string().trim().min(1),
});

// ---------------------------------------------------------------------------
// Leads
// ---------------------------------------------------------------------------

const phoneSchema = z
  .string()
  .trim()
  .min(1, "A phone number is required")
  .max(40)
  .refine(
    (value) => /^\+?[\d][\d\s().-]{5,38}$/.test(value),
    "Enter a phone number, e.g. +92 300 1234567.",
  );

const emailOrEmpty = z
  .string()
  .trim()
  .max(160)
  .refine(
    (value) => value === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
    "Enter a valid email address.",
  )
  .optional()
  .default("");

/** Public lead-capture form (contact/consultation). */
export const leadSchema = z.object({
  name: z.string().trim().min(1, "Your name is required").max(160),
  phone: phoneSchema,
  email: emailOrEmpty,
  goal: optString(160),
  message: optString(5000),
  sourcePage: optString(200),
});

export const leadUpdateSchema = z.object({
  id: z.string().trim().min(1),
  status: z.enum(["NEW", "CONTACTED", "CONVERTED", "CLOSED"]),
  notes: optString(5000),
});

export const leadDeleteSchema = z.object({
  id: z.string().trim().min(1),
});
