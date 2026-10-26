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
  createTimetableEntryAction,
  deleteModuleItemAction,
  moveModuleItemAction,
  updateTimetableEntryAction,
} from "@/server/actions/modules";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Timetable" };

const DAY_OPTIONS = [
  { value: "1", label: "Monday" },
  { value: "2", label: "Tuesday" },
  { value: "3", label: "Wednesday" },
  { value: "4", label: "Thursday" },
  { value: "5", label: "Friday" },
  { value: "6", label: "Saturday" },
  { value: "0", label: "Sunday" },
];

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export default async function AdminTimetablePage() {
  const user = await requirePermission("content:read");
  const canWrite = roleHasPermission(user.role, "content:write");

  const [entries, trainers] = await Promise.all([
    prisma.timetableEntry.findMany({
      orderBy: [{ dayOfWeek: "asc" }, { sortOrder: "asc" }],
    }),
    prisma.trainer.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  const trainerById = new Map(trainers.map((entry) => [entry.id, entry.name]));
  const media: MediaPickerItem[] = [];

  const fields: ModuleField[] = [
    {
      kind: "text",
      name: "title",
      label: "Class title",
      required: true,
      maxLength: 160,
    },
    {
      kind: "select",
      name: "dayOfWeek",
      label: "Day",
      options: DAY_OPTIONS,
    },
    {
      kind: "text",
      name: "startTime",
      label: "Starts at",
      placeholder: "18:30",
      hint: "24-hour format",
    },
    {
      kind: "text",
      name: "endTime",
      label: "Ends at",
      placeholder: "19:30",
      hint: "24-hour format",
    },
    {
      kind: "select",
      name: "trainerId",
      label: "Trainer",
      options: [
        { value: "", label: "— No trainer —" },
        ...trainers.map((trainer) => ({
          value: trainer.id,
          label: trainer.name,
        })),
      ],
    },
    { kind: "checkbox", name: "isPublished", label: "Visible on the site" },
  ];

  const rows: ModuleRow[] = entries.map((entry) => ({
    id: entry.id,
    title: entry.title,
    subtitle: `${DAY_NAMES[entry.dayOfWeek] ?? entry.dayOfWeek} · ${entry.startTime}–${entry.endTime}${
      entry.trainerId && trainerById.get(entry.trainerId)
        ? ` · ${trainerById.get(entry.trainerId)}`
        : ""
    }`,
    thumb: null,
    published: entry.isPublished,
    values: {
      title: entry.title,
      dayOfWeek: entry.dayOfWeek,
      startTime: entry.startTime,
      endTime: entry.endTime,
      trainerId: entry.trainerId ?? "",
      isPublished: entry.isPublished,
      sortOrder: entry.sortOrder,
    },
  }));

  return (
    <ModuleManager
      module="timetable"
      heading="Timetable"
      intro="Weekly class schedule. Grouped by day in the admin; the renderer is part of Phase 5 polish."
      createLabel="Add a class"
      fields={fields}
      rows={rows}
      media={media}
      createAction={createTimetableEntryAction}
      updateAction={updateTimetableEntryAction}
      deleteAction={deleteModuleItemAction}
      moveAction={moveModuleItemAction}
      canWrite={canWrite}
    />
  );
}
