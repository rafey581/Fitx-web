# FITX Gym Sahiwal: Website + Admin CMS

**Product Requirements Document and Phased Development Plan** Prepared for: coding agent / development team. Version 1.0

---

## 1. Overview

**Client:** FITX Personal Fitness Training Studio, Shadman Town, Faisalabad Road, Sahiwal, Pakistan. Phone: 0300 6900206.

**Reference site:** https://www.fitxfitnessstudio.com/ (canonical fitx.pk). It is a dark, photo-driven premium site (black, white and one orange accent) for a personal training studio offering Personal Training, Boxing, Yoga, Family Sessions and Nutrition Guidance, with a coaches page, client testimonials and a Join Now call to action.

**Goal:** Rebuild the same public website (same look, structure and content) on a new platform, and add a **full admin panel (CMS)** so the gym owner can change everything on every page without a developer: text, images, sections, layout order, colors, menus, trainers, plans, SEO and more.

**Success criteria**

1. The public site visually matches the reference site on desktop and mobile.
2. A non-technical admin can add a new page, add and reorder sections, upload images and publish, with no code.
3. Every piece of visible text and every image on the public site is editable from the admin panel.
4. Lighthouse scores: Performance 85+, Accessibility 90+, SEO 95+ on mobile for the home page.

> **Note for the agent:** the reference site is JavaScript-rendered. Use the screenshots and assets supplied by the client (see Section 14) as the source of truth for design and copy. Do not guess content.

---

## 2. Users and Roles

| Role | Description | Permissions |
| --- | --- | --- |
| **Visitor** | Prospective member | Browse site, submit forms, click to call or WhatsApp |
| **Owner (Super Admin)** | Gym owner | Everything, including managing admin users and site settings |
| **Editor** | Staff or marketing | Edit pages, media, trainers, plans, gallery; view leads. Cannot manage users or global settings |
| **Front-desk** (optional) | Reception | View and manage leads only |

---

## 3. Technology Stack (decided)

| Layer | Choice |
| --- | --- |
| Framework | **Next.js 14+ (App Router), TypeScript** |
| Styling | Tailwind CSS with design tokens driven by DB settings (CSS variables) |
| Database | **MySQL 8** (MariaDB 10.5+ compatible) |
| ORM | **Prisma** |
| Auth | NextAuth/Auth.js (credentials) or Lucia, bcrypt/argon2 password hashing, secure httpOnly sessions |
| Rich text | TipTap editor (stores sanitized HTML or JSON) |
| Drag and drop | dnd-kit (section reordering) |
| Validation | Zod on every API input |
| Media storage | Local disk (`/uploads`) behind an abstraction, switchable to S3/Cloudinary. Images auto-converted to WebP with multiple sizes (sharp) |
| Email / notifications | Nodemailer (SMTP) for lead alerts. Optional WhatsApp click-to-chat link |
| Hosting | VPS (Node 20 + PM2 + Nginx + MySQL) or Vercel plus managed MySQL |

*If the client's host only supports PHP/cPanel, the same PRD can be implemented in Laravel + MySQL. The data model, features and phases below stay identical.*

---

## 4. Public Website Scope

All pages below are **dynamic and built from sections** (see Section 6) unless noted. Slugs are editable.

| Page | Default slug | Purpose |
| --- | --- | --- |
| **Home** | `/` | Hero slider, two feature cards, Our Programs and Our Coaches, client testimonials slider, footer (see 16.3) |
| **Who We Are** | `/who-we-are` | Studio story ("Boutique Training"), philosophy, facility photos. Menu dropdown items to be confirmed |
| **What We Do (Services)** | `/services` and `/services/[slug]` | Dropdown pages: Personal Training, Boxing Session, Yoga Sessions, Family Sessions, Nutrition Guidance. "Choose a Program" links here |
| **Coaches** | `/coaches` and `/coaches/[slug]` | Coach cards and individual profiles (e.g. Zohaib Ali). "Meet Our Coaches" links here |
| **Gallery** | `/gallery` | Image and video grid with lightbox, filter by category |
| **Success Stories** | `/success-stories` | Client testimonials, transformations, before/after |
| **Contact Us** | `/contact` | Consultation form, map, address, hours, phone, WhatsApp |
| **Membership / Plans** (optional, off by default) | `/plans` | Pricing cards |
| **Blog** (optional, Phase 5) | `/blog` and `/blog/[slug]` | Fitness articles for SEO |
| **Custom pages** | any slug | Created by admin (e.g. Offers, Privacy, Terms) |
| **404 page** | n/a | Branded, editable text |

