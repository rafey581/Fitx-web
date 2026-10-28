/**
 * FITX approved facts and chatbot answers.
 *
 * Source: "FITX Chatbot Knowledge Base & Approved Answers" (26 Oct 2026),
 * supplied by the studio. This is the single source of truth for the website
 * chatbot and for the studio facts shown on the site (fees, timings, Family
 * Hour, progress tracking). Edit here when the studio's details change.
 *
 * Items the document marks "confirm before launch" are worded cautiously on
 * purpose; see `pendingConfirmation` below. Safe to import on client and server.
 */

export const studio = {
  name: "FITX Personal Fitness Training Studio",
  /** Name as the studio publishes it (the knowledge-base document gives "Zohaib Munir Ali"). */
  founder: "Zohaib Ali",
  address: "Shadman Town, Faisalabad Road, Sahiwal",
  phones: ["0322-6900206", "0300-6900206"],
  whatsapp: "0322-6900206",
  /** Overall session window across all timings (days not specified by the studio). */
  hoursSummary: "Sessions 8:00 AM – 11:30 PM",
};

export type TeamMember = {
  slug: string;
  name: string;
  role: string;
  /** One-line summary for cards. */
  summary: string;
  /** Profile text; paragraphs separated by blank lines. */
  bio: string;
  photo: string;
  /** Certifications the studio has confirmed. */
  credentials?: string[];
};

/** The owners, as written on the studio's own website (Core Team page). */
export const owners: TeamMember[] = [
  {
    slug: "zohaib-ali",
    name: studio.founder,
    role: "Founder & Head Coach",
    summary:
      "Founded FITX to redefine how Sahiwal approaches fitness: structured personal training instead of a crowded gym.",
    bio: [
      "Zohaib Ali founded FITX Personal Fitness Training Studio in Shadman Town, Sahiwal, with a vision to redefine how the city approaches fitness. Rather than a crowded gym where members are left to figure things out on their own, FITX is built around structured personal training, from an initial consultation and goal-focused programming to consistent coaching and technique guidance.",
      "In December 2025, Zohaib was invited as a guest speaker at the University of Sahiwal for an HEC-funded NRPU project on youth-led entrepreneurship, where he was presented with a token of appreciation for his contribution.",
      "He continues to train personal clients while overseeing the training programs developed at FITX.",
    ].join("\n\n"),
    photo: "/images/fitx/team/zohaib-ali.webp",
    credentials: ["Certified Nutrition Consultant"],
  },
  {
    slug: "usman-munir",
    name: "Rana Usman Munir",
    role: "Co-Owner & Executive Director",
    summary:
      "Runs the studio's operations, member experience and growth, so your program, schedule and goals always come first.",
    bio: [
      "Rana Usman Munir is the Co-Owner & Executive Director of FITX Personal Fitness Training Studio. Working alongside founder Zohaib Ali, he oversees the studio's operations, member experience and long-term growth, making sure the standard that FITX is known for holds true every single day: serious coaching, a professional floor, and honest service.",
      "With a strong background in business and operations, Usman works as much behind the scenes as on the floor, managing members, trainers, timings and the small details that make a training studio feel truly professional. He believes a fitness journey should never be complicated by poor service; your program, your schedule and your goals always come first.",
      "Under his direction, FITX continues to grow into one of Sahiwal's most respected personal training studios, one member, one result, one session at a time.",
    ].join("\n\n"),
    photo: "/images/fitx/team/usman-munir.webp",
  },
];

/**
 * Coaches with an approved profile. Zohaib is both an owner and a coach; the
 * other coaches from the studio's Coaches page are added once their photos and
 * profiles are supplied.
 */
export const coaches: TeamMember[] = owners.filter((m) => m.slug === "zohaib-ali");

export const teamMember = (slug: string) => [...owners, ...coaches].find((m) => m.slug === slug);

export type Fee = {
  name: string;
  monthly: number;
  quarterly: number;
  summary: string;
  features: string[];
  highlighted: boolean;
  /** Short tag on the chatbot's fee card. */
  badge: string;
};

