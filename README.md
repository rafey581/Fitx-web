# FITX Gym Sahiwal — Website + Admin CMS

Public website and admin CMS for **FITX Personal Fitness Training Studio**, Sahiwal, built phase by phase from the PRD (`FITX Gym Sahiwal – Website + Admin CMS PRD & Development Plan.md`).

**Documentation map**

| Doc | For |
| --- | --- |
| `README.md` (this file) | Developers: setup, architecture, extending, phase history |
| `DEPLOYMENT.md` | Operators: production VPS + PM2 + Nginx + TLS, backups, go-live |
| `docs/ADMIN-GUIDE.md` | The client/owner: how to run the site, plus the handover checklist |

## Stack

| Layer | Choice | Notes |
| --- | --- | --- |
| Framework | Next.js 16 (App Router) + React 19 | Turbopack dev/build, TypeScript strict |
| Styling | Tailwind CSS v4 | Design tokens as CSS variables; theme can be overridden from the admin (Phase 2) |
| Database | MySQL 8 (local) | schema `fitx`, user `fitx` |
| ORM | Prisma 7 (SQL driver adapter: MariaDB/MySQL) | Prisma config lives in `prisma7.config.ts`; client generated to `src/generated/prisma` |
| Validation | Zod 4 | Server actions validate every input; page-level schemas mirror the DB |
| Auth | Custom HS256 JWT session (`jose`) in an httpOnly cookie | Not NextAuth — see "Auth model" |
| Email | `nodemailer` (only when `SMTP_HOST` is set) | Dev fallback logs to the console |
| Formatting | Prettier + `prettier-plugin-tailwindcss`, ESLint | `npm run format`, `npm run lint` |

## Prerequisites

- **Node.js 20+** (built against 22)
- **MySQL 8** running locally on `localhost:3306` (the dev DB is `fitx`; see `.env`)

## Setup

```bash
npm install

# 1. Copy env and fill in values
cp .env.example .env

# 2. Create the database + user (once)
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS fitx CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# 3. Apply migrations and seed starter content
npm run db:migrate   # first run creates the schema
npm run db:seed      # owner account, settings, menus, pages, content modules

# 4. Start developing
npm run dev          # http://localhost:3000
```

The **owner account** is created from `OWNER_*` env vars. With the shipped `.env.example` values that is:

- login: `http://localhost:3000/admin`
- email: `owner@fitx.pk` — password: your `OWNER_PASSWORD` value

> Change the owner password from the Users page after first login.

## Environment variables

See `.env.example` for the full list with comments. Key ones:

- `DATABASE_URL` — MySQL connection string
- `AUTH_SECRET` — 32+ random bytes used to sign session JWTs (`node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"`)
- `AUTH_SESSION_TTL_HOURS` — session lifetime (default 72)
- `OWNER_NAME` / `OWNER_EMAIL` / `OWNER_PASSWORD` — seeded owner credentials
- `SMTP_*` / `LEAD_NOTIFY_TO` — optional email; empty = dev logging
- `TURNSTILE_*` — Cloudflare Turnstile keys for the public lead form (Phase 4)

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Next dev server (Turbopack) |
| `npm run build` / `npm run start` | Production build / run |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Unit tests (Node test runner + tsx; no extra deps) |
| `npm run lint` / `lint:fix` | ESLint |
| `npm run format` / `format:check` | Prettier |
| `npm run db:migrate` / `db:deploy` | Prisma migrate dev / deploy |
| `npm run db:seed` | Run `prisma/seed.ts` (idempotent) |
| `npm run db:studio` | Prisma Studio |

## Testing

Two layers, both dependency-free:

- **Unit — `npm test`** (`tests/*.test.ts`, 57 tests). Node's built-in test runner via `tsx`. Covers the pure, security-relevant logic: the permission matrix, the section registry/schema/defaults invariant, the Zod validation schemas, slug/format helpers, `serializeJsonLd`, `csvCell`, and field-error mapping.
- **Acceptance — `tests/acceptance/`** (`accept2/5/6/7.mjs`). Node scripts that drive the **real** server actions over HTTP against a running production build, following the PRD's phase acceptance criteria. They create throwaway rows, assert behaviour, and clean up after themselves. Prerequisites: a migrated + seeded DB, `npm run build`, and `npm start`. Action ids are read from the build manifests automatically (see `tests/acceptance/README.md`).

## Troubleshooting

