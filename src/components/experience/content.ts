/**
 * Plain, serialisable content for the 3D home film. The server page fills this
 * from the database (services, coaches, plans, settings) and falls back to the
 * studio's launch copy, so the film never renders empty while the CMS is being
 * filled in.
 */

export type FilmService = {
  title: string;
  description: string;
  href: string;
  image: string;
};

export type FilmCoach = {
  name: string;
  role: string;
  bio: string;
  href: string;
  image: string;
};

export type FilmPlan = {
  name: string;
  price: string;
  period: string;
  features: string[];
  highlighted: boolean;
  href: string;
};

export type FilmContent = {
  businessName: string;
  address: string;
  phone: string;
  /** Individual numbers parsed from `phone` (it may list several). */
  phones: string[];
  whatsapp: string;
  email: string;
  hours: string;
  instagram: string;
  services: FilmService[];
  coaches: FilmCoach[];
  plans: FilmPlan[];
  gallery: string[];
  nav: { label: string; href: string }[];
};

import { coaches, fees, formatRs, studio, teamMember } from "@/lib/fitx/knowledge";

const photo = (name: string) => `/images/fitx/3d/PHOTO-${name}.webp`;

export const PHOTOS = {
  founder: photo("2026-08-30-15-12-52"),
  founderAlt: photo("2026-08-31-18-00-39"),
  lunge: photo("2026-09-30-13-30-25"),
  curlTrainer: photo("2026-09-30-13-32-52"),
  floorCoach: photo("2026-09-30-13-37-25"),
  ropes: photo("2026-09-30-13-38-58"),
  trainerBack: photo("2026-09-30-13-40-02"),
  dumbbellTalk: photo("2026-09-30-13-41-22"),
  rowCoach: photo("2026-09-30-13-42-32"),
  rackTalk: photo("2026-09-30-13-45-10"),
  airbike: photo("2026-09-30-13-49-45"),
  deadlift: photo("2026-09-30-13-53-32"),
  legPress: photo("2026-09-30-13-54-53"),
  padsKick: photo("2026-09-30-14-06-02"),
  padsDuo: photo("2026-09-30-14-08-35"),
  platesTrainer: photo("2026-09-30-14-12-20"),
  splitSquat: photo("2026-09-30-14-14-54"),
  overhead: photo("2026-09-30-14-16-41"),
  gloves: photo("2026-09-30-14-22-11"),
  clientMonth: photo("2026-10-03-16-28-42"),
  floorWide: photo("2026-10-03-17-36-56"),
} as const;

/** Opening slideshow. `position` keeps the subject in frame on tall phones. */
export const heroSlides = [
  { src: "/images/fitx/hero/studio-floor.webp", label: "The studio floor", alt: "The FITX training floor in Sahiwal", position: "45% 50%" },
  { src: "/images/fitx/hero/pad-work.webp", label: "Boxing pad work", alt: "A FITX coach holding pads for a client", position: "55% 40%" },
  { src: "/images/fitx/hero/coached-lift.webp", label: "Coached lifting", alt: "A FITX trainer coaching a client through a curl", position: "30% 45%" },
  { src: "/images/fitx/hero/group-class.webp", label: "Group sessions", alt: "A group session on the FITX studio floor", position: "50% 55%" },
  { src: "/images/fitx/hero/floor-coaching.webp", label: "One-to-one coaching", alt: "A FITX trainer coaching a client through push-ups", position: "35% 60%" },
  { src: "/images/fitx/hero/team.webp", label: "The FITX team", alt: "The FITX team with a trophy", position: "50% 60%" },
];

export const fallbackServiceImages = [
  PHOTOS.curlTrainer,
  PHOTOS.padsDuo,
  PHOTOS.floorWide,
  PHOTOS.splitSquat,
  PHOTOS.rackTalk,
];

export const fallbackCoachImages = [PHOTOS.founder, PHOTOS.padsKick, PHOTOS.floorCoach];

/**
 * The studio's own photo for a roster coach (knowledge.ts). It wins over a photo
 * uploaded in the admin, so owners' portraits never stand in for coach photos.
 */
export const rosterPhoto = (slug: string) => coaches.find((c) => c.slug === slug)?.photo;

/** Portrait for a coach without an uploaded photo: the core team's own, else a studio photo. */
export const coachPhoto = (slug: string, index: number) =>
  teamMember(slug)?.photo ?? fallbackCoachImages[index % fallbackCoachImages.length];

