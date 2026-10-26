import Link from "next/link";
import type { ReactNode } from "react";

type AuthScreenProps = {
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
};

/**
 * Centred card used by the sign-in / forgot-password / reset-password screens so
 * they share one visual language. Server component: no client hooks.
 */
export function AuthScreen({
  title,
  description,
  children,
  footer,
}: AuthScreenProps) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-ink px-4 py-12">
      <div className="w-full max-w-sm">
        <Link
          href="/"
          className="mb-8 flex items-center justify-center gap-2"
          aria-label="FITX home"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-base font-black text-white">
            X
          </span>
          <span className="font-heading text-lg font-extrabold tracking-[0.25em] text-white uppercase">
            FIT<span className="text-accent">X</span>
          </span>
        </Link>

        <div className="rounded-brand bg-white p-6 shadow-xl sm:p-8">
          <h1 className="heading-display text-2xl text-ink">{title}</h1>
          {description ? (
            <p className="mt-2 text-sm text-muted">{description}</p>
          ) : null}
          {children}
        </div>

        {footer ? (
          <div className="mt-6 text-center text-sm text-white/60">{footer}</div>
        ) : null}
      </div>
    </main>
  );
}
