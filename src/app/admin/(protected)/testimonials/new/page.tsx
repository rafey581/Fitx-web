import type { Metadata } from "next";

import { requirePermission } from "@/lib/auth/server";
import { TestimonialForm } from "../testimonial-form";

export const metadata: Metadata = { title: "Add testimonial" };

export default async function NewTestimonialPage() {
  await requirePermission("content:write");
  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-extrabold text-ink">Add testimonial</h1>
      <TestimonialForm />
    </div>
  );
}
