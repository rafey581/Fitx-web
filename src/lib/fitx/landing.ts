import { familyHour, fees, formatRs, studio, timings, tracking } from "@/lib/fitx/knowledge";

/**
 * Local landing pages: one page per thing people in Sahiwal search for
 * (a gym, a ladies gym, a personal trainer, weight loss). Each answers that
 * search properly with the studio's real facts (knowledge.ts), real coaches and
 * real Google reviews, then links to the rest of the site. Prices and timings
 * are read from the knowledge base so these pages never disagree with it.
 */

export type LandingSection = {
  heading: string;
  paragraphs?: string[];
  bullets?: string[];
};

export type LandingPage = {
  path: string;
  /** Short label for links between the landing pages. */
  label: string;
  title: string;
  description: string;
  eyebrow: string;
  h1: string;
  intro: string[];
  sections: LandingSection[];
  /** Coaches to feature (slugs from knowledge.ts). */
  coaches: string[];
  /** Show reviews whose text mentions any of these words. */
  reviewWords: string[];
  /** Approved FAQ answers to include (ids from knowledge.ts). */
  faqIds: string[];
  /** Whether to show the fee cards and session timings. */
  showFees: boolean;
  showTimings: boolean;
};

const group = fees[0];
const oneToOne = fees[1];
const sessions = (g: "Male" | "Female" | "Family") =>
  timings
    .filter((t) => t.group === g)
    .map((t) => `${t.start} – ${t.end}`)
    .join(" and ");

