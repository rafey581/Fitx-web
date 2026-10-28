import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { requirePermission } from "@/lib/auth/server";
import { prisma } from "@/lib/db";
import { legacyCover } from "@/lib/fitx/legacy-blog";
import { mediaUrl } from "@/lib/media-url";
import { PostForm } from "../post-form";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Edit post" };

export default async function EditPostPage(props: PageProps<"/admin/blog/[id]">) {
  await requirePermission("content:write");
  const { id } = await props.params;
  const post = await prisma.blogPost.findUnique({ where: { id }, include: { cover: { select: { path: true } } } });
  if (!post) notFound();
  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-extrabold text-ink">Edit post</h1>
      <PostForm
        id={post.id}
        title={post.title}
        content={post.content ?? ""}
        cover={post.cover ? mediaUrl(post.cover) : (legacyCover(post.slug) ?? null)}
        coverRemovable={Boolean(post.cover)}
      />
    </div>
  );
}
