/**
 * Permission-matrix tests (PRD Phase 6 / §15.3).
 *
 * The role→permission map is the server-side authorization source used by
 * `assertPermission` on every admin action. These tests lock in the least
 * privilege guarantees: an Editor is powerful but cannot touch users, global
 * settings, the theme, custom scripts or the audit log; Front-desk can only
 * work with leads.
 */
import assert from "node:assert/strict";
import { test } from "node:test";

import {
  permissionsForRole,
  roleHasPermission,
  type Permission,
} from "@/lib/auth/permissions";

const EVERY_PERMISSION: Permission[] = [
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

test("OWNER has every permission", () => {
  for (const permission of EVERY_PERMISSION) {
    assert.equal(roleHasPermission("OWNER", permission), true, permission);
  }
});

test("EDITOR can manage pages, media, content, navigation and leads", () => {
  for (const permission of [
    "pages:read",
    "pages:write",
    "pages:publish",
    "pages:delete",
    "media:write",
    "media:delete",
    "content:read",
    "content:write",
    "leads:read",
    "leads:write",
    "navigation:write",
  ] as Permission[]) {
    assert.equal(roleHasPermission("EDITOR", permission), true, permission);
  }
});

test("EDITOR cannot touch users, settings, theme, scripts or the audit log", () => {
  for (const permission of [
    "users:read",
    "users:write",
    "settings:read",
    "settings:write",
    "theme:write",
    "scripts:write",
    "audit:read",
  ] as Permission[]) {
    assert.equal(roleHasPermission("EDITOR", permission), false, permission);
  }
});

test("FRONTDESK is limited to leads read/write", () => {
  assert.equal(roleHasPermission("FRONTDESK", "leads:read"), true);
  assert.equal(roleHasPermission("FRONTDESK", "leads:write"), true);
  for (const permission of EVERY_PERMISSION.filter(
    (p) => !p.startsWith("leads:"),
  )) {
    assert.equal(roleHasPermission("FRONTDESK", permission), false, permission);
  }
});

test("an unknown role denies everything (fail closed)", () => {
  assert.equal(roleHasPermission("ROBOT" as never, "pages:read"), false);
});

test("permissionsForRole returns a stable, deduplicated list", () => {
  for (const role of ["OWNER", "EDITOR", "FRONTDESK"] as const) {
    const list = permissionsForRole(role);
    assert.equal(new Set(list).size, list.length, `${role} has duplicates`);
  }
  assert.equal(permissionsForRole("NOPE" as never).length, 0);
});