**Global elements (all editable):** header with logo and menu, sticky mobile call/WhatsApp button, footer (links, address, hours, socials), announcement bar (optional promo banner), cookie/notice bar (optional).

**Public features**

- Fully responsive (mobile-first; most traffic will be mobile in Pakistan)
- Consultation/contact form with validation, spam protection (honeypot + rate limit, optional reCAPTCHA/Turnstile)
- Click-to-call, click-to-WhatsApp, embedded Google Map
- SEO: per-page title, meta description, OG image, canonical, `sitemap.xml`, `robots.txt`, JSON-LD `LocalBusiness` / `HealthClub` schema
- Image lazy-loading, responsive `srcset`, WebP
- Draft pages never visible publicly
- Optional English/Urdu toggle with RTL support (Phase 5; design the schema now so `content` can hold per-locale values)

---

## 5. Admin Panel Requirements (`/admin`)

Admin is a separate protected area with its own clean UI. Everything is accessible without touching code.

### 5.1 Authentication and Security

- Login at `/admin/login`, logout, forgot/reset password by email
- Roles and permissions enforced **server-side** on every API route and server action
- Brute-force protection (rate limit + temporary lockout), CSRF protection, secure cookies
- Audit log: who changed what and when (pages, settings, users)

### 5.2 Dashboard

- New leads count, recent leads, quick links (Edit Home, Upload Media, Add Page), site publish status

### 5.3 Pages Manager

- List, search and filter pages (Published / Draft / Scheduled)
- Create, duplicate, rename, delete (soft delete with trash and restore)
- Edit slug, SEO title, meta description, OG image, noindex toggle
- Set a page as Home; add or remove it from the menu
- **Status:** Draft, Published, Scheduled (publish at date/time)

### 5.4 Visual Section Builder (core feature)

- For each page, show an ordered list of sections
- **Add section** from a library (Section 6), **drag to reorder**, **duplicate**, **hide/show**, **delete**
- Each section opens a form editor with fields for its type (text, rich text, image picker, button label + link, repeatable items, toggles, color pickers)
- Per-section style controls: background (color, image, gradient), text color, padding top/bottom, container width, alignment, show/hide on mobile or desktop
- **Live preview** pane (desktop / tablet / mobile toggle) that updates as the admin edits
- **Save Draft**, **Publish**, **Discard changes**, **Revert to previous version** (version history with last 20 versions per page)
- Autosave drafts; warn before leaving with unsaved changes

### 5.5 Media Library

- Drag and drop multi-upload (jpg, png, webp, svg, mp4; size limits configurable)
- Grid with search, folders or tags, file details (size, dimensions, alt text, caption)
- Auto-optimize and generate thumbnails and responsive sizes
- Replace file (keep URL), delete (block deletion if in use or warn which pages use it)
- Image picker modal reused everywhere in the admin
- Basic crop and focal point selection

### 5.6 Content Modules

Each has list, create, edit, delete, reorder, publish toggle:

- **Trainers:** name, role, photo, bio, specialties, certifications, social links, profile page SEO
- **Services/Programs:** title, short description, full content, icon or image, gallery, CTA
- **Membership Plans:** name, price, billing period, feature list, highlight flag, CTA link
- **Testimonials:** name, quote, photo, rating, before/after images
- **Gallery items:** image/video, category, caption
- **Class timetable (optional):** day, time, class, trainer
- **Blog posts (Phase 5):** title, slug, cover, rich content, category, author, status

### 5.7 Leads / Inquiries

