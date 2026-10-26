"use client";

/**
 * Admin form definitions for every section type (PRD §6: "a Zod schema, a
 * render component and an admin form definition"). These are controlled
 * client components: the builder owns the draft state and passes content +
 * an updater. The public renderers live separately in
 * src/components/sections/renderers.tsx (server).
 */
import type { ReactNode } from "react";

import {
  MediaField,
  NumberField,
  Repeater as RepeaterBase,
  SelectField,
  TextField,
  Toggle,
  type SelectOption,
} from "@/components/sections/fields";
import {
  SECTION_REGISTRY,
  SECTION_TYPES,
  pickArr,
  pickBool,
  pickNum,
  pickStr,
  sectionDefaults,
  sectionMetaFor,
} from "@/lib/sections/types";

export type MediaItemOption = { id: string; thumb: string; filename: string };

export type SectionFormContext = {
  media: MediaItemOption[];
  services: { id: string; title: string }[];
  trainers: { id: string; name: string }[];
  plans: { id: string; name: string }[];
  gallery: { id: string; label: string }[];
};

export type SectionFormProps = {
  type: string;
  content: Record<string, unknown>;
  onChange: (content: Record<string, unknown>) => void;
  context: SectionFormContext;
};

const patch =
  (content: Record<string, unknown>, onChange: SectionFormProps["onChange"]) =>
  (key: string, value: unknown) =>
    onChange({ ...content, [key]: value });

/**
 * Children-based wrapper over the `renderItem` primitive. Every admin form
 * below lists object items (slides, cards, columns…) so `item` is treated as
 * a plain object; the string-item lists (bullets, paragraphs) only use `set`.
 */
function Repeater({
  items,
  onChange,
  newItem,
  addLabel,
  minItems,
  children,
}: {
  items: unknown[];
  onChange: (items: unknown[]) => void;
  newItem: () => unknown;
  addLabel: string;
  minItems?: number;
  children: (
    item: Record<string, unknown>,
    index: number,
    updaters: {
      update: (patch: Record<string, unknown>) => void;
      set: (next: unknown) => void;
      remove: () => void;
    },
  ) => ReactNode;
}) {
  return (
    <RepeaterBase<unknown>
      items={items}
      onChange={onChange}
      newItem={newItem}
      addLabel={addLabel}
      minItems={minItems}
      renderItem={(item, index, updaters) =>
        children(item as Record<string, unknown>, index, updaters)
      }
    />
  );
}

/** Types that may sit inside a Columns wrapper (no other layout wrappers). */
export const NESTABLE_TYPES = SECTION_TYPES.filter((type) => {
  const meta = SECTION_REGISTRY[type];
  return !meta.isLayout && meta.nestable;
});

const ICON_OPTIONS: SelectOption[] = [
  { value: "none", label: "No icon (photo card)" },
  { value: "dumbbell", label: "Dumbbell" },
  { value: "glove", label: "Boxing glove" },
  { value: "lotus", label: "Lotus" },
  { value: "heart", label: "Heart" },
  { value: "shield", label: "Shield" },
  { value: "star", label: "Star" },
  { value: "flame", label: "Flame" },
];

const sourceOptions: SelectOption[] = [
  { value: "all", label: "Show all published items" },
  { value: "selection", label: "Pick specific items" },
];

/** Checkbox group used to pick module items for selection-source blocks. */
function CheckedList({
  label,
  options,
  selected,
  onChange,
}: {
  label: string;
  options: { id: string; label: string }[];
  selected: string[];
  onChange: (ids: string[]) => void;
}) {
  const toggle = (id: string) =>
    onChange(
      selected.includes(id)
        ? selected.filter((entry) => entry !== id)
        : [...selected, id],
    );

  return (
    <fieldset>
      <legend className="mb-1 block text-xs font-semibold tracking-wide text-muted uppercase">
        {label}
      </legend>
      {options.length === 0 ? (
        <p className="text-xs text-muted">
          Nothing to pick yet — add items in the module first.
        </p>
      ) : (
        <ul className="max-h-44 space-y-1 overflow-y-auto rounded-brand border border-black/10 p-2">
          {options.map((option) => (
            <li key={option.id}>
              <label className="flex items-center gap-2 text-sm text-ink">
                <input
                  type="checkbox"
                  checked={selected.includes(option.id)}
                  onChange={() => toggle(option.id)}
                  className="h-3.5 w-3.5"
                />
                {option.label}
              </label>
            </li>
          ))}
        </ul>
      )}
    </fieldset>
  );
}

