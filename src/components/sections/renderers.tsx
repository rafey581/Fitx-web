/**
 * Public renderers for every section type (PRD §6, §10, §16). This module is
 * server-only: section content is arbitrary JSON, so renderers resolve media
 * rows, pull module data (services/trainers/plans/testimonials) and escape all
 * text through React. Interactive pieces (sliders) delegate to the small client
 * component `Slider`. Unknown or legacy types are skipped, never crashed on.
 */
import { cache, Fragment, type ReactNode } from "react";

import Link from "next/link";

import { prisma } from "@/lib/db";
import { mediaSrc, mediaUrl } from "@/lib/media-url";
import { getSiteSettings } from "@/lib/site/settings";
import {
  pickArr,
  pickBool,
  pickNum,
  pickStr,
  sectionMetaFor,
  type SectionStyle,
} from "@/lib/sections/types";

import { LeadForm } from "@/components/site/lead-form";
import { Home3DHero } from "@/components/site/Home3DHero";

import { Slider } from "./slider";

export type RenderableSection = {
  id?: string | null;
  type: string;
  content: Record<string, unknown>;
  style?: Record<string, unknown>;
  isVisible: boolean;
  visibilityDevices?: string;
};

// ---------------------------------------------------------------------------
// Media + link helpers (media rows are small; memoised per request)
// ---------------------------------------------------------------------------

const getMedia = cache(async (id: string) => {
  if (!id) return null;
  const row = await prisma.media.findUnique({
    where: { id },
    select: { path: true, variants: true },
  });
  if (!row) return null;
  return {
    path: row.path,
    variants: row.variants as Record<string, string> | null,
  };
});

/** Allow only safe link targets (never `javascript:`). Relative paths are fine. */
export function safeHref(value: string | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (/^\s*javascript:/i.test(trimmed)) return null;
  if (/^(https?:)?\/\//i.test(trimmed) || trimmed.startsWith("#"))
    return trimmed;
  return `/${trimmed}`;
}

async function SiteImage({
  id,
  alt = "",
  className,
  width = 1600,
}: {
  id: string;
  alt?: string;
  className?: string;
  width?: number;
}) {
  const media = await getMedia(id);
  if (!media) {
    // No media row yet — render an on-brand gradient panel rather than a grey
    // void, so image-less pages still look intentional.
    return (
      <div aria-hidden="true" className={`media-placeholder ${className ?? ""}`} />
    );
  }
  const { src, width: resolvedWidth } = mediaSrc(media, width);
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} width={resolvedWidth} className={className} />
  );
}

// ---------------------------------------------------------------------------
// Shared heading component (PRD 16.3: eyebrow + heavy heading + orange slash)
// ---------------------------------------------------------------------------