- Table of form submissions: name, phone, email, goal, message, source page, date
- Status workflow: New, Contacted, Converted, Closed; internal notes
- Search, filter, export CSV, delete
- Email notification to configured addresses on new lead

### 5.8 Navigation and Footer Manager

- Edit header menu and footer links: label, link (page or custom URL), order (drag), nested dropdowns (one level), open in new tab
- Edit footer columns, copyright text, social icons

### 5.9 Design / Theme Settings

- Logo (light and dark), favicon
- Brand colors (primary, secondary, accent, background, text), with contrast warning
- Fonts (pick from curated Google Fonts list, self-hosted)
- Button style (radius, fill or outline), section spacing scale
- Changes apply site-wide through CSS variables, with a preview before publishing

### 5.10 Global Settings

- Business name, tagline, address, phone, WhatsApp number, email, opening hours, Google Map embed or lat/long
- Social links (Instagram, Facebook, TikTok, YouTube)
- Announcement bar (text, link, on/off, dates)
- SEO defaults, Google Analytics / Meta Pixel IDs, custom head/body scripts (Owner only)
- Email (SMTP) settings and lead notification recipients
- Maintenance mode toggle
- 301 redirect manager

### 5.11 User Management (Owner only)

- Create, edit, deactivate users; assign role; force password reset

---

## 6. Section (Block) Library

Every section is stored as `type` + `content` (JSON) + `style` (JSON). The renderer maps `type` to a React component. Each type has a Zod schema that drives both validation and the admin form. Build these types:

| Type | Key fields |
| --- | --- |
| **Hero** | heading, subheading, 1 to 2 CTA buttons, background image or video, overlay opacity, alignment |
| **Rich Text** | heading, rich text body, alignment |
| **Text + Image** | heading, text, image, image side (left/right), button |
| **Services Grid** | heading, pick services (from module) or custom cards, columns |
| **Feature List / Icons** | repeatable items: icon, title, text |
| **Trainers Showcase** | heading, pick trainers or all, layout (grid/carousel) |
| **Plans / Pricing** | heading, pick plans or all |
| **Gallery** | heading, pick images or category, layout (grid/masonry/carousel), lightbox |
| **Testimonials** | heading, pick items, layout (slider/grid) |
| **Stats / Counters** | repeatable: number, label |
| **CTA Banner** | heading, text, button, background |
| **FAQ (accordion)** | repeatable: question, answer |
| **Video** | YouTube/Vimeo URL or uploaded video, poster |
| **Timetable** | pick days or classes |
| **Contact Form** | heading, field toggles, success message, notification email override |
| **Map + Contact Info** | pulls from global settings, with overrides |
| **Image Banner / Slider** | repeatable images with caption and link |
| **Spacer / Divider** | height, line style |
| **Custom HTML** | raw HTML (Owner only, sanitized) |

Adding a new block type later must require only: a Zod schema, a render component and an admin form definition. No DB migration.

The reference design also requires these block types, specified in Section 16.4: Hero Slider, Feature Cards, Split Content, Columns wrapper, Testimonials Slider and Instagram Highlights. Build them in addition to the list above.

---

## 7. Data Model (MySQL via Prisma)

Use `utf8mb4` for Urdu and emoji. Primary keys are BigInt or CUID. All tables have `created_at` and `updated_at`.

**Core tables**

- `users`: id, name, email (unique), password\_hash, role (OWNER/EDITOR/FRONTDESK), is\_active, last\_login\_at
- `pages`: id, title, slug (unique), status (DRAFT/PUBLISHED/SCHEDULED), publish\_at, is\_home, seo\_title, seo\_description, og\_image\_id, noindex, deleted\_at
- `sections`: id, page\_id, type, sort\_order, content (JSON), style (JSON), is\_visible, visibility\_devices
- `page_versions`: id, page\_id, snapshot (JSON of page + sections), created\_by, created\_at
- `media`: id, filename, path, mime, size, width, height, alt, caption, folder, variants (JSON), uploaded\_by
- `trainers`, `services`, `plans`, `testimonials`, `gallery_items`, `timetable_entries`, `blog_posts`: module fields as in Section 5.6, plus `sort_order` and `is_published`
- `menu_items`: id, menu (HEADER/FOOTER), parent\_id, label, link\_type (PAGE/URL), page\_id, url, sort\_order, new\_tab
- `leads`: id, name, phone, email, goal, message, source\_page, status, notes, ip, user\_agent
- `settings`: key (unique), value (JSON), group (for example `general`, `theme`, `seo`, `email`, `scripts`)
- `redirects`: id, from\_path, to\_path, code
- `audit_logs`: id, user\_id, action, entity, entity\_id, meta (JSON), created\_at