function HeroSliderForm({ content, onChange, context }: SectionFormProps) {
  const set = patch(content, onChange);
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <NumberField
          label="Autoplay (ms, 0 = off)"
          value={pickNum(content, "autoplayMs", 6000)}
          min={0}
          max={30000}
          onChange={(value) => set("autoplayMs", value)}
        />
        <NumberField
          label="Overlay opacity"
          value={pickNum(content, "overlayOpacity", 0.55)}
          min={0}
          max={1}
          onChange={(value) => set("overlayOpacity", value)}
        />
        <SelectField
          label="Height"
          value={pickStr(content, "height", "full")}
          options={[
            { value: "full", label: "Full screen" },
            { value: "short", label: "Short" },
          ]}
          onChange={(value) => set("height", value)}
        />
      </div>
      <div className="flex flex-wrap gap-5">
        <Toggle
          label="Show arrows"
          checked={pickBool(content, "arrows", true)}
          onChange={(value) => set("arrows", value)}
        />
        <Toggle
          label="Show dots"
          checked={pickBool(content, "dots", true)}
          onChange={(value) => set("dots", value)}
        />
      </div>

      <fieldset>
        <legend className="mb-1 block text-xs font-semibold tracking-wide text-muted uppercase">
          Slides
        </legend>
        <Repeater
          items={pickArr(content, "slides")}
          onChange={(items) => set("slides", items)}
          newItem={() => ({
            image: "",
            logoImage: "",
            eyebrow: "",
            heading: "A striking headline",
            subheading: "",
            ctaLabel: "Start now",
            ctaHref: "/contact",
            ctaPosition: "right",
          })}
          addLabel="+ Add slide"
        >
          {(item, _, { update, remove }) => (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold text-muted">Slide</p>
                <button
                  type="button"
                  onClick={remove}
                  className="text-xs font-medium text-red-600 hover:underline"
                >
                  Remove slide
                </button>
              </div>
              <MediaField
                label="Background image"
                value={pickStr(item, "image")}
                onChange={(value) => update({ image: value })}
                media={context.media}
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <TextField
                  label="Eyebrow"
                  value={pickStr(item, "eyebrow")}
                  onChange={(value) => update({ eyebrow: value })}
                  maxLength={120}
                />
                <TextField
                  label="Headline"
                  value={pickStr(item, "heading")}
                  onChange={(value) => update({ heading: value })}
                  maxLength={240}
                />
              </div>
              <TextField
                label="Subheading"
                value={pickStr(item, "subheading")}
                textarea
                rows={2}
                onChange={(value) => update({ subheading: value })}
                maxLength={400}
              />
              <div className="grid gap-3 sm:grid-cols-3">
                <TextField
                  label="Button label"
                  value={pickStr(item, "ctaLabel")}
                  onChange={(value) => update({ ctaLabel: value })}
                  maxLength={80}
                />
                <TextField
                  label="Button link"
                  value={pickStr(item, "ctaHref")}
                  onChange={(value) => update({ ctaHref: value })}
                  maxLength={500}
                />
                <SelectField
                  label="Button position"
                  value={pickStr(item, "ctaPosition", "right")}
                  options={[
                    { value: "right", label: "Bottom-right" },
                    { value: "center", label: "Center" },
                  ]}
                  onChange={(value) => update({ ctaPosition: value })}
                />
              </div>
              <MediaField
                label="Logo graphic (optional, over image)"
                value={pickStr(item, "logoImage")}
                onChange={(value) => update({ logoImage: value })}
                media={context.media}
              />
            </div>
          )}
        </Repeater>
      </fieldset>
    </div>
  );
}

function FeatureCardsForm({ content, onChange, context }: SectionFormProps) {
  const set = patch(content, onChange);
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <TextField
          label="Eyebrow"
          value={pickStr(content, "eyebrow")}
          onChange={(value) => set("eyebrow", value)}
          maxLength={120}
        />
        <TextField
          label="Heading"
          value={pickStr(content, "heading")}
          onChange={(value) => set("heading", value)}
          maxLength={200}
        />
      </div>
      <NumberField
        label="Columns (2–4)"
        value={pickNum(content, "columns", 3)}
        min={2}
        max={4}
        onChange={(value) => set("columns", value)}
      />
      <fieldset>
        <legend className="mb-1 block text-xs font-semibold tracking-wide text-muted uppercase">
          Cards
        </legend>
        <Repeater
          items={pickArr(content, "items")}
          onChange={(items) => set("items", items)}
          newItem={() => ({
            icon: "none",
            eyebrow: "",
            title: "",
            text: "",
            link: "",
            image: "",
          })}
          addLabel="+ Add card"
        >
          {(item, _, { update, remove }) => (
            <div className="space-y-3">
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={remove}
                  className="text-xs font-medium text-red-600 hover:underline"
                >
                  Remove card
                </button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <SelectField
                  label="Icon"
                  value={pickStr(item, "icon", "none")}
                  options={ICON_OPTIONS}
                  onChange={(value) => update({ icon: value })}
                />
                <TextField
                  label="Eyebrow"
                  value={pickStr(item, "eyebrow")}
                  onChange={(value) => update({ eyebrow: value })}
                  maxLength={80}
                />
              </div>
              <TextField
                label="Title"
                value={pickStr(item, "title")}
                onChange={(value) => update({ title: value })}
                maxLength={120}
              />
              <TextField
                label="Text"
                value={pickStr(item, "text")}
                textarea
                rows={2}
                onChange={(value) => update({ text: value })}
                maxLength={500}
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <TextField
                  label="Link (whole card)"
                  value={pickStr(item, "link")}
                  onChange={(value) => update({ link: value })}
                  maxLength={500}
                />
                <MediaField
                  label="Photo (optional)"
                  value={pickStr(item, "image")}
                  onChange={(value) => update({ image: value })}
                  media={context.media}
                />
              </div>
            </div>
          )}
        </Repeater>
      </fieldset>
    </div>
  );
}