export const landingPages: LandingPage[] = [
  {
    path: "/gym-in-sahiwal",
    label: "Gym in Sahiwal",
    title: "Best Gym in Sahiwal – FITX Personal Fitness Training Studio",
    description: `Looking for the best gym in Sahiwal? FITX in Shadman Town offers coached personal and group training, separate female sessions and a Family Hour. From ${formatRs(group.monthly)}/month.`,
    eyebrow: "Gym in Sahiwal",
    h1: "A gym in Sahiwal where every session is coached",
    intro: [
      `FITX Personal Fitness Training Studio is a gym in Shadman Town, Faisalabad Road, Sahiwal. It is built around coaching, not crowds: instead of being left to figure things out alone, every member trains with a structured plan, technique instruction and a coach who tracks their progress.`,
      `Members regularly describe FITX as the best gym in Sahiwal in their Google reviews, for the coaching, the clean and well-maintained studio and the friendly, respectful environment.`,
    ],
    sections: [
      {
        heading: "What makes FITX different from a regular gym",
        bullets: [
          "Structured training: a plan built around your goal, experience, schedule and any limitations",
          "Coached sessions with exercise-technique instruction, so you train correctly and safely",
          "Progress you can see: body-composition tracking with graphs, reviewed weekly or about every 10 days",
          "Separate male and female sessions, plus a Family Hour for husband, wife and children",
          "Personal attention and accountability from your coach",
        ],
      },
      {
        heading: "Training options and gym fees",
        paragraphs: [
          `Choose coached Group sessions (${formatRs(group.monthly)} per month) or One-to-One personal training (${formatRs(oneToOne.monthly)} per month). Three-month packages save 10%: ${formatRs(group.quarterly)} for Group and ${formatRs(oneToOne.quarterly)} for One-to-One.`,
        ],
      },
      {
        heading: "Where to find FITX in Sahiwal",
        paragraphs: [
          `FITX is in ${studio.address}. It is open ${studio.days} from 8:00 AM to 11:30 PM and closed on ${studio.closedDay}. Call or WhatsApp ${studio.phones[0]} for directions or to book a free consultation.`,
        ],
      },
    ],
    coaches: ["zohaib-ali", "iqra-zahid", "muazam", "arslan-ahmad"],
    reviewWords: ["best gym", "clean", "environment"],
    faqIds: ["fees", "timings", "days", "join", "approach"],
    showFees: true,
    showTimings: true,
  },
  {
    path: "/ladies-gym-sahiwal",
    label: "Ladies gym in Sahiwal",
    title: "Ladies Gym in Sahiwal with a Female Coach – FITX",
    description: `Ladies gym in Sahiwal with separate female sessions and women's coach Iqra Zahid at FITX, Shadman Town. Fat loss and strength training for women.`,
    eyebrow: "Ladies gym in Sahiwal",
    h1: "Ladies gym in Sahiwal, with a female coach",
    intro: [
      `FITX runs separate female sessions every open day, ${sessions("Female")}, coached by Iqra Zahid, the studio's women's fitness coach. Many of FITX's Google reviews are from women who started their fitness journey with her.`,
      "Women don’t need a lighter version of training. They need a proper program, a coach who takes them seriously, and a space where they can focus. — Iqra Zahid",
    ],
    sections: [
      {
        heading: "Training with Iqra Zahid",
        paragraphs: [
          "Iqra has over seven years of coaching experience and has worked with students, brides-to-be, new mothers and women in their fifties, many beginning from zero. Her programs combine progressive strength training, focused fat-loss programming and practical nutrition guidance tailored to each client.",
        ],
        bullets: [
          "Women’s fat loss programs",
          "Strength training for women",
          "Postpartum-appropriate programming (with medical clearance)",
          "Confidence with technique and equipment",
        ],
      },
      {
        heading: "Who it is right for",
        bullets: [
          "Women starting fitness for the first time",
          "Women who want structured fat loss with a female coach",
          "Women who tried home workouts and plateaued",
        ],
      },
      {
        heading: "Training as a family",
        paragraphs: [
          `FITX also has a Family Hour, ${familyHour.time}, when husband, wife and children can train at the same time. Each family member pays separately.`,
        ],
      },
    ],
    coaches: ["iqra-zahid"],
    reviewWords: ["iqra"],
    faqIds: ["female", "family", "fees", "join"],
    showFees: true,
    showTimings: true,
  },
  {
    path: "/personal-trainer-sahiwal",
    label: "Personal trainer in Sahiwal",
    title: "Personal Trainer in Sahiwal – One-to-One Coaching | FITX",
    description: `One-to-one personal training in Sahiwal at FITX: a coach, a plan built around you and progress tracking for ${formatRs(oneToOne.monthly)}/month (${formatRs(oneToOne.quarterly)} for 3 months).`,
    eyebrow: "Personal trainer in Sahiwal",
    h1: "Personal trainer in Sahiwal: one-to-one coaching at FITX",
    intro: [
      "Personal training is what FITX was built for. Founder and Head Coach Zohaib Ali opened the studio so people in Sahiwal could train with structure and real guidance, not guesswork.",
      `One-to-One coaching is ${formatRs(oneToOne.monthly)} per month, or ${formatRs(oneToOne.quarterly)} for three months (save 10%).`,
    ],
    sections: [
      {
        heading: "How personal training at FITX works",
        bullets: [
          "Consultation: your goal, experience, schedule and any limitations or injuries",
          "A program built for you, not a copied routine",
          "Every session coached, with a focus on technique and consistency",
          "Body-composition tracking with progress graphs, reviewed weekly or about every 10 days",
          "Your plan adjusted as your results come in",
        ],
      },
      {
        heading: "Choose the right coach",
        paragraphs: [
          "Zohaib Ali oversees every training program. Iqra Zahid coaches women. Muazam leads strength & conditioning and sport preparation. Arslan Ahmad specialises in fat loss and complete beginners. The free consultation helps match you with the right coach.",
        ],
      },
    ],
    coaches: ["zohaib-ali", "iqra-zahid", "muazam", "arslan-ahmad"],
    reviewWords: ["zohaib", "personalized", "personalised", "supervis"],
    faqIds: ["one-to-one-fee", "approach", "which-coach", "join"],
    showFees: true,
    showTimings: false,
  },
  {
    path: "/weight-loss-sahiwal",
    label: "Weight loss in Sahiwal",
    title: "Weight Loss & Fat Loss Program in Sahiwal | FITX",
    description:
      "Lose fat in Sahiwal with coached training, nutrition guidance for Pakistani home food and body-composition tracking at FITX, Shadman Town. Book a free consultation.",
    eyebrow: "Weight loss in Sahiwal",
    h1: "Weight loss in Sahiwal, with a plan you can keep",
    intro: [
      "Fat loss fails when the plan is perfect on paper and impossible at home. At FITX, coaches build your training and eating around your real week, then measure and adjust.",
      "Most of FITX’s fat-loss clients start with a consultation with Arslan Ahmad, who maps your starting point, your schedule and a realistic timeline before you pick up a weight. Women can train with Iqra Zahid in the female sessions.",
    ],
    sections: [
      {
        heading: "What the program includes",
        bullets: [
          "A training plan you can repeat, coached session by session",
          "Eating guidance that works with the food your household actually cooks",
          "Weekly check-ins that catch problems before they become drop-outs",
          `Body-composition tracking: ${tracking.metrics.slice(0, 5).join(", ").toLowerCase()} and more`,
          "Training suitable for complete beginners",
        ],
      },
      {
        heading: "Honest results",
        paragraphs: [
          "No responsible coach can promise the same result or timeline for everyone. FITX guides your training and tracks your body composition, not just your weight, so you can see real progress. See real client results on the Transformations page.",
        ],
      },
    ],
    coaches: ["arslan-ahmad", "iqra-zahid"],
    reviewWords: ["weight loss", "lost", "kg", "fat"],
    faqIds: ["tracking", "nutrition", "guarantee", "fees"],
    showFees: true,
    showTimings: false,
  },
];

export const landingPage = (path: string) => landingPages.find((p) => p.path === path);

export const sessionsFor = sessions;
