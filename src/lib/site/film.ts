import "server-only";

import {
  defaultContent,
  fallbackCoachImages,
  fallbackServiceImages,
  galleryImages,
  type FilmContent,
} from "@/components/experience/content";
import { prisma } from "@/lib/db";
import { mediaUrl } from "@/lib/media-url";
import { getSiteSettings } from "@/lib/site/settings";

const strings = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];

function formatPrice(price: unknown, currency: string): string {
  if (price === null || price === undefined) return "On request";
  const n = Number(price);
  if (!Number.isFinite(n)) return "On request";
  return `${currency} ${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

/**
 * Content for the 3D home film. Published CMS rows win; anything the owner has
 * not filled in yet falls back to the studio's launch copy and photos.
 */
export async function getFilmContent(): Promise<FilmContent> {
  const [settings, services, trainers, plans] = await Promise.all([
    getSiteSettings(),
    prisma.service.findMany({
      where: { isPublished: true },
      orderBy: { sortOrder: "asc" },
      take: 5,
      include: { image: { select: { path: true } } },
    }),
    prisma.trainer.findMany({
      where: { isPublished: true },
      orderBy: { sortOrder: "asc" },
      take: 3,
      include: { photo: { select: { path: true } } },
    }),
    prisma.plan.findMany({
      where: { isPublished: true },
      orderBy: { sortOrder: "asc" },
      take: 3,
    }),
  ]);

  const g = settings.general;

  return {
    ...defaultContent,
    businessName: g.businessName || defaultContent.businessName,
    address: g.address || defaultContent.address,
    phone: g.phone || defaultContent.phone,
    whatsapp: g.whatsapp || g.phone || defaultContent.whatsapp,
    email: g.email || defaultContent.email,
    hours: g.openingHours || defaultContent.hours,
    instagram: g.instagram,
    services: services.length
      ? services.map((s, i) => ({
          title: s.title,
          description: s.shortDescription ?? "",
          href: `/services/${s.slug}`,
          image: s.image ? mediaUrl(s.image) : fallbackServiceImages[i % fallbackServiceImages.length],
        }))
      : defaultContent.services,
    coaches: trainers.length
      ? trainers.map((t, i) => ({
          name: t.name,
          role: t.title ?? "Coach",
          bio: t.bio ?? "",
          href: `/trainers/${t.slug}`,
          image: t.photo ? mediaUrl(t.photo) : fallbackCoachImages[i % fallbackCoachImages.length],
        }))
      : defaultContent.coaches,
    plans: plans.length
      ? plans.map((p) => ({
          name: p.name,
          price: formatPrice(p.price, p.currency),
          period: p.billingPeriod ?? "",
          features: strings(p.features),
          highlighted: p.isHighlighted,
          href: p.ctaUrl || "/contact",
        }))
      : defaultContent.plans,
    gallery: galleryImages,
  };
}
