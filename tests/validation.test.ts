/**
 * Zod validation tests for the admin + public forms (PRD Phase 6).
 *
 * Every server action validates its input through these schemas, so these
 * tests double as a security regression net: URL fields must reject
 * `javascript:`, redirects must not hijack `/admin`, phone/email formats are
 * enforced, and list fields survive the JSON-string round trip the admin forms
 * use.
 */
import assert from "node:assert/strict";
import { test } from "node:test";

import {
  createUserSchema,
  loginSchema,
  resetPasswordSchema,
} from "@/lib/validation/auth";
import {
  CONTENT_MODULES,
  galleryItemSchema,
  leadSchema,
  leadUpdateSchema,
  moduleDeleteSchema,
  moduleMoveSchema,
  planSchema,
  serviceSchema,
  testimonialSchema,
  timetableEntrySchema,
  trainerSchema,
} from "@/lib/validation/modules";
import {
  generalSettingsSchema,
  redirectSchema,
  themeSettingsSchema,
} from "@/lib/validation/settings";

test("loginSchema requires an email and a password", () => {
  assert.equal(loginSchema.safeParse({ email: "a@b.com", password: "x" }).success, true);
  assert.equal(loginSchema.safeParse({ email: "nope", password: "x" }).success, false);
  assert.equal(loginSchema.safeParse({ email: "a@b.com", password: "" }).success, false);
});

test("resetPasswordSchema enforces length and confirmation", () => {
  assert.equal(
    resetPasswordSchema.safeParse({
      token: "0123456789",
      password: "longenough",
      confirmPassword: "longenough",
    }).success,
    true,
  );
  assert.equal(
    resetPasswordSchema.safeParse({
      token: "0123456789",
      password: "short",
      confirmPassword: "short",
    }).success,
    false,
  );
  assert.equal(
    resetPasswordSchema.safeParse({
      token: "0123456789",
      password: "longenough",
      confirmPassword: "different",
    }).success,
    false,
  );
});

test("createUserSchema only allows the known roles", () => {
  assert.equal(
    createUserSchema.safeParse({
      name: "Ada",
      email: "ada@fitx.pk",
      password: "Password1",
      role: "EDITOR",
    }).success,
    true,
  );
  assert.equal(
    createUserSchema.safeParse({
      name: "Ada",
      email: "ada@fitx.pk",
      password: "Password1",
      role: "SUPERUSER",
    }).success,
    false,
  );
});

test("urlField blocks javascript: and vbscript: destinations", () => {
  const base = {
    title: "Personal Training",
    slug: "",
    shortDescription: "",
    content: "",
    iconId: "",
    imageId: "",
    gallery: "[]",
    ctaLabel: "Book",
    seoTitle: "",
    seoDescription: "",
    isPublished: true,
  };
  assert.equal(serviceSchema.safeParse({ ...base, ctaUrl: "/contact" }).success, true);
  assert.equal(serviceSchema.safeParse({ ...base, ctaUrl: "https://fitx.pk" }).success, true);
  assert.equal(serviceSchema.safeParse({ ...base, ctaUrl: "javascript:alert(1)" }).success, false);
  assert.equal(serviceSchema.safeParse({ ...base, ctaUrl: "  javascript:alert(1)" }).success, false);
  assert.equal(serviceSchema.safeParse({ ...base, ctaUrl: "vbscript:msgbox" }).success, false);
});

test("trainerSchema accepts JSON-stringified list fields", () => {
  const parsed = trainerSchema.safeParse({
    name: "Usman Ali",
    slug: "",
    title: "Head Coach",
    photoId: "",
    bio: "",
    specialties: JSON.stringify(["Strength", "Boxing"]),
    certifications: JSON.stringify(["ACE CPT"]),
    facebookUrl: "",
    instagramUrl: "",
    twitterUrl: "",
    youtubeUrl: "",
    seoTitle: "",
    seoDescription: "",
    isPublished: true,
  });
  assert.equal(parsed.success, true);
  if (parsed.success) {
    assert.deepEqual(parsed.data.specialties, ["Strength", "Boxing"]);
  }
});

test("trainerSchema rejects malformed list JSON", () => {
  const parsed = trainerSchema.safeParse({
    name: "Broken",
    specialties: "{not json",
  });
  assert.equal(parsed.success, false);
});

test("planSchema validates the price format", () => {
  const base = { name: "Starter", currency: "PKR", features: "[]", isPublished: true };
  assert.equal(planSchema.safeParse({ ...base, price: "15000" }).success, true);
  assert.equal(planSchema.safeParse({ ...base, price: "15000.50" }).success, true);
  assert.equal(planSchema.safeParse({ ...base, price: "" }).success, true);
  assert.equal(planSchema.safeParse({ ...base, price: "Rs 15000" }).success, false);
});

test("testimonialSchema requires a quote and bounds the rating", () => {
  assert.equal(
    testimonialSchema.safeParse({ name: "Ayesha", quote: "Great", rating: 5 }).success,
    true,
  );
  assert.equal(
    testimonialSchema.safeParse({ name: "Ayesha", quote: "", rating: 5 }).success,
    false,
  );
  assert.equal(
    testimonialSchema.safeParse({ name: "Ayesha", quote: "Great", rating: 9 }).success,
    false,
  );
});

