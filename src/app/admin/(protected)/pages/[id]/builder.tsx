"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";

import { MediaField } from "@/components/sections/fields";
import {
  SectionFormFields,
  type SectionFormContext,
} from "@/components/sections/forms";
import { ActionForm } from "@/components/ui/action-form";
import { Field } from "@/components/ui/field";
import { inputClass, labelClass } from "@/components/ui/styles";
import { SubmitButton } from "@/components/ui/submit-button";
import {
  SECTION_REGISTRY,
  SECTION_TYPES,
  sectionDefaults,
  sectionMetaFor,
  type SectionGroup,
  type SectionTypeValue,
} from "@/lib/sections/types";
import {
  publishPageAction,
  revertPageAction,
  savePageMetaAction,
  saveSectionsAction,
} from "@/server/actions/pages";

export type BuilderDraftSection = {
  key: string;
  type: string;
  content: Record<string, unknown>;
  style: Record<string, unknown>;
  isVisible: boolean;
  visibilityDevices: "all" | "desktop" | "mobile";
};

export type BuilderVersion = {
  id: string;
  label: string;
  createdAt: string;
  isCurrent: boolean;
};

type BuilderProps = {
  page: {
    id: string;
    title: string;
    slug: string;
    isHome: boolean;
    status: "DRAFT" | "PUBLISHED" | "SCHEDULED";
    noindex: boolean;
    seoTitle: string | null;
    seoDescription: string | null;
    ogImageId: string | null;
    publishAt: string | null;
    hasUnpublishedChanges: boolean;
    published: boolean;
  };
  drafts: BuilderDraftSection[];
  versions: BuilderVersion[];
  canWrite: boolean;
  canPublish: boolean;
  context: SectionFormContext;
};

const STATUS_META: Record<BuilderProps["page"]["status"], string> = {
  DRAFT: "bg-stone-100 text-stone-600",
  PUBLISHED: "bg-emerald-100 text-emerald-700",
  SCHEDULED: "bg-amber-100 text-amber-700",
};

const STATUS_LABEL: Record<BuilderProps["page"]["status"], string> = {
  DRAFT: "Draft",
  PUBLISHED: "Live",
  SCHEDULED: "Scheduled",
};

/** JSON fingerprint of the draft, ignoring client-side row keys. */
function serialize(drafts: BuilderDraftSection[]): string {
  return JSON.stringify(
    drafts.map((section) => {
      const copy: Partial<BuilderDraftSection> = { ...section };
      delete copy.key;
      return copy;
    }),
  );
}