/** Coach monoliths in the home film's coaches chapter. */
export const FILM_COACHES = 4;

/** Closes the coaches chapter when fewer coaches than that are published. */
export const teamCoach: FilmCoach = {
  name: "The FITX coaching team",
  role: "Personal & group training",
  bio: "Every session is coached: technique instruction, structured programming and personal attention, built on the training programs Zohaib oversees.",
  href: "/coaches",
  image: PHOTOS.floorCoach,
};

/** Studio photos for the "Inside FITX" strips (studio shots first). */
export const galleryImages = [
  "/images/fitx/3d/studio-1.webp",
  PHOTOS.padsDuo,
  "/images/fitx/3d/studio-5.webp",
  PHOTOS.ropes,
  PHOTOS.curlTrainer,
  "/images/fitx/3d/studio-3.webp",
  PHOTOS.deadlift,
  PHOTOS.gloves,
  "/images/fitx/3d/studio-2.webp",
  PHOTOS.legPress,
  PHOTOS.airbike,
  PHOTOS.floorWide,
  "/images/fitx/3d/studio-4.webp",
  PHOTOS.overhead,
  PHOTOS.padsKick,
  PHOTOS.lunge,
  PHOTOS.rowCoach,
  PHOTOS.clientMonth,
];

export const defaultContent: FilmContent = {
  businessName: "FITX Personal Fitness Training Studio",
  address: studio.address,
  phone: studio.phones.join(" / "),
  phones: studio.phones,
  whatsapp: studio.whatsapp,
  email: "info@fitx.pk",
  hours: studio.hoursSummary,
  instagram: "",
  services: [
    {
      title: "Personal Training",
      description: "One-on-one coaching programmed around your goals.",
      href: "/services/personal-training",
      image: fallbackServiceImages[0],
    },
    {
      title: "Boxing & Conditioning",
      description: "Technique, pad work and fight-ready conditioning.",
      href: "/services/boxing-conditioning",
      image: fallbackServiceImages[1],
    },
    {
      title: "Group Training",
      description: "Small-group sessions with big accountability.",
      href: "/services/group-training",
      image: fallbackServiceImages[2],
    },
    {
      title: "Yoga & Mobility",
      description: "Move better, recover faster, stay injury free.",
      href: "/services/yoga-mobility",
      image: fallbackServiceImages[3],
    },
    {
      title: "Nutrition Coaching",
      description: "Sustainable eating plans that fit your routine.",
      href: "/services/nutrition-coaching",
      image: fallbackServiceImages[4],
    },
  ],
  coaches: [
    ...coaches.map((m) => ({
      name: m.name,
      role: m.role,
      bio: m.summary,
      href: `/trainers/${m.slug}`,
      image: m.photo,
    })),
    teamCoach,
  ].slice(0, FILM_COACHES),
  plans: fees.map((f) => ({
    name: f.name,
    price: formatRs(f.monthly),
    period: "per month",
    features: f.features,
    highlighted: f.highlighted,
    href: "/contact",
  })),
  gallery: galleryImages,
  nav: [
    { label: "Who we are", href: "/who-we-are" },
    { label: "What we do", href: "/services" },
    { label: "Coaches", href: "/coaches" },
    { label: "Gallery", href: "/gallery" },
    { label: "Success stories", href: "/success-stories" },
    { label: "Transformations", href: "/transformations" },
    { label: "Plans", href: "/plans" },
    { label: "Timetable", href: "/timetable" },
    { label: "Blog", href: "/blog" },
    { label: "Contact", href: "/contact" },
  ],
};

/** The film's chapters, in scroll order. `vh` is the scroll length of each. */
export const CHAPTERS = [
  { id: "origin", label: "Origin", vh: 210 },
  { id: "forge", label: "Forge", vh: 200 },
  { id: "programs", label: "Programs", vh: 320 },
  { id: "studio", label: "Studio", vh: 220 },
  { id: "coaches", label: "Coaches", vh: 330 },
  { id: "progress", label: "Progress", vh: 220 },
  { id: "plans", label: "Fees", vh: 200 },
  { id: "join", label: "Join", vh: 170 },
] as const;

export type ChapterId = (typeof CHAPTERS)[number]["id"];
