import type { Metadata } from "next";

import { coaches, fees, owners, studio } from "@/lib/fitx/knowledge";

/**
 * Search-engine copy and structured data for the whole site.
 *
 * Titles and descriptions target what people in Sahiwal actually search for
 * ("gym in Sahiwal", "ladies gym Sahiwal", "personal trainer Sahiwal", gym fees
 * and timings), written as normal sentences: Google demotes keyword stuffing.
 * Every claim comes from the studio's knowledge base (knowledge.ts).
 */

export const SITE_NAME = "FITX Personal Fitness Training Studio";
export const SHARE_IMAGE = "/og-image.jpg";

/** Google Maps listing for the studio (the place behind the embedded map). */
export const MAPS_URL = "https://www.google.com/maps?cid=18422960762609200461";

type PageSeo = { title: string; description: string };

export const pageSeo: Record<string, PageSeo> = {
  "/": {
    title: "FITX | Best Gym & Personal Training Studio in Sahiwal",
    description:
      "Coaching-led gym in Shadman Town, Sahiwal: personal and group training, separate female sessions, Family Hour and body-composition tracking. Book a free consultation.",
  },
  "/who-we-are": {
    title: "About FITX – Personal Training Gym in Sahiwal",
    description:
      "Meet FITX Personal Fitness Training Studio in Shadman Town, Sahiwal: founded by Zohaib Ali to replace the crowded gym with structured, coached personal training.",
  },
  "/services": {
    title: "Gym Programs in Sahiwal – Personal & Group Training | FITX",
    description:
      "Training programs at FITX Sahiwal: one-to-one personal training, coached group sessions and nutrition guidance, with progress tracked every week or so.",
  },
  "/coaches": {
    title: "Personal Trainers in Sahiwal – Meet the FITX Coaches",
    description:
      "Train with FITX's coaches in Sahiwal: Zohaib Ali (Founder & Head Coach), Iqra Zahid (women's fitness), Muazam (strength & conditioning) and Arslan Ahmad (fat loss).",
  },
  "/gallery": {
    title: "FITX Gym Sahiwal Photos – Studio, Training & Events",
    description:
      "Photos from inside FITX in Shadman Town, Sahiwal: the training floor, coached sessions, boxing pad work and community events.",
  },
  "/success-stories": {
    title: "FITX Reviews – What Clients Say About the Gym in Sahiwal",
    description:
      "Read Google reviews from FITX members in Sahiwal about the coaches, the clean studio and their weight-loss and strength results.",
  },
  "/plans": {
    title: "Gym Fees in Sahiwal – FITX Membership Plans & Prices",
    description: `FITX fees: Group sessions ${fmt(fees[0].monthly)}/month and One-to-One coaching ${fmt(fees[1].monthly)}/month, with 10% off 3-month packages. Body-composition tracking included.`,
  },
  "/timetable": {
    title: "FITX Gym Timings Sahiwal – Male, Female & Family Hour",
    description:
      "FITX Sahiwal timings: open Saturday to Thursday, 8:00 AM – 11:30 PM. Separate male and female sessions plus a Family Hour. Closed on Friday.",
  },
  "/contact": {
    title: "Contact FITX Gym Sahiwal – Shadman Town, Faisalabad Road",
    description: `Visit FITX at ${studio.address}. Call or WhatsApp ${studio.phones[0]} to book a free consultation. Open Saturday to Thursday.`,
  },
  "/transformations": {
    title: "Before & After Transformations – FITX Gym Sahiwal",
    description:
      "Real before-and-after results from FITX clients in Sahiwal, coached and tracked with body-composition measurements.",
  },
  "/blog": {
    title: "FITX Blog – Fitness, Training & Nutrition Tips from Sahiwal",
    description:
      "Training advice, fat-loss and nutrition tips and studio news from the coaches at FITX Personal Fitness Training Studio in Sahiwal.",
  },
};

function fmt(n: number) {
  return `Rs ${n.toLocaleString("en-US")}`;
}

/** Metadata for a page: its title, description, canonical URL and share card. */
export function seoMetadata(path: string, override?: Partial<PageSeo> & { image?: string }): Metadata {
  const base = pageSeo[path];
  const title = override?.title ?? base?.title ?? SITE_NAME;
  const description = override?.description ?? base?.description;
  const image = override?.image ?? SHARE_IMAGE;
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      locale: "en_PK",
      url: path,
      title,
      description,
      images: [{ url: image, width: 1200, height: 630, alt: "FITX Personal Fitness Training Studio, Sahiwal" }],
    },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}

const absolute = (base: string, path: string) => new URL(path, base).toString();

/** The studio as a local business (ExerciseGym), for Google's knowledge panel and map results. */
export function gymJsonLd(base: string, social: { facebook?: string; instagram?: string } = {}) {
  const phone = (n: string) => `+92-${n.replace(/^0/, "")}`;
  return {
    "@context": "https://schema.org",
    "@type": "ExerciseGym",
    "@id": absolute(base, "/#gym"),
    name: SITE_NAME,
    alternateName: ["FITX", "FITX Fitness Studio", "FITX Gym Sahiwal", "FITX Personal Training Studio"],
    description: pageSeo["/"].description,
    url: absolute(base, "/"),
    logo: absolute(base, "/images/fitx/3d/logo-horizontal.png"),
    image: [
      absolute(base, SHARE_IMAGE),
      absolute(base, "/images/fitx/3d/studio-1.webp"),
      absolute(base, "/images/fitx/3d/studio-3.webp"),
    ],
    telephone: phone(studio.phones[0]),
    address: {
      "@type": "PostalAddress",
      streetAddress: "Shadman Town, Faisalabad Road",
      addressLocality: "Sahiwal",
      addressRegion: "Punjab",
      postalCode: "57000",
      addressCountry: "PK",
    },
    geo: { "@type": "GeoCoordinates", ...studio.geo },
    hasMap: MAPS_URL,
    areaServed: { "@type": "City", name: "Sahiwal" },
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Saturday", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"],
        opens: "08:00",
        closes: "23:30",
      },
    ],
    priceRange: `${fmt(fees[0].monthly)} – ${fmt(fees[1].monthly)} per month`,
    currenciesAccepted: "PKR",
    founder: { "@type": "Person", name: owners[0].name, jobTitle: owners[0].role },
    employee: coaches.map((c) => ({
      "@type": "Person",
      name: c.name,
      jobTitle: c.role,
      url: absolute(base, `/trainers/${c.slug}`),
    })),
    makesOffer: fees.map((fee) => ({
      "@type": "Offer",
      name: fee.name,
      description: fee.summary,
      price: fee.monthly,
      priceCurrency: "PKR",
      url: absolute(base, "/plans"),
    })),
    sameAs: [social.facebook || studio.social.facebook, social.instagram || studio.social.instagram],
  };
}

export function websiteJsonLd(base: string) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": absolute(base, "/#website"),
    name: SITE_NAME,
    alternateName: "FITX",
    url: absolute(base, "/"),
    publisher: { "@id": absolute(base, "/#gym") },
    inLanguage: "en-PK",
  };
}

/** "Home › Coaches › Iqra Zahid" trail for search results. */
export function breadcrumbJsonLd(base: string, trail: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [{ name: "Home", path: "/" }, ...trail].map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: absolute(base, item.path),
    })),
  };
}

/** JSON for a <script type="application/ld+json">, safe to inline in HTML. */
export { serializeJsonLd as jsonLd } from "@/lib/seo";
