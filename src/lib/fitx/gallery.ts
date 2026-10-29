/**
 * The studio's photo gallery (Gallery page). Grouped for the page's filter
 * tabs; listed in the order shown under "All". Sizes keep the grid steady
 * while photos load.
 */
export type GalleryCategory = "studio" | "training" | "events";

export type GalleryPhoto = {
  src: string;
  alt: string;
  category: GalleryCategory;
  width: number;
  height: number;
};

export const galleryCategories: { id: GalleryCategory; label: string }[] = [
  { id: "studio", label: "Studio" },
  { id: "training", label: "Training" },
  { id: "events", label: "Events & community" },
];

export const galleryPhotos: GalleryPhoto[] = [
  {
    src: "/images/fitx/3d/studio-1.webp",
    alt: "The FITX training floor",
    category: "studio",
    width: 1024,
    height: 768,
  },
  {
    src: "/images/fitx/3d/PHOTO-2026-09-30-13-30-25.webp",
    alt: "Dumbbell lunges",
    category: "training",
    width: 683,
    height: 1024,
  },
  {
    src: "/images/fitx/3d/PHOTO-2026-09-30-13-32-52.webp",
    alt: "A FITX trainer coaching a curl",
    category: "training",
    width: 1024,
    height: 683,
  },
  {
    src: "/images/fitx/events/university-talk-1.webp",
    alt: "Zohaib Ali speaking at the University of Sahiwal",
    category: "events",
    width: 1242,
    height: 831,
  },
  {
    src: "/images/fitx/3d/studio-2.webp",
    alt: "Machines and free weights on the studio floor",
    category: "studio",
    width: 1024,
    height: 768,
  },
  {
    src: "/images/fitx/3d/PHOTO-2026-09-30-13-37-25.webp",
    alt: "Floor coaching during push-ups",
    category: "training",
    width: 1024,
    height: 682,
  },
  {
    src: "/images/fitx/3d/PHOTO-2026-09-30-13-38-58.webp",
    alt: "Battle ropes conditioning",
    category: "training",
    width: 682,
    height: 1024,
  },
  {
    src: "/images/fitx/events/anniversary.webp",
    alt: "The FITX family at the studio's first anniversary",
    category: "events",
    width: 960,
    height: 466,
  },
  {
    src: "/images/fitx/3d/studio-3.webp",
    alt: "The full length of the FITX studio",
    category: "studio",
    width: 768,
    height: 1024,
  },
  {
    src: "/images/fitx/3d/PHOTO-2026-09-30-13-40-02.webp",
    alt: "A trainer spotting dumbbell curls",
    category: "training",
    width: 1024,
    height: 682,
  },
  {
    src: "/images/fitx/3d/PHOTO-2026-09-30-13-41-22.webp",
    alt: "Coaching dumbbell technique",
    category: "training",
    width: 682,
    height: 1024,
  },
  {
    src: "/images/fitx/events/breakfast-gathering.webp",
    alt: "FITX breakfast gathering",
    category: "events",
    width: 1024,
    height: 1536,
  },
  {
    src: "/images/fitx/3d/studio-4.webp",
    alt: "The turf lane for sleds and conditioning",
    category: "studio",
    width: 768,
    height: 1024,
  },
  {
    src: "/images/fitx/3d/PHOTO-2026-09-30-13-42-32.webp",
    alt: "Coached barbell rows",
    category: "training",
    width: 682,
    height: 1024,
  },
  {
    src: "/images/fitx/3d/PHOTO-2026-09-30-13-45-10.webp",
    alt: "A coach watching a client's set",
    category: "training",
    width: 682,
    height: 1024,
  },
  {
    src: "/images/fitx/hero/team.webp",
    alt: "The FITX team with a trophy",
    category: "events",
    width: 1920,
    height: 1080,
  },
  {
    src: "/images/fitx/3d/studio-5.webp",
    alt: "A group session on the studio floor",
    category: "studio",
    width: 1024,
    height: 768,
  },
  {
    src: "/images/fitx/3d/PHOTO-2026-09-30-13-49-45.webp",
    alt: "Air bike intervals",
    category: "training",
    width: 682,
    height: 1024,
  },
  {
    src: "/images/fitx/3d/PHOTO-2026-09-30-13-53-32.webp",
    alt: "Single-arm dumbbell rows",
    category: "training",
    width: 683,
    height: 1024,
  },
  {
    src: "/images/fitx/events/university-talk-2.webp",
    alt: "Zohaib Ali at the University of Sahiwal, youth entrepreneurship session",
    category: "events",
    width: 1364,
    height: 908,
  },
  {
    src: "/images/fitx/3d/PHOTO-2026-09-30-13-54-53.webp",
    alt: "Leg press",
    category: "training",
    width: 1024,
    height: 683,
  },
  {
    src: "/images/fitx/3d/PHOTO-2026-09-30-14-06-02.webp",
    alt: "Boxing pad work",
    category: "training",
    width: 1024,
    height: 683,
  },
  {
    src: "/images/fitx/3d/PHOTO-2026-10-03-16-28-42.webp",
    alt: "Client of the Month banner at the studio",
    category: "events",
    width: 1024,
    height: 683,
  },
  {
    src: "/images/fitx/3d/PHOTO-2026-09-30-14-08-35.webp",
    alt: "Pad work with a FITX coach",
    category: "training",
    width: 1024,
    height: 683,
  },
  {
    src: "/images/fitx/3d/PHOTO-2026-09-30-14-12-20.webp",
    alt: "Plate-loaded training with a trainer",
    category: "training",
    width: 683,
    height: 1024,
  },
  {
    src: "/images/fitx/events/consistency-poster.webp",
    alt: "Consistency builds a better you",
    category: "events",
    width: 900,
    height: 1600,
  },
  {
    src: "/images/fitx/3d/PHOTO-2026-09-30-14-14-54.webp",
    alt: "Split squats",
    category: "training",
    width: 683,
    height: 1024,
  },
  {
    src: "/images/fitx/3d/PHOTO-2026-09-30-14-16-41.webp",
    alt: "Barbell overhead press",
    category: "training",
    width: 683,
    height: 1024,
  },
  {
    src: "/images/fitx/3d/PHOTO-2026-09-30-14-22-11.webp",
    alt: "Gloves on for boxing",
    category: "training",
    width: 1024,
    height: 683,
  },
];