type ColumnBlock = {
  key: string;
  type: string;
  content: Record<string, unknown>;
  isVisible?: boolean;
};

function NestedBlockEditor({
  blocks,
  onBlocksChange,
  context,
}: {
  blocks: ColumnBlock[];
  onBlocksChange: (blocks: ColumnBlock[]) => void;
  context: SectionFormContext;
}) {
  const update = (index: number, patchValue: Partial<ColumnBlock>) =>
    onBlocksChange(
      blocks.map((block, i) =>
        i === index ? { ...block, ...patchValue } : block,
      ),
    );

  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= blocks.length) return;
    const next = [...blocks];
    [next[index], next[target]] = [next[target], next[index]];
    onBlocksChange(next);
  };

  return (
    <div className="space-y-3">
      {blocks.length === 0 ? (
        <p className="rounded-brand border border-dashed border-black/20 p-4 text-center text-xs text-muted">
          No blocks in this column yet.
        </p>
      ) : (
        blocks.map((block, index) => {
          const meta = sectionMetaFor(block.type);
          return (
            <div
              key={block.key}
              className="rounded-brand border border-accent/30 bg-white p-3"
            >
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <select
                  value={block.type}
                  aria-label="Block type"
                  onChange={(event) => {
                    const type = event.target.value;
                    update(index, {
                      type,
                      content: sectionDefaults(
                        type as (typeof NESTABLE_TYPES)[number],
                      ),
                    });
                  }}
                  className="w-56 rounded-brand border border-black/15 bg-white px-2 py-1.5 text-xs text-ink"
                >
                  {NESTABLE_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {SECTION_REGISTRY[type].label}
                    </option>
                  ))}
                </select>
                <div className="ml-auto flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => move(index, -1)}
                    disabled={index === 0}
                    aria-label="Move block up"
                    className="grid h-7 w-7 place-items-center rounded-full border border-black/10 text-xs disabled:opacity-30"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => move(index, 1)}
                    disabled={index === blocks.length - 1}
                    aria-label="Move block down"
                    className="grid h-7 w-7 place-items-center rounded-full border border-black/10 text-xs disabled:opacity-30"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      onBlocksChange([
                        ...blocks.slice(0, index + 1),
                        {
                          ...block,
                          key: crypto.randomUUID(),
                        },
                        ...blocks.slice(index + 1),
                      ])
                    }
                    aria-label="Duplicate block"
                    className="grid h-7 w-7 place-items-center rounded-full border border-black/10 text-xs"
                  >
                    ⧉
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      onBlocksChange(blocks.filter((_, i) => i !== index))
                    }
                    aria-label="Remove block"
                    className="grid h-7 w-7 place-items-center rounded-full border border-red-200 text-xs text-red-600"
                  >
                    ✕
                  </button>
                </div>
              </div>
              {meta ? (
                <SectionFormFields
                  type={block.type}
                  content={block.content ?? {}}
                  onChange={(value) => update(index, { content: value })}
                  context={context}
                />
              ) : null}
            </div>
          );
        })
      )}
      <button
        type="button"
        onClick={() =>
          onBlocksChange([
            ...blocks,
            {
              key: crypto.randomUUID(),
              type: NESTABLE_TYPES[0],
              content: sectionDefaults(NESTABLE_TYPES[0]),
            },
          ])
        }
        className="btn btn-outline px-4 py-2 text-[0.7rem]"
      >
        + Add block
      </button>
    </div>
  );
}

function ColumnsForm({ content, onChange, context }: SectionFormProps) {
  const set = patch(content, onChange);
  const columns = pickArr(content, "columns");

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted">
        Each column holds any other block. Columns stack on mobile and sit side
        by side on desktop according to their widths.
      </p>
      <Repeater
        items={columns}
        onChange={(items) => set("columns", items)}
        newItem={() => ({ key: crypto.randomUUID(), width: 6, blocks: [] })}
        addLabel="+ Add column"
        minItems={1}
      >
        {(column, index, { update, remove }) => (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <SelectField
                label={`Column ${index + 1} width`}
                value={String(pickNum(column, "width", 6))}
                options={[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(
                  (width) => ({
                    value: String(width),
                    label: `${width} / 12`,
                  }),
                )}
                onChange={(value) => update({ width: Number(value) })}
              />
              <button
                type="button"
                onClick={remove}
                className="text-xs font-medium text-red-600 hover:underline"
              >
                Remove column
              </button>
            </div>
            <NestedBlockEditor
              blocks={(column.blocks ?? []) as ColumnBlock[]}
              onBlocksChange={(blocks) => update({ blocks })}
              context={context}
            />
          </div>
        )}
      </Repeater>
    </div>
  );
}

