import { MenuLocation, LinkType } from "@/generated/prisma/enums";
import { requirePermission } from "@/lib/auth/server";
import { prisma } from "@/lib/db";

import { MenusManager, type MenuManagerItem } from "./menus-manager";

type MenuRow = {
  id: string;
  label: string;
  linkType: LinkType;
  pageId: string | null;
  url: string | null;
  newTab: boolean;
  parentId: string | null;
};

export default async function MenusPage() {
  await requirePermission("navigation:write");

  const [items, pages] = await Promise.all([
    prisma.menuItem.findMany({
      orderBy: [{ menu: "asc" }, { sortOrder: "asc" }],
    }),
    prisma.page.findMany({
      where: { deletedAt: null },
      orderBy: { title: "asc" },
      select: { id: true, title: true, slug: true },
    }),
  ]);

  const toItem = (item: MenuRow): MenuManagerItem => ({
    key: item.id,
    label: item.label,
    linkType: item.linkType,
    pageId: item.pageId,
    url: item.url,
    newTab: item.newTab,
    parentKey: item.parentId,
  });

  return (
    <MenusManager
      header={items
        .filter((item) => item.menu === MenuLocation.HEADER)
        .map(toItem)}
      footer={items
        .filter((item) => item.menu === MenuLocation.FOOTER)
        .map(toItem)}
      pages={pages.map((page) => ({
        id: page.id,
        title: page.title,
        slug: page.slug,
      }))}
    />
  );
}
