"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type InstallEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const HIDE_KEY = "fitx-install-hidden-until";
const HIDE_DAYS = 30;
/** Safari shows no install event; the Share-sheet hint waits a little first. */
const IOS_HINT_DELAY_MS = 12_000;

function isInstalled() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function hiddenForNow() {
  const until = Number(window.localStorage.getItem(HIDE_KEY) ?? 0);
  return Number.isFinite(until) && until > Date.now();
}

function hideFor(days: number) {
  window.localStorage.setItem(HIDE_KEY, String(Date.now() + days * 86_400_000));
}

/**
 * "Add FITX to your home screen" popup, the same install flow other PWAs use.
 *
 * Chrome fires `beforeinstallprompt` once the site qualifies (HTTPS, the
 * manifest in src/app/manifest.ts, and a little engagement); we hold the event
 * and call it from our own button, so the install dialog belongs to the site
 * instead of the browser's own banner. iPhone has no such event, so it gets the
 * Share → Add to Home Screen steps instead.
 */
export function InstallPrompt() {
  const pathname = usePathname();
  const [installEvent, setInstallEvent] = useState<InstallEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [ios, setIos] = useState(false);
  const installRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    // Phones only: desktop already has an install icon in the address bar, and
    // a gym's customers find the site on their phone.
    const onPhone = /android|iphone|ipad|ipod|mobile/i.test(
      window.navigator.userAgent,
    );
    if (!onPhone) return;
    if (isInstalled() || hiddenForNow()) return;

    function onBeforeInstall(event: Event) {
      event.preventDefault();
      setInstallEvent(event as InstallEvent);
      setVisible(true);
    }
    function onInstalled() {
      setVisible(false);
      setInstallEvent(null);
    }

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);

    const isSafari = /iphone|ipad|ipod/i.test(window.navigator.userAgent);
    const timer = isSafari
      ? window.setTimeout(() => {
          setIos(true);
          setVisible(true);
        }, IOS_HINT_DELAY_MS)
      : undefined;

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
      if (timer) window.clearTimeout(timer);
    };
  }, []);

  function close() {
    setVisible(false);
    hideFor(HIDE_DAYS);
  }

  async function install() {
    if (!installEvent) return;
    await installEvent.prompt();
    const { outcome } = await installEvent.userChoice;
    setInstallEvent(null);
    setVisible(false);
    // Turned the dialog down: ask again sooner than an explicit "Not now".
    if (outcome === "dismissed") hideFor(7);
  }

  useEffect(() => {
    if (!visible) return;
    installRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [visible]);

  // The admin is a work tool, not something to install from; the preview is
  // rendered inside the admin. Both keep the popup out of the way.
  if (!visible) return null;
  if (pathname.startsWith("/admin") || pathname.startsWith("/preview"))
    return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="install-prompt-title"
      className="fixed inset-0 z-[70] flex items-end justify-center bg-black/60 p-4 backdrop-blur-sm sm:items-center"
      onClick={(event) => event.target === event.currentTarget && close()}
    >
      <div className="w-full max-w-md rounded-brand border border-white/10 bg-[#0d0a10] p-6 text-white shadow-[0_30px_80px_-30px_rgb(0_0_0/0.9)]">
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/icon-192.png"
            alt=""
            width={44}
            height={44}
            className="h-11 w-11 rounded-xl"
          />
          <div>
            <p className="eyebrow">FITX Sahiwal</p>
            <h2
              id="install-prompt-title"
              className="heading-display mt-1 text-xl"
            >
              Install FITX
            </h2>
          </div>
        </div>

        {ios ? (
          <p className="mt-4 text-sm leading-relaxed text-white/70">
            Tap the Share button in Safari, then choose{" "}
            <strong className="text-white">Add to Home Screen</strong> to keep
            the studio one tap away.
          </p>
        ) : (
          <p className="mt-4 text-sm leading-relaxed text-white/70">
            Add the studio to your home screen: timings, classes and a direct
            WhatsApp chat, one tap away. No app store needed.
          </p>
        )}

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={close}
            className="btn btn-outline px-4! py-2.5! text-[11px]"
          >
            {ios ? "Got it" : "Not now"}
          </button>
          {ios ? null : (
            <button
              ref={installRef}
              type="button"
              onClick={install}
              className="btn btn-accent px-4! py-2.5! text-[11px]"
            >
              Install app
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