function SplitContentForm({ content, onChange, context }: SectionFormProps) {
  const set = patch(content, onChange);
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <TextField
          label="Eyebrow"
          value={pickStr(content, "eyebrow")}
          onChange={(value) => set("eyebrow", value)}
          maxLength={120}
        />
        <SelectField
          label="Image side"
          value={pickStr(content, "imageSide", "left")}
          options={[
            { value: "left", label: "Image left" },
            { value: "right", label: "Image right" },
          ]}
          onChange={(value) => set("imageSide", value)}
        />
      </div>
      <TextField
        label="Heading"
        value={pickStr(content, "heading")}
        onChange={(value) => set("heading", value)}
        maxLength={200}
      />
      <Toggle
        label="Orange slash after heading"
        checked={pickBool(content, "showAccentSlash", true)}
        onChange={(value) => set("showAccentSlash", value)}
      />
      <TextField
        label="Lead sentence (bold)"
        value={pickStr(content, "lead")}
        textarea
        rows={2}
        onChange={(value) => set("lead", value)}
        maxLength={300}
      />
      <TextField
        label="Body text"
        value={pickStr(content, "text")}
        textarea
        rows={5}
        onChange={(value) => set("text", value)}
        maxLength={4000}
      />
      <fieldset>
        <legend className="mb-1 block text-xs font-semibold tracking-wide text-muted uppercase">
          Bullet points
        </legend>
        <Repeater
          items={pickArr(content, "bullets")}
          onChange={(items) =>
            set(
              "bullets",
              items.map((item) => String(item)),
            )
          }
          newItem={() => ""}
          addLabel="+ Add bullet"
          minItems={0}
        >
          {(item, _, { set, remove }) => (
            <div className="flex items-center gap-2">
              <span aria-hidden="true">•</span>
              <input
                type="text"
                value={String(item ?? "")}
                onChange={(event) => set(event.target.value)}
                className="w-full rounded-brand border border-black/15 bg-white px-2 py-1.5 text-sm text-ink"
              />
              <button
                type="button"
                onClick={remove}
                aria-label="Remove bullet"
                className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-red-200 text-xs text-red-600"
              >
                ✕
              </button>
            </div>
          )}
        </Repeater>
      </fieldset>
      <MediaField
        label="Image"
        value={pickStr(content, "image")}
        onChange={(value) => set("image", value)}
        media={context.media}
      />
      <TextField
        label="Image alt text"
        value={pickStr(content, "imageAlt")}
        onChange={(value) => set("imageAlt", value)}
        maxLength={300}
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <TextField
          label="Button label (empty hides)"
          value={pickStr(content, "ctaLabel")}
          onChange={(value) => set("ctaLabel", value)}
          maxLength={80}
        />
        <TextField
          label="Button link"
          value={pickStr(content, "ctaHref")}
          onChange={(value) => set("ctaHref", value)}
          maxLength={500}
        />
      </div>
    </div>
  );
}

function RichTextForm({ content, onChange }: SectionFormProps) {
  const set = patch(content, onChange);
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <TextField
          label="Eyebrow"
          value={pickStr(content, "eyebrow")}
          onChange={(value) => set("eyebrow", value)}
          maxLength={120}
        />
        <SelectField
          label="Alignment"
          value={pickStr(content, "align", "left")}
          options={[
            { value: "left", label: "Left" },
            { value: "center", label: "Center" },
          ]}
          onChange={(value) => set("align", value)}
        />
      </div>
      <TextField
        label="Heading"
        value={pickStr(content, "heading")}
        onChange={(value) => set("heading", value)}
        maxLength={200}
      />
      <Toggle
        label="Orange slash after heading"
        checked={pickBool(content, "showAccentSlash", true)}
        onChange={(value) => set("showAccentSlash", value)}
      />
      <fieldset>
        <legend className="mb-1 block text-xs font-semibold tracking-wide text-muted uppercase">
          Paragraphs
        </legend>
        <Repeater
          items={pickArr(content, "paragraphs")}
          onChange={(items) =>
            set(
              "paragraphs",
              items.map((item) => String(item)),
            )
          }
          newItem={() => ""}
          addLabel="+ Add paragraph"
          minItems={1}
        >
          {(item, _, { set, remove }) => (
            <div className="space-y-2">
              <textarea
                rows={3}
                value={String(item ?? "")}
                onChange={(event) => set(event.target.value)}
                className="w-full rounded-brand border border-black/15 bg-white px-2 py-1.5 text-sm text-ink"
              />
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={remove}
                  className="text-xs font-medium text-red-600 hover:underline"
                >
                  Remove paragraph
                </button>
              </div>
            </div>
          )}
        </Repeater>
      </fieldset>
    </div>
  );
}

function ModulePickForm({
  content,
  onChange,
  options,
  idKey,
  hasColumns,
}: SectionFormProps & {
  options: { id: string; label: string }[];
  idKey: "serviceIds" | "trainerIds" | "planIds";
  hasColumns?: boolean;
}) {
  const set = patch(content, onChange);
  const selected = pickArr(content, idKey).map((id) => String(id));
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <TextField
          label="Eyebrow"
          value={pickStr(content, "eyebrow")}
          onChange={(value) => set("eyebrow", value)}
          maxLength={120}
        />
        <TextField
          label="Heading"
          value={pickStr(content, "heading")}
          onChange={(value) => set("heading", value)}
          maxLength={200}
        />
      </div>
      <Toggle
        label="Orange slash after heading"
        checked={pickBool(content, "showAccentSlash", true)}
        onChange={(value) => set("showAccentSlash", value)}
      />
      <SelectField
        label="Which items?"
        value={pickStr(content, "source", "all")}
        options={sourceOptions}
        onChange={(value) => set("source", value)}
      />
      {pickStr(content, "source", "all") === "selection" ? (
        <CheckedList
          label="Pick items"
          options={options}
          selected={selected}
          onChange={(ids) => set(idKey, ids)}
        />
      ) : null}
      {hasColumns ? (
        <NumberField
          label="Columns (1–4)"
          value={pickNum(content, "columns", 3)}
          min={1}
          max={4}
          onChange={(value) => set("columns", value)}
        />
      ) : null}
    </div>
  );
}

