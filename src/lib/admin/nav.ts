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
 * The full admin information architecture from PRD section 8.
 * Items are revealed phase by phase; `implemented: false` entries show a
 * "soon" badge so the owner can see what is coming.
 */
export const adminNav: AdminNavItem[] = [
  {
    label: "Dashboard",
    href: "/admin",
    permission: null,
    group: "Overview",
    implemented: true,
  },

  {
    label: "Pages",
    href: "/admin/pages",
    permission: "pages:read",
    group: "Content",
    implemented: true,
  },
  {
    label: "Media",
    href: "/admin/media",
    permission: "media:read",
    group: "Content",
    implemented: true,
  },
  {
    label: "Trainers",
    href: "/admin/trainers",
    permission: "content:read",
    group: "Content",
    implemented: true,
  },
  {
    label: "Services",
    href: "/admin/services",
    permission: "content:read",
    group: "Content",
    implemented: true,
  },
  {
    label: "Plans",
    href: "/admin/plans",
    permission: "content:read",
    group: "Content",
    implemented: true,
  },
  {
    label: "Testimonials",
    href: "/admin/testimonials",
    permission: "content:read",
    group: "Content",
    implemented: true,
  },
  {
    label: "Gallery",
    href: "/admin/gallery",
    permission: "content:read",
    group: "Content",
    implemented: true,
  },
  {
    label: "Timetable",
    href: "/admin/timetable",
    permission: "content:read",
    group: "Content",
    implemented: true,
  },
  {
    label: "Leads",
    href: "/admin/leads",
    permission: "leads:read",
    group: "Content",
    implemented: true,
  },

  {
    label: "Menus",
    href: "/admin/menus",
    permission: "navigation:write",
    group: "Site",
    implemented: true,
  },
  {
    label: "Theme",
    href: "/admin/theme",
    permission: "theme:write",
    group: "Site",
    implemented: true,
  },
  {
    label: "Settings",
    href: "/admin/settings",
    permission: "settings:read",
    group: "Site",
    implemented: true,
  },
  {
    label: "Redirects",
    href: "/admin/redirects",
    permission: "navigation:write",
    group: "Site",
    implemented: true,
  },

  {
    label: "Users",
    href: "/admin/users",
    permission: "users:read",
    group: "System",
    implemented: true,
  },
  {
    label: "Audit log",
    href: "/admin/audit-log",
    permission: "audit:read",
    group: "System",
    implemented: true,
  },
];

export const ADMIN_NAV_GROUPS = [
  "Overview",
  "Content",
  "Site",
  "System",
] as const;
