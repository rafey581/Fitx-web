import type { Metadata } from "next";

import { requirePermission } from "@/lib/auth/server";
import { PostForm } from "../post-form";

export const metadata: Metadata = { title: "Write a post" };

export default async function NewPostPage() {
  await requirePermission("content:write");
  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-extrabold text-ink">Write a post</h1>
      <PostForm />
    </div>
  );
}
