"use server";

import { revalidatePath } from "next/cache";

import { recordAudit } from "@/lib/audit";
import { assertPermission } from "@/lib/auth/server";
import { prisma } from "@/lib/db";
import { LinkType, MenuLocation } from "@/generated/prisma/enums";
import { toFieldErrors } from "@/lib/validation/errors";
import { saveMenusSchema, type MenuLinkInput } from "@/lib/validation/settings";
import type { ActionState } from "./types";

/**
 * Rebuild the header/footer menus from the manager's snapshot.
 *
 * The client serialises both menus (in display order) into two JSON hidden
 * fields. Items reference their parent by a client-side key so we can rebuild
 * nested links without persisting temporary ids. Nesting is one level deep.
 */
export async function saveMenusAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await assertPermission("navigation:write");

  let raw: unknown;
  try {
    raw = {
      header: JSON.parse(String(formData.get("header") ?? "[]")),
      footer: JSON.parse(String(formData.get("footer") ?? "[]")),
    };
  } catch {
    return {
      ok: false,
      error: "The menu data could not be read. Reload the page and try again.",
    };
  }

  const parsed = saveMenusSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Some links are incomplete.",
      fieldErrors: toFieldErrors(parsed.error),
    };
  }

  const pages = await prisma.page.findMany({ select: { id: true } });
  const pageIds = new Set(pages.map((page) => page.id));

  const menuError = (items: MenuLinkInput[], label: string): string | null => {
    const byKey = new Map(items.map((item) => [item.key, item]));
    const childKeys = new Set(
      items
        .filter((item) => item.parentKey)
        .map((item) => item.parentKey as string),
    );
    for (let index = 0; index < items.length; index += 1) {
      const item = items[index];
      if (
        item.linkType === LinkType.PAGE &&
        (!item.pageId || !pageIds.has(item.pageId))
      ) {
        return `"${item.label}" in the ${label} menu needs a valid page.`;
      }
      if (item.linkType === LinkType.URL && !item.url) {
        return `"${item.label}" in the ${label} menu needs a URL.`;
      }
      if (item.parentKey) {
        if (item.parentKey === item.key)
          return `"${item.label}" cannot be its own parent.`;
        const parent = byKey.get(item.parentKey);
        if (!parent) return `"${item.label}" is missing its parent link.`;
        if (childKeys.has(parent.key)) {
          return `"${item.label}" nests more than one level deep.`;
        }
        const parentIndex = items.findIndex(
          (entry) => entry.key === parent.key,
        );
        if (parentIndex > index) {
          return `"${item.label}" must appear below its parent in the ${label} menu.`;
        }
      }
    }
    return null;
  };

  const headerError = menuError(parsed.data.header, "header");
  if (headerError) return { ok: false, error: headerError };
  const footerError = menuError(parsed.data.footer, "footer");
  if (footerError) return { ok: false, error: footerError };

  await prisma.$transaction(async (tx) => {
    await tx.menuItem.deleteMany({
      where: { menu: { in: [MenuLocation.HEADER, MenuLocation.FOOTER] } },
    });

    const rebuild = async (menu: MenuLocation, items: MenuLinkInput[]) => {
      const idByKey = new Map<string, string>();
      for (let index = 0; index < items.length; index += 1) {
        const item = items[index];
        const created = await tx.menuItem.create({
          data: {
            menu,
            label: item.label,
            linkType: item.linkType,
            pageId: item.linkType === LinkType.PAGE ? item.pageId : null,
            url: item.linkType === LinkType.URL ? item.url : null,
            newTab: item.newTab,
            sortOrder: index,
            parentId: item.parentKey
              ? (idByKey.get(item.parentKey) ?? null)
              : null,
          },
        });
        idByKey.set(item.key, created.id);
      }
    };

    await rebuild(MenuLocation.HEADER, parsed.data.header);
    await rebuild(MenuLocation.FOOTER, parsed.data.footer);
  });

  await recordAudit({
    userId: actor.id,
    action: "navigation.menus.updated",
    entity: "settings",
    entityId: "menus",
  });
  revalidatePath("/", "layout");
  revalidatePath("/admin/menus");

  return {
    ok: true,
    message: "Menus saved. Your header and footer now reflect the change.",
  };
}