- **Every page 500s and the server log shows Prisma `pool timeout … active=0 idle=0`.** This is not a network problem. The `fitx` MySQL account uses the `caching_sha2_password` plugin; over a non-TLS connection the server normally answers from its fast-auth cache, but **immediately after a MySQL restart that cache is cold**, so the client must fetch the server's RSA public key. The MariaDB driver refuses that by default and throws `ER_CANNOT_RETRIEVE_RSA_KEY`, which Prisma reports as a misleading 10-second "pool timeout". `src/lib/db.ts` now passes `allowPublicKeyRetrieval: true` (building the pool options from `DATABASE_URL`), so this is handled. If you connect from another tool and hit the same error, either enable that option or warm the cache once (`mysql -ufitx -p fitx -e "SELECT 1"` about a second before the app's first query). For a hardened production setup prefer TLS to MySQL instead of public-key retrieval.

## Data model & publishing model

The full schema is in `prisma/schema.prisma` (PRD §7). Important decisions:

- **IDs are CUID strings** (`@default(cuid())`) — JSON-safe and avoid BigInt serialization issues in server actions.
- **Draft/publish**: a `Page` row holds the live page metadata; its working content lives in `sections` rows (the draft). Publishing snapshots the page + sections into an immutable `PageVersion.snapshot` JSON and points the page at it (`published_version_id`). Public rendering uses the snapshot for the *sections*; page lifecycle fields (`PageStatus`, `publishAt`, SEO, `noindex`) live on `Page`. `has_unpublished_changes` flips when a draft diverges from the published version. This is the approach the PRD left open ("The agent should choose one approach and document it").
- **Section `type` is a plain String** — adding a new block type later needs only a Zod schema, a renderer and an admin form definition. **No DB migration.**
- Tables carry `created_at` / `updated_at`; indexes match the PRD (pages.slug, sections(page_id, sort_order), leads(status, created_at), …).
- Audit log (`audit_logs`) is append-only; failures to write never break the triggering action.

## Auth model

- Passwords are **bcrypt-hashed** (cost 12); reset tokens are single-use SHA-256 digests with a 1-hour expiry.
- Sessions are **signed JWTs (HS256)** in the `fitx_session` cookie (`httpOnly`, `sameSite=lax`, `secure` in production). Every request re-checks `is_active`, so deactivating a user cuts access immediately.
- Roles: **OWNER** (everything), **EDITOR** (pages/media/content/navigation/leads), **FRONTDESK** (leads only). Permissions are coarse-grained strings (`pages:write`, `users:read`, …) mapped per role in `src/lib/auth/permissions.ts`.
- Enforcement is **server-side only**: `requireUser()` / `requirePermission()` on pages, `assertPermission()` inside server actions. `src/proxy.ts` is a first-pass redirect for anonymous visitors and is deliberately *not* treated as the security boundary (Next.js docs recommend the same).
- Login is rate-limited: 5 failures → 15-minute lock. Unknown emails get a fake bcrypt compare so timing does not leak account existence.

## Project layout

```
prisma/
  schema.prisma        # full data model
  seed.ts              # idempotent starter content
  migrations/          # SQL migrations
tests/                 # unit tests (Node test runner + tsx, no extra deps)
deploy/                # PM2 + Nginx config, backup/restore scripts
docs/ADMIN-GUIDE.md    # owner user guide + acceptance checklist
DEPLOYMENT.md          # production deployment guide (VPS + PM2 + Nginx + TLS)
src/
  proxy.ts             # admin first-pass redirect + x-pathname stamping (Next 16: middleware → proxy)
  app/                 # public site (route group), /health, /admin/* (login, protected group), /preview/[id]
  app/uploads/         # local-disk media serving route
  app/robots.ts        # dynamic robots.txt
  app/sitemap.ts       # dynamic sitemap.xml
  components/
    ui/                # primitives: ActionForm (useActionState wrapper), fields, buttons, cards
    admin/             # admin shell, dashboard, media picker
    sections/          # Phase 3 registry: admin forms, public renderers, client fields, slider
    site/              # announcement bar, header, footer, mobile nav (public chrome)
  lib/
    auth/              # password, session, permissions, server guards
    admin/nav.ts       # admin information architecture (phase flags)
    sections/types.ts  # block registry: schemas, defaults, metadata (single source of truth)
    validation/        # Zod schemas + field-error helpers (settings/menus/redirects/media)
    theme/tokens.ts    # design tokens + curated font options (defaults → CSS)
    site/settings.ts   # getSiteSettings / getMenuLinks (server-only, cached per request)
    site/pages.ts      # public page resolution (published snapshot + lazy schedule promotion)
    slug.ts            # slugify + uniqueSlug for pages
    media-storage.ts   # local-disk upload pipeline (sharp variants, sanitisation)
    seo.ts             # JSON-LD serialiser (safe against </script> breakout)
    csv.ts             # CSV cell encoder (RFC 4180 + formula-injection guard)
    db.ts env.ts audit.ts email.ts format.ts media-url.ts
  server/actions/      # "use server" mutations (auth, users, media, settings, menus, redirects, pages, …)
  generated/prisma/    # generated Prisma client (do not edit)
```