function Heading({
  eyebrow,
  heading,
  slash = true,
  align = "left",
  light = false,
  size = "md",
  as: Tag = "h2",
}: {
  eyebrow?: string;
  heading?: string;
  slash?: boolean;
  align?: "left" | "center";
  light?: boolean;
  size?: "md" | "lg";
  as?: "h1" | "h2" | "h3";
}) {
  const alignClass = align === "center" ? "text-center" : "";
  const sizeClass = size === "lg" ? "text-4xl sm:text-6xl" : "text-3xl sm:text-5xl";
  if (!eyebrow && !heading) return null;
  return (
    <div className={alignClass}>
      {eyebrow ? (
        <p className={`eyebrow eyebrow-bar ${align === "center" ? "justify-center" : ""}`}>
          {eyebrow}
        </p>
      ) : null}
      {heading ? (
        <Tag
          className={`heading-display mt-4 ${sizeClass} ${
            slash ? "heading-slash" : ""
          } ${light ? "text-white" : "text-ink"}`}
        >
          {heading}
        </Tag>
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Icons (small inline set; admin picks by name)
// ---------------------------------------------------------------------------

const ICON_PATHS: Record<string, ReactNode> = {
  dumbbell: (
    <>
      <path d="M6.5 6.5v11M17.5 6.5v11M3 9v6M21 9v6M6.5 12h11" />
    </>
  ),
  glove: (
    <>
      <path d="M14 4c-3 0-5 2.5-5 5.5V15l-1-2c-1.5-2-4-1.5-4.5.5C3 15.5 4 18 5.5 19.5c2 2 5 2.5 8 1.5 3.5-1 6-4 6-7.5 0-2-1-4-3-5 0 0-1 2-2 3" />
    </>
  ),
  lotus: (
    <>
      <path d="M12 20c-3 0-5.5-4.5-5.5-9C6.5 7 9.5 5 12 5s5.5 2 5.5 6c0 4.5-2.5 9-5.5 9Z" />
      <path d="M5.5 10C4 7 4.5 4.5 6 3c2 1.5 2.5 3.5 2 6M18.5 10c1.5-3 1-5.5-.5-7-2 1.5-2.5 3.5-2 6" />
    </>
  ),
  heart: (
    <path d="M12 20s-7-4.5-9-9c-1.5-3.5 1-7 4.5-7 2 0 3.5 1 4.5 2.5C13 5 14.5 4 16.5 4c3.5 0 6 3.5 4.5 7-2 4.5-9 9-9 9Z" />
  ),
  shield: <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3Z" />,
  star: (
    <path d="M12 3l2.7 5.6 6.3.8-4.6 4.3 1.2 6.1L12 16.9 6.4 19.8l1.2-6.1L3 9.4l6.3-.8L12 3Z" />
  ),
  flame: (
    <path d="M12 3c1 4-4 6-4 11a4 4 0 0 0 8 0c0-2-1-3.5-2-5-.5 1.5-1.5 2-2 2 1-3 0-5.5 0-8Z" />
  ),
};

function Icon({ name, className }: { name: string; className?: string }) {
  const path = ICON_PATHS[name];
  if (!path) return null;
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className ?? "h-6 w-6"}
    >
      {path}
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Section shell (per-section styling: background, text colour, padding, width)
// ---------------------------------------------------------------------------

const PADDING: Record<string, string> = {
  none: "",
  sm: "py-8",
  md: "py-16",
  lg: "py-24",
};

const MAX_WIDTH: Record<string, string> = {
  narrow: "max-w-3xl",
  default: "max-w-6xl",
  wide: "max-w-7xl",
};

function SectionShell({
  style,
  visibilityDevices,
  contain = true,
  className = "",
  children,
}: {
  style?: Record<string, unknown>;
  visibilityDevices?: string;
  contain?: boolean;
  className?: string;
  children: ReactNode;
}) {
  const background = pickStr(style ?? {}, "background");
  const textColor = pickStr(style ?? {}, "textColor");
  const padClass = PADDING[pickStr(style ?? {}, "paddingY", "md")] ?? "py-16";
  const widthClass =
    MAX_WIDTH[pickStr(style ?? {}, "maxWidth", "default")] ?? "max-w-6xl";
  const deviceClass =
    visibilityDevices === "desktop"
      ? "hidden md:block"
      : visibilityDevices === "mobile"
        ? "md:hidden"
        : "";
  return (
    <div className={deviceClass}>
      <section
        className={`relative ${padClass} ${className}`}
        style={{
          background: background || undefined,
          color: textColor || undefined,
        }}
      >
        {contain ? (
          <div className={`mx-auto w-full px-4 sm:px-6 ${widthClass}`}>
            {children}
          </div>
        ) : (
          children
        )}
      </section>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Per-type renderers
// ---------------------------------------------------------------------------

async function HeroSlider({
  content,
  style,
}: {
  content: Record<string, unknown>;
  style?: Record<string, unknown>;
}) {
  const autoplay = pickNum(content, "autoplayMs", 6000);
  const overlay = pickNum(content, "overlayOpacity", 0.55);
  const tall = pickStr(content, "height", "full") === "full";
  const arrows = pickBool(content, "arrows", true);
  const dots = pickBool(content, "dots", true);

  const slideNodes = await Promise.all(
    pickArr(content, "slides").map(async (raw, index) => {
      const slide = raw as Record<string, unknown>;
      const image = await getMedia(pickStr(slide, "image"));
      const logo = await getMedia(pickStr(slide, "logoImage"));
      const centered = pickStr(slide, "ctaPosition", "right") === "center";
      const href = safeHref(pickStr(slide, "ctaHref"));
      return (
        <div
          key={index}
          className={`relative flex overflow-hidden bg-ink ${
            tall ? "min-h-[92svh]" : "min-h-[68svh]"
          }`}
        >
          {/* Layered backdrop: arena gradient, optional photo, grid and glow. */}
          <div aria-hidden="true" className="absolute inset-0 bg-arena" />
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={mediaUrl(image)}
              alt=""
              className="absolute inset-0 h-full w-full object-cover opacity-70"
            />
          ) : null}
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-grid-overlay opacity-60"
          />
          <div
            aria-hidden="true"
            className="absolute -bottom-48 -left-40 h-[36rem] w-[36rem] rounded-full bg-accent/25 blur-3xl"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-t from-ink via-ink/70 to-ink/30"
            style={{ opacity: Math.min(1, overlay + 0.25) }}
          />
          <div
            aria-hidden="true"
            className={`absolute inset-0 ${
              centered
                ? "bg-gradient-to-t from-ink/85 to-transparent"
                : "bg-gradient-to-r from-ink/90 via-ink/45 to-transparent"
            }`}
          />
          {logo ? (
            <div className="absolute top-8 left-6 z-20 sm:left-10">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={mediaUrl(logo)}
                alt=""
                className="h-14 w-auto object-contain"
              />
            </div>
          ) : null}
          <div
            className={`relative z-10 mx-auto flex w-full max-w-7xl flex-1 flex-col justify-end px-4 pt-32 pb-24 sm:px-6 ${
              centered ? "items-center text-center" : "items-start"
            }`}
          >
            {pickStr(slide, "eyebrow") ? (
              <span
                className="animate-rise inline-flex items-center gap-2.5 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 backdrop-blur"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                <span className="eyebrow">{pickStr(slide, "eyebrow")}</span>
              </span>
            ) : null}
            {pickStr(slide, "heading") ? (
              <h1
                className="heading-display heading-slash animate-rise mt-6 max-w-4xl text-4xl text-white sm:text-6xl lg:text-7xl"
                style={{ animationDelay: "80ms" }}
              >
                {pickStr(slide, "heading")}
              </h1>
            ) : null}
            {pickStr(slide, "subheading") ? (
              <p
                className="animate-rise mt-6 max-w-xl text-lg leading-relaxed text-white/75"
                style={{ animationDelay: "160ms" }}
              >
                {pickStr(slide, "subheading")}
              </p>
            ) : null}
            {href && pickStr(slide, "ctaLabel") ? (
              <div
                className="animate-rise mt-10"
                style={{ animationDelay: "240ms" }}
              >
                <a href={href} className="btn btn-accent">
                  {pickStr(slide, "ctaLabel")}
                  <span aria-hidden="true">→</span>
                </a>
              </div>
            ) : null}
          </div>
        </div>
      );
    }),
  );

  return (
    <SectionShell style={style} contain={false} className="p-0">
      <div className="relative">
        <div className="absolute inset-x-0 top-0 -z-10 h-[60vh]">
          <Home3DHero />
        </div>
        <Slider
          slides={slideNodes}
          autoplayMs={autoplay}
          arrows={arrows}
          dots={dots}
          ariaLabel="Hero"
        />
      </div>
    </SectionShell>
  );
}

async function FeatureCards({
  content,
  style,
}: {
  content: Record<string, unknown>;
  style?: Record<string, unknown>;
}) {
  const columns = pickNum(content, "columns", 3);
  const gridClass =
    columns === 2
      ? "sm:grid-cols-2"
      : columns === 4
        ? "sm:grid-cols-2 lg:grid-cols-4"
        : "sm:grid-cols-2 lg:grid-cols-3";

  const cards = await Promise.all(
    pickArr(content, "items").map(async (raw, index) => {
      const card = raw as Record<string, unknown>;
      const photo = await getMedia(pickStr(card, "image"));
      const href = safeHref(pickStr(card, "link"));
      const body = (onImage: boolean) => (
        <>
          {pickStr(card, "eyebrow") ? (
            <p className="eyebrow">{pickStr(card, "eyebrow")}</p>
          ) : null}
          {pickStr(card, "title") ? (
            <h3 className="heading-display mt-2 text-lg">
              {pickStr(card, "title")}{" "}
              {href ? <span className="text-accent">→</span> : null}
            </h3>
          ) : null}
          {pickStr(card, "text") ? (
            <p
              className={`mt-2 text-sm leading-relaxed ${
                onImage ? "text-white/75" : "text-muted"
              }`}
            >
              {pickStr(card, "text")}
            </p>
          ) : null}
        </>
      );
      return (
        <article
          key={index}
          className={`card card-hover group flex flex-col overflow-hidden ${
            href ? "cursor-pointer" : ""
          }`}
        >
          {photo ? (
            <div className="relative overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={mediaUrl(photo)}
                alt={pickStr(card, "eyebrow")}
                className="aspect-[16/10] w-full object-cover transition duration-500 group-hover:scale-[1.04]"
              />
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-gradient-to-t from-ink via-ink/55 to-transparent"
              />
              <div className="absolute inset-x-0 bottom-0 px-5 py-5 text-white">
                {body(true)}
              </div>
            </div>
          ) : (
            <div className="flex flex-1 flex-col p-7">
              <span className="icon-tile mb-5">
                <Icon
                  name={pickStr(card, "icon", "none")}
                  className="h-7 w-7"
                />
              </span>
              {body(false)}
            </div>
          )}
        </article>
      );
    }),
  );

  return (
    <SectionShell style={style}>
      <Heading
        eyebrow={pickStr(content, "eyebrow")}
        heading={pickStr(content, "heading")}
        slash
      />
      <div className={`mt-10 grid gap-6 ${gridClass}`}>
        {cards.map((card, index) => (
          <Fragment key={index}>{card}</Fragment>
        ))}
      </div>
    </SectionShell>
  );
}

async function ColumnsWrapper({
  content,
  style,
}: {
  content: Record<string, unknown>;
  style?: Record<string, unknown>;
}) {
  const colSpan: Record<number, string> = {
    1: "lg:col-span-1",
    2: "lg:col-span-2",
    3: "lg:col-span-3",
    4: "lg:col-span-4",
    5: "lg:col-span-5",
    6: "lg:col-span-6",
    7: "lg:col-span-7",
    8: "lg:col-span-8",
    9: "lg:col-span-9",
    10: "lg:col-span-10",
    11: "lg:col-span-11",
    12: "lg:col-span-12",
  };

  const columns = pickArr(content, "columns");
  const cells = await Promise.all(
    columns.map(async (raw) => {
      const column = raw as Record<string, unknown>;
      const width = pickNum(column, "width", 6);
      const blocks = pickArr(column, "blocks").map((block) => ({
        id: pickStr(block as Record<string, unknown>, "key") || undefined,
        type: pickStr(block as Record<string, unknown>, "type"),
        content: (block as Record<string, unknown>).content as Record<
          string,
          unknown
        >,
        style: (block as Record<string, unknown>).style as Record<
          string,
          unknown
        >,
        isVisible:
          typeof (block as Record<string, unknown>).isVisible === "boolean"
            ? ((block as Record<string, unknown>).isVisible as boolean)
            : true,
      }));
      const rendered = await renderSections(blocks);
      return (
        <div
          key={pickStr(column, "key") || undefined}
          className={`col-span-12 ${colSpan[width] ?? "lg:col-span-6"}`}
        >
          {rendered}
        </div>
      );
    }),
  );

  return (
    <SectionShell style={style}>
      <div className="grid grid-cols-12 items-start gap-8">{cells}</div>
    </SectionShell>
  );
}

async function SplitContent({
  content,
  style,
}: {
  content: Record<string, unknown>;
  style?: Record<string, unknown>;
}) {
  const imageLeft = pickStr(content, "imageSide", "left") === "left";
  const href = safeHref(pickStr(content, "ctaHref"));
  const paragraphs = pickStr(content, "text")
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
  const bullets = pickArr(content, "bullets")
    .map((bullet) => String(bullet))
    .filter(Boolean);

  const textColumn = (
    <div className="flex flex-col items-start">
      {pickStr(content, "eyebrow") ? (
        <p className="eyebrow">{pickStr(content, "eyebrow")}</p>
      ) : null}
      {pickStr(content, "heading") ? (
        <h2 className="heading-display heading-slash mt-4 text-3xl sm:text-5xl">
          {pickStr(content, "heading")}
        </h2>
      ) : null}
      {pickStr(content, "lead") ? (
        <p className="mt-5 font-serif text-xl font-semibold text-ink">
          {pickStr(content, "lead")}
        </p>
      ) : null}
      {paragraphs.length > 0 ? (
        <div className="mt-4 space-y-3 text-sm leading-relaxed text-muted">
          {paragraphs.map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>
      ) : null}
      {bullets.length > 0 ? (
        <ul className="mt-5 space-y-2">
          {bullets.map((bullet, index) => (
            <li key={index} className="flex items-start gap-3 text-sm text-ink">
              <span
                aria-hidden="true"
                className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-accent text-[0.6rem] font-black text-white"
              >
                ✓
              </span>
              {bullet}
            </li>
          ))}
        </ul>
      ) : null}
      {href && pickStr(content, "ctaLabel") ? (
        <div className="mt-8">
          <a href={href} className="btn btn-accent">
            {pickStr(content, "ctaLabel")}
          </a>
        </div>
      ) : null}
    </div>
  );

  const imageColumn = (
    <div
      className={`relative ${imageLeft ? "lg:order-first" : "lg:order-last"}`}
    >
      <div
        aria-hidden="true"
        className="absolute -inset-4 rounded-[1.5rem] bg-gradient-to-br from-accent/20 via-transparent to-transparent blur-2xl"
      />
      <div className="relative overflow-hidden rounded-brand border border-line shadow-[0_36px_70px_-46px_rgba(13,10,16,0.65)]">
        <SiteImage
          id={pickStr(content, "image")}
          alt={pickStr(content, "imageAlt")}
          width={1200}
          className="aspect-[4/3] w-full object-cover"
        />
      </div>
    </div>
  );

  return (
    <SectionShell style={style}>
      <div className="grid items-center gap-10 lg:grid-cols-2">
        {imageLeft ? imageColumn : textColumn}
        {imageLeft ? textColumn : imageColumn}
      </div>
    </SectionShell>
  );
}

async function RichText({
  content,
  style,
}: {
  content: Record<string, unknown>;
  style?: Record<string, unknown>;
}) {
  const align = pickStr(content, "align", "left") as "left" | "center";
  const paragraphs = pickArr(content, "paragraphs").map((paragraph) =>
    String(paragraph),
  );
  return (
    <SectionShell style={style}>
      <Heading
        eyebrow={pickStr(content, "eyebrow")}
        heading={pickStr(content, "heading")}
        slash={pickBool(content, "showAccentSlash", true)}
        align={align}
      />
      <div
        className={`mt-6 space-y-4 leading-relaxed text-muted ${
          align === "center" ? "mx-auto max-w-2xl text-center" : "max-w-2xl"
        }`}
      >
        {paragraphs.map((paragraph, index) => (
          <p key={index}>{paragraph}</p>
        ))}
      </div>
    </SectionShell>
  );
}

async function ServicesGrid({
  content,
  style,
}: {
  content: Record<string, unknown>;
  style?: Record<string, unknown>;
}) {
  const ids = pickArr(content, "serviceIds").map((id) => String(id));
  const where =
    pickStr(content, "source", "all") === "selection" && ids.length > 0
      ? { AND: [{ isPublished: true }, { id: { in: ids } }] }
      : { isPublished: true };
  const services = await prisma.service.findMany({
    where,
    orderBy: { sortOrder: "asc" },
    select: {
      id: true,
      slug: true,
      title: true,
      shortDescription: true,
      imageId: true,
    },
  });
  const columns = pickNum(content, "columns", 3);
  const gridClass =
    columns <= 1
      ? "sm:grid-cols-2 lg:grid-cols-1"
      : columns === 2
        ? "sm:grid-cols-2"
        : columns === 4
          ? "sm:grid-cols-2 lg:grid-cols-4"
          : "sm:grid-cols-2 lg:grid-cols-3";

  const cards = await Promise.all(
    services.map(async (service) => {
      const image = service.imageId ? await getMedia(service.imageId) : null;
      return (
        <Link
          key={service.id}
          href={`/services/${service.slug}`}
          className="card card-hover group flex flex-col overflow-hidden"
        >
          <div className="relative overflow-hidden">
            {image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={mediaUrl(image)}
                alt=""
                className="aspect-[16/9] w-full object-cover transition duration-500 group-hover:scale-[1.05]"
              />
            ) : (
              <div className="media-placeholder aspect-[16/9] w-full" />
            )}
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-gradient-to-t from-ink/70 to-transparent opacity-70"
            />
          </div>
          <div className="flex flex-1 flex-col p-6">
            <h3 className="heading-display flex items-center gap-2 text-lg transition group-hover:text-accent">
              {service.title}
              <span
                aria-hidden="true"
                className="text-accent transition group-hover:translate-x-1"
              >
                →
              </span>
            </h3>
            {service.shortDescription ? (
              <p className="mt-2 text-sm leading-relaxed text-muted">
                {service.shortDescription}
              </p>
            ) : null}
          </div>
        </Link>
      );
    }),
  );
  return (
    <SectionShell style={style}>
      <Heading
        eyebrow={pickStr(content, "eyebrow")}
        heading={pickStr(content, "heading")}
        slash={pickBool(content, "showAccentSlash", true)}
      />
      <div className={`mt-10 grid gap-6 ${gridClass}`}>{cards}</div>
      {services.length === 0 ? (
        <p className="mt-8 text-sm text-muted">No services published yet.</p>
      ) : null}
    </SectionShell>
  );
}

async function TrainersGrid({
  content,
  style,
}: {
  content: Record<string, unknown>;
  style?: Record<string, unknown>;
}) {
  const ids = pickArr(content, "trainerIds").map((id) => String(id));
  const where =
    pickStr(content, "source", "all") === "selection" && ids.length > 0
      ? { AND: [{ isPublished: true }, { id: { in: ids } }] }
      : { isPublished: true };
  const trainers = await prisma.trainer.findMany({
    where,
    orderBy: { sortOrder: "asc" },
    select: {
      id: true,
      slug: true,
      name: true,
      title: true,
      bio: true,
      specialties: true,
      photoId: true,
    },
  });

  const cards = await Promise.all(
    trainers.map(async (trainer) => {
      const photo = trainer.photoId ? await getMedia(trainer.photoId) : null;
      const specialties = Array.isArray(trainer.specialties)
        ? (trainer.specialties as unknown[]).map(String)
        : [];
      return (
        <Link
          key={trainer.id}
          href={`/trainers/${trainer.slug}`}
          className="card card-hover group flex flex-col p-6"
        >
          <div className="flex items-center gap-4">
            {photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={mediaUrl(photo)}
                alt={trainer.name}
                className="h-16 w-16 rounded-full object-cover ring-2 ring-accent/30 transition group-hover:ring-accent"
              />
            ) : (
              <span className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-gradient-to-br from-accent to-accent-soft text-xl font-black text-white shadow-[0_16px_30px_-16px_var(--brand-glow)]">
                {trainer.name.trim().charAt(0)}
              </span>
            )}
            <div>
              <h3 className="heading-display text-base transition group-hover:text-accent">
                {trainer.name}
              </h3>
              {trainer.title ? (
                <p className="eyebrow mt-1">{trainer.title}</p>
              ) : null}
            </div>
          </div>
          {trainer.bio ? (
            <p className="mt-4 text-sm leading-relaxed text-muted">
              {trainer.bio}
            </p>
          ) : null}
          {specialties.length > 0 ? (
            <ul className="mt-4 flex flex-wrap gap-2">
              {specialties.map((specialty) => (
                <li key={specialty} className="chip">
                  {specialty}
                </li>
              ))}
            </ul>
          ) : null}
        </Link>
      );
    }),
  );
  return (
    <SectionShell style={style}>
      <Heading
        eyebrow={pickStr(content, "eyebrow")}
        heading={pickStr(content, "heading")}
        slash={pickBool(content, "showAccentSlash", true)}
      />
      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {cards}
      </div>
      {trainers.length === 0 ? (
        <p className="mt-8 text-sm text-muted">No coaches published yet.</p>
      ) : null}
    </SectionShell>
  );
}

async function PlansGrid({
  content,
  style,
}: {
  content: Record<string, unknown>;
  style?: Record<string, unknown>;
}) {
  const ids = pickArr(content, "planIds").map((id) => String(id));
  const where =
    pickStr(content, "source", "all") === "selection" && ids.length > 0
      ? { AND: [{ isPublished: true }, { id: { in: ids } }] }
      : { isPublished: true };
  const plans = await prisma.plan.findMany({
    where,
    orderBy: { sortOrder: "asc" },
  });
  return (
    <SectionShell style={style}>
      <Heading
        eyebrow={pickStr(content, "eyebrow")}
        heading={pickStr(content, "heading")}
        slash={pickBool(content, "showAccentSlash", true)}
      />
      <div className="mt-10 grid gap-6 md:grid-cols-3">
        {plans.map((plan) => {
          const features = Array.isArray(plan.features)
            ? (plan.features as unknown[]).map(String)
            : [];
          const price = plan.price ? plan.price.toString() : "";
          return (
            <article
              key={plan.id}
              className={`relative flex flex-col overflow-hidden p-7 ${
                plan.isHighlighted
                  ? "bg-arena rounded-brand text-white shadow-[0_44px_90px_-46px_var(--brand-glow)] lg:-mt-4 lg:mb-4"
                  : "card card-hover text-ink"
              }`}
            >
              {plan.isHighlighted ? (
                <>
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 bg-grid-overlay opacity-40"
                  />
                  <p className="eyebrow absolute top-6 right-6 rounded-full bg-accent px-3 py-1 text-white">
                    Most popular
                  </p>
                </>
              ) : null}
              <h3 className="heading-display relative text-xl">
                {plan.name}
              </h3>
              <p className="relative mt-4">
                <span
                  className={`font-heading text-4xl font-extrabold ${
                    plan.isHighlighted ? "text-white" : "text-gradient"
                  }`}
                >
                  {plan.currency} {price}
                </span>
                {plan.billingPeriod ? (
                  <span
                    className={`text-sm ${plan.isHighlighted ? "text-white/60" : "text-muted"}`}
                  >
                    {" "}
                    / {plan.billingPeriod}
                  </span>
                ) : null}
              </p>
              {features.length > 0 ? (
                <ul className="relative mt-6 flex-1 space-y-2.5">
                  {features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-2.5 text-sm"
                    >
                      <span aria-hidden="true" className="text-accent">
                        ✓
                      </span>
                      {feature}
                    </li>
                  ))}
                </ul>
              ) : null}
            </article>
          );
        })}
      </div>
      {plans.length === 0 ? (
        <p className="mt-8 text-sm text-muted">No plans published yet.</p>
      ) : null}
    </SectionShell>
  );
}

function Stars({ rating }: { rating: number }) {
  const count = Math.max(0, Math.min(5, Math.round(rating)));
  return (
    <p
      aria-label={`${count} out of 5 stars`}
      className="flex gap-1 text-accent"
    >
      {Array.from({ length: count }, (_, index) => (
        <span key={index} aria-hidden="true">
          ★
        </span>
      ))}
    </p>
  );
}

async function Testimonials({
  content,
  style,
}: {
  content: Record<string, unknown>;
  style?: Record<string, unknown>;
}) {
  const selection = pickStr(content, "source", "all") === "selection";
  const picked = pickArr(content, "items").map((raw) => {
    const item = raw as Record<string, unknown>;
    return {
      name: pickStr(item, "name"),
      quote: pickStr(item, "quote"),
      rating: pickNum(item, "rating", 5),
      photoId: pickStr(item, "photo"),
    };
  });
  const items =
    selection && picked.length > 0
      ? picked
      : (
          await prisma.testimonial.findMany({
            where: { isPublished: true },
            orderBy: { sortOrder: "asc" },
            select: { name: true, quote: true, rating: true, photoId: true },
          })
        ).map((item) => ({
          name: item.name,
          quote: item.quote,
          rating: item.rating ?? 5,
          photoId: item.photoId ?? "",
        }));

  const slides = await Promise.all(
    items.map(async (item, index) => {
      const photo = item.photoId ? await getMedia(item.photoId) : null;
      return (
        <div key={index} className="px-6 pt-6 pb-16 text-white">
          <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
            <span
              aria-hidden="true"
              className="font-serif text-7xl leading-[0.6] text-accent"
            >
              &ldquo;
            </span>
            {photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={mediaUrl(photo)}
                alt={item.name}
                className="mt-6 h-16 w-16 rounded-full object-cover ring-2 ring-accent/50"
              />
            ) : null}
            <blockquote className="mt-6 font-serif text-xl leading-relaxed text-white/90 sm:text-2xl">
              {item.quote}
            </blockquote>
            <p className="eyebrow mt-7">{item.name}</p>
            <Stars rating={item.rating} />
          </div>
        </div>
      );
    }),
  );

  return (
    <SectionShell style={style} contain={false} className="bg-arena">
      <div className="relative overflow-hidden">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-grid-overlay opacity-40"
        />
        <div className="relative mx-auto w-full max-w-6xl px-4 sm:px-6">
          <Heading
            eyebrow={pickStr(content, "eyebrow")}
            heading={pickStr(content, "heading")}
            slash={pickBool(content, "showAccentSlash", false)}
            align="center"
            light
          />
          <div className="mt-12">
            <Slider
              slides={slides}
              autoplayMs={pickNum(content, "autoplayMs", 5000)}
              dots={pickBool(content, "dots", true)}
              ariaLabel="Testimonials"
            />
          </div>
        </div>
      </div>
    </SectionShell>
  );
}