**Rules**

- Add indexes on `pages.slug`, `sections(page_id, sort_order)`, `leads(status, created_at)`.
- Publishing copies the draft into live data. Keep a `draft_content` and `published` distinction for pages (either a flag on sections, or a snapshot rendered from `page_versions`). The agent should choose one approach and document it in the README.
- Provide a Prisma seed script that creates the Owner account (from env vars), default settings, the default menu and the starter Home page with sections that replicate the reference site.

---

## 8. Routing and API Overview

**Public (server-rendered, cached with on-demand revalidation when admin publishes)** `/`, `/[slug]`, `/services/[slug]`, `/coaches/[slug]`, `/blog/[slug]`, `/sitemap.xml`, `/robots.txt`, `POST /api/leads`

**Admin (protected)** `/admin`, `/admin/pages`, `/admin/pages/[id]/builder`, `/admin/media`, `/admin/trainers`, `/admin/services`, `/admin/plans`, `/admin/testimonials`, `/admin/gallery`, `/admin/leads`, `/admin/menus`, `/admin/theme`, `/admin/settings`, `/admin/users`, `/admin/redirects`, `/admin/audit-log`

All mutations go through validated server actions or REST routes under `/api/admin/*` with role checks. Public pages must revalidate (ISR tags) immediately after publish so changes go live in seconds.

---

## 9. Non-Functional Requirements

- **Performance:** LCP under 2.5 s on 4G mobile; images optimized; minimal JS on public pages
- **Security:** OWASP Top 10 coverage, input validation and sanitization (DOMPurify on rich text and custom HTML), file-type verification on uploads, no executable uploads, rate limiting, HTTPS only, secrets in env vars
- **Accessibility:** WCAG 2.1 AA (semantic HTML, alt text, keyboard navigation, focus states, contrast)
- **Reliability:** Daily automated MySQL backup and uploads backup, with a documented restore procedure
- **Browser support:** last 2 versions of Chrome, Safari, Edge, Firefox; Android Chrome and iOS Safari
- **Maintainability:** TypeScript strict, ESLint and Prettier, clear folder structure, README, `.env.example`, inline comments on non-obvious logic
- **Admin usability:** Admin works well on desktop and is usable on tablet and phone; use plain labels and helper text, since users are non-technical

---

## 10. Design Requirements

- Replicate the reference site: layout, spacing, typography, colors, imagery style, and animations (subtle fade or slide on scroll), using client-provided screenshots as the design source of truth
- Dark, photographic premium look: transparent header over a full-bleed hero, white content areas, navy caption bars, near-black footer, one orange accent and strong photography (theme tokens in Section 16.1)
- Convert the visual style into **theme tokens** (colors, fonts, radius, spacing) so the admin Theme Settings can change them
- Admin UI: clean, neutral, consistent component library (shadcn/ui recommended)

---

## 11. Phased Development Plan

Estimated total: **8 to 10 weeks** for one full-stack developer or agent-driven workflow. Each phase ends with a working, demoable build and acceptance criteria.

### Phase 0: Discovery and Setup (Week 1)

**Tasks**

- Collect screenshots of every page of the reference site, logo, photos, copy, brand colors, fonts, trainer details, plans and prices
- Create the repo, Next.js + TypeScript + Tailwind setup, ESLint/Prettier, Prisma + MySQL connection, `.env.example`
- Set up Git workflow, staging environment, CI lint and build
- Create design tokens from the reference design