## Extending: adding a new section block

The section system is **registry-driven**, so a new block type is a code change
only — **no database migration** (PRD §15.4). Touch these files:

1. `src/lib/sections/types.ts`
   - add the type name to `SECTION_TYPES`;
   - add a Zod schema to `SECTION_SCHEMAS` (reuse the shared helpers:
     `optStr`, `mediaId`, `hrefOrEmpty`, `boolDefault`, `safeHref`);
   - add metadata to `SECTION_REGISTRY` (label, group, `nestable`);
   - add a default content object to `sectionDefaults`.
2. `src/components/sections/forms.tsx` — add the admin form component and
   register it in `FORM_BY_TYPE`.
3. `src/components/sections/renderers.tsx` — add the server renderer and a case
   in the dispatcher.
4. `tests/sections.test.ts` — the existing invariant already checks every type
   has metadata + a schema and that its defaults validate, so a *new* type is
   covered automatically; add a focused test for any interesting rule.
5. Verify: `npx tsc --noEmit && npm test && npm run lint && npm run build`.

`sectionDefaults` feeds the builder when an admin adds the block, so its output
must pass the schema — that is exactly what the unit suite enforces.

## Design system & UI

The public site is styled from a single layer so it stays consistent and remains
themeable from the admin. Two rules govern it:

1. **Visible content is never hard-coded** — all copy and imagery comes from the
   database. UI-only labels ("Quick links", "Find us", button captions shipped by
   a block) are the only literals.
2. **Colour is data, composition is code.** The palette is the DB theme; the
   layout, type scale and decorative treatment live in CSS/markup.

Where things live:

- `src/app/globals.css` — the design system. It defines the brand CSS variables
  (`--brand-*`), the Tailwind `@theme inline` mapping, and the shared component
  classes used by the site: `.btn`/`.btn-accent`/`.btn-outline`/`.btn-light`,
  `.card`/`.card-hover`, `.chip`, `.icon-tile`, `.eyebrow`/`.eyebrow-bar`,
  `.heading-display`/`.heading-slash`, `.stat-value`, `.text-gradient`,
  `.bg-arena`/`.bg-grid-overlay`/`.media-placeholder`, `.footer-glow`,
  `.nav-link`, and the `.animate-rise`/`.animate-fade` entrances.
- `src/lib/theme/tokens.ts` — the editable defaults + curated fonts. The admin
  Theme page persists overrides that are injected as `:root{…}` per request.
- `src/components/sections/renderers.tsx` — every block's markup (hero, feature
  cards, split content, services, trainers, plans, testimonials, stats, CTA, FAQ,
  gallery, timetable, contact, lead form).
- `src/components/site/*` — public chrome (header, footer, announcement bar,
  mobile nav).

**Derived tones.** Beyond the admin-editable tokens, `globals.css` derives
`--brand-accent-soft`, `--brand-accent-deep`, `--brand-glow`, `--brand-line` and
`--brand-surface` from the brand colours with `color-mix(in srgb, …)`. They are
exposed to Tailwind as `accent-soft`/`accent-deep`/`line`/`surface`, so gradients,
glows and hairlines all follow the brand accent automatically — change one colour
in the admin and the whole site (buttons, glow, grid tint) updates.

**Images are optional by design.** Because seeded pages ship without photography,
a missing media row renders `.media-placeholder` (an on-brand gradient panel) and
the dark `hero`/`stats`/`testimonials`/`cta` bands are pure CSS, so the site looks
intentional before any photos are uploaded.

**Motion & accessibility.** Entrances are short and use `transform`/`opacity`;
`prefers-reduced-motion: reduce` disables them and smooth scrolling. Focus rings,
the skip link (`#main-content`) and the `aria-hidden` decorative layers are
preserved.

## Phase status