/** Three-month packages carry a 10% discount against three monthly payments. */
export const fees: Fee[] = [
  {
    name: "Group Session",
    monthly: 9000,
    quarterly: 24300,
    summary: "Coached group training.",
    features: [
      "Coached group training",
      "Exercise-technique instruction",
      "Body-composition progress tracking",
      "3 months: Rs 24,300 (save 10%)",
    ],
    highlighted: false,
    badge: "Group",
  },
  {
    name: "One-to-One Session",
    monthly: 16000,
    quarterly: 43200,
    summary: "Personal coaching built around you.",
    features: [
      "Personal one-to-one coaching",
      "Goal-oriented guidance & accountability",
      "Body-composition progress tracking",
      "3 months: Rs 43,200 (save 10%)",
    ],
    highlighted: true,
    badge: "Personalized",
  },
];

export const formatRs = (n: number) => `Rs ${n.toLocaleString("en-US")}`;

export type Timing = { group: "Female" | "Male" | "Family"; label: string; start: string; end: string };

export const timings: Timing[] = [
  { group: "Male", label: "Male sessions", start: "8:00 AM", end: "10:00 AM" },
  { group: "Female", label: "Female sessions", start: "10:30 AM", end: "1:00 PM" },
  { group: "Female", label: "Female sessions", start: "3:00 PM", end: "6:00 PM" },
  { group: "Male", label: "Male sessions", start: "6:00 PM", end: "10:00 PM" },
  { group: "Family", label: "Family Hour", start: "10:30 PM", end: "11:30 PM" },
];

export const familyHour = {
  time: "10:30 PM – 11:30 PM",
  description:
    "Husband, wife and children can train at the same time. Each family member pays separately.",
};

export const tracking = {
  summary:
    "Your FITX service includes access to a phone-based body-composition tracking system. You can view your measurements and progress graphs in the app, and we review your progress weekly or approximately every 10 days.",
  metrics: [
    "Weight",
    "Body fat %",
    "Muscle mass",
    "Skeletal muscle",
    "Water",
    "Bone mass",
    "Protein",
    "BMI",
    "Visceral fat",
    "Basal metabolic rate",
    "Body age",
    "Waist-to-hip ratio",
  ],
  views: ["Recent", "Weekly", "Monthly", "Yearly"],
  disclaimer:
    "Readings are estimates, not medical diagnoses. They can be affected by hydration, food, recent exercise and testing conditions, so we compare trends rather than single readings.",
};

export const approach = [
  "Understand your goal, training experience, schedule and any limitations.",
  "Find the training format that suits you.",
  "Coach exercise technique and consistent participation.",
  "Review body-composition trends, not scale weight alone.",
  "Adjust the plan as your progress shows.",
];

/** Open questions from the studio's own "confirm before launch" list. */
export const pendingConfirmation = [
  "Fitdays is the official app used with the body-composition device",
  "Tracking is included in both Group and One-to-One packages",
  "Family Hour fee per person",
  "Current slot availability and booking rules",
  "One-to-One session duration and frequency",
  "Official website and social media URLs",
];

// ---------------------------------------------------------------------------
// Chatbot: approved answers + matching hints
// ---------------------------------------------------------------------------

export type Faq = {
  id: string;
  question: string;
  answer: string;
  /** Lower-case words/phrases (English + common Roman Urdu) that signal this topic. */
  keywords: string[];
};

const phoneLine = `Call ${studio.phones.join(" or ")}.`;