async function StatsBar({
  content,
  style,
}: {
  content: Record<string, unknown>;
  style?: Record<string, unknown>;
}) {
  const items = pickArr(content, "items");
  return (
    <SectionShell style={style} contain={false} className="bg-arena">
      <div className="relative overflow-hidden">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-grid-overlay opacity-40"
        />
        <div className="relative mx-auto w-full max-w-6xl px-4 sm:px-6">
          <Heading
            eyebrow={pickStr(content, "eyebrow")}
            heading={pickStr(content, "heading")}
            slash={pickBool(content, "showAccentSlash", true)}
            align="center"
            light
          />
          <dl className="mt-12 grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-4">
            {items.map((raw, index) => {
              const item = raw as Record<string, unknown>;
              return (
                <div key={index} className="text-center">
                  <dd className="stat-value">{pickStr(item, "value")}</dd>
                  <dt className="mt-3 text-xs font-semibold tracking-[0.15em] text-white/60 uppercase">
                    {pickStr(item, "label")}
                  </dt>
                </div>
              );
            })}
          </dl>
        </div>
      </div>
    </SectionShell>
  );
}

async function CtaBanner({
  content,
  style,
}: {
  content: Record<string, unknown>;
  style?: Record<string, unknown>;
}) {
  const image = await getMedia(pickStr(content, "image"));
  const overlay = pickNum(content, "overlayOpacity", 0.6);
  const href = safeHref(pickStr(content, "ctaHref"));
  return (
    <SectionShell style={style} contain={false} className="p-0">
      <div className="relative overflow-hidden py-24 sm:py-32">
        <div aria-hidden="true" className="absolute inset-0 bg-arena" />
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={mediaUrl(image)}
            alt=""
            className="absolute inset-0 h-full w-full object-cover opacity-70"
          />
        ) : null}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-ink"
          style={{ opacity: overlay }}
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-grid-overlay opacity-50"
        />
        <div
          aria-hidden="true"
          className="absolute -top-40 left-1/2 h-[30rem] w-[30rem] -translate-x-1/2 rounded-full bg-accent/25 blur-3xl"
        />
        <div className="relative z-10 mx-auto flex max-w-3xl flex-col items-center px-4 text-center sm:px-6">
          {pickStr(content, "eyebrow") ? (
            <p className="eyebrow eyebrow-bar justify-center">
              {pickStr(content, "eyebrow")}
            </p>
          ) : null}
          {pickStr(content, "heading") ? (
            <h2 className="heading-display heading-slash mt-5 text-3xl text-white sm:text-5xl">
              {pickStr(content, "heading")}
            </h2>
          ) : null}
          {pickStr(content, "text") ? (
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/75">
              {pickStr(content, "text")}
            </p>
          ) : null}
          {href && pickStr(content, "ctaLabel") ? (
            <div className="mt-9">
              <a href={href} className="btn btn-accent">
                {pickStr(content, "ctaLabel")}
                <span aria-hidden="true">→</span>
              </a>
            </div>
          ) : null}
        </div>
      </div>
    </SectionShell>
  );
}