- ✅ **Phase 0** — skeleton, MySQL, migrations, design tokens, health check
- ✅ **Phase 1** — full schema + seed, auth (login/reset/rate limit), roles + permission middleware, admin shell, dashboard, user management, audit log
- ✅ **Phase 2** — media library, global/theme/menus/redirects settings, live public site chrome
- ✅ **Phase 3** — section registry + builder, page manager, draft/publish UI
- ✅ **Phase 4** — content modules CRUD (trainers, services, plans, testimonials, gallery, timetable), service/trainer profile pages, module-driven section blocks, contact/consultation form + leads inbox (statuses, notes, CSV export, email notification, spam protection)
- ✅ **Phase 5** — reference-site starter content (PRD default pages + menus), class-timetable and contact-info section blocks, SEO suite (dynamic `sitemap.xml` + `robots.txt`, site-wide + per-type JSON-LD, DB-driven default meta/OG, script injection)
- ✅ **Phase 6** — QA/security/a11y hardening: dependency-free unit-test suite (57 tests), security review with fixes (JSON-LD breakout escaping, CSV formula-injection guard, unexposed internal action), indexed redirect lookup, skip link + keyboard-accessible media picker
- ✅ **Phase 7** — deployment + handover: `DEPLOYMENT.md` (VPS + PM2 + Nginx + TLS + backups), `deploy/` ops scripts, admin user guide + acceptance checklist, HTTP acceptance harness for the client checklist
- 🎨 **Post-phase — UI overhaul**: bold, high-energy studio aesthetic (dark "arena" bands, gradient accents, grid texture, gradient buttons/cards, condensed display type, entrance motion), full-bleed hero, prominent stats/testimonials, richer header/footer, and an on-brand `.media-placeholder` so image-less pages still look finished. All colour still derives from the DB theme (see **Design system & UI**).

### What landed in Phase 2

- **Media library** (`/admin/media`) — multipart upload through a server action with per-file validation (extension allow-list, size cap, sharp header/magic check), responsive **WebP** variants (480/960/1920), alt/caption/folder editing, usage-aware delete. Files are stored under `UPLOAD_DIR` (`uploads/…`) and served by `/uploads/…` (traversal-safe).
- **Settings** (`/admin/settings`) — general (identity, contact, socials, logo via media picker, announcement bar w/ date window), SEO (meta defaults, OG image, favicon), email (SMTP host/port/user/password/from, lead notification address), scripts (head/body HTML).
- **Theme manager** (`/admin/theme`) — brand accent/navy/ink + background/foreground/muted, three fonts from a **curated set** (`FONT_OPTIONS`), border radius. Emitted as CSS variables into the root layout `<style>` so changes apply immediately.
- **Menu manager** (`/admin/menus`) — nested header (one level) + footer links with row editing, stored as JSON settings.
- **Redirects** (`/admin/redirects`) — 301/302/307/308 old→new URL map.
- **Public chrome** — announcement bar, sticky header (logo renders from the selected media; text fallback otherwise), footer, mobile nav — all read the DB on every request.
- **Maintenance mode + redirects run in the root layout**, so they also cover URLs that match no route (the app not-found page renders under the root layout) — which is exactly what legacy redirects are for.

## Phase 2 notes & assumptions

- **Uploads are served from the repo directory** (`uploads/`). The route uses `fs` on the server; `next build` may print a filesystem-tracing warning about the uploads route — expected when media lives on disk and not in the bundle. On a serverless deploy, point `UPLOAD_DIR` at a persistent volume (or swap `media-storage.ts` for an object-storage-backed implementation).
- **Fonts are a closed, curated set** (Montserrat/Inter/Playfair Display + alternatives in `FONT_OPTIONS`); arbitrary Google Font URLs are not accepted, so the theme is self-hosting-safe.
- **Menu nesting is one level** (header → submenu). Deeper trees would need an extra schema/UI pass.
- **SMTP credentials live in the DB** (Email settings) in addition to `.env` fallbacks. They are write-once: the UI shows a masked password and lets you replace it without reading it back.
- **Redirect checking adds one `redirects` query per public page render** in Phase 2; Phase 3 introduces caching/invalidation so this stays cheap at scale.
- **Public server actions on a redirected URL** would be re-routed (the root layout applies redirects to any public path) — keep redirect sources on distinct, non-form URLs.

### What landed in Phase 3

- **Section registry** (`src/lib/sections/types.ts`) — 16 block types across 6 groups (Layout, Hero & banners, Text & media, Lists & proof, Modules, Utilities), each with a Zod schema + defaults, a client admin form (`components/sections/forms.tsx`), a server renderer (`components/sections/renderers.tsx`) and style controls (background/padding/max-width). Adding a block type needs no migration.
- **Pages manager** (`/admin/pages`) — list with status chips, build/duplicate/trash/restore/delete-forever; the home page can never be trashed; deleting requires the trashed state first.
- **New page flow** (`/admin/pages/new`) — title → auto-slug (unique-ified against existing slugs), SEO fields, home-page takeover (unsets any other home).
- **Visual builder** (`/admin/pages/[id]`) — add/duplicate/hide/reorder sections (up/down controls), per-section style controls, mobile/desktop toggle with a live draft preview iframe (`/preview/[id]`), settings tab (title/slug/SEO/OG image/noindex), versions tab (publish history + revert). Save draft and Publish buttons; publish snapshots the current builder state atomically (never a stale draft).
- **Draft/publish model** — `sections` rows are the working draft; publishing writes an immutable `PageVersion.snapshot` and points the page at it. See "Data model & publishing model" above.
- **Dynamic public routing** (`/` home + `/[slug]`) — `getPublicPageBySlug` reads the published snapshot, promotes due SCHEDULED pages lazily on access (no cron), and 404s drafts, not-due scheduled pages and trashed pages. `generateMetadata` emits per-page SEO (title/description/robots/OG). Menus skip non-public pages so the site never links to a 404.

