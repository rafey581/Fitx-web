"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";

import { SubmitButton } from "@/components/ui/submit-button";
import { ADMIN_NAV_GROUPS, type AdminNavItem } from "@/lib/admin/nav";
import { logoutAction } from "@/server/actions/auth";

export type ShellNavItem = AdminNavItem & { allowed: boolean };

type AdminShellProps = {
  user: { name: string; email: string; roleLabel: string };
  nav: ShellNavItem[];
  children: ReactNode;
};

function isActive(pathname: string, href: string): boolean {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminShell({ user, nav, children }: AdminShellProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const visibleItems = nav.filter((item) => item.allowed);

  const sidebar = (
    <nav className="flex flex-1 flex-col gap-6 overflow-y-auto px-3 py-4">
      {ADMIN_NAV_GROUPS.map((group) => {
        const items = visibleItems.filter((item) => item.group === group);
        if (items.length === 0) return null;

        return (
          <div key={group}>
            <p className="px-3 pb-2 text-[0.65rem] font-semibold tracking-[0.18em] text-white/40 uppercase">
              {group}
            </p>
            <ul className="space-y-0.5">
              {items.map((item) =>
                item.implemented ? (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      aria-current={
                        isActive(pathname, item.href) ? "page" : undefined
                      }
                      className={`flex items-center justify-between rounded-brand px-3 py-2 text-sm transition ${
                        isActive(pathname, item.href)
                          ? "bg-accent text-white"
                          : "text-white/75 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      {item.label}
                    </Link>
                  </li>
                ) : (
                  <li key={item.href}>
                    <span
                      className="flex cursor-not-allowed items-center justify-between rounded-brand px-3 py-2 text-sm text-white/35"
                      title="Coming in a later phase"
                    >
                      {item.label}
                      <span className="rounded-full bg-white/10 px-2 py-0.5 text-[0.6rem] tracking-wide uppercase">
                        soon
                      </span>
                    </span>
                  </li>
                ),
              )}
            </ul>
          </div>
        );
      })}
    </nav>
  );

  const brand = (
    <div className="flex items-center gap-2 px-5 py-5">
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-sm font-black text-white">
        X
      </span>
      <span className="font-heading text-sm font-extrabold tracking-[0.2em] text-white uppercase">
        FIT<span className="text-accent">X</span> Admin
      </span>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-black/[0.03]">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col bg-ink lg:flex">
        {brand}
        {sidebar}
        <div className="border-t border-white/10 p-3">
          <form action={logoutAction}>
            <SubmitButton
              variant="outline"
              className="w-full border-white/20 text-white hover:bg-white/10"
            >
              Sign out
            </SubmitButton>
          </form>
        </div>
      </aside>

      {/* Mobile sidebar */}
      {mobileOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            aria-label="Close menu"
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 flex w-72 flex-col bg-ink">
            {brand}
            {sidebar}
            <div className="border-t border-white/10 p-3">
              <form action={logoutAction}>
                <SubmitButton
                  variant="outline"
                  className="w-full border-white/20 text-white hover:bg-white/10"
                >
                  Sign out
                </SubmitButton>
              </form>
            </div>
          </div>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between gap-4 border-b border-black/10 bg-white px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="rounded-brand border border-black/15 px-3 py-2 text-sm lg:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
            >
              ☰
            </button>
            <div>
              <p className="text-sm font-semibold text-ink">{user.name}</p>
              <p className="text-xs text-muted">{user.roleLabel}</p>
            </div>
          </div>
          <p className="hidden text-xs text-muted sm:block">{user.email}</p>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