**Deliverables:** running skeleton app, DB connected, design token file, written content inventory. **Acceptance:** `npm run dev` works, migrations run, a health-check page loads.

### Phase 1: Database, Auth and Admin Shell (Week 2)

**Tasks**

- Implement the full Prisma schema (Section 7) and the seed script
- Authentication, roles and permission middleware, password reset, login rate limiting
- Admin layout: sidebar, top bar, dashboard, protected routes
- User management and audit log

**Deliverables:** secure admin login with working roles. **Acceptance:** Owner can log in, create an Editor; the Editor cannot open `/admin/users` (blocked server-side, not only hidden).

### Phase 2: Media Library and Global Settings (Week 3)

**Tasks**

- Upload pipeline (validation, WebP conversion, responsive sizes via sharp), storage abstraction
- Media library UI and reusable image picker, alt text, replace and delete safety
- Global settings, theme settings, menu manager, redirects
- Global header, footer and announcement bar rendered from settings

**Deliverables:** media library, site-wide settings that update the live layout. **Acceptance:** changing the logo, a brand color and a menu item in admin changes the public site after save.

### Phase 3: Section Builder and Page Manager (Weeks 4 to 5), core

**Tasks**

- Section registry (type to Zod schema, renderer and admin form)
- Build all block types in Sections 6 and 16.4, matching the reference design
- Pages manager (CRUD, slugs, SEO, status, scheduling, trash)
- Builder UI: add, reorder (drag), duplicate, hide, delete, per-section styling, live preview with device toggle
- Draft/publish flow, autosave, version history and revert
- Dynamic public routing `/[slug]` with ISR and on-demand revalidation

**Deliverables:** admin can build any page from scratch. **Acceptance:** an admin creates a new "Offers" page with 5 sections, reorders them, previews on mobile, publishes, and it appears live and in the menu without developer help.

### Phase 4: Content Modules and Leads (Week 6)

**Tasks**

- CRUD UIs for trainers, services, plans, testimonials, gallery, timetable
- Detail pages for services and trainers
- Connect modules to the section blocks (pick items or show all)
- Contact and consultation form, leads inbox with statuses, notes, CSV export, email notifications, spam protection

**Deliverables:** full content management and lead capture. **Acceptance:** adding a trainer in admin shows them in the Trainers section and on their own profile page; a form submission appears in Leads and sends an email.

### Phase 5: Recreate Reference Site and Polish (Week 7)

**Tasks**

- Build the starter content in the seed so the site matches the reference site page by page
- Pixel-level pass on spacing, typography, animations, responsive breakpoints
- SEO: metadata, sitemap, robots, JSON-LD, OG images; redirects from old URLs
- Optional: blog module, Urdu/English toggle with RTL

**Deliverables:** public site visually equivalent to the reference. **Acceptance:** side-by-side visual review with the client passes on desktop and mobile; Lighthouse targets met.

### Phase 6: QA, Security and Hardening (Week 8)

**Tasks**

- Functional testing of every admin feature; Playwright end-to-end tests for login, create page, publish, upload, submit lead
- Unit tests for permission checks and schema validation
- Security review (auth, uploads, XSS, CSRF, SQL injection via ORM misuse, rate limits)
- Accessibility audit and cross-browser/device testing
- Performance tuning (image sizes, caching, bundle size)

**Deliverables:** test report, fixed issues list. **Acceptance:** no critical or high issues open; all E2E tests pass.

### Phase 7: Deployment, Training and Handover (Weeks 9 to 10)

**Tasks**

- Production server setup (Node + PM2 + Nginx + SSL, MySQL), domain DNS, email (SMTP)
- Automated daily backups and a documented restore
- Content migration and go-live; monitor for 1 week
- Admin user guide (PDF or in-app help) and a recorded walkthrough video for the owner
- Developer README: architecture, how to add a new section type, deployment steps

**Deliverables:** live site, admin accounts for the client, documentation, backup routine. **Acceptance:** client independently completes a checklist: edit text, replace an image, add a section, add a page, add a trainer, publish and read leads.

---