function TestimonialsForm({ content, onChange, context }: SectionFormProps) {
  const set = patch(content, onChange);
  const selection = pickStr(content, "source", "all") === "selection";
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <TextField
          label="Eyebrow"
          value={pickStr(content, "eyebrow")}
          onChange={(value) => set("eyebrow", value)}
          maxLength={120}
        />
        <TextField
          label="Heading"
          value={pickStr(content, "heading")}
          onChange={(value) => set("heading", value)}
          maxLength={200}
        />
      </div>
      <Toggle
        label="Orange slash after heading"
        checked={pickBool(content, "showAccentSlash", true)}
        onChange={(value) => set("showAccentSlash", value)}
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <NumberField
          label="Autoplay (ms, 0 = off)"
          value={pickNum(content, "autoplayMs", 5000)}
          min={0}
          max={30000}
          onChange={(value) => set("autoplayMs", value)}
        />
        <Toggle
          label="Show dots"
          checked={pickBool(content, "dots", true)}
          onChange={(value) => set("dots", value)}
        />
      </div>
      <SelectField
        label="Which testimonials?"
        value={pickStr(content, "source", "all")}
        options={sourceOptions}
        onChange={(value) => set("source", value)}
      />
      {selection ? (
        <fieldset>
          <legend className="mb-1 block text-xs font-semibold tracking-wide text-muted uppercase">
            Hand-picked quotes
          </legend>
          <Repeater
            items={pickArr(content, "items")}
            onChange={(items) => set("items", items)}
            newItem={() => ({ name: "", quote: "", rating: 5, photo: "" })}
            addLabel="+ Add quote"
            minItems={1}
          >
            {(item, _, { update, remove }) => (
              <div className="space-y-3">
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={remove}
                    className="text-xs font-medium text-red-600 hover:underline"
                  >
                    Remove quote
                  </button>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <TextField
                    label="Author"
                    value={pickStr(item, "name")}
                    onChange={(value) => update({ name: value })}
                    maxLength={120}
                  />
                  <SelectField
                    label="Rating"
                    value={String(pickNum(item, "rating", 5))}
                    options={[1, 2, 3, 4, 5].map((rating) => ({
                      value: String(rating),
                      label: "★".repeat(rating),
                    }))}
                    onChange={(value) => update({ rating: Number(value) })}
                  />
                </div>
                <TextField
                  label="Quote"
                  value={pickStr(item, "quote")}
                  textarea
                  rows={3}
                  onChange={(value) => update({ quote: value })}
                  maxLength={1000}
                />
                <MediaField
                  label="Photo (optional)"
                  value={pickStr(item, "photo")}
                  onChange={(value) => update({ photo: value })}
                  media={context.media}
                />
              </div>
            )}
          </Repeater>
        </fieldset>
      ) : null}
    </div>
  );
}

function GalleryForm({ content, onChange, context }: SectionFormProps) {
  const set = patch(content, onChange);
  const storedSource = pickStr(content, "source");
  const hasHandPicked = pickArr(content, "images").length > 0;
  const source =
    storedSource === "all" || storedSource === "selection"
      ? storedSource
      : hasHandPicked
        ? "handPicked"
        : "all";

  const chooseSource = (value: string) => {
    if (value === "handPicked") {
      const next: Record<string, unknown> = { ...content };
      delete next.source;
      if (!Array.isArray(next.images) || next.images.length === 0) {
        next.images = [{ image: "", caption: "", link: "" }];
      }
      onChange(next);
      return;
    }
    onChange({
      ...content,
      source: value,
      ...(value === "all" ? { itemIds: [] } : {}),
    });
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <TextField
          label="Eyebrow"
          value={pickStr(content, "eyebrow")}
          onChange={(value) => set("eyebrow", value)}
          maxLength={120}
        />
        <SelectField
          label="Layout"
          value={pickStr(content, "layout", "grid")}
          options={[
            { value: "grid", label: "Even grid" },
            { value: "masonry", label: "Masonry" },
          ]}
          onChange={(value) => set("layout", value)}
        />
        <SelectField
          label="Images from"
          value={source}
          options={[
            { value: "all", label: "Gallery module (all)" },
            { value: "selection", label: "Gallery module (pick)" },
            { value: "handPicked", label: "Hand-picked here" },
          ]}
          onChange={chooseSource}
        />
      </div>
      <TextField
        label="Heading"
        value={pickStr(content, "heading")}
        onChange={(value) => set("heading", value)}
        maxLength={200}
      />

      {source === "all" ? (
        <p className="text-xs text-muted">
          Shows every published image from the Gallery module, in module order.
        </p>
      ) : null}

      {source === "selection" ? (
        <CheckedList
          label="Pick gallery images"
          options={context.gallery}
          selected={pickArr(content, "itemIds").map((id) => String(id))}
          onChange={(ids) => set("itemIds", ids)}
        />
      ) : null}

      {source === "handPicked" ? (
        <fieldset>
          <legend className="mb-1 block text-xs font-semibold tracking-wide text-muted uppercase">
            Images
          </legend>
          <Repeater
            items={pickArr(content, "images")}
            onChange={(items) => set("images", items)}
            newItem={() => ({ image: "", caption: "", link: "" })}
            addLabel="+ Add image"
          >
            {(item, _, { update, remove }) => (
              <div className="space-y-3">
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={remove}
                    className="text-xs font-medium text-red-600 hover:underline"
                  >
                    Remove image
                  </button>
                </div>
                <MediaField
                  label="Image"
                  value={pickStr(item, "image")}
                  onChange={(value) => update({ image: value })}
                  media={context.media}
                />
                <div className="grid gap-3 sm:grid-cols-2">
                  <TextField
                    label="Caption"
                    value={pickStr(item, "caption")}
                    onChange={(value) => update({ caption: value })}
                    maxLength={200}
                  />
                  <TextField
                    label="Link (optional)"
                    value={pickStr(item, "link")}
                    onChange={(value) => update({ link: value })}
                    maxLength={500}
                  />
                </div>
              </div>
            )}
          </Repeater>
        </fieldset>
      ) : null}
    </div>
  );
}

