import type { Role } from "@/generated/prisma/enums";

/**
 * Coarse-grained permissions, enforced on the server for every admin action.
 * UI hiding is never treated as security (PRD 15.3).
 */
export type Permission =
  // Pages & the visual builder
  | "pages:read"
  | "pages:write"
  | "pages:publish"
  | "pages:delete"
  // Media library
  | "media:read"
  | "media:write"
  | "media:delete"
  // Content modules (trainers, services, plans, testimonials, gallery, blog)
  | "content:read"
  | "content:write"
  // Leads / inquiries
  | "leads:read"
  | "leads:write"
  // Navigation, footer, redirects
  | "navigation:write"
  // Theme + global settings
  | "settings:read"
  | "settings:write"
  | "theme:write"
  // Custom scripts are Owner-only (PRD 5.10)
  | "scripts:write"
  // User management (Owner only)
  | "users:read"
  | "users:write"
  | "audit:read";

const ALL_PERMISSIONS: Permission[] = [
  "pages:read",
  "pages:write",
  "pages:publish",
  "pages:delete",
  "media:read",
  "media:write",
  "media:delete",
  "content:read",
  "content:write",
  "leads:read",
  "leads:write",
  "navigation:write",
  "settings:read",
  "settings:write",
  "theme:write",
  "scripts:write",
  "users:read",
  "users:write",
  "audit:read",
];

/**
 * OWNER  - everything.
 * EDITOR - pages, media, content, navigation, leads (read + write); no users,
 *          no global settings/theme/scripts, no audit log.
 * FRONTDESK - leads only (PRD section 2).
 */
const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  OWNER: ALL_PERMISSIONS,
  EDITOR: [
    "pages:read",
    "pages:write",
    "pages:publish",
    "pages:delete",
    "media:read",
    "media:write",
    "media:delete",
    "content:read",
    "content:write",
    "leads:read",
    "leads:write",
    "navigation:write",
  ],
  FRONTDESK: ["leads:read", "leads:write"],
};

export function roleHasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function permissionsForRole(role: Role): Permission[] {
  return ROLE_PERMISSIONS[role] ?? [];
}

export const ROLE_LABELS: Record<Role, string> = {
  OWNER: "Owner (Super Admin)",
  EDITOR: "Editor",
  FRONTDESK: "Front-desk",
};
