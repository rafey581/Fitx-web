/**
 * Section registry + draft validation tests (PRD Phase 6).
 *
 * The registry is the single source of truth for block types; the builder saves
 * arbitrary JSON, so `validateDraftSections` is the security-relevant boundary
 * that every admin save must pass. These tests pin its behaviour, including the
 * Phase 5 additions (timetable, contact-info) and link-safety rules.
 */
import assert from "node:assert/strict";
import { test } from "node:test";

import {
  SECTION_REGISTRY,
  SECTION_SCHEMAS,
  SECTION_TYPES,
  sectionDefaults,
  sectionMetaFor,
  validateDraftSections,
} from "@/lib/sections/types";

test("SECTION_TYPES and the registry/schema maps stay in sync", () => {
  for (const type of SECTION_TYPES) {
    assert.ok(SECTION_REGISTRY[type], `registry missing ${type}`);
    assert.ok(SECTION_SCHEMAS[type], `schema missing ${type}`);
  }
  assert.equal(Object.keys(SECTION_REGISTRY).length, SECTION_TYPES.length);
  assert.equal(Object.keys(SECTION_SCHEMAS).length, SECTION_TYPES.length);
});

test("the Phase 5 blocks are registered with the right metadata", () => {
  const timetable = sectionMetaFor("timetable");
  assert.ok(timetable);
  assert.equal(timetable.label, "Class timetable");
  assert.equal(timetable.group, "Modules");
  assert.equal(timetable.nestable, false);

  const contact = sectionMetaFor("contact-info");
  assert.ok(contact);
  assert.equal(contact.label, "Contact information");
  assert.equal(contact.group, "Modules");
  assert.equal(contact.nestable, true);
});

test("sectionMetaFor tolerates unknown/legacy types", () => {
  assert.equal(sectionMetaFor("not-a-block"), null);
  assert.equal(sectionMetaFor(""), null);
});

test("sectionDefaults returns schema-shaped content for every type", () => {
  for (const type of SECTION_TYPES) {
    const content = sectionDefaults(type);
    const parsed = SECTION_SCHEMAS[type].safeParse(content);
    assert.equal(
      parsed.success,
      true,
      `defaults for ${type} do not validate: ${
        parsed.success ? "" : JSON.stringify(parsed.error.issues)
      }`,
    );
  }
});

test("sectionDefaults for the Phase 5 blocks", () => {
  const timetable = sectionDefaults("timetable") as Record<string, unknown>;
  assert.equal(timetable.heading, "Class timetable");
  assert.deepEqual(timetable.days, []);

  const contact = sectionDefaults("contact-info") as Record<string, unknown>;
  assert.equal(contact.heading, "Find us in Sahiwal");
  assert.equal(contact.showAddress, true);
  assert.equal(contact.showMap, true);
});

test("validateDraftSections: accepts a well-formed draft and normalises defaults", () => {
  const result = validateDraftSections([
    {
      type: "contact-info",
      content: {
        eyebrow: "Visit us",
        heading: "Find us",
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
  ]);
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.sections.length, 1);
  const [section] = result.sections;
  assert.equal(section.type, "contact-info");
  assert.equal(section.isVisible, true);
  assert.equal(section.visibilityDevices, "all");
  assert.equal(section.style.paddingY, "md");
});

test("validateDraftSections: a timetable block validates with an empty day filter", () => {
  const result = validateDraftSections([
    { type: "timetable", content: { heading: "Schedule", days: [] } },
  ]);
  assert.equal(result.ok, true);
});

test("validateDraftSections: rejects a non-array payload", () => {
  const result = validateDraftSections({ type: "spacer" });
  assert.equal(result.ok, false);
});

test("validateDraftSections: rejects unknown block types", () => {
  const result = validateDraftSections([{ type: "evil-block", content: {} }]);
  assert.equal(result.ok, false);
  if (!result.ok) assert.match(result.error, /Unknown section type/);
});

test("validateDraftSections: rejects content that fails the type schema", () => {
  // `showAddress` must be a boolean; a string must not silently pass.
  const result = validateDraftSections([
    { type: "contact-info", content: { showAddress: "yes" } },
  ]);
  assert.equal(result.ok, false);
});

test("validateDraftSections: caps a page at 80 sections", () => {
  const many = Array.from({ length: 81 }, () => ({
    type: "spacer",
    content: { height: 32 },
  }));
  const result = validateDraftSections(many);
  assert.equal(result.ok, false);
  if (!result.ok) assert.match(result.error, /at most 80/);
});

test("validateDraftSections: refuses javascript: links in href fields", () => {
  const result = validateDraftSections([
    {
      type: "cta-banner",
      content: { heading: "Hi", ctaLabel: "Go", ctaHref: "javascript:alert(1)" },
    },
  ]);
  assert.equal(result.ok, false);
});

test("validateDraftSections: columns accept nestable blocks", () => {
  const result = validateDraftSections([
    {
      type: "columns",
      content: {
        columns: [
          {
            width: 6,
            blocks: [{ type: "rich-text", content: { paragraphs: ["Hello"] } }],
          },
          { width: 6, blocks: [] },
        ],
      },
    },
  ]);
  assert.equal(result.ok, true);
});

test("validateDraftSections: columns refuse non-nestable blocks (e.g. gallery)", () => {
  const result = validateDraftSections([
    {
      type: "columns",
      content: {
        columns: [
          { width: 6, blocks: [{ type: "gallery", content: { images: [] } }] },
        ],
      },
    },
  ]);
  assert.equal(result.ok, false);
  if (!result.ok) assert.match(result.error, /cannot be placed inside Columns/);
});

test("validateDraftSections: columns refuse another layout wrapper", () => {
  const result = validateDraftSections([
    {
      type: "columns",
      content: {
        columns: [
          { width: 6, blocks: [{ type: "columns", content: { columns: [] } }] },
        ],
      },
    },
  ]);
  assert.equal(result.ok, false);
});
