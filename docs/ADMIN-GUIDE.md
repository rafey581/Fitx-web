# FITX admin user guide

A practical guide to running the site from `/admin`. No coding required — every
change here is saved to the database and appears on the public site after you
publish.

> **Golden rule:** edits are saved as a **draft** first. Nothing changes on the
> live site until you press **Publish**.

---

## 1. Signing in

1. Go to `https://<your-domain>/admin`.
2. Enter your email and password, then **Sign in**.
3. Forgot it? Use **Forgot password** — you'll get a reset link by email (this
   requires SMTP to be configured).

You'll land on the dashboard, which shows recent activity and quick links.

**Your role decides what you can do.** If a menu item is missing, your account
doesn't have that permission. Ask the owner to change your role.

| Role | Can do |
| --- | --- |
| **Owner** | Everything, including users, settings, theme and custom scripts. |
| **Editor** | Pages, media, content (trainers, services, plans, gallery, timetable, testimonials), menus, leads. |
| **Front desk** | Leads only (read and update). |

---

## 2. The parts of the admin

| Menu | What it's for |
| --- | --- |
| **Pages** | Build and publish the public pages (Home, Who We Are, …). |
| **Media** | Upload and manage images. |
| **Trainers** | Coach profiles (shown publicly on `/coaches`). |
| **Services** | The "What We Do" services. |
| **Plans** | Membership/pricing plans. |
| **Testimonials** | Client success stories. |
| **Gallery** | Photo gallery. |
| **Timetable** | Weekly class schedule. |
| **Leads** | Enquiries from the contact form. |
| **Menus** | The header and footer navigation. |
| **Theme** | Colours, fonts, corner radius. |
| **Settings** | Business info, SEO, email, custom scripts. |
| **Redirects** | Send an old URL to a new one (301/302). |
| **Users** | Staff accounts (owner only). |
| **Audit log** | Who changed what, and when (owner only). |

---

## 3. Common tasks

### 3.1 Edit text on a page

1. **Pages** → click the page (e.g. **Home**).
2. In the builder, click the block you want to edit (e.g. the hero or a
   text block) to expand its fields on the right.
3. Change the text.
4. Click **Save draft**, then **Preview** to check it.
5. Click **Publish** to make it live.

### 3.2 Replace or add an image

1. **Media** → **Upload**. Choose a file (JPG/PNG/WebP/AVIF, up to 25 MB).
2. To use it: open a page, click the block's image field, then **Choose image**
   and pick from the library. (Use the same flow for coach photos and gallery
   items.)
3. You can edit a media item's **alt text** and **caption** in **Media** — the
   alt text is read by Google and screen readers, so keep it descriptive.
4. Deleting is blocked while an image is still used somewhere; the app tells you
   where.

### 3.3 Add a section to a page

1. Open the page in the builder.
2. Click **Add section** and pick a block type (Hero slider, Image banner,
   CTA banner, Columns, Split content, Rich text, Video, Feature cards,
   Stats / counters, Testimonials slider, FAQ accordion, Services grid,
   Trainers showcase, Plans / pricing, Gallery, Class timetable,
   Contact / lead form, Contact information, Spacer / divider).
3. Fill in the fields. Use the visibility toggle to hide a block without
   deleting it, and the style options to change spacing/background.
4. Reorder with the up/down controls.
5. **Save draft** → **Preview** → **Publish**.

### 3.4 Add a page

1. **Pages** → **New page**.
2. Give it a **title**. The **slug** (URL) is generated automatically — you can
   override it.
3. Add sections (see above).
4. Optionally set the page's own SEO title/description.
5. When ready, **Publish**. Then add it to the menu (see 3.6) if you want it in
   the navigation.

### 3.5 Add a trainer

1. **Trainers** → **New**. Enter name, title, bio and specialties.
2. Upload a photo via the media field.
3. Toggle **Published** on, then **Save**. It appears on the Coaches page and in
   the "Trainers showcase" block where used.

### 3.6 Change the menus

1. **Menus** → pick **Header** or **Footer**.
2. Add, reorder or remove items. An item can link to a page or to a custom URL.
   One level of dropdowns is supported (e.g. "What We Do" → the five services).
3. **Save**. Menu changes are live immediately (no publish step).

### 3.7 Read and work the leads

1. **Leads** shows every contact-form enquiry with its status.
2. Open a lead to see the message, then set a **status** (New → Contacted →
   Converted/Closed) and add a **note**.
3. **Export CSV** downloads the whole inbox (opens in Excel/Sheets). New leads
   are also emailed to the address in **Settings → Email**.

### 3.8 Testimonials, plans, gallery, timetable

These work like trainers: list → **New** → fill the fields → **Save** / toggle
**Published**. The public pages and home-page blocks read from them
automatically.

### 3.9 Business info, SEO and theme

- **Settings → General**: business name, tagline, address, phone, WhatsApp,
  email, opening hours, map embed, social links, announcement bar, and
  **maintenance mode** (turns the whole public site into a "Back shortly" page).
- **Settings → SEO**: default title/description, share image, robots directive,
  and analytics/pixel IDs.
- **Settings → Scripts**: custom head/body snippets (owner only).
- **Theme**: brand colours, fonts and corner radius — applied site-wide.

---

## 4. Client acceptance checklist

Work through this on your own to confirm the site is ready:

- [ ] **Edit text** — change a heading on the Home page, Save draft, Publish,
      and see it on the live site.
- [ ] **Replace an image** — upload a new photo in Media and swap it into a
      block or a trainer.
- [ ] **Add a section** — add a block (e.g. Timetable or Contact information) to
      a page and publish it.
- [ ] **Add a page** — create a new page, add a section, publish it, and add it
      to the Header menu.
- [ ] **Add a trainer** — create a trainer with a photo and publish it; check the
      Coaches page.
- [ ] **Read leads** — submit the public contact form, see the lead in **Leads**
      (and in your inbox), set its status, and export the CSV.

If each box is ticked without help, handover is complete.

---

## 5. Tips & troubleshooting

- **"I saved but the site didn't change."** Drafts don't show publicly — press
  **Publish**. (Menus, theme and settings apply immediately; pages and modules
  need Publish.)
- **"A page is missing from the menu."** Only *published* pages can be linked
  from a menu; publish it first.
- **"I can't delete an image."** It's still used somewhere — the message says
  where. Replace it first.
- **"The site says Back shortly."** Maintenance mode is on in Settings →
  General. Turn it off.
- **Publishing a mistake?** Use the page's **Revert** action to restore the last
  published version.