function toDateTimeLocal(iso: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate(),
  )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function formatWhen(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

// ---------------------------------------------------------------------------
// Save / publish forms (each with its own ActionForm + state)
// ---------------------------------------------------------------------------

function SaveDraftForm({
  pageId,
  drafts,
  disabled,
  onSaved,
}: {
  pageId: string;
  drafts: BuilderDraftSection[];
  disabled: boolean;
  onSaved: () => void;
}) {
  const serialized = JSON.stringify(drafts);
  return (
    <ActionForm action={saveSectionsAction} className="contents">
      {(state) => (
        <SaveInner
          state={state}
          pageId={pageId}
          serialized={serialized}
          disabled={disabled}
          onSaved={onSaved}
        />
      )}
    </ActionForm>
  );
}

function SaveInner({
  state,
  pageId,
  serialized,
  disabled,
  onSaved,
}: {
  state: { ok: boolean; message?: string; error?: string };
  pageId: string;
  serialized: string;
  disabled: boolean;
  onSaved: () => void;
}) {
  useEffect(() => {
    if (state.ok) onSaved();
    // `onSaved` closes over the drafts at the moment the save resolved.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.ok]);
  return (
    <>
      <input type="hidden" name="pageId" value={pageId} />
      <input type="hidden" name="sections" value={serialized} />
      <SubmitButton
        variant="outline"
        className="px-4 py-2 text-[0.7rem]"
        pendingLabel="Saving…"
        disabled={disabled}
      >
        Save draft
      </SubmitButton>
      {state.message && !disabled ? (
        <span className="text-xs font-medium text-emerald-700">
          {state.message}
        </span>
      ) : null}
      {state.error ? (
        <span className="text-xs font-medium text-red-600">{state.error}</span>
      ) : null}
    </>
  );
}

function PublishForm({
  pageId,
  drafts,
  disabled,
  onPublished,
}: {
  pageId: string;
  drafts: BuilderDraftSection[];
  disabled: boolean;
  onPublished: () => void;
}) {
  const serialized = JSON.stringify(drafts);
  return (
    <ActionForm action={publishPageAction} className="contents">
      {(state) => (
        <PublishInner
          state={state}
          pageId={pageId}
          serialized={serialized}
          disabled={disabled}
          onPublished={onPublished}
        />
      )}
    </ActionForm>
  );
}

function PublishInner({
  state,
  pageId,
  serialized,
  disabled,
  onPublished,
}: {
  state: { ok: boolean; message?: string; error?: string };
  pageId: string;
  serialized: string;
  disabled: boolean;
  onPublished: () => void;
}) {
  useEffect(() => {
    if (state.ok) onPublished();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.ok]);
  return (
    <>
      <input type="hidden" name="pageId" value={pageId} />
      <input type="hidden" name="sections" value={serialized} />
      <SubmitButton
        className="px-4 py-2 text-[0.7rem]"
        pendingLabel="Publishing…"
        disabled={disabled}
      >
        Publish
      </SubmitButton>
      {state.message ? (
        <span className="text-xs font-medium text-emerald-700">
          {state.message}
        </span>
      ) : null}
      {state.error ? (
        <span className="text-xs font-medium text-red-600">{state.error}</span>
      ) : null}
    </>
  );
}

// ---------------------------------------------------------------------------
// Section editor
// ---------------------------------------------------------------------------

const PADDING_OPTIONS = [
  { value: "none", label: "No padding" },
  { value: "sm", label: "Small" },
  { value: "md", label: "Medium" },
  { value: "lg", label: "Large" },
];

const MAX_WIDTH_OPTIONS = [
  { value: "narrow", label: "Narrow" },
  { value: "default", label: "Default" },
  { value: "wide", label: "Wide" },
];

function StyleControls({
  section,
  onChange,
}: {
  section: BuilderDraftSection;
  onChange: (style: Record<string, unknown>) => void;
}) {
  const style = section.style ?? {};
  return (
    <details className="mt-4 rounded-brand bg-black/[0.03] px-3 py-2">
      <summary className="cursor-pointer text-[0.7rem] font-semibold tracking-wide text-muted uppercase">
        Section style
      </summary>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <label className="block">
          <span className={labelClass}>Background</span>
          <input
            type="text"
            value={typeof style.background === "string" ? style.background : ""}
            placeholder="#ffffff"
            onChange={(event) =>
              onChange({ ...style, background: event.target.value })
            }
            className={inputClass}
          />
        </label>
        <label className="block">
          <span className={labelClass}>Text colour</span>
          <input
            type="text"
            value={typeof style.textColor === "string" ? style.textColor : ""}
            placeholder="inherit"
            onChange={(event) =>
              onChange({ ...style, textColor: event.target.value })
            }
            className={inputClass}
          />
        </label>
        <label className="block">
          <span className={labelClass}>Vertical padding</span>
          <select
            value={typeof style.paddingY === "string" ? style.paddingY : "md"}
            onChange={(event) =>
              onChange({ ...style, paddingY: event.target.value })
            }
            className={inputClass}
          >
            {PADDING_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className={labelClass}>Content width</span>
          <select
            value={
              typeof style.maxWidth === "string" ? style.maxWidth : "default"
            }
            onChange={(event) =>
              onChange({ ...style, maxWidth: event.target.value })
            }
            className={inputClass}
          >
            {MAX_WIDTH_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>
    </details>
  );
}

function IconButton({
  onClick,
  label,
  children,
  disabled,
  danger = false,
}: {
  onClick: () => void;
  label: string;
  children: ReactNode;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={`grid h-7 w-7 place-items-center rounded-full border text-xs ${
        danger
          ? "border-red-200 text-red-600 hover:bg-red-50"
          : "border-black/10 hover:bg-black/5"
      } disabled:cursor-not-allowed disabled:opacity-30`}
    >
      {children}
    </button>
  );
}

function SectionCard({
  section,
  index,
  total,
  canEdit,
  context,
  onChange,
  onMove,
  onDuplicate,
  onRemove,
}: {
  section: BuilderDraftSection;
  index: number;
  total: number;
  canEdit: boolean;
  context: SectionFormContext;
  onChange: (next: BuilderDraftSection) => void;
  onMove: (direction: -1 | 1) => void;
  onDuplicate: () => void;
  onRemove: () => void;
}) {
  const meta = sectionMetaFor(section.type);
  if (!meta) return null;

  const update = (patch: Partial<BuilderDraftSection>) =>
    onChange({ ...section, ...patch });

  return (
    <div
      className={`rounded-brand border bg-white p-4 shadow-sm ${
        section.isVisible
          ? "border-black/10"
          : "border-dashed border-black/20 opacity-70"
      }`}
    >
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-ink">{meta.label}</span>
          <span className="rounded-full bg-black/5 px-2 py-0.5 text-[0.6rem] font-bold text-muted">
            {meta.group}
          </span>
          {!section.isVisible ? (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[0.6rem] font-bold text-amber-700">
              Hidden
            </span>
          ) : null}
          {section.visibilityDevices !== "all" ? (
            <span className="rounded-full bg-navy/5 px-2 py-0.5 text-[0.6rem] font-bold text-navy">
              {section.visibilityDevices === "desktop"
                ? "Desktop only"
                : "Mobile only"}
            </span>
          ) : null}
        </div>
        <div className="ml-auto flex items-center gap-1">
          {canEdit ? (
            <>
              <select
                value={section.visibilityDevices}
                aria-label="Show on devices"
                title="Show on devices"
                onChange={(event) =>
                  update({
                    visibilityDevices: event.target.value as
                      "all" | "desktop" | "mobile",
                  })
                }
                className="rounded-full border border-black/10 bg-white px-2 py-1 text-[0.6rem] text-ink"
              >
                <option value="all">All devices</option>
                <option value="desktop">Desktop</option>
                <option value="mobile">Mobile</option>
              </select>
              <IconButton
                label={section.isVisible ? "Hide section" : "Show section"}
                onClick={() => update({ isVisible: !section.isVisible })}
              >
                {section.isVisible ? "👁" : "🚫"}
              </IconButton>
              <IconButton
                label="Move up"
                onClick={() => onMove(-1)}
                disabled={index === 0}
              >
                ↑
              </IconButton>
              <IconButton
                label="Move down"
                onClick={() => onMove(1)}
                disabled={index === total - 1}
              >
                ↓
              </IconButton>
              <IconButton
                label="Duplicate section"
                onClick={() => onDuplicate()}
              >
                ⧉
              </IconButton>
              <IconButton
                label="Delete section"
                onClick={() => onRemove()}
                danger
              >
                ✕
              </IconButton>
            </>
          ) : null}
        </div>
      </div>

      {section.isVisible && canEdit ? (
        <SectionFormFields
          type={section.type}
          content={section.content ?? {}}
          onChange={(content) => update({ content })}
          context={context}
        />
      ) : null}

      {canEdit ? (
        <StyleControls
          section={section}
          onChange={(style) => update({ style })}
        />
      ) : null}
    </div>
  );
}

function AddSectionMenu({
  onAdd,
}: {
  onAdd: (type: SectionTypeValue) => void;
}) {
  const groups: SectionGroup[] = [
    "Layout",
    "Hero & banners",
    "Text & media",
    "Lists & proof",
    "Modules",
    "Utilities",
  ];
  return (
    <details className="rounded-brand border border-black/15 bg-white">
      <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-accent">
        + Add section
      </summary>
      <div className="max-h-80 space-y-4 overflow-y-auto border-t border-black/10 p-4">
        {groups.map((group) => {
          const types = SECTION_TYPES.filter(
            (type) => SECTION_REGISTRY[type].group === group,
          );
          if (types.length === 0) return null;
          return (
            <section key={group}>
              <h4 className="mb-2 text-[0.65rem] font-bold tracking-wide text-muted uppercase">
                {group}
              </h4>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {types.map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => onAdd(type)}
                    className="rounded-brand border border-black/10 bg-black/[0.02] px-3 py-2 text-left text-xs font-semibold text-ink transition hover:border-accent hover:text-accent"
                  >
                    {SECTION_REGISTRY[type].label}
                  </button>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </details>
  );
}

// ---------------------------------------------------------------------------
// Preview
// ---------------------------------------------------------------------------

const DEVICES = [
  { id: "desktop", label: "Desktop", width: "100%" },
  { id: "tablet", label: "Tablet", width: 768 },
  { id: "mobile", label: "Mobile", width: 375 },
] as const;

function DevicePreview({
  pageId,
  revision,
  onRefresh,
  device,
  onDevice,
}: {
  pageId: string;
  revision: number;
  onRefresh: () => void;
  device: (typeof DEVICES)[number]["id"];
  onDevice: (device: (typeof DEVICES)[number]["id"]) => void;
}) {
  const active = DEVICES.find((entry) => entry.id === device) ?? DEVICES[0];
  const frameWidth =
    typeof active.width === "number" ? `${active.width}px` : "100%";
  return (
    <div className="rounded-brand border border-black/10 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center gap-2">
        <span className={labelClass}>Live preview</span>
        <div
          className="ml-auto flex items-center gap-1"
          role="group"
          aria-label="Preview device"
        >
          {DEVICES.map((entry) => (
            <button
              key={entry.id}
              type="button"
              onClick={() => onDevice(entry.id)}
              aria-pressed={device === entry.id}
              className={`rounded-full px-3 py-1 text-[0.65rem] font-bold transition ${
                device === entry.id
                  ? "bg-accent text-white"
                  : "bg-black/5 text-muted hover:bg-black/10"
              }`}
            >
              {entry.label}
            </button>
          ))}
          <button
            type="button"
            onClick={onRefresh}
            className="ml-1 rounded-full border border-black/10 px-3 py-1 text-[0.65rem] font-bold text-ink hover:bg-black/5"
          >
            ↻ Refresh
          </button>
        </div>
      </div>
      <p className="mb-3 text-[0.65rem] text-muted">
        Shows the saved draft. Save first, then refresh to see newer edits.
      </p>
      <div className="overflow-x-auto pb-2">
        <div
          className={`mx-auto overflow-hidden rounded-brand border border-black/10 bg-white shadow-md ${
            device === "mobile" || device === "tablet" ? "border-4" : ""
          }`}
          style={{ width: frameWidth, maxWidth: "100%" }}
        >
          <iframe
            title="Page preview"
            src={`/preview/${pageId}?v=${revision}`}
            className="h-[640px] w-full border-0 bg-white"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tabs
// ---------------------------------------------------------------------------

type TabId = "sections" | "settings" | "versions";

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full px-4 py-1.5 text-xs font-bold transition ${
        active ? "bg-ink text-white" : "bg-black/5 text-muted hover:bg-black/10"
      }`}
    >
      {children}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Versions tab
// ---------------------------------------------------------------------------

function RevertForm({
  pageId,
  version,
}: {
  pageId: string;
  version: BuilderVersion;
}) {
  return (
    <ActionForm action={revertPageAction} className="contents">
      {(state) => (
        <RevertInner state={state} pageId={pageId} versionId={version.id} />
      )}
    </ActionForm>
  );
}

function RevertInner({
  state,
  pageId,
  versionId,
}: {
  state: { ok: boolean; message?: string; error?: string };
  pageId: string;
  versionId: string;
}) {
  useEffect(() => {
    if (state.ok) {
      const timer = window.setTimeout(() => window.location.reload(), 700);
      return () => window.clearTimeout(timer);
    }
    return undefined;
  }, [state.ok]);
  return (
    <>
      <input type="hidden" name="pageId" value={pageId} />
      <input type="hidden" name="versionId" value={versionId} />
      <SubmitButton variant="outline" className="px-3 py-1 text-[0.65rem]">
        Restore draft
      </SubmitButton>
      {state.message ? (
        <span className="text-xs font-medium text-emerald-700">
          {state.message}
        </span>
      ) : null}
      {state.error ? (
        <span className="text-xs font-medium text-red-600">{state.error}</span>
      ) : null}
    </>
  );
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

export function PageBuilder(props: BuilderProps) {
  const { page, context } = props;
  const [drafts, setDrafts] = useState<BuilderDraftSection[]>(props.drafts);
  const [savedSnapshot, setSavedSnapshot] = useState(() =>
    serialize(props.drafts),
  );
  const [tab, setTab] = useState<TabId>("sections");
  const [device, setDevice] =
    useState<(typeof DEVICES)[number]["id"]>("desktop");
  const [revision, setRevision] = useState(0);

  const move = (from: number, direction: -1 | 1) => {
    const to = from + direction;
    if (to < 0 || to >= drafts.length) return;
    const next = [...drafts];
    [next[from], next[to]] = [next[to], next[from]];
    setDrafts(next);
  };

  const duplicate = (index: number) => {
    if (index < 0 || index >= drafts.length) return;
    const copy: BuilderDraftSection = {
      ...drafts[index],
      key: crypto.randomUUID(),
    };
    setDrafts([
      ...drafts.slice(0, index + 1),
      copy,
      ...drafts.slice(index + 1),
    ]);
  };

  const remove = (index: number) => {
    if (drafts.length <= 1 || index < 0 || index >= drafts.length) return;
    setDrafts(drafts.filter((_, i) => i !== index));
  };

  const updateSection = (index: number, next: BuilderDraftSection) =>
    setDrafts(drafts.map((section, i) => (i === index ? next : section)));

  const addSection = (type: SectionTypeValue) => {
    setDrafts([
      ...drafts,
      {
        key: crypto.randomUUID(),
        type,
        content: sectionDefaults(type),
        style: {
          background: "",
          textColor: "",
          paddingY: "md",
          maxWidth: "default",
        },
        isVisible: true,
        visibilityDevices: "all",
      },
    ]);
  };

  const dirty = serialize(drafts) !== savedSnapshot;

  const publicHref = page.isHome ? "/" : `/${page.slug}`;

  return (
    <div className="mx-auto w-full max-w-[1400px] space-y-6">
      <header className="flex flex-wrap items-center gap-3">
        <Link
          href="/admin/pages"
          className="text-xs font-bold text-accent hover:underline"
        >
          ← All pages
        </Link>
        <span
          className={`rounded-full px-2.5 py-0.5 text-[0.65rem] font-bold ${
            STATUS_META[page.status]
          }`}
        >
          {STATUS_LABEL[page.status]}
        </span>
        {page.published && page.hasUnpublishedChanges ? (
          <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[0.65rem] font-bold text-amber-700">
            Unpublished changes
          </span>
        ) : null}
      </header>

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="heading-display text-3xl text-ink">{page.title}</h1>
          <p className="mt-1 text-sm text-muted">
            {page.isHome ? "/" : `/${page.slug}`}
            {page.published ? (
              <>
                {" · "}
                <a
                  href={publicHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-accent hover:underline"
                >
                  view live ↗
                </a>
              </>
            ) : (
              " · not published yet"
            )}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <SaveDraftForm
            pageId={page.id}
            drafts={drafts}
            disabled={!props.canWrite}
            onSaved={() => setSavedSnapshot(serialize(drafts))}
          />
          <PublishForm
            pageId={page.id}
            drafts={drafts}
            disabled={!props.canPublish}
            onPublished={() => setSavedSnapshot(serialize(drafts))}
          />
          {props.canWrite ? (
            <Link
              href="/admin/menus"
              className="btn px-4 py-2 text-[0.7rem]"
              title="Open the menu manager to add this page to the header/footer."
            >
              Add to menu
            </Link>
          ) : null}
        </div>
      </div>

      {dirty ? (
        <p role="status" className="text-xs font-semibold text-amber-700">
          You have unsaved changes — press &ldquo;Save draft&rdquo; (or
          &ldquo;Publish&rdquo;, which saves and publishes together).
        </p>
      ) : (
        <p className="text-xs text-muted">
          Draft is saved. Edits below are not live until published.
        </p>
      )}

      {!props.canWrite && !props.canPublish ? (
        <div className="rounded-brand border border-dashed border-black/20 bg-white p-6 text-sm text-muted">
          Read-only: your role can view this page but not edit or publish it.
        </div>
      ) : null}

      <div className="grid gap-8 xl:grid-cols-2">
        {/* Editor column */}
        <div className="order-2 min-w-0 space-y-6 xl:order-1">
          <div className="flex flex-wrap items-center gap-2">
            <TabButton
              active={tab === "sections"}
              onClick={() => setTab("sections")}
            >
              Sections ({drafts.length})
            </TabButton>
            <TabButton
              active={tab === "settings"}
              onClick={() => setTab("settings")}
            >
              Page settings
            </TabButton>
            <TabButton
              active={tab === "versions"}
              onClick={() => setTab("versions")}
            >
              Versions ({props.versions.length})
            </TabButton>
          </div>

          {tab === "sections" ? (
            props.canWrite ? (
              <div className="space-y-4">
                <AddSectionMenu onAdd={addSection} />
                {drafts.length === 0 ? (
                  <p className="rounded-brand border border-dashed border-black/20 p-8 text-center text-sm text-muted">
                    No sections yet — add your first block above.
                  </p>
                ) : (
                  <ul className="space-y-4">
                    {drafts.map((section, index) => (
                      <li key={section.key}>
                        <SectionCard
                          section={section}
                          index={index}
                          total={drafts.length}
                          canEdit
                          context={context}
                          onChange={(next) => updateSection(index, next)}
                          onMove={(direction) => move(index, direction)}
                          onDuplicate={() => duplicate(index)}
                          onRemove={() => remove(index)}
                        />
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted">
                Editing is disabled for your role.
              </p>
            )
          ) : null}

          {tab === "settings" && props.canWrite ? (
            <SettingsForm {...props} />
          ) : null}
          {tab === "settings" && !props.canWrite ? (
            <p className="text-sm text-muted">
              Editing is disabled for your role.
            </p>
          ) : null}

          {tab === "versions" ? (
            <div className="space-y-3">
              {props.versions.length === 0 ? (
                <p className="rounded-brand border border-dashed border-black/20 p-6 text-sm text-muted">
                  No published versions yet. Publish once to create one.
                </p>
              ) : (
                <ul className="space-y-2">
                  {props.versions.map((version) => (
                    <li
                      key={version.id}
                      className="flex flex-wrap items-center gap-3 rounded-brand border border-black/10 bg-white px-4 py-3 shadow-sm"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-ink">
                          {version.label}
                          {version.isCurrent ? (
                            <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-[0.6rem] font-bold text-emerald-700">
                              Current version
                            </span>
                          ) : null}
                        </p>
                        <p className="text-xs text-muted">
                          {formatWhen(version.createdAt)}
                        </p>
                      </div>
                      {!version.isCurrent && props.canWrite ? (
                        <RevertForm pageId={page.id} version={version} />
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
              <p className="text-xs text-muted">
                Restoring a version replaces the working draft with that
                snapshot. You still need to publish for it to go live.
              </p>
            </div>
          ) : null}
        </div>

        {/* Preview column */}
        <div className="order-1 min-w-0 xl:order-2">
          <DevicePreview
            pageId={page.id}
            revision={revision}
            onRefresh={() => setRevision((value) => value + 1)}
            device={device}
            onDevice={setDevice}
          />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Settings tab
// ---------------------------------------------------------------------------

function SettingsForm(props: BuilderProps) {
  const { page, context } = props;
  const [ogImage, setOgImage] = useState(page.ogImageId ?? "");
  return (
    <ActionForm action={savePageMetaAction} className="space-y-5">
      {(state) => (
        <>
          <input type="hidden" name="pageId" value={page.id} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Page name"
              htmlFor="builder-title"
              error={state.fieldErrors?.title?.[0]}
            >
              <input
                id="builder-title"
                name="title"
                defaultValue={page.title}
                required
                maxLength={200}
                className={inputClass}
              />
            </Field>
            <Field
              label="Web address (slug)"
              htmlFor="builder-slug"
              hint={
                page.isHome
                  ? "The home page is always served at /"
                  : "Leave as-is unless you need to rename the URL."
              }
            >
              <input
                id="builder-slug"
                name="slug"
                defaultValue={page.slug}
                maxLength={80}
                disabled={page.isHome}
                className={inputClass}
              />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="SEO title" htmlFor="builder-seo-title">
              <input
                id="builder-seo-title"
                name="seoTitle"
                defaultValue={page.seoTitle ?? ""}
                maxLength={200}
                className={inputClass}
              />
            </Field>
            <Field label="SEO description" htmlFor="builder-seo-description">
              <textarea
                id="builder-seo-description"
                name="seoDescription"
                defaultValue={page.seoDescription ?? ""}
                rows={2}
                maxLength={400}
                className={inputClass}
              />
            </Field>
          </div>

          <MediaField
            label="Share image (Open Graph)"
            name="ogImageId"
            value={ogImage}
            onChange={setOgImage}
            media={context.media}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex items-center gap-2 text-sm text-ink">
              <input
                type="checkbox"
                name="noindex"
                defaultChecked={page.noindex}
                className="h-4 w-4"
              />
              Hide from search engines (noindex)
            </label>
            <label className="flex items-center gap-2 text-sm text-ink">
              <input
                type="checkbox"
                name="isHome"
                defaultChecked={page.isHome}
                disabled={page.isHome}
                className="h-4 w-4"
              />
              Make this the home page
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Status" htmlFor="builder-status">
              <select
                id="builder-status"
                name="status"
                defaultValue={page.status}
                className={inputClass}
              >
                <option value="DRAFT">Draft (hidden)</option>
                <option value="PUBLISHED">Published (live)</option>
                <option value="SCHEDULED">Scheduled</option>
              </select>
            </Field>
            <Field
              label="Publish at (local time)"
              htmlFor="builder-publish-at"
              hint="Choosing a future date + time auto-switches the status to Scheduled."
            >
              <input
                id="builder-publish-at"
                name="publishAt"
                type="datetime-local"
                defaultValue={toDateTimeLocal(page.publishAt)}
                className={inputClass}
              />
            </Field>
          </div>

          {state.message ? (
            <p role="status" className="text-sm font-medium text-emerald-700">
              {state.message}
            </p>
          ) : null}
          {state.error ? (
            <p role="alert" className="text-sm font-medium text-red-600">
              {state.error}
            </p>
          ) : null}

          <SubmitButton className="px-5 py-2.5 text-[0.7rem]">
            Save settings
          </SubmitButton>
        </>
      )}
    </ActionForm>
  );
}