async function Faq({
  content,
  style,
}: {
  content: Record<string, unknown>;
  style?: Record<string, unknown>;
}) {
  const items = pickArr(content, "items");
  return (
    <SectionShell style={style}>
      <Heading
        eyebrow={pickStr(content, "eyebrow")}
        heading={pickStr(content, "heading")}
        slash={pickBool(content, "showAccentSlash", true)}
      />
      <div className="mt-8 max-w-3xl space-y-3">
        {items.map((raw, index) => {
          const item = raw as Record<string, unknown>;
          return (
            <details
              key={index}
              className="card group overflow-hidden transition open:border-accent/40"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-6 py-5 font-heading text-sm font-bold tracking-wide text-ink uppercase">
                {pickStr(item, "question")}
                <span
                  aria-hidden="true"
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-accent/10 text-lg font-black text-accent transition group-open:rotate-45 group-open:bg-accent group-open:text-white"
                >
                  +
                </span>
              </summary>
              <p className="border-t border-line px-6 py-5 text-sm leading-relaxed text-muted">
                {pickStr(item, "answer")}
              </p>
            </details>
          );
        })}
      </div>
    </SectionShell>
  );
}

function VideoEmbed({ url }: { url: string }) {
  let embedSrc = "";
  try {
    const parsed = new URL(/^https?:\/\//i.test(url) ? url : `https://${url}`);
    if (
      parsed.hostname.includes("youtube.com") ||
      parsed.hostname.includes("youtu.be")
    ) {
      const id =
        parsed.pathname.match(/^\/(?:embed\/|shorts\/)?([\w-]{6,})/)?.[1] ??
        parsed.searchParams.get("v") ??
        "";
      if (id) embedSrc = `https://www.youtube.com/embed/${id}`;
    } else if (parsed.hostname.includes("vimeo.com")) {
      const id = parsed.pathname.replace(/^\//, "").split("/")[0];
      if (/^\d+$/.test(id)) embedSrc = `https://player.vimeo.com/video/${id}`;
    }
  } catch {
    // Invalid URLs simply render nothing.
  }
  if (!embedSrc) return null;
  return (
    <iframe
      src={embedSrc}
      title="Embedded video"
      allow={
        embedSrc.includes("vimeo.com")
          ? "autoplay; fullscreen; picture-in-picture"
          : "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      }
      allowFullScreen
      className="aspect-video w-full rounded-brand border-0"
    />
  );
}

async function Video({
  content,
  style,
}: {
  content: Record<string, unknown>;
  style?: Record<string, unknown>;
}) {
  const url = pickStr(content, "url");
  const poster = await getMedia(pickStr(content, "poster"));
  return (
    <SectionShell style={style}>
      <Heading
        eyebrow={pickStr(content, "eyebrow")}
        heading={pickStr(content, "heading")}
      />
      <div className="mt-8 max-w-4xl">
        {/\.mp4$/i.test(url) ? (
          <video
            controls
            preload="metadata"
            poster={poster ? mediaUrl(poster) : undefined}
            className="aspect-video w-full rounded-brand bg-black"
          >
            <source src={safeHref(url) ?? url} type="video/mp4" />
          </video>
        ) : (
          <VideoEmbed url={url} />
        )}
        {pickStr(content, "caption") ? (
          <p className="mt-3 text-center text-xs text-muted">
            {pickStr(content, "caption")}
          </p>
        ) : null}
      </div>
    </SectionShell>
  );
}

async function ImageBanner({
  content,
  style,
}: {
  content: Record<string, unknown>;
  style?: Record<string, unknown>;
}) {
  const heightClass =
    pickStr(content, "height", "auto") === "short"
      ? "aspect-[16/7]"
      : pickStr(content, "height", "auto") === "tall"
        ? "aspect-[16/9]"
        : "aspect-[3/2] sm:aspect-[16/9]";
  const slides = await Promise.all(
    pickArr(content, "images").map(async (raw, index) => {
      const item = raw as Record<string, unknown>;
      const image = await getMedia(pickStr(item, "image"));
      const href = safeHref(pickStr(item, "link"));
      return (
        <div
          key={index}
          className={`relative w-full overflow-hidden bg-navy ${heightClass}`}
        >
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={mediaUrl(image)}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 bg-navy/20" />
          )}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-5">
            {pickStr(item, "caption") ? (
              href ? (
                <a
                  href={href}
                  className="font-serif text-sm text-white underline decoration-accent underline-offset-4"
                >
                  {pickStr(item, "caption")}
                </a>
              ) : (
                <p className="font-serif text-sm text-white">
                  {pickStr(item, "caption")}
                </p>
              )
            ) : null}
          </div>
        </div>
      );
    }),
  );
  return (
    <SectionShell style={style} contain={false} className="p-0">
      <Slider
        slides={slides}
        autoplayMs={pickNum(content, "autoplayMs", 5000)}
        dots
        ariaLabel="Images"
      />
    </SectionShell>
  );
}

function Spacer({
  content,
  style,
}: {
  content: Record<string, unknown>;
  style?: Record<string, unknown>;
}) {
  const height = pickNum(content, "height", 64);
  return (
    <SectionShell style={style} contain={false} className="p-0">
      <div
        className={
          pickBool(content, "showLine", false) ? "border-t border-black/10" : ""
        }
        style={{ height }}
        aria-hidden="true"
      />
    </SectionShell>
  );
}

async function LeadFormSection({
  content,
  style,
}: {
  content: Record<string, unknown>;
  style?: Record<string, unknown>;
}) {
  return (
    <SectionShell style={style}>
      <div className="grid gap-10 lg:grid-cols-2 lg:items-start">
        <div>
          <Heading
            eyebrow={pickStr(content, "eyebrow")}
            heading={pickStr(content, "heading")}
            slash={pickBool(content, "showAccentSlash", true)}
          />
          {pickStr(content, "text") ? (
            <p className="mt-5 max-w-md font-serif text-lg leading-relaxed text-muted">
              {pickStr(content, "text")}
            </p>
          ) : null}
        </div>
        <LeadForm
          submitLabel={pickStr(content, "submitLabel", "Send message")}
        />
      </div>
    </SectionShell>
  );
}

// ---------------------------------------------------------------------------
// Class timetable (Phase 5): weekly schedule from the timetable module,
// grouped by day and ordered by start time. Days may be filtered by content.
// ---------------------------------------------------------------------------

const TIMETABLE_DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

async function TimetableSection({
  content,
  style,
}: {
  content: Record<string, unknown>;
  style?: Record<string, unknown>;
}) {
  const allowedDays = pickArr(content, "days")
    .map((value) => Number(value))
    .filter((value) => Number.isInteger(value) && value >= 0 && value <= 6);
  const where =
    allowedDays.length === 0
      ? { isPublished: true }
      : { isPublished: true, dayOfWeek: { in: allowedDays } };

  const entries = await prisma.timetableEntry.findMany({
    where,
    orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }, { sortOrder: "asc" }],
    include: { trainer: { select: { name: true } } },
  });

  const byDay: Array<{ day: number; name: string; entries: typeof entries }> =
    [];
  for (let day = 0; day < 7; day += 1) {
    const rows = entries.filter((entry) => entry.dayOfWeek === day);
    if (rows.length > 0) {
      byDay.push({
        day,
        name: TIMETABLE_DAYS[day] ?? `Day ${day}`,
        entries: rows,
      });
    }
  }

  return (
    <SectionShell style={style}>
      <Heading
        eyebrow={pickStr(content, "eyebrow")}
        heading={pickStr(content, "heading")}
        slash={pickBool(content, "showAccentSlash", true)}
      />
      {byDay.length > 0 ? (
        <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {byDay.map(({ day, name, entries: rows }) => (
            <div key={day} className="card card-hover overflow-hidden">
              <h3 className="heading-display bg-ink px-5 py-3 text-sm text-white">
                {name}
              </h3>
              <ul className="divide-y divide-line">
                {rows.map((entry) => (
                  <li key={entry.id} className="px-5 py-3.5">
                    <p className="flex items-center gap-2 text-sm font-semibold text-ink">
                      <span
                        aria-hidden="true"
                        className="h-1.5 w-1.5 rounded-full bg-accent"
                      />
                      {entry.title}
                    </p>
                    <p className="mt-1 pl-3.5 text-xs text-muted">
                      <time>
                        {entry.startTime}–{entry.endTime}
                      </time>
                      {entry.trainer ? (
                        <span> · {entry.trainer.name}</span>
                      ) : null}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-8 text-sm text-muted">No classes published yet.</p>
      )}
    </SectionShell>
  );
}

// ---------------------------------------------------------------------------
// Contact information (Phase 5): address, phone, WhatsApp, email, opening hours
// and the map embed from Settings → General. Each row can be hidden per page.
// ---------------------------------------------------------------------------

function contactFieldHref(
  kind: "tel" | "whatsapp" | "mailto",
  value: string,
): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (kind === "tel") return `tel:${trimmed.replace(/[^+\d\s-]/g, "")}`;
  if (kind === "mailto") return `mailto:${trimmed}`;
  const digits = trimmed.replace(/\D/g, "");
  return digits ? `https://wa.me/${digits}` : null;
}

async function ContactInfoSection({
  content,
  style,
}: {
  content: Record<string, unknown>;
  style?: Record<string, unknown>;
}) {
  const { general } = await getSiteSettings();
  const rows: Array<{ label: string; value: string; href?: string }> = [];

  if (pickBool(content, "showAddress", true) && general.address.trim()) {
    rows.push({ label: "Address", value: general.address });
  }
  if (pickBool(content, "showPhone", true) && general.phone.trim()) {
    rows.push({
      label: "Phone",
      value: general.phone,
      href: contactFieldHref("tel", general.phone) ?? undefined,
    });
  }
  if (pickBool(content, "showWhatsapp", true) && general.whatsapp.trim()) {
    rows.push({
      label: "WhatsApp",
      value: general.whatsapp,
      href: contactFieldHref("whatsapp", general.whatsapp) ?? undefined,
    });
  }
  if (pickBool(content, "showEmail", true) && general.email.trim()) {
    rows.push({
      label: "Email",
      value: general.email,
      href: contactFieldHref("mailto", general.email) ?? undefined,
    });
  }
  if (pickBool(content, "showHours", true) && general.openingHours.trim()) {
    rows.push({ label: "Opening hours", value: general.openingHours });
  }

  const mapEmbed = pickBool(content, "showMap", true)
    ? general.mapEmbed.trim()
    : "";
  const showMap = /^https?:\/\//i.test(mapEmbed) || /^\/\//i.test(mapEmbed);

  return (
    <SectionShell style={style}>
      <div className="grid gap-10 lg:grid-cols-2 lg:items-start">
        <div>
          <Heading
            eyebrow={pickStr(content, "eyebrow")}
            heading={pickStr(content, "heading")}
            slash={pickBool(content, "showAccentSlash", true)}
          />
          {pickStr(content, "text") ? (
            <p className="mt-5 max-w-md font-serif text-lg leading-relaxed text-muted">
              {pickStr(content, "text")}
            </p>
          ) : null}
          {rows.length > 0 ? (
            <dl className="mt-8 space-y-4">
              {rows.map((row) => (
                <div
                  key={row.label}
                  className="border-l-2 border-accent/40 pl-4"
                >
                  <dt className="eyebrow text-muted">{row.label}</dt>
                  <dd className="mt-1">
                    {row.href ? (
                      <a
                        href={row.href}
                        className="font-serif text-lg text-ink underline decoration-accent/40 underline-offset-4 transition hover:text-accent"
                      >
                        {row.value}
                      </a>
                    ) : (
                      <span className="font-serif text-lg text-ink">
                        {row.value}
                      </span>
                    )}
                  </dd>
                </div>
              ))}
            </dl>
          ) : null}
        </div>
        {showMap ? (
          <div className="card overflow-hidden">
            <iframe
              src={mapEmbed}
              title={`Map showing ${general.businessName}`}
              loading="lazy"
              allowFullScreen
              referrerPolicy="no-referrer-when-downgrade"
              className="h-80 w-full border-0 lg:h-[26rem]"
            />
          </div>
        ) : null}
      </div>
    </SectionShell>
  );
}

// ---------------------------------------------------------------------------
// Dispatcher
// ---------------------------------------------------------------------------

async function renderSection(
  section: RenderableSection,
): Promise<ReactNode | null> {
  if (!section.isVisible) return null;
  const meta = sectionMetaFor(section.type);
  if (!meta) return null;

  const props = { content: section.content ?? {}, style: section.style ?? {} };

  switch (section.type) {
    case "hero-slider":
      return <HeroSlider {...props} />;
    case "feature-cards":
      return <FeatureCards {...props} />;
    case "columns":
      return <ColumnsWrapper {...props} />;
    case "split-content":
      return <SplitContent {...props} />;
    case "rich-text":
      return <RichText {...props} />;
    case "services-grid":
      return <ServicesGrid {...props} />;
    case "trainers-grid":
      return <TrainersGrid {...props} />;
    case "plans":
      return <PlansGrid {...props} />;
    case "gallery":
      return <Gallery {...props} />;
    case "timetable":
      return <TimetableSection {...props} />;
    case "testimonials-slider":
      return <Testimonials {...props} />;
    case "stats":
      return <StatsBar {...props} />;
    case "cta-banner":
      return <CtaBanner {...props} />;
    case "faq":
      return <Faq {...props} />;
    case "video":
      return <Video {...props} />;
    case "image-banner":
      return <ImageBanner {...props} />;
    case "spacer":
      return <Spacer {...props} />;
    case "lead-form":
      return <LeadFormSection {...props} />;
    case "contact-info":
      return <ContactInfoSection {...props} />;
    default:
      return null;
  }
}

async function Gallery({
  content,
  style,
}: {
  content: Record<string, unknown>;
  style?: Record<string, unknown>;
}) {
  const masonry = pickStr(content, "layout", "grid") === "masonry";
  const source = pickStr(content, "source", "");
  const itemIds = pickArr(content, "itemIds").map((id) => String(id));
  const handPicked = pickArr(content, "images");

  type Cell = {
    key: string;
    imageId: string;
    caption: string;
    href: string | null;
  };

  const fromModule = (
    rows: {
      id: string;
      mediaId: string | null;
      externalUrl: string | null;
      caption: string | null;
    }[],
  ): Cell[] =>
    rows.map((row) => ({
      key: row.id,
      imageId: row.mediaId ?? "",
      caption: row.caption ?? "",
      href: safeHref(row.externalUrl ?? "") ?? null,
    }));

  let cells: Cell[] = [];

  if (source === "all" || (source === "selection" && itemIds.length > 0)) {
    // Gallery module (Phase 4): all published items, or a hand-picked subset.
    const rows = await prisma.galleryItem.findMany({
      where:
        source === "selection"
          ? { isPublished: true, id: { in: itemIds } }
          : { isPublished: true },
      orderBy: { sortOrder: "asc" },
      select: { id: true, mediaId: true, externalUrl: true, caption: true },
    });
    const ordered =
      source === "selection"
        ? itemIds
            .map((id) => rows.find((row) => row.id === id))
            .filter((row): row is (typeof rows)[number] => Boolean(row))
        : rows;
    cells = fromModule(ordered);
  } else if (handPicked.length > 0) {
    // Hand-picked images stored on the section (legacy representation).
    cells = handPicked.map((raw, index) => {
      const item = raw as Record<string, unknown>;
      return {
        key: `image-${index}`,
        imageId: pickStr(item, "image"),
        caption: pickStr(item, "caption"),
        href: safeHref(pickStr(item, "link")),
      };
    });
  } else {
    // Sensible fallback: show the published gallery module.
    const rows = await prisma.galleryItem.findMany({
      where: { isPublished: true },
      orderBy: { sortOrder: "asc" },
      select: { id: true, mediaId: true, externalUrl: true, caption: true },
    });
    cells = fromModule(rows);
  }

  const figures = await Promise.all(
    cells.map(async (cell) => {
      const inner = (
        <figure className="group relative overflow-hidden rounded-brand border border-line">
          <SiteImage
            id={cell.imageId}
            alt={cell.caption}
            className={`w-full object-cover transition duration-500 group-hover:scale-[1.05] ${
              masonry ? "aspect-[3/4]" : "aspect-square"
            }`}
          />
          {cell.caption ? (
            <>
              <div
                aria-hidden="true"
                className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-ink/85 to-transparent"
              />
              <figcaption className="absolute inset-x-0 bottom-0 px-4 py-3.5 text-xs font-semibold tracking-wide text-white uppercase">
                {cell.caption}
              </figcaption>
            </>
          ) : null}
        </figure>
      );
      return cell.href ? (
        <a key={cell.key} href={cell.href} className="block">
          {inner}
        </a>
      ) : (
        <div key={cell.key}>{inner}</div>
      );
    }),
  );

  return (
    <SectionShell style={style}>
      <Heading
        eyebrow={pickStr(content, "eyebrow")}
        heading={pickStr(content, "heading")}
        slash={pickBool(content, "showAccentSlash", true)}
      />
      {figures.length > 0 ? (
        <div
          className={`mt-10 grid gap-4 ${masonry ? "grid-cols-2 gap-4 lg:grid-cols-3" : "grid-cols-2 lg:grid-cols-3"}`}
        >
          {figures}
        </div>
      ) : (
        <p className="mt-8 text-sm text-muted">
          No gallery images published yet.
        </p>
      )}
    </SectionShell>
  );
}

/**
 * Render a list of sections into React nodes, skipping hidden/unknown ones.
 * Used by the public home, the dynamic /[slug] page, the admin preview and
 * nested column blocks.
 */
export async function renderSections(
  sections: RenderableSection[],
): Promise<ReactNode[]> {
  const nodes: ReactNode[] = [];
  for (let index = 0; index < sections.length; index += 1) {
    const section = sections[index];
    const node = await renderSection(section);
    if (node !== null) {
      nodes.push(
        <Fragment key={section.id ?? `${section.type}-${index}`}>
          {node}
        </Fragment>,
      );
    }
  }
  return nodes;
}

export type { SectionStyle };