## Phase 3 notes & assumptions

- **The public site is force-dynamic** in Phase 3 (no ISR)—every page render re-reads the snapshot so publish/preview is instant. ISR/static export is a Phase 5 performance pass.
- **Reorder is keyboard/mouse button based** (move up/down) instead of drag-and-drop — keeps a11y and touch support free and skips a dnd dependency.
- **Scheduled pages promote lazily** at read time: when `publish_at` passes, the next public request flips the page to PUBLISHED. No background job is required.
- **Legacy PUBLISHED pages without a snapshot** (e.g. the seeded home page before its first publish) render their live draft sections so the site is never blank.
- **Preview is auth-gated**: `/preview/[id]` requires a signed-in admin and carries `noindex`; it renders the working draft inside the builder iframe.
- **The builder sends Publish its current draft JSON**, so Save+Publish is one atomic action — publishing can never snapshot stale sections.

### What landed in Phase 4

- **Content module CRUD** (`/admin/trainers`, `/admin/services`, `/admin/plans`, `/admin/testimonials`, `/admin/gallery`, `/admin/timetable`) — one config-driven manager (shared client component + per-module server actions) with create/edit/delete, move-up/down ordering, publish toggles, media pickers, list editors (specialties, features, service gallery) and slug auto-generation. Every action re-checks `content:write` and writes an audit entry.
- **Service & trainer profile pages** — `/services/[slug]` and `/trainers/[slug]` (force-dynamic, unpublished items 404) with SEO metadata, images, bio/content, and — on trainer pages — the classes they teach from the timetable module. The Services/Trainers section blocks now link their cards to these pages.
- **Modules connected to section blocks** — services-grid/trainers-grid/plans/testimonials-slider already support "show all / pick"; the **Gallery block** gained the same choice: source from the gallery module (all or picked) or keep hand-picked images on the section. Legacy hand-picked sections keep working.
- **Contact / consultation form** — new **"Contact / lead form"** section type (registry, builder form, public renderer) that posts to `createLeadAction`. Spam protection is a hidden honeypot plus optional **Cloudflare Turnstile** (widget charges and verifies only when `TURNSTILE_*` keys are present — skipped in dev without keys).
- **Leads inbox** (`/admin/leads`) — statuses (NEW → CONTACTED → CONVERTED → CLOSED), staff notes, per-status filtering, delete, and a CSV export route (`/admin/leads/export`, auth-checked, BOM + RFC 4180 escaping). Every new lead sends an email to the address in Email settings (`LEAD_NOTIFY_TO` fallback) when SMTP is configured.

## Phase 4 notes & assumptions

- Module order = `sort_order` (the move arrows in the admin), and published modules render in that order in the public blocks.
- Slugs auto-generate from names/titles and uniquify; editing them keeps uniqueness.
- SMTP isn't configured in dev, so lead emails log to the console instead (see "Auth model"/`email.ts`).
- A public class timetable renderer is Phase 5 polish — the timetable CRUD exists now, and trainer profile pages already surface that trainer's classes.
- The detail routes live at `/services/[slug]` and `/trainers/[slug]`, which take precedence over the generic `/[slug]` page for those prefixes (a CMS page with a matching slug on `/services/…` is shadowed by the module detail route).

### Phase 4 acceptance (HTTP, against the running build)

Driven end-to-end over the real server-action wire protocol (login → builder save/publish → module CRUD → lead form → inbox/CSV): 43/43 checks passed. Highlights:

- Logged in via `loginAction`; created trainer **Usman Ali** through `createTrainerAction` → he appears in the admin list, in the home **Trainers grid** (section added to home via `saveSectionsAction`), and on the live profile page `/trainers/usman-ali` (unknown slugs 404).
- Create/list for all six modules (`services`, `plans`, `testimonials`, `gallery`, `timetable`) verified over HTTP, including `deleteModuleItemAction` cleanup.
- The **contact page** was published with a **lead-form** section; the public form renders. A submission via `createLeadAction` appeared in `/admin/leads` as NEW, status/notes updated to CONTACTED, and the CSV export (`/admin/leads/export`) returned BOM-prefixed `text/csv` with the lead. The honeypot silently swallowed a bot submission (no row, no email). With SMTP unset the email notification logged `[email] SMTP not configured - would send "New lead: …"`.
- Unauthenticated `/admin/*` requests redirect to `/admin/login` (page and export route).

