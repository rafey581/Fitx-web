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

export const fallbackServiceImages = [
  PHOTOS.curlTrainer,
  PHOTOS.padsDuo,
  PHOTOS.floorWide,
  PHOTOS.splitSquat,
  PHOTOS.rackTalk,
];

export const fallbackCoachImages = [PHOTOS.founder, PHOTOS.padsKick, PHOTOS.floorCoach];

export const galleryImages = [
  PHOTOS.ropes,
  PHOTOS.deadlift,
  PHOTOS.gloves,
  PHOTOS.lunge,
  PHOTOS.legPress,
  PHOTOS.airbike,
  PHOTOS.overhead,
  PHOTOS.clientMonth,
  PHOTOS.platesTrainer,
  PHOTOS.trainerBack,
  PHOTOS.rowCoach,
  PHOTOS.dumbbellTalk,
];

export const defaultContent: FilmContent = {
  businessName: "FITX Personal Fitness Training Studio",
  address: "Shadman Town, Faisalabad Road, Sahiwal",
  phone: "+92 300 0000000",
  whatsapp: "+92 300 0000000",
  email: "info@fitx.pk",
  hours: "Mon–Sat · 6:00am – 10:00pm",
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
    {
      name: "Head Coach",
      role: "Founder & Head Coach",
      bio: "Strength and conditioning specialist with a decade of coaching experience.",
      href: "/coaches",
      image: fallbackCoachImages[0],
    },
    {
      name: "Boxing Coach",
      role: "Boxing & Combat Coach",
      bio: "Former competitive boxer focused on technique, footwork and conditioning.",
      href: "/coaches",
      image: fallbackCoachImages[1],
    },
    {
      name: "Yoga Coach",
      role: "Yoga & Mobility Coach",
      bio: "Guides mobility, breathing and recovery work for every training level.",
      href: "/coaches",
      image: fallbackCoachImages[2],
    },
  ],
  plans: [
    {
      name: "Starter",
      price: "PKR 8,000",
      period: "per month",
      features: ["4 personal sessions", "Progress tracking", "Nutrition basics"],
      highlighted: false,
      href: "/contact",
    },
    {
      name: "Commit",
      price: "PKR 15,000",
      period: "per month",
      features: ["8 personal sessions", "Full progress tracking", "Nutrition coaching", "Studio access"],
      highlighted: true,
      href: "/contact",
    },
    {
      name: "Transform",
      price: "PKR 25,000",
      period: "per month",
      features: ["Unlimited sessions", "1-to-1 programming", "Nutrition coaching", "Priority scheduling"],
      highlighted: false,
      href: "/contact",
    },
  ],
  gallery: galleryImages,
  nav: [
    { label: "Who we are", href: "/who-we-are" },
    { label: "What we do", href: "/services" },
    { label: "Coaches", href: "/coaches" },
    { label: "Gallery", href: "/gallery" },
    { label: "Success stories", href: "/success-stories" },
    { label: "Plans", href: "/plans" },
    { label: "Timetable", href: "/timetable" },
    { label: "Blog", href: "/blog" },
    { label: "Contact", href: "/contact" },
  ],
};

/** The film's chapters, in scroll order. `vh` is the scroll length of each. */
export const CHAPTERS = [
  { id: "origin", label: "Origin", vh: 170 },
  { id: "forge", label: "Forge", vh: 200 },
  { id: "programs", label: "Programs", vh: 320 },
  { id: "studio", label: "Studio", vh: 220 },
  { id: "coaches", label: "Coaches", vh: 260 },
  { id: "plans", label: "Plans", vh: 200 },
  { id: "join", label: "Join", vh: 170 },
] as const;

export type ChapterId = (typeof CHAPTERS)[number]["id"];