function LeadFormForm({ content, onChange }: SectionFormProps) {
  const set = patch(content, onChange);
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <TextField
          label="Eyebrow"
          value={pickStr(content, "eyebrow")}
          onChange={(value) => set("eyebrow", value)}
          maxLength={120}
        />
        <TextField
          label="Heading"
          value={pickStr(content, "heading")}
          onChange={(value) => set("heading", value)}
          maxLength={200}
        />
      </div>
      <TextField
        label="Intro text"
        textarea
        rows={3}
        value={pickStr(content, "text")}
        onChange={(value) => set("text", value)}
        maxLength={1000}
      />
      <TextField
        label="Submit button label"
        value={pickStr(content, "submitLabel")}
        onChange={(value) => set("submitLabel", value)}
        maxLength={80}
      />
      <Toggle
        label="Show the accent slash after the heading"
        checked={pickBool(content, "showAccentSlash", true)}
        onChange={(value) => set("showAccentSlash", value)}
      />
    </div>
  );
}

function StatsForm({ content, onChange }: SectionFormProps) {
  const set = patch(content, onChange);
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <TextField
          label="Eyebrow"
          value={pickStr(content, "eyebrow")}
          onChange={(value) => set("eyebrow", value)}
          maxLength={120}
        />
        <TextField
          label="Heading"
          value={pickStr(content, "heading")}
          onChange={(value) => set("heading", value)}
          maxLength={200}
        />
      </div>
      <fieldset>
        <legend className="mb-1 block text-xs font-semibold tracking-wide text-muted uppercase">
          Stat items
        </legend>
        <Repeater
          items={pickArr(content, "items")}
          onChange={(items) => set("items", items)}
          newItem={() => ({ value: "", label: "" })}
          addLabel="+ Add stat"
        >
          {(item, _, { update, remove }) => (
            <div className="flex items-start gap-2">
              <div className="grid flex-1 gap-2 sm:grid-cols-2">
                <input
                  type="text"
                  value={pickStr(item, "value")}
                  aria-label="Stat value"
                  placeholder="500+"
                  onChange={(event) => update({ value: event.target.value })}
                  className="w-full rounded-brand border border-black/15 bg-white px-2 py-1.5 text-sm text-ink"
                />
                <input
                  type="text"
                  value={pickStr(item, "label")}
                  aria-label="Stat label"
                  placeholder="Clients trained"
                  onChange={(event) => update({ label: event.target.value })}
                  className="w-full rounded-brand border border-black/15 bg-white px-2 py-1.5 text-sm text-ink"
                />
              </div>
              <button
                type="button"
                onClick={remove}
                aria-label="Remove stat"
                className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-red-200 text-xs text-red-600"
              >
                ✕
              </button>
            </div>
          )}
        </Repeater>
      </fieldset>
    </div>
  );
}

function CtaBannerForm({ content, onChange, context }: SectionFormProps) {
  const set = patch(content, onChange);
  return (
    <div className="space-y-4">
      <TextField
        label="Eyebrow"
        value={pickStr(content, "eyebrow")}
        onChange={(value) => set("eyebrow", value)}
        maxLength={120}
      />
      <TextField
        label="Heading"
        value={pickStr(content, "heading")}
        onChange={(value) => set("heading", value)}
        maxLength={200}
      />
      <TextField
        label="Text"
        value={pickStr(content, "text")}
        textarea
        rows={3}
        onChange={(value) => set("text", value)}
        maxLength={500}
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <TextField
          label="Button label (empty hides)"
          value={pickStr(content, "ctaLabel")}
          onChange={(value) => set("ctaLabel", value)}
          maxLength={80}
        />
        <TextField
          label="Button link"
          value={pickStr(content, "ctaHref")}
          onChange={(value) => set("ctaHref", value)}
          maxLength={500}
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <MediaField
          label="Background image"
          value={pickStr(content, "image")}
          onChange={(value) => set("image", value)}
          media={context.media}
        />
        <NumberField
          label="Overlay opacity"
          value={pickNum(content, "overlayOpacity", 0.6)}
          min={0}
          max={1}
          onChange={(value) => set("overlayOpacity", value)}
        />
      </div>
    </div>
  );
}

