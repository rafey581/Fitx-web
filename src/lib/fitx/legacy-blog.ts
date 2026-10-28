/**
 * The blog posts that were hard-coded in the site before the blog moved into
 * the admin. `npm run db:sync-knowledge` imports them once when the blog is
 * empty; after that they are managed (edited or deleted) in Admin → Blog.
 * `image` is the cover used until one is uploaded in the admin.
 */
export type LegacyPost = {
  slug: string;
  title: string;
  date: string;
  image: string;
  excerpt: string;
  content: string;
};

export const legacyPosts: LegacyPost[] = [
  {
    slug: "benefits-of-personal-training",
    title: "5 Benefits of Personal Training vs Group Classes",
    date: "2026-10-15",
    image: "/images/fitx/PHOTO-2026-09-30-13-30-25.jpg",
    excerpt:
      "Discover why one-on-one coaching at FITX delivers faster, safer results than generic group workouts.",
    content:
      "When it comes to achieving your fitness goals, choosing between personal training and group classes can make all the difference. At FITX Personal Fitness Training Studio in Sahiwal, we believe one-on-one coaching delivers unmatched results.\n\n1. Personalized Program Design\n\nEvery body is different. With personal training, your program is built specifically around your goals, fitness level, injuries, and schedule. No cookie-cutter workouts.\n\n2. Proper Form & Injury Prevention\n\nHaving a coach watch your form in real-time prevents injuries and ensures you're getting the most out of every movement. This is especially crucial for beginners.\n\n3. Accountability & Motivation\n\nIt's much harder to skip a session when someone is expecting you. Your FITX coach keeps you accountable and pushes you when you need it most.\n\n4. Faster Results\n\nWith focused attention and progressive programming, personal training typically yields results faster than trying to figure it out on your own in group settings.\n\n5. Flexibility & Adaptability\n\nYour program evolves as you do. Feeling tired? We adjust. Hit a plateau? We change it up. Your training adapts to your life, not the other way around.\n\nReady to experience the FITX difference? Book your consultation today at the Contact page.",
  },
  {
    slug: "boxing-for-fitness",
    title: "Boxing for Fitness: More Than Just Fighting",
    date: "2026-10-12",
    image: "/images/fitx/PHOTO-2026-09-30-13-37-25.jpg",
    excerpt:
      "How boxing and conditioning at FITX builds strength, cardio, and confidence like nothing else.",
    content:
      "Boxing has exploded as a fitness modality, and for good reason. At FITX, our boxing and conditioning sessions deliver a full-body workout that torches calories while building real skills.\n\nFull-Body Conditioning\n\nBoxing engages your entire body - legs for footwork and power, core for rotation and stability, and upper body for punches. It's a true functional workout.\n\nCardiovascular Powerhouse\n\nA typical boxing session will have your heart rate soaring. The combination of high-intensity bursts and active recovery is excellent for building cardiovascular endurance.\n\nStress Relief\n\nThere's nothing quite like hitting pads to relieve stress. Boxing provides a healthy outlet for tension while building mental toughness.\n\nConfidence Building\n\nLearning a new skill builds confidence that extends far beyond the gym. Our boxing coach focuses on technique first, creating a supportive environment for all skill levels.\n\nReady to throw your first punch? Join us for a boxing session at FITX Sahiwal.",
  },
  {
    slug: "recovery-and-mobility",
    title: "The Power of Recovery & Mobility",
    date: "2026-10-08",
    image: "/images/fitx/PHOTO-2026-09-30-14-06-02.jpg",
    excerpt:
      "Why yoga and mobility work is essential for injury prevention and long-term progress.",
    content:
      "In the pursuit of fitness goals, many people overlook the most crucial component: recovery. At FITX, we integrate yoga and mobility work into our programs for optimal results.\n\nWhy Recovery Matters\n\nGrowth happens outside the gym. Your muscles repair and strengthen during rest periods. Skimping on recovery leads to burnout, plateaus, and increased injury risk.\n\nBenefits of Mobility Work\n\n• Improved range of motion and movement quality\n• Reduced risk of injury\n• Better performance in strength and conditioning\n• Decreased muscle soreness\n• Improved posture and body awareness\n\nYoga at FITX\n\nOur yoga and mobility sessions focus on functional movement that directly complements your training. Whether you're a seasoned athlete or just starting, these sessions will help you move better and feel better.\n\nRecovery isn't lazy - it's strategic. Make it part of your FITX training plan.",
  },
  {
    slug: "nutrition-for-gym-goals",
    title: "Nutrition Coaching: Fueling Your Fitness Journey",
    date: "2026-10-05",
    image: "/images/fitx/PHOTO-2026-09-30-13-49-45.jpg",
    excerpt:
      "Simple, sustainable nutrition strategies that complement your training at FITX.",
    content:
      "You can't out-train a bad diet. At FITX, our nutrition coaching ensures your eating habits align with your training goals for maximum results.\n\nSustainable Over Perfect\n\nWe don't believe in extreme diets or unsustainable restrictions. Our approach focuses on practical changes you can maintain long-term.\n\nPersonalized to Your Life\n\nYour nutrition plan should fit your schedule, preferences, budget, and lifestyle in Sahiwal. We work with what you have and what you enjoy.\n\nWhat You Get\n\n• Initial assessment and goal setting\n• Customized meal guidelines\n• Practical recipes and shopping tips\n• Regular check-ins and adjustments\n• Education to build lifelong habits\n\nThe FITX Approach\n\nNutrition coaching is integrated with your training program. Your coach tracks both your workouts and your nutrition, making adjustments based on your progress.\n\nReady to fuel your transformation? Add nutrition coaching to your FITX membership today.",
  },
];

/** Cover for an imported post that has no uploaded cover yet. */
export const legacyCover = (slug: string) =>
  legacyPosts.find((p) => p.slug === slug)?.image;