export const faqs: Faq[] = [
  {
    id: "fees",
    question: "What are your fees?",
    answer: `Group Session: Rs 9,000 per month, or Rs 24,300 for three months. One-to-One Session: Rs 16,000 per month, or Rs 43,200 for three months. Three-month packages include a 10% discount.`,
    keywords: ["fee", "fees", "fess", "feez", "fes", "feess", "prise", "pirce", "price", "prices", "pricing", "cost", "charges", "charge", "rate", "rates", "package", "packages", "membership", "plan", "plans", "kitni", "kitne", "paise", "paisay", "rupees", "rs", "monthly", "month"],
  },
  {
    id: "group-fee",
    question: "What is the monthly group fee?",
    answer: "The Group Session fee is Rs 9,000 per month per member. The three-month package is Rs 24,300, including a 10% discount.",
    keywords: ["group", "class", "classes", "batch"],
  },
  {
    id: "one-to-one-fee",
    question: "What is the one-to-one fee?",
    answer: "One-to-One Session training costs Rs 16,000 per month. The three-month package is Rs 43,200, including a 10% discount.",
    keywords: ["one to one", "one-to-one", "1 to 1", "1-to-1", "1:1", "personal", "private", "individual", "pt", "personal trainer"],
  },
  {
    id: "discount",
    question: "Is there a discount?",
    answer: "Yes. Three-month packages include a 10% discount: Group Rs 24,300 (instead of Rs 27,000) and One-to-One Rs 43,200 (instead of Rs 48,000). There is no confirmed family discount.",
    keywords: ["discount", "offer", "deal", "3 month", "three month", "quarter", "quarterly", "save", "saving", "off"],
  },
  {
    id: "timings",
    question: "What are your timings?",
    answer: "Male sessions: 8:00 AM–10:00 AM and 6:00 PM–10:00 PM. Female sessions: 10:30 AM–1:00 PM and 3:00 PM–6:00 PM. Family Hour: 10:30 PM–11:30 PM. Contact FITX to confirm current slot availability.",
    keywords: ["timing", "timings", "time", "times", "hours", "hour", "open", "close", "closing", "opening", "schedule", "slot", "slots", "when", "waqt", "kab", "morning", "evening", "night"],
  },
  {
    id: "open-close",
    question: "When do you open and close?",
    answer: "The first session starts at 8:00 AM and the last one, Family Hour, ends at 11:30 PM. Male evening sessions end at 10:00 PM and female sessions end at 6:00 PM. Contact FITX to confirm current slot availability.",
    keywords: ["close", "closing", "closes", "band", "khulta", "khulti", "open", "opening", "opens", "last session", "first session", "kitne baje", "late", "early"],
  },
  {
    id: "female",
    question: "What are the female timings?",
    answer: "The female session timings are 10:30 AM–1:00 PM and 3:00 PM–6:00 PM. Contact FITX to confirm current slot availability.",
    keywords: ["female", "females", "ladies", "lady", "women", "woman", "girls", "girl", "khawateen", "aurat", "auraton"],
  },
  {
    id: "male",
    question: "What are the male timings?",
    answer: "The male session timings are 8:00 AM–10:00 AM and 6:00 PM–10:00 PM. Contact FITX to confirm current slot availability.",
    keywords: ["male", "males", "men", "man", "gents", "boys", "boy", "mard"],
  },
  {
    id: "family",
    question: "What is Family Hour?",
    answer: "Family Hour is from 10:30 PM to 11:30 PM. Husband, wife and children can attend at the same time. Each family member pays separately — please contact FITX to confirm the fee per person.",
    keywords: ["family", "families", "husband", "wife", "kids", "children", "child", "couple", "couples", "together", "biwi", "bachay", "bachon"],
  },
  {
    id: "tracking",
    question: "Do you provide body-composition tracking?",
    answer: "Yes. FITX includes access to a phone-based body-composition tracking system. The app shows your measurements and progress graphs, and we review your progress weekly or approximately every 10 days.",
    keywords: ["tracking", "track", "progress", "body composition", "body-composition", "body fat", "fat percentage", "measure", "measurement", "measurements", "scale", "machine", "inbody", "analysis", "graph", "graphs", "report"],
  },
  {
    id: "report",
    question: "What does the body-composition report show?",
    answer: "Depending on the device and report, it can show weight, body fat, muscle mass, skeletal muscle, water, bone mass, protein, BMI, visceral fat, basal metabolic rate, fat-free weight, subcutaneous fat, body age, waist-to-hip ratio and segmental analysis. These are estimates to follow as trends, not medical diagnoses.",
    keywords: ["report", "show", "metrics", "bmi", "visceral", "muscle mass", "bone", "water", "protein", "bmr", "metabolic", "body age", "whr", "accurate", "accuracy"],
  },
  {
    id: "app",
    question: "Which app do you use?",
    answer: "Measurements are shown in a phone app with progress graphs. The FITX team can confirm the exact app and device when you join.",
    keywords: ["app", "application", "fitdays", "phone app", "mobile app", "software"],
  },
  {
    id: "frequency",
    question: "How often do you check progress?",
    answer: "FITX reviews progress weekly or approximately every 10 days, using measurements and graphs to monitor trends and discuss adjustments to your plan.",
    keywords: ["how often", "check", "review", "weekly", "every week", "10 days", "ten days"],
  },
  {
    id: "included",
    question: "Is tracking included in my membership?",
    answer: "FITX describes body-composition tracking as included for clients. If you need confirmation for a specific package, the team can verify its exact inclusions.",
    keywords: ["included", "include", "includes", "extra", "free", "additional", "part of"],
  },
  {
    id: "location",
    question: "Where is FITX located?",
    answer: `FITX is at ${studio.address}. ${phoneLine}`,
    keywords: ["where", "location", "located", "address", "directions", "direction", "map", "kahan", "kidhar", "shadman", "faisalabad road", "sahiwal", "reach", "find"],
  },
  {
    id: "contact",
    question: "How do I contact FITX?",
    answer: `${phoneLine} WhatsApp: ${studio.whatsapp}. You can also send a message from the Contact page.`,
    keywords: ["contact", "phone", "number", "call", "whatsapp", "mobile", "cell", "reach you", "talk", "rabta"],
  },
  {
    id: "join",
    question: "How do I join?",
    answer: `Tell us your goal and preferred timing through the Contact page, or call ${studio.phones.join(" / ")}. The team will confirm availability and next steps.`,
    keywords: ["join", "joining", "register", "registration", "sign up", "signup", "admission", "enroll", "enrol", "start", "book", "booking", "trial", "consultation", "membership form"],
  },
  {
    id: "founder",
    question: "Who runs FITX?",
    answer: `FITX was founded by ${studio.founder}, Founder & Head Coach, and is run with Rana Usman Munir, Co-Owner & Executive Director. The studio is coaching-led: structured training, technique instruction, personal attention, accountability and progress tracking. Meet them on the Who We Are page.`,
    keywords: ["founder", "owner", "co-owner", "director", "who runs", "who is", "zohaib", "usman", "rana", "munir", "head coach", "senior", "main coach", "best coach", "coach", "coaches", "trainer", "trainers", "team", "staff"],
  },
  {
    id: "nutrition",
    question: "Who handles nutrition at FITX?",
    answer: `${studio.founder}, FITX's Founder & Head Coach, is a certified nutrition consultant. Ask about nutrition guidance when you book a consultation; the team confirms what is included in your package.`,
    keywords: ["nutrition", "nutritionist", "nutrition consultant", "diet", "diet plan", "dietitian", "dietician", "meal", "meals", "meal plan", "food", "eating", "calories", "macros", "protein", "khana", "khurak", "ghiza"],
  },
  {
    id: "approach",
    question: "How does coaching at FITX work?",
    answer: "We start by understanding your goal, experience, schedule and any limitations, then help you choose the right format. Sessions focus on exercise technique and consistency, and we review body-composition trends (not just scale weight) to adjust your plan.",
    keywords: ["how does", "approach", "method", "coaching", "program", "programme", "training", "workout", "beginner", "beginners", "experience", "technique", "weight loss", "fat loss", "muscle", "gain", "lose weight", "kam karna"],
  },
  {
    id: "guarantee",
    question: "Can you guarantee results?",
    answer: "No responsible coach can guarantee the same result or timeline for every person. FITX guides your training and monitors your progress, but outcomes vary with individual circumstances and consistency.",
    keywords: ["guarantee", "guaranteed", "promise", "how fast", "how long", "how many kg", "kg in", "results", "result", "sure"],
  },
];

