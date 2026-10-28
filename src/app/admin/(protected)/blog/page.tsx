import type { Metadata } from "next";

import { noticeFrom, SimpleList } from "@/components/admin/simple-list";
import { requirePermission } from "@/lib/auth/server";
import { prisma } from "@/lib/db";
import { legacyCover } from "@/lib/fitx/legacy-blog";
import { mediaUrl } from "@/lib/media-url";
import { deleteBlogPostAction } from "@/server/actions/simple-content";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Blog" };

export default async function AdminBlogPage(props: PageProps<"/admin/blog">) {
  await requirePermission("content:write");
  const params = await props.searchParams;
  const posts = await prisma.blogPost.findMany({
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    include: { cover: { select: { path: true } } },
  });

  return (
    <SimpleList
      heading="Blog"
      intro="Posts shown on the website’s Blog page. Newest are shown first."
      addHref="/admin/blog/new"
      addLabel="Write a post"
      emptyText="No posts yet. Click “Write a post” to add the first one."
      notice={noticeFrom(params, "post")}
      deleteAction={deleteBlogPostAction}
      deleteConfirm={(title) => `Delete “${title}”? It will be removed from the website.`}
      items={posts.map((p) => ({
        id: p.id,
        title: p.title,
        subtitle: p.excerpt ?? "",
        thumb: p.cover ? mediaUrl(p.cover) : (legacyCover(p.slug) ?? null),
        editHref: `/admin/blog/${p.id}`,
        viewHref: `/blog/${p.slug}`,
      }))}
    />
  );
}