function FaqForm({ content, onChange }: SectionFormProps) {
  const set = patch(content, onChange);
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <TextField
          label="Eyebrow"
          value={pickStr(content, "eyebrow")}
          onChange={(value) => set("eyebrow", value)}
          maxLength={120}
        />
        <TextField
          label="Heading"
          value={pickStr(content, "heading")}
          onChange={(value) => set("heading", value)}
          maxLength={200}
        />
      </div>
      <fieldset>
        <legend className="mb-1 block text-xs font-semibold tracking-wide text-muted uppercase">
          Questions
        </legend>
        <Repeater
          items={pickArr(content, "items")}
          onChange={(items) => set("items", items)}
          newItem={() => ({ question: "", answer: "" })}
          addLabel="+ Add question"
        >
          {(item, _, { update, remove }) => (
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <div className="grid flex-1 gap-2">
                  <input
                    type="text"
                    value={pickStr(item, "question")}
                    aria-label="Question"
                    placeholder="Question"
                    onChange={(event) =>
                      update({ question: event.target.value })
                    }
                    className="w-full rounded-brand border border-black/15 bg-white px-2 py-1.5 text-sm text-ink"
                  />
                  <textarea
                    rows={2}
                    value={pickStr(item, "answer")}
                    aria-label="Answer"
                    placeholder="Answer"
                    onChange={(event) => update({ answer: event.target.value })}
                    className="w-full rounded-brand border border-black/15 bg-white px-2 py-1.5 text-sm text-ink"
                  />
                </div>
                <button
                  type="button"
                  onClick={remove}
                  aria-label="Remove question"
                  className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-red-200 text-xs text-red-600"
                >
                  ✕
                </button>
              </div>
            </div>
          )}
        </Repeater>
      </fieldset>
    </div>
  );
}

function VideoForm({ content, onChange, context }: SectionFormProps) {
  const set = patch(content, onChange);
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <TextField
          label="Eyebrow"
          value={pickStr(content, "eyebrow")}
          onChange={(value) => set("eyebrow", value)}
          maxLength={120}
        />
        <TextField
          label="Heading"
          value={pickStr(content, "heading")}
          onChange={(value) => set("heading", value)}
          maxLength={200}
        />
      </div>
      <TextField
        label="YouTube, Vimeo or .mp4 URL"
        value={pickStr(content, "url")}
        onChange={(value) => set("url", value)}
        placeholder="https://www.youtube.com/watch?v=…"
        maxLength={500}
      />
      <MediaField
        label="Poster image"
        value={pickStr(content, "poster")}
        onChange={(value) => set("poster", value)}
        media={context.media}
      />
      <TextField
        label="Caption"
        value={pickStr(content, "caption")}
        onChange={(value) => set("caption", value)}
        maxLength={300}
      />
    </div>
  );
}

function ImageBannerForm({ content, onChange, context }: SectionFormProps) {
  const set = patch(content, onChange);
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <NumberField
          label="Autoplay (ms, 0 = off)"
          value={pickNum(content, "autoplayMs", 5000)}
          min={0}
          max={30000}
          onChange={(value) => set("autoplayMs", value)}
        />
        <SelectField
          label="Height"
          value={pickStr(content, "height", "auto")}
          options={[
            { value: "auto", label: "Natural" },
            { value: "short", label: "Short" },
            { value: "tall", label: "Tall" },
          ]}
          onChange={(value) => set("height", value)}
        />
      </div>
      <fieldset>
        <legend className="mb-1 block text-xs font-semibold tracking-wide text-muted uppercase">
          Slides
        </legend>
        <Repeater
          items={pickArr(content, "images")}
          onChange={(items) => set("images", items)}
          newItem={() => ({ image: "", caption: "", link: "" })}
          addLabel="+ Add image"
        >
          {(item, _, { update, remove }) => (
            <div className="space-y-3">
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={remove}
                  className="text-xs font-medium text-red-600 hover:underline"
                >
                  Remove image
                </button>
              </div>
              <MediaField
                label="Image"
                value={pickStr(item, "image")}
                onChange={(value) => update({ image: value })}
                media={context.media}
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <TextField
                  label="Caption"
                  value={pickStr(item, "caption")}
                  onChange={(value) => update({ caption: value })}
                  maxLength={300}
                />
                <TextField
                  label="Link (optional)"
                  value={pickStr(item, "link")}
                  onChange={(value) => update({ link: value })}
                  maxLength={500}
                />
              </div>
            </div>
          )}
        </Repeater>
      </fieldset>
    </div>
  );
}

function SpacerForm({ content, onChange }: SectionFormProps) {
  const set = patch(content, onChange);
  return (
    <div className="space-y-4">
      <NumberField
        label="Height (px)"
        value={pickNum(content, "height", 64)}
        min={8}
        max={320}
        onChange={(value) => set("height", value)}
      />
      <Toggle
        label="Show a divider line"
        checked={pickBool(content, "showLine", false)}
        onChange={(value) => set("showLine", value)}
      />
    </div>
  );
}

const TIMETABLE_DAY_LABELS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