test("galleryItemSchema requires a category", () => {
  assert.equal(
    galleryItemSchema.safeParse({ mediaId: "", externalUrl: "", category: "general" }).success,
    true,
  );
  assert.equal(
    galleryItemSchema.safeParse({ mediaId: "", externalUrl: "", category: "" }).success,
    false,
  );
});

test("timetableEntrySchema enforces 24-hour times and a weekday", () => {
  const base = { title: "Strength", trainerId: "", isPublished: true };
  assert.equal(
    timetableEntrySchema.safeParse({ ...base, dayOfWeek: 1, startTime: "18:30", endTime: "19:30" }).success,
    true,
  );
  assert.equal(
    timetableEntrySchema.safeParse({ ...base, dayOfWeek: 7, startTime: "18:30", endTime: "19:30" }).success,
    false,
  );
  assert.equal(
    timetableEntrySchema.safeParse({ ...base, dayOfWeek: 1, startTime: "6pm", endTime: "19:30" }).success,
    false,
  );
});

test("moduleMove/moduleDelete only allow known modules + directions", () => {
  assert.equal(moduleMoveSchema.safeParse({ module: "trainers", id: "x", direction: "up" }).success, true);
  assert.equal(moduleMoveSchema.safeParse({ module: "users", id: "x", direction: "up" }).success, false);
  assert.equal(moduleMoveSchema.safeParse({ module: "trainers", id: "x", direction: "sideways" }).success, false);
  assert.equal(moduleDeleteSchema.safeParse({ module: "gallery", id: "x" }).success, true);
  assert.equal(moduleDeleteSchema.safeParse({ module: "pages", id: "x" }).success, false);
  assert.deepEqual([...CONTENT_MODULES], [
    "trainers",
    "services",
    "plans",
    "testimonials",
    "gallery",
    "timetable",
  ]);
});

test("leadSchema enforces name, phone and optional email", () => {
  assert.equal(
    leadSchema.safeParse({ name: "Ali", phone: "+92 300 1234567", email: "ali@example.com" }).success,
    true,
  );
  assert.equal(
    leadSchema.safeParse({ name: "Ali", phone: "+92 300 1234567", email: "" }).success,
    true,
  );
  assert.equal(leadSchema.safeParse({ name: "", phone: "+92 300 1234567" }).success, false);
  assert.equal(leadSchema.safeParse({ name: "Ali", phone: "abc" }).success, false);
  assert.equal(
    leadSchema.safeParse({ name: "Ali", phone: "+92 300 1234567", email: "not-an-email" }).success,
    false,
  );
});

test("leadUpdateSchema only allows the four statuses", () => {
  for (const status of ["NEW", "CONTACTED", "CONVERTED", "CLOSED"]) {
    assert.equal(leadUpdateSchema.safeParse({ id: "x", status }).success, true, status);
  }
  assert.equal(leadUpdateSchema.safeParse({ id: "x", status: "DELETED" }).success, false);
});

test("generalSettingsSchema validates the contact email", () => {
  const base = {
    businessName: "FITX",
    announcementEnabled: false,
    maintenanceMode: false,
  };
  assert.equal(generalSettingsSchema.safeParse({ ...base, email: "info@fitx.pk" }).success, true);
  assert.equal(generalSettingsSchema.safeParse({ ...base, email: "" }).success, true);
  assert.equal(generalSettingsSchema.safeParse({ ...base, email: "bad" }).success, false);
});

test("themeSettingsSchema requires hex colours from the curated fonts", () => {
  const valid = {
    accent: "#FF4B00",
    navy: "#1E2330",
    ink: "#0D0A10",
    footer: "#0D0A10",
    background: "#FFFFFF",
    foreground: "#171717",
    muted: "#5B5F6B",
    headingFont: "Montserrat",
    bodyFont: "Inter",
    serifFont: "Playfair Display",
    radius: "0.5rem",
  };
  assert.equal(themeSettingsSchema.safeParse(valid).success, true);
  assert.equal(themeSettingsSchema.safeParse({ ...valid, accent: "red" }).success, false);
  assert.equal(themeSettingsSchema.safeParse({ ...valid, headingFont: "Comic Sans" }).success, false);
});

test("redirectSchema refuses to hijack /admin and unsafe destinations", () => {
  assert.equal(redirectSchema.safeParse({ fromPath: "/old", toPath: "/new", code: "301" }).success, true);
  assert.equal(
    redirectSchema.safeParse({ fromPath: "/admin/login", toPath: "/new", code: "301" }).success,
    false,
  );
  assert.equal(
    redirectSchema.safeParse({ fromPath: "/old", toPath: "javascript:alert(1)", code: "301" }).success,
    false,
  );
  assert.equal(
    redirectSchema.safeParse({ fromPath: "/old", toPath: "ftp://x", code: "301" }).success,
    false,
  );
  assert.equal(
    redirectSchema.safeParse({ fromPath: "no-slash", toPath: "/new", code: "301" }).success,
    false,
  );
});