### What landed in Phase 5

- **Reference-site starter content** — the seed now creates the PRD default page set (`home`, `who-we-are`, `services`, `coaches`, `gallery`, `success-stories`, `plans`, `timetable`, `contact`), all published, each with starter sections drawn from the section registry (story rich-text, stats, feature cards, modules, CTA banners, contact block, lead form). Images are intentionally left empty until the owner uploads studio photos. The header/footer menus are seeded to the PRD §16.2 structure — Home, Who We Are, **What We Do** (a dropdown listing the five services), Gallery, Success Stories, Contact Us. Seeding stays idempotent: existing pages/sections/menus are left untouched.
- **Two new section blocks** (registry + Zod schema + admin form + public renderer, no migration):
  - **Class timetable** — renders the weekly schedule from the timetable module, grouped by day and ordered by start time, with an optional per-section day filter. Shows the trainer name per entry.
  - **Contact information** — renders address, phone, WhatsApp, email and opening hours from Settings → General (each row toggleable per page) alongside the Google Maps embed (only when the URL is `http(s)`).
- **SEO suite**:
  - **`/sitemap.xml`** (`src/app/sitemap.ts`, dynamic) — every published, non-`noindex` CMS page plus the public `/services/[slug]` and `/trainers/[slug]` routes, with `lastModified`, `changeFrequency` and `priority`.
  - **`/robots.txt`** (`src/app/robots.ts`, dynamic) — honours the Settings → SEO `robots` directive (a `noindex` choice blocks the whole site), always disallows `/admin/` and `/preview/`, and advertises the sitemap.
  - **Structured data (JSON-LD)** — site-wide `HealthClub`/`LocalBusiness` on every public page (from General settings), `Service` on service profiles and `Person` on trainer profiles.
  - **DB-driven default metadata** — the root layout's static `metadata` became `generateMetadata`, reading the default title/description and OG image from Settings → SEO (per-page metadata still overrides).
  - **Owner script injection** — Settings → Scripts `headScripts` (via `next/script` `beforeInteractive`) and `bodyScripts` now render on every page (for GA/Pixel/custom snippets).

## Phase 5 notes & assumptions

- **Public pages remain `force-dynamic`.** The Phase 5 reference recreation targets correctness and completeness; an ISR/Lighthouse performance pass was deferred to Phase 6 because the deployment host and a real Lighthouse run weren't available in this environment. Dynamic `sitemap.xml`/`robots.txt` likewise re-read the DB per request so SEO settings and publishes apply immediately.
- **"Recreate the reference site" follows PRD §16 structure and copy**, not a pixel diff: no reference screenshots or brand assets were available, so layout uses the existing design tokens and the seeded text is placeholder-quality until the client supplies final content.
- **Blog and Urdu/English RTL are optional PRD items and were not implemented** in Phase 5 (the `BlogPost`/`InstagramHighlight` tables exist in the schema for a later pass). The site ships English, left-to-right.
- The **timetable and contact-info renderers are deliberately conservative**: the timetable shows a friendly empty state when nothing is published, and the map iframe is skipped unless the stored URL is absolute `http(s)`.
- **Starter content is additive to the seed only** — because seeding is idempotent, the reference page set applies to fresh installs. The same content was applied to the running dev database (new pages created, menus rebuilt, `services`/`contact` published) for acceptance.

### Phase 5 acceptance (HTTP, against the running build)

35/35 Phase 5 checks passed (`accept5.mjs`), and the Phase 4 harness still passes 43/43 (both made idempotent / non-destructive). Highlights:

- `/robots.txt` returns 200, blocks `/admin/` and advertises the sitemap; `/sitemap.xml` lists every published page plus module-detail URLs and excludes drafts (`/about`, `/trainers`).
- All nine starter pages render 200; each shows its seeded sections (story, services grid, coaches, gallery, testimonials, plans, timetable).
- Home ships `HealthClub`/`LocalBusiness` JSON-LD; `/services/personal-training` ships `Service`, `/trainers/head-coach` ships `Person`.
- The **timetable** block renders the weekly schedule (day names + seeded classes); the **contact-info** block was added to the contact page through the real `saveSectionsAction` (so it passed registry validation) and `publishPageAction`, then rendered live (address, phone, email, hours).
- The rebuilt header menu shows the reference items and the "What We Do" dropdown links to service detail pages; the page builder lists the two new block types.