function TimetableForm({ content, onChange }: SectionFormProps) {
  const set = patch(content, onChange);
  const days = pickArr(content, "days")
    .map((value) => Number(value))
    .filter((value) => Number.isInteger(value) && value >= 0 && value <= 6);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <TextField
          label="Eyebrow"
          value={pickStr(content, "eyebrow")}
          onChange={(value) => set("eyebrow", value)}
          maxLength={120}
        />
        <TextField
          label="Heading"
          value={pickStr(content, "heading")}
          onChange={(value) => set("heading", value)}
          maxLength={200}
        />
      </div>
      <Toggle
        label="Orange slash after heading"
        checked={pickBool(content, "showAccentSlash", true)}
        onChange={(value) => set("showAccentSlash", value)}
      />
      <fieldset>
        <legend className="mb-1 block text-xs font-semibold tracking-wide text-muted uppercase">
          Days to show (leave all off to show every day)
        </legend>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
          {TIMETABLE_DAY_LABELS.map((label, index) => {
            const active = days.includes(index);
            return (
              <Toggle
                key={label}
                label={label}
                checked={active}
                onChange={(checked) => {
                  const next = checked
                    ? [...days, index].sort((a, b) => a - b)
                    : days.filter((day) => day !== index);
                  set("days", next);
                }}
              />
            );
          })}
        </div>
      </fieldset>
    </div>
  );
}

function ContactInfoForm({ content, onChange }: SectionFormProps) {
  const set = patch(content, onChange);
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <TextField
          label="Eyebrow"
          value={pickStr(content, "eyebrow")}
          onChange={(value) => set("eyebrow", value)}
          maxLength={120}
        />
        <TextField
          label="Heading"
          value={pickStr(content, "heading")}
          onChange={(value) => set("heading", value)}
          maxLength={200}
        />
      </div>
      <Toggle
        label="Orange slash after heading"
        checked={pickBool(content, "showAccentSlash", true)}
        onChange={(value) => set("showAccentSlash", value)}
      />
      <TextField
        label="Intro text"
        value={pickStr(content, "text")}
        textarea
        rows={3}
        onChange={(value) => set("text", value)}
        maxLength={1000}
      />
      <fieldset>
        <legend className="mb-1 block text-xs font-semibold tracking-wide text-muted uppercase">
          Rows (values come from Settings → General)
        </legend>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
          <Toggle
            label="Address"
            checked={pickBool(content, "showAddress", true)}
            onChange={(value) => set("showAddress", value)}
          />
          <Toggle
            label="Phone"
            checked={pickBool(content, "showPhone", true)}
            onChange={(value) => set("showPhone", value)}
          />
          <Toggle
            label="WhatsApp"
            checked={pickBool(content, "showWhatsapp", true)}
            onChange={(value) => set("showWhatsapp", value)}
          />
          <Toggle
            label="Email"
            checked={pickBool(content, "showEmail", true)}
            onChange={(value) => set("showEmail", value)}
          />
          <Toggle
            label="Opening hours"
            checked={pickBool(content, "showHours", true)}
            onChange={(value) => set("showHours", value)}
          />
          <Toggle
            label="Map embed"
            checked={pickBool(content, "showMap", true)}
            onChange={(value) => set("showMap", value)}
          />
        </div>
      </fieldset>
    </div>
  );
}

const FORM_BY_TYPE: Record<string, (props: SectionFormProps) => ReactNode> = {
  "hero-slider": HeroSliderForm,
  "feature-cards": FeatureCardsForm,
  columns: ColumnsForm,
  "split-content": SplitContentForm,
  "rich-text": RichTextForm,
  "services-grid": (props) => (
    <ModulePickForm
      {...props}
      options={props.context.services.map((service) => ({
        id: service.id,
        label: service.title,
      }))}
      idKey="serviceIds"
      hasColumns
    />
  ),
  "trainers-grid": (props) => (
    <ModulePickForm
      {...props}
      options={props.context.trainers.map((trainer) => ({
        id: trainer.id,
        label: trainer.name,
      }))}
      idKey="trainerIds"
    />
  ),
  plans: (props) => (
    <ModulePickForm
      {...props}
      options={props.context.plans.map((plan) => ({
        id: plan.id,
        label: plan.name,
      }))}
      idKey="planIds"
    />
  ),
  "testimonials-slider": TestimonialsForm,
  gallery: GalleryForm,
  stats: StatsForm,
  "cta-banner": CtaBannerForm,
  faq: FaqForm,
  video: VideoForm,
  "image-banner": ImageBannerForm,
  spacer: SpacerForm,
  "lead-form": LeadFormForm,
  timetable: TimetableForm,
  "contact-info": ContactInfoForm,
};

/**
 * Dispatch to the admin form for a section type. Merges stored content over the
 * type's defaults so every editable field has a value even for older content.
 */
export function SectionFormFields(props: SectionFormProps) {
  const form = FORM_BY_TYPE[props.type];
  if (!form) {
    return (
      <p className="text-xs text-red-600">
        No editor for section type &quot;{props.type}&quot; yet.
      </p>
    );
  }
  const merged = {
    ...sectionDefaults(props.type as never),
    ...(props.content ?? {}),
  };
  return form({ ...props, content: merged });
}