export const suggestedQuestions = [
  "What are your fees?",
  "Female timings?",
  "What is Family Hour?",
  "Do you track body composition?",
  "Where are you located?",
];

/** Extra, CMS-managed context for the AI (published services and coaches). */
export type SiteContext = {
  services: { title: string; description: string; href: string }[];
  coaches: { name: string; role: string; href: string }[];
};

/** System instruction for an AI model answering on the studio's behalf. */
export function systemPrompt(site?: SiteContext): string {
  const feeLines = fees
    .map((f) => `- ${f.name}: ${formatRs(f.monthly)} per month, or ${formatRs(f.quarterly)} for three months (10% discount).`)
    .join("\n");
  const timingLines = timings.map((t) => `- ${t.label}: ${t.start}–${t.end}`).join("\n");
  const faqLines = faqs.map((f) => `Q: ${f.question}\nA: ${f.answer}`).join("\n\n");
  const serviceLines = site?.services.length
    ? site.services.map((s) => `- ${s.title}: ${s.description} (page: ${s.href})`).join("\n")
    : "- See the Services page (/services).";
  const coachLines = site?.coaches.length
    ? site.coaches.map((c) => `- ${c.name}, ${c.role} (page: ${c.href})`).join("\n")
    : coaches.map((m) => `- ${m.name}, ${m.role} (page: /trainers/${m.slug})`).join("\n");
  const teamLines = owners
    .map((m) => {
      const credentials = m.credentials?.length ? ` Credentials: ${m.credentials.join(", ")}.` : "";
      return `- ${m.name} (${m.role}): ${m.bio.replace(/\n+/g, " ")}${credentials}`;
    })
    .join("\n");

  return `You are the friendly front-desk assistant on the website of ${studio.name} ("FITX") in Sahiwal, Pakistan. You chat with visitors like a helpful, upbeat member of the FITX team.

# How to talk
- Answer every message, including very short ones ("fees?", "timing", "ladies", "where", "hi", "ok", a single word, or a typo like "fess" or "timmings"). Work out what they most likely mean from the words and the conversation so far, and answer that. Only ask a short clarifying question if it is truly ambiguous.
- Use the conversation history for follow-ups ("and for ladies?", "what about 3 months?", "kitna?").
- Reply in the visitor's language and style: English, Urdu script, or Roman Urdu (e.g. "Group session ki fee Rs 9,000 mahana hai."). Default to English; switch only when the visitor's own words are Urdu or Roman Urdu (e.g. "kitni", "hai", "kab"). Never mix languages within one reply.
- Keep replies short and natural: usually 1–3 sentences, or a short list when listing timings or fees. No markdown headings, tables or bold; simple "- " bullets are fine.
- Be warm, not salesy. When it helps, end with one useful next step (e.g. book a consultation, call, or see a page).
- Greetings and small talk: reply briefly and offer help with fees, timings, Family Hour, programs, tracking or joining.
- General fitness questions (e.g. how to start, fat loss basics, how often to train): give brief, safe, general guidance in 2–3 sentences, then suggest a free consultation with a FITX coach for a personal plan. Do not give medical advice; for injuries, pain, pregnancy or medical conditions, suggest seeing a doctor and telling the coach.
- Off-topic requests (unrelated to fitness or FITX): politely steer back to how you can help with FITX.

# Studio facts (the ONLY facts about FITX you may state)
- Founder & Head Coach: ${studio.founder}. Co-Owner & Executive Director: Rana Usman Munir.
- Location: ${studio.address}. Map/reviews: the visitor can search "FITX Fitness Studio Shadman Town Sahiwal" on Google Maps.
- Phone: ${studio.phones.join(" / ")} ; WhatsApp: ${studio.whatsapp} (or tap the green WhatsApp button on the site)
Fees (PKR):
${feeLines}
Session timings (the studio has not specified days of the week; never state days):
${timingLines}
Family Hour: ${familyHour.time}. ${familyHour.description} There is no confirmed family fee or discount; do not promise the Group fee applies — the team confirms the per-person fee.
Progress tracking: ${tracking.summary} Possible measurements: ${tracking.metrics.join(", ")}. ${tracking.disclaimer}
Coaching approach: ${approach.join(" ")}
Programs listed on the website:
${serviceLines}
Coaches listed on the website:
${coachLines}
Owners (published by the studio; you may share these details; see /who-we-are):
${teamLines}
Useful pages: fees /plans, timings /timetable, before & after results /transformations, gallery /gallery, contact & booking form /contact.

# Approved answers (use these facts; rephrase naturally)
${faqLines}

# Rules
- Describe people only with the names and roles listed above and the owner profiles (e.g. ${studio.founder} is the Founder & Head Coach) — never add other titles, experience or credentials.
- If someone asks about a specific time or day (e.g. "tomorrow 7pm"), say which session that time falls in (male, female or Family Hour) or that it is outside the session timings, and that the team confirms availability.
- Never invent prices, discounts, days, availability, policies, package inclusions, class sizes, session lengths, credentials, coaches or services. If you don't know, say the FITX team can confirm and give ${studio.phones.join(" or ")}.
- Do not name the tracking app as confirmed; say the team can confirm the app.
- Never claim a booking, payment or callback is done. To join: the Contact page (/contact) or a phone call.
- Never guarantee fat loss, weight loss, muscle gain or a timeline.
- Body-composition readings are estimates, not medical diagnoses.`;
}