### What landed in Phase 6

- **Unit tests** (`npm test`, 57 tests) — a dependency-free suite using Node's built-in test runner with `tsx` for TypeScript and the `@/*` path alias. Coverage targets the pure, security-relevant logic:
  - `tests/permissions.test.ts` — the role→permission matrix (Owner/Editor/Front-desk least privilege, fail-closed on unknown roles).
  - `tests/sections.test.ts` — the section registry ↔ Zod schema invariant (every type has metadata + a schema, every `sectionDefaults` validates), draft-save limits (≤80 blocks, unknown types rejected, `javascript:` hrefs rejected, Columns nestable-block rules).
  - `tests/validation.test.ts` — the admin/public Zod schemas: URL fields reject `javascript:`/`vbscript:`, redirects can't hijack `/admin`, phone/email/price/weekday formats, JSON-list round trips.
  - `tests/lib-primitives.test.ts` — slug generation, date/media formatting, `themeToCss` sanitisation, `serializeJsonLd` escaping, `csvCell` formula-injection guards, `toFieldErrors`.
- **Security review + fixes** (every item backed by a test or an HTTP check):
  - **JSON-LD breakout** — structured data was emitted with raw `JSON.stringify`, so a CMS field containing `</script>` could close the tag and inject markup. Added `serializeJsonLd` (`src/lib/seo.ts`) which escapes `<` and the line separators; used by the site layout and the service/trainer pages.
  - **CSV formula injection** — the leads export escaped quotes but not leading `= + - @`, so a public submission could execute as a spreadsheet formula when staff opened the file. Added `csvCell` (`src/lib/csv.ts`) per OWASP guidance; the export route now uses it.
  - **Unexposed internal action** — `mediaUsageLabels` was an `export` in a `"use server"` module, which Next.js turns into a callable action endpoint; it did DB counts with no permission check. It is now a module-private function (its only caller is `deleteMediaAction`, which checks `media:delete`).
  - Reviewed and confirmed: all 40+ admin actions call `assertPermission`; the proxy is a first-pass only and every page re-checks via `requirePermission`; sessions are signed HS256 JWTs in an httpOnly/SameSite=Lax/(Secure-in-prod) cookie with a live `is_active` re-check; passwords are bcrypt cost 12 with a 5-attempt/15-minute lockout and constant-time behaviour for unknown emails; no raw SQL is used (Prisma is parameterised).
- **Accessibility** — added a skip-to-content link and a focusable `#main-content` landmark on the public site, and made the media picker keyboard-friendly (dialog closes on Escape and returns focus to the trigger, individual pickers have a unique accessible name). Confirmed the header/mobile nav, dialog and all images (decorative ones use `alt=""`) are labelled.
- **Performance** — the root layout resolved redirects by loading the whole table and filtering in JS; `fromPath` is unique, so it now does an indexed `findUnique`. Confirmed settings, menus and media rows are memoised per request with `React.cache`.

## Phase 6 notes & assumptions

- **Draft saves are always allowed.** The video and image-banner block schemas previously *required* a URL/image, which meant a freshly added block could not be saved as a draft; both fields now accept empty (the renderers already degrade gracefully). This was found by the "every `sectionDefaults` validates" test.
- **E2E is HTTP-level, not a browser.** The PRD lists Playwright; no browser binary is available in this environment, so end-to-end coverage is provided by the scripted HTTP harnesses in `tests/acceptance/` (`accept2.mjs` Phase 4, `accept5.mjs` Phase 5, `accept6.mjs` Phase 6, `accept7.mjs` Phase 7) which drive the *real* Next.js server actions over the wire, plus the unit suite. A Playwright pass remains a Phase 7/deployment nicety, not a blocker.
- **Custom scripts stay owner-only.** `settings.scripts.headScripts/bodyScripts` are injected raw by design (GA/Pixel/custom snippets); access is gated by the owner-only `scripts:write` permission, so this is trusted input rather than an escalation.
- **ISR/Lighthouse tuning deferred.** Public pages remain `force-dynamic`; the perf work here removes obvious waste but a full Core-Web-Vitals pass needs the real host (Phase 7).

### Phase 6 acceptance (unit + HTTP, against the running build)

- `npm test` → **57/57** green; `npm run typecheck` and `npm run lint` clean; `npm run build` succeeds.
- `accept6.mjs` → **18/18** checks: skip link + `#main-content` + `lang="en"` on the public site; `robots.txt`/`sitemap.xml` and the site-wide/service/trainer JSON-LD intact after the serializer change; the leads CSV export refuses anonymous callers (307) and, when authenticated, is `text/csv` with a UTF-8 BOM; a real public lead whose name is `=cmd|'/C calc'!A0` lands in the export as `"'=cmd…"` (neutralised), then is removed via `deleteLeadAction` (the harness leaves no residue).
- Phase 4 (`accept2.mjs` 43/43) and Phase 5 (`accept5.mjs` 35/35) still pass, so the hardening introduced no regressions.