## 12. Testing Strategy

- **Unit:** Zod schemas, permission helpers, slug and redirect logic
- **Integration:** API routes with a test MySQL database
- **E2E (Playwright):** admin login, page create, section add and reorder, publish, media upload, form submit, role restrictions
- **Manual:** responsive testing on real Android and iPhone devices; content review by the client
- **Non-functional:** Lighthouse CI, basic load test of public pages

---

## 13. Out of Scope (v1) / Future Ideas

- Online payments or membership billing
- Member login portal, attendance or check-in system
- Mobile app
- Class booking with capacity management
- WhatsApp API automation

*The data model should not block these, but they are not built in v1.*

---

## 14. Inputs Required from Client

1. Screenshots (or screen recording) of every page of the current site, desktop and mobile
2. Logo files (vector or high-res PNG), brand colors, fonts used
3. All photos and videos, trainer bios, service descriptions, plan names and prices, testimonials
4. Domain name and hosting access (or approval to purchase a VPS)
5. Email accounts for lead notifications and SMTP details
6. Google Maps location, social media links, Analytics and Pixel IDs
7. Decision on optional features: Blog, Urdu language, timetable

---

## 15. Instructions for the Coding Agent

1. Work **phase by phase**. Finish and verify each phase's acceptance criteria before starting the next. Commit after each task with clear messages.
2. Never hard-code visible content. Every string and image on the public site must come from the database (seeded with the reference content).
3. Enforce permissions on the server for every admin action. UI hiding is not security.
4. Keep the section system extensible: adding a block type must not require a DB migration.
5. Validate all input with Zod; sanitize all rich text and custom HTML before rendering.
6. Make everything mobile-first and accessible.
7. At the end of each phase, update the README with setup steps, env variables and what was built, and list any assumptions or open questions.
8. If something in this PRD is ambiguous, choose the simplest option that satisfies the acceptance criteria, document the decision, and continue.
9. Final deliverables: source code, seed data, `.env.example`, deployment guide, admin user guide, test results.

---

## 16. Reference Design Spec (from client screenshots)

Based on screenshots of the live home page supplied by the client. Colors and fonts are approximate; the agent must confirm them from the client's brand files or by inspecting the live site.

### 16.1 Brand defaults, services, menu and naming

1. **Theme tokens (defaults):** orange `#FF4B00` (approx.), navy/charcoal `#1E2330` (approx.), near-black `#0D0A10` (approx.), white and body grey. All editable in Theme Settings.
2. **Services (What We Do):** Personal Training, Boxing Session, Yoga Sessions, Family Sessions, Nutrition Guidance.
3. **Main menu:** Home, Who We Are (dropdown, items to be confirmed), What We Do (dropdown with the five services), Gallery, Success Stories, Contact Us. Plans, Blog and Timetable are optional and off by default.
4. **Naming on the public site:** Coaches (admin module: Trainers), Success Stories (admin module: Testimonials), and "Client Testimonials" as the home-page section title.
5. **Hero:** a multi-slide slider (see 16.3).
6. **Footer credit:** the current footer reads "Built with ♥ by AH Systems". The credit text must be editable or removable in admin.

### 16.2 Global header and footer

**Header:** logo on the left (circular dumbbell icon + white "FIT" + orange "X"); right-aligned uppercase menu with wide letter-spacing (Montserrat-style); active page marked with an orange slash; dropdown is a black panel with an orange bottom border and uppercase items. Header mode is selectable in admin: **transparent over hero** or **solid**, and it becomes solid after scrolling. On mobile it collapses into a hamburger menu.

**Footer (dark, 4 columns):**

1. Logo + tagline ("The Most Premium Personal Training Program", serif)
2. **Instagram** feed or highlight image (see 16.5)
3. **Contact Us:** address (Shadman Town, Faisalabad Road, Sahiwal 57000, Punjab, Pakistan), phone (+92 300 6900206), email, each with an icon
4. **Follow Us:** social icon buttons (Facebook, Instagram, TikTok or similar) and opening hours (Saturday to Thursday 11:00 AM to 10:00 PM; Friday closed)

