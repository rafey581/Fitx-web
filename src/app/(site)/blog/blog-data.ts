import "server-only";

import { PHOTOS } from "@/components/experience/content";
import { prisma } from "@/lib/db";
import { legacyCover } from "@/lib/fitx/legacy-blog";
import { mediaUrl } from "@/lib/media-url";

const FALLBACK_COVERS = [PHOTOS.lunge, PHOTOS.floorCoach, PHOTOS.padsKick, PHOTOS.airbike, PHOTOS.deadlift];

/** Cover for a post: the uploaded picture, else its original picture, else a studio photo. */
export function coverFor(post: { slug: string; cover: { path: string } | null }, index = 0): string {
  if (post.cover) return mediaUrl(post.cover);
  return legacyCover(post.slug) ?? FALLBACK_COVERS[index % FALLBACK_COVERS.length];
}

export const publishedPosts = () =>
  prisma.blogPost.findMany({
    where: { status: "PUBLISHED" },
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    include: { cover: { select: { path: true } } },
  });

export const publishedPost = (slug: string) =>
  prisma.blogPost.findFirst({
    where: { slug, status: "PUBLISHED" },
    include: { cover: { select: { path: true } } },
  });

export const formatPostDate = (date: Date | null) =>
  (date ?? new Date()).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
