"use client";

import type { ReactNode } from "react";

import {
  MediaPicker,
  type MediaPickerItem,
} from "@/components/admin/media-picker";
import { Alert, Field } from "@/components/ui/field";
import { ActionForm } from "@/components/ui/action-form";
import { inputClass } from "@/components/ui/styles";
import { SubmitButton } from "@/components/ui/submit-button";
import {
  saveEmailAction,
  saveGeneralAction,
  saveScriptsAction,
  saveSeoAction,
} from "@/server/actions/settings";

export type SettingsManagerProps = {
  canScripts: boolean;
  media: MediaPickerItem[];
  general: {
    businessName: string;
    tagline: string;
    address: string;
    phone: string;
    whatsapp: string;
    email: string;
    openingHours: string;
    mapEmbed: string;
    instagram: string;
    facebook: string;
    tiktok: string;
    youtube: string;
    logoLightId: string | null;
    logoDarkId: string | null;
    faviconId: string | null;
    announcementEnabled: boolean;
    announcementText: string;
    announcementHref: string;
    announcementStartsAt: string | null;
    announcementEndsAt: string | null;
    maintenanceMode: boolean;
  };
  seo: {
    defaultTitle: string;
    defaultDescription: string;
    ogImageId: string | null;
    robots: string;
    googleAnalyticsId: string;
    metaPixelId: string;
  };
  email: Record<string, unknown>;
  scripts: { headScripts: string; bodyScripts: string };
};

