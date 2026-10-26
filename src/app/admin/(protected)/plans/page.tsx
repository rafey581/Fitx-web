import type { Metadata } from "next";

import {
  ModuleManager,
  type MediaPickerItem,
  type ModuleField,
  type ModuleRow,
} from "@/components/admin/module-manager";
import { roleHasPermission } from "@/lib/auth/permissions";
import { requirePermission } from "@/lib/auth/server";
import { prisma } from "@/lib/db";

import {
  createPlanAction,
  deleteModuleItemAction,
  moveModuleItemAction,
  updatePlanAction,
} from "@/server/actions/modules";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Plans" };

export default async function AdminPlansPage() {
  const user = await requirePermission("content:read");
  const canWrite = roleHasPermission(user.role, "content:write");

  const plans = await prisma.plan.findMany({ orderBy: { sortOrder: "asc" } });
  const media: MediaPickerItem[] = [];

  const fields: ModuleField[] = [
    {
      kind: "text",
      name: "name",
      label: "Plan name",
      required: true,
      maxLength: 120,
    },
    {
      kind: "text",
      name: "price",
      label: "Price",
      placeholder: "15000",
      hint: "Without the currency symbol (e.g. 15000). Leave empty for 'custom'.",
    },
    { kind: "text", name: "currency", label: "Currency", maxLength: 10 },
    {
      kind: "text",
      name: "billingPeriod",
      label: "Billing period",
      maxLength: 60,
      placeholder: "per month",
    },
    {
      kind: "list",
      name: "features",
      label: "Features",
      hint: "e.g. Full gym access, 2 PT sessions / month",
      wide: true,
    },
    { kind: "checkbox", name: "isHighlighted", label: "Highlighted (popular)" },
    { kind: "text", name: "ctaLabel", label: "Button label", maxLength: 80 },
    { kind: "text", name: "ctaUrl", label: "Button link", maxLength: 500 },
    { kind: "checkbox", name: "isPublished", label: "Visible on the site" },
  ];

  const rows: ModuleRow[] = plans.map((plan) => {
    const price = plan.price ? plan.price.toString() : "";
    return {
      id: plan.id,
      title: plan.name,
      subtitle: price
        ? `${plan.currency} ${price}${plan.billingPeriod ? ` / ${plan.billingPeriod}` : ""}`
        : "Custom pricing",
      thumb: null,
      published: plan.isPublished,
      values: {
        name: plan.name,
        price,
        currency: plan.currency,
        billingPeriod: plan.billingPeriod ?? "",
        features: Array.isArray(plan.features)
          ? (plan.features as unknown[]).map(String)
          : [],
        isHighlighted: plan.isHighlighted,
        ctaLabel: plan.ctaLabel ?? "",
        ctaUrl: plan.ctaUrl ?? "",
        isPublished: plan.isPublished,
        sortOrder: plan.sortOrder,
      },
    };
  });

  return (
    <ModuleManager
      module="plans"
      heading="Plans"
      intro="Membership plans priced per month. Featured in the Plans section."
      createLabel="Add a plan"
      fields={fields}
      rows={rows}
      media={media}
      createAction={createPlanAction}
      updateAction={updatePlanAction}
      deleteAction={deleteModuleItemAction}
      moveAction={moveModuleItemAction}
      canWrite={canWrite}
    />
  );
}