Bottom bar: copyright text on the left, Privacy and Terms links on the right. All of this comes from Global Settings and the Menu Manager.

### 16.3 Home page sections, top to bottom

| # | Section | What it contains | Block type |
| --- | --- | --- | --- |
| 1 | **Hero slider** | Full-width photo slides, previous/next arrows, autoplay. Each slide has: background image, optional logo graphic image, headline (bold serif, e.g. "The Most Premium Personal Training Program"), and an orange pill button ("JOIN NOW ›") placed bottom-right | **Hero Slider** (new) |
| 2 | **Feature card pair** | Two side-by-side cards. Each has a photo, a dark navy caption bar with an orange eyebrow ("WHO WE ARE", "COMBAT TRAINING"), an uppercase title ("BOUTIQUE TRAINING", "BOXING SESSION"), an orange arrow, and a short paragraph underneath. The whole card links to a page | **Feature Cards** (new) |
| 3 | **Our Programs / Our Coaches (two columns)** | Left column: image, orange eyebrow "WHAT WE DO", large uppercase heading "OUR PROGRAMS /" with an orange slash, a bold lead sentence, two paragraphs (with bold highlighted words), button "CHOOSE A PROGRAM", then a second image. Right column: tall image, divider line, eyebrow "PERSONAL TRAINING", heading "OUR COACHES /", lead sentence, paragraphs, button "MEET OUR COACHES" | **Split Content** (new), used twice in a two-column wrapper |
| 4 | **Client Testimonials** | Heading "CLIENT TESTIMONIALS /", round avatar, large centered quote with orange quote marks, orange author name, square pagination dots, auto-rotating | **Testimonials Slider** |
| 5 | **Footer** | See 16.2 | Global |

**Reusable heading style:** eyebrow in small orange uppercase, then heading in heavy uppercase sans-serif followed by an orange slash "/". Make this a shared option on every block: `eyebrow`, `heading`, `show_accent_slash`.

### 16.4 New or updated block types

Add these to the Section Library in Section 6:

- **Hero Slider:** repeatable slides (image, optional logo image, headline, subheading, button label and link, button position), autoplay and interval, arrows on/off, dots on/off, overlay opacity, height (full screen or fixed), mobile image override.
- **Feature Cards:** 2 to 4 cards (image, eyebrow, title, link, paragraph), caption bar color, hover effect.
- **Split Content:** image(s) on one side, text on the other; fields for eyebrow, heading, lead (bold), rich text body, button, image position (left/right), optional extra image below, optional divider; can be placed inside a **Columns** wrapper so two Split Content blocks sit side by side.
- **Columns wrapper (new):** 1 to 4 columns, each holding any other block, with responsive stacking. Needed to reproduce the two-column layout in row 3.
- **Testimonials Slider:** heading, avatar (optional), quote, author, autoplay, dot style.
- **Instagram Block:** see 16.5.

### 16.5 Instagram feed

The footer shows an Instagram post or highlight. Live Instagram feeds need API tokens that expire and break often, so for v1:

- **Default:** a manual "Instagram highlights" module in admin where the owner uploads 1 to 6 images, each with a link to the Instagram post.
- **Optional:** a toggle to paste an embed code from a third-party feed widget.

### 16.6 Admin implications

- The Theme Settings page must expose: accent color, navy caption color, footer color, heading font, body font, and the serif font used for hero text and taglines.
- Every image on the home page (including the logo graphic inside the hero and the footer Instagram image) must be selectable from the media library.
- Provide the header mode (transparent or solid) and the dropdown structure through the Menu Manager.
- The seed script must recreate this home page exactly, using the supplied photos and the copy captured in the screenshots, so the client sees an identical site on first login.

### 16.7 Still needed from the client

Screenshots of the remaining pages: Who We Are (and its dropdown items), each What We Do page (Personal Training, Boxing, Yoga, Family Sessions, Nutrition Guidance), Gallery, Success Stories, Contact Us, the Coaches page, and any Privacy and Terms pages. Mobile screenshots of the home page are also required.