function SectionCard({
  id,
  title,
  description,
  children,
}: {
  id: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      className="scroll-mt-24 rounded-brand border border-black/10 bg-white p-6 shadow-sm"
    >
      <h2 className="font-heading text-lg font-bold text-ink">{title}</h2>
      <p className="mt-1 text-sm text-muted">{description}</p>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function GeneralForm(props: SettingsManagerProps) {
  const g = props.general;
  return (
    <ActionForm action={saveGeneralAction}>
      {(state) => (
        <div className="space-y-5">
          {state.error ? <Alert variant="error">{state.error}</Alert> : null}
          {state.message ? (
            <Alert variant="success">{state.message}</Alert>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Business name"
              htmlFor="general-businessName"
              error={state.fieldErrors?.businessName?.[0]}
            >
              <input
                id="general-businessName"
                name="businessName"
                defaultValue={g.businessName}
                className={inputClass}
              />
            </Field>
            <Field
              label="Tagline"
              htmlFor="general-tagline"
              error={state.fieldErrors?.tagline?.[0]}
            >
              <input
                id="general-tagline"
                name="tagline"
                defaultValue={g.tagline}
                className={inputClass}
              />
            </Field>
            <Field
              label="Address"
              htmlFor="general-address"
              error={state.fieldErrors?.address?.[0]}
            >
              <input
                id="general-address"
                name="address"
                defaultValue={g.address}
                className={inputClass}
              />
            </Field>
            <Field
              label="Phone"
              htmlFor="general-phone"
              error={state.fieldErrors?.phone?.[0]}
            >
              <input
                id="general-phone"
                name="phone"
                defaultValue={g.phone}
                className={inputClass}
              />
            </Field>
            <Field
              label="WhatsApp"
              htmlFor="general-whatsapp"
              error={state.fieldErrors?.whatsapp?.[0]}
            >
              <input
                id="general-whatsapp"
                name="whatsapp"
                defaultValue={g.whatsapp}
                className={inputClass}
              />
            </Field>
            <Field
              label="Email"
              htmlFor="general-email"
              error={state.fieldErrors?.email?.[0]}
            >
              <input
                id="general-email"
                name="email"
                type="email"
                defaultValue={g.email}
                className={inputClass}
              />
            </Field>
            <Field
              label="Opening hours"
              htmlFor="general-openingHours"
              error={state.fieldErrors?.openingHours?.[0]}
            >
              <input
                id="general-openingHours"
                name="openingHours"
                defaultValue={g.openingHours}
                className={inputClass}
              />
            </Field>
            <Field
              label="Map embed code"
              htmlFor="general-mapEmbed"
              error={state.fieldErrors?.mapEmbed?.[0]}
              hint="Optional embedded Google Maps iframe snippet for the contact section."
            >
              <textarea
                id="general-mapEmbed"
                name="mapEmbed"
                rows={2}
                defaultValue={g.mapEmbed}
                className={inputClass}
              />
            </Field>
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold tracking-wide text-muted uppercase">
              Social profiles
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              {(
                [
                  ["instagram", "Instagram"],
                  ["facebook", "Facebook"],
                  ["tiktok", "TikTok"],
                  ["youtube", "YouTube"],
                ] as const
              ).map(([key, label]) => (
                <Field
                  key={key}
                  label={label}
                  htmlFor={`general-${key}`}
                  error={state.fieldErrors?.[key]?.[0]}
                >
                  <input
                    id={`general-${key}`}
                    name={key}
                    defaultValue={g[key]}
                    className={inputClass}
                    placeholder="Handle or full URL"
                  />
                </Field>
              ))}
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <MediaPicker
              name="logoLightId"
              value={g.logoLightId}
              media={props.media}
              label="Logo (light background)"
              hint="Used on white sections and the admin."
            />
            <MediaPicker
              name="logoDarkId"
              value={g.logoDarkId}
              media={props.media}
              label="Logo (dark background)"
              hint="Used on dark sections."
            />
            <MediaPicker
              name="faviconId"
              value={g.faviconId}
              media={props.media}
              label="Favicon"
              hint="Small square icon, ideally SVG or 64×64 PNG."
            />
          </div>

          <div className="space-y-3 rounded-brand border border-black/10 bg-black/[0.02] p-4">
            <p className="text-xs font-semibold tracking-wide text-muted uppercase">
              Announcement bar
            </p>
            <label className="flex items-center gap-2 text-sm text-ink">
              <input
                type="checkbox"
                name="announcementEnabled"
                defaultChecked={g.announcementEnabled}
                className="h-4 w-4"
              />
              Show announcement above the header
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Announcement text"
                htmlFor="general-announcementText"
                error={state.fieldErrors?.announcementText?.[0]}
              >
                <input
                  id="general-announcementText"
                  name="announcementText"
                  defaultValue={g.announcementText}
                  className={inputClass}
                  placeholder="New year offer — 20% off plans"
                />
              </Field>
              <Field
                label="Link (optional)"
                htmlFor="general-announcementHref"
                error={state.fieldErrors?.announcementHref?.[0]}
              >
                <input
                  id="general-announcementHref"
                  name="announcementHref"
                  defaultValue={g.announcementHref}
                  className={inputClass}
                  placeholder="/contact"
                />
              </Field>
              <Field
                label="Starts (optional)"
                htmlFor="general-announcementStartsAt"
                error={state.fieldErrors?.announcementStartsAt?.[0]}
              >
                <input
                  id="general-announcementStartsAt"
                  name="announcementStartsAt"
                  type="date"
                  defaultValue={g.announcementStartsAt ?? ""}
                  className={inputClass}
                />
              </Field>
              <Field
                label="Ends (optional)"
                htmlFor="general-announcementEndsAt"
                error={state.fieldErrors?.announcementEndsAt?.[0]}
              >
                <input
                  id="general-announcementEndsAt"
                  name="announcementEndsAt"
                  type="date"
                  defaultValue={g.announcementEndsAt ?? ""}
                  className={inputClass}
                />
              </Field>
            </div>
          </div>

          <div className="rounded-brand border border-amber-200 bg-amber-50/60 p-4">
            <label className="flex items-center gap-2 text-sm font-semibold text-amber-900">
              <input
                type="checkbox"
                name="maintenanceMode"
                defaultChecked={g.maintenanceMode}
                className="h-4 w-4"
              />
              Maintenance mode — hide the public site
            </label>
            <p className="mt-1 text-xs text-amber-800/80">
              Shows a “back shortly” page to visitors. The admin stays
              accessible.
            </p>
          </div>

          <SubmitButton pendingLabel="Saving…">
            Save general settings
          </SubmitButton>
        </div>
      )}
    </ActionForm>
  );
}

function SeoForm(props: SettingsManagerProps) {
  const s = props.seo;
  return (
    <ActionForm action={saveSeoAction}>
      {(state) => (
        <div className="space-y-5">
          {state.error ? <Alert variant="error">{state.error}</Alert> : null}
          {state.message ? (
            <Alert variant="success">{state.message}</Alert>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Default title"
              htmlFor="seo-defaultTitle"
              error={state.fieldErrors?.defaultTitle?.[0]}
            >
              <input
                id="seo-defaultTitle"
                name="defaultTitle"
                defaultValue={s.defaultTitle}
                className={inputClass}
              />
            </Field>
            <Field
              label="Robots"
              htmlFor="seo-robots"
              error={state.fieldErrors?.robots?.[0]}
            >
              <select
                id="seo-robots"
                name="robots"
                defaultValue={s.robots}
                className={inputClass}
              >
                <option value="index,follow">index, follow</option>
                <option value="noindex,nofollow">noindex, nofollow</option>
              </select>
            </Field>
            <Field
              label="Default description"
              htmlFor="seo-defaultDescription"
              error={state.fieldErrors?.defaultDescription?.[0]}
            >
              <textarea
                id="seo-defaultDescription"
                name="defaultDescription"
                rows={2}
                defaultValue={s.defaultDescription}
                className={inputClass}
              />
            </Field>
            <Field
              label="Google Analytics ID"
              htmlFor="seo-googleAnalyticsId"
              error={state.fieldErrors?.googleAnalyticsId?.[0]}
              hint="G-XXXXXXX"
            >
              <input
                id="seo-googleAnalyticsId"
                name="googleAnalyticsId"
                defaultValue={s.googleAnalyticsId}
                className={inputClass}
              />
            </Field>
            <Field
              label="Meta Pixel ID"
              htmlFor="seo-metaPixelId"
              error={state.fieldErrors?.metaPixelId?.[0]}
            >
              <input
                id="seo-metaPixelId"
                name="metaPixelId"
                defaultValue={s.metaPixelId}
                className={inputClass}
              />
            </Field>
            <MediaPicker
              name="ogImageId"
              value={s.ogImageId}
              media={props.media}
              label="Default share image (OG)"
            />
          </div>

          <SubmitButton pendingLabel="Saving…">Save SEO defaults</SubmitButton>
        </div>
      )}
    </ActionForm>
  );
}

function EmailForm(props: SettingsManagerProps) {
  const e = props.email;
  return (
    <ActionForm action={saveEmailAction}>
      {(state) => (
        <div className="space-y-5">
          {state.error ? <Alert variant="error">{state.error}</Alert> : null}
          {state.message ? (
            <Alert variant="success">{state.message}</Alert>
          ) : null}
          <p className="text-sm text-muted">
            Used for lead notification emails. Wired to the site in Phase 4;
            until then sending uses the server environment variables.
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="SMTP host"
              htmlFor="email-smtpHost"
              error={state.fieldErrors?.smtpHost?.[0]}
            >
              <input
                id="email-smtpHost"
                name="smtpHost"
                defaultValue={String(e.smtpHost ?? "")}
                className={inputClass}
                placeholder="smtp.yourmail.com"
              />
            </Field>
            <Field
              label="SMTP port"
              htmlFor="email-smtpPort"
              error={state.fieldErrors?.smtpPort?.[0]}
            >
              <input
                id="email-smtpPort"
                name="smtpPort"
                type="number"
                defaultValue={Number(e.smtpPort ?? 587)}
                className={inputClass}
              />
            </Field>
            <Field
              label="SMTP username"
              htmlFor="email-smtpUser"
              error={state.fieldErrors?.smtpUser?.[0]}
            >
              <input
                id="email-smtpUser"
                name="smtpUser"
                defaultValue={String(e.smtpUser ?? "")}
                autoComplete="off"
                className={inputClass}
              />
            </Field>
            <Field
              label="SMTP password"
              htmlFor="email-smtpPassword"
              error={state.fieldErrors?.smtpPassword?.[0]}
              hint="Stored in the database, as with all settings."
            >
              <input
                id="email-smtpPassword"
                name="smtpPassword"
                type="password"
                defaultValue={String(e.smtpPassword ?? "")}
                autoComplete="new-password"
                className={inputClass}
              />
            </Field>
            <Field
              label="Notify this address for new leads"
              htmlFor="email-notifyTo"
              error={state.fieldErrors?.notifyTo?.[0]}
            >
              <input
                id="email-notifyTo"
                name="notifyTo"
                type="email"
                defaultValue={String(e.notifyTo ?? "")}
                className={inputClass}
              />
            </Field>
          </div>

          <SubmitButton pendingLabel="Saving…">
            Save email settings
          </SubmitButton>
        </div>
      )}
    </ActionForm>
  );
}

function ScriptsForm(props: SettingsManagerProps) {
  const s = props.scripts;
  return (
    <ActionForm action={saveScriptsAction}>
      {(state) => (
        <div className="space-y-5">
          {state.error ? <Alert variant="error">{state.error}</Alert> : null}
          {state.message ? (
            <Alert variant="success">{state.message}</Alert>
          ) : null}
          <p className="text-sm text-muted">
            Owner-only. Injected on every public page. Be careful — scripts run
            exactly as written.
          </p>
          <Field
            label="Head scripts"
            htmlFor="scripts-head"
            error={state.fieldErrors?.headScripts?.[0]}
          >
            <textarea
              id="scripts-head"
              name="headScripts"
              rows={5}
              defaultValue={s.headScripts}
              className={`${inputClass} font-mono text-xs`}
              placeholder="<script>…</script>"
            />
          </Field>
          <Field
            label="Body scripts (end of page)"
            htmlFor="scripts-body"
            error={state.fieldErrors?.bodyScripts?.[0]}
          >
            <textarea
              id="scripts-body"
              name="bodyScripts"
              rows={5}
              defaultValue={s.bodyScripts}
              className={`${inputClass} font-mono text-xs`}
              placeholder="<script>…</script>"
            />
          </Field>
          <SubmitButton pendingLabel="Saving…">Save scripts</SubmitButton>
        </div>
      )}
    </ActionForm>
  );
}

export function SettingsManager(props: SettingsManagerProps) {
  return (
    <div className="space-y-6">
      <SectionCard
        id="general"
        title="General"
        description="Business info, logos, announcement bar and maintenance mode."
      >
        <GeneralForm {...props} />
      </SectionCard>

      <SectionCard
        id="seo"
        title="SEO"
        description="Default search-engine metadata for pages that do not set their own."
      >
        <SeoForm {...props} />
      </SectionCard>

      <SectionCard
        id="email"
        title="Email"
        description="SMTP details and the address that receives new-lead alerts."
      >
        <EmailForm {...props} />
      </SectionCard>

      {props.canScripts ? (
        <SectionCard
          id="scripts"
          title="Custom scripts"
          description="Analytics and tracking injected on the public site (Owner only)."
        >
          <ScriptsForm {...props} />
        </SectionCard>
      ) : null}
    </div>
  );
}
