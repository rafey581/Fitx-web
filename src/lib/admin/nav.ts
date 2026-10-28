import type { Permission } from "@/lib/auth/permissions";

export type AdminNavItem = {
  label: string;
  href: string;
  /** Permission required to see/use the section (null = any signed-in user). */
  permission: Permission | null;
  group: "Overview" | "Content" | "Site" | "System";
  /** Built in an earlier phase? Unbuilt items render as disabled. */
  implemented: boolean;
};

/**
 * The simple admin: the studio only manages testimonials and blog posts.
 *
 * The other sections (pages, media, trainers, menus, theme, settings, users…)
 * still exist in the code but are hidden, and src/proxy.ts sends their
 * addresses back to the admin home. To bring one back, add it here and to
 * SIMPLE_ADMIN_PATHS.
 */
export const adminNav: AdminNavItem[] = [
  { label: "Home", href: "/admin", permission: null, group: "Overview", implemented: true },
  { label: "Testimonials", href: "/admin/testimonials", permission: "content:write", group: "Content", implemented: true },
  { label: "Blog", href: "/admin/blog", permission: "content:write", group: "Content", implemented: true },
];

/** Admin addresses reachable in the simple admin (besides sign-in screens). */
export const SIMPLE_ADMIN_PATHS = ["/admin", "/admin/testimonials", "/admin/blog", "/admin/forbidden"];

export const ADMIN_NAV_GROUPS = [
  "Overview",
  "Content",
  "Site",
  "System",
] as const;