### What landed in Phase 7

- **`DEPLOYMENT.md`** — an end-to-end production guide: server prerequisites (Node 22, MySQL 8, Nginx, PM2), database creation, `.env` for production, `prisma migrate deploy` + seed, build/run under PM2, the Nginx server block and Certbot TLS, the writable `uploads/` directory, daily backups, a go-live checklist, an update procedure, a documented restore, and a troubleshooting table.
- **`deploy/`** — the operational artifacts the guide references:
  - `ecosystem.config.cjs` — PM2 process definition (binds `127.0.0.1:3000`).
  - `nginx.conf` — reverse proxy with gzip, long-lived caching for `/_next/static` and `/uploads`, and a commented `/admin` IP-allowlist block.
  - `backup.sh` — mysqldump (via `MYSQL_PWD`, no password on the command line) + `uploads/` tarball, with retention pruning; driven by cron.
  - `restore.sh` — confirmation-guarded restore of the DB and uploads.
- **`docs/ADMIN-GUIDE.md`** — the owner's user guide: roles, a tour of the admin, step-by-step instructions for every common task (edit text, replace an image, add a section/page/coach, menus, leads, settings/theme), troubleshooting, and the **client acceptance checklist** from the PRD.
- **`.gitignore` fixes** — the documented `.env.example` was being ignored by the `.env*` rule; it is now explicitly committed (`!.env.example`), and runtime `uploads/` is ignored so client media is never committed (it is backed up on the server instead).
- **`accept7.mjs`** — an HTTP acceptance harness that performs the PRD's client checklist against the running build and then removes everything it created (see below).

## Phase 7 notes & assumptions

- **No server was provisioned.** This environment has no VPS/domain/DNS/SMTP, so the *executable* deliverables are the deployment guide and scripts; provisioning, DNS and Certbot are documented steps the operator runs. The site is verified against a local production build (`npm run build && next start`).
- **No recorded walkthrough video** (the PRD lists "PDF or in-app help" as the primary deliverable, which `docs/ADMIN-GUIDE.md` provides). A screen recording is a deployment-time nicety.
- **Source control:** the project is not a git repository; `.gitignore` is prepared so the tree can be initialised and committed as-is.
- **Cleanup ids are read from the database by unique key.** The Phase 7 harness creates real rows (a page, a media item, a trainer, a lead) and deletes them again; to guarantee it removes *exactly* its own rows — and never a live record — it resolves the ids from the local DB by their unique slug/email/filename rather than scraping the admin HTML. This was a deliberate hardening after a first attempt resolved a wrong row.

### Phase 7 acceptance (HTTP, against the running build)

`accept7.mjs` → **23/23** checks, walking the PRD acceptance checklist end-to-end through the real server actions:

- **Edit text** — create a page, save a rich-text draft, publish, and see the text live at its URL.
- **Add a section** — add a second block, publish, and confirm both render.
- **Replace an image** — upload a file through `uploadMediaAction`, confirm it appears in the media library, then remove it.
- **Add a page** — `createPageAction` routes to the new builder (id parsed from the action redirect).
- **Add a trainer** — create one, confirm it appears in the admin *and* publicly on `/coaches`, then remove it.
- **Read leads** — submit the public form, see the enquiry in the inbox, update its status, find it in the CSV export, then delete it.
- **Cleanup** — trash + permanently delete the acceptance page and confirm it 404s. The harness leaves no rows or files behind (verified against the database).

The manual equivalent is `docs/ADMIN-GUIDE.md` §4; Phase 4/5/6 harnesses (`43/43`, `35/35`, `18/18`) and the 57 unit tests all still pass.

## Assumptions

- Placeholder copy, prices and addresses are used until the client supplies final content (PRD Phase 0 deliverable). Everything is editable through the CMS once the relevant phase lands.
- Design tokens in `src/lib/theme/tokens.ts` approximate the reference design until brand files are provided.
- Section JSON `content` shapes used by the seed are the registry's field names; images are empty strings until the owner uploads media (the seed deliberately ships no stock photos).
- The Phase 5 starter pages (`home`, `who-we-are`, `services`, `coaches`, `gallery`, `success-stories`, `plans`, `timetable`, `contact`) are seeded as published with starter sections, and the reference header/footer menus are seeded alongside them.