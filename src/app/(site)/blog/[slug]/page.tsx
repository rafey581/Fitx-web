import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

const blogPosts: Record<string, any> = {
  "benefits-of-personal-training": {
    title: "5 Benefits of Personal Training vs Group Classes",
    category: "Training",
    date: "2026-10-15",
    image: "/images/fitx/PHOTO-2026-09-30-13-30-25.jpg",
    content: `
      <p>When it comes to achieving your fitness goals, choosing between personal training and group classes can make all the difference. At FITX Personal Fitness Training Studio in Sahiwal, we believe one-on-one coaching delivers unmatched results.</p>
      
      <h2>1. Personalized Program Design</h2>
      <p>Every body is different. With personal training, your program is built specifically around your goals, fitness level, injuries, and schedule. No cookie-cutter workouts.</p>
      
      <h2>2. Proper Form & Injury Prevention</h2>
      <p>Having a coach watch your form in real-time prevents injuries and ensures you're getting the most out of every movement. This is especially crucial for beginners.</p>
      
      <h2>3. Accountability & Motivation</h2>
      <p>It's much harder to skip a session when someone is expecting you. Your FITX coach keeps you accountable and pushes you when you need it most.</p>
      
      <h2>4. Faster Results</h2>
      <p>With focused attention and progressive programming, personal training typically yields results faster than trying to figure it out on your own in group settings.</p>
      
      <h2>5. Flexibility & Adaptability</h2>
      <p>Your program evolves as you do. Feeling tired? We adjust. Hit a plateau? We change it up. Your training adapts to your life, not the other way around.</p>
      
      <p><strong>Ready to experience the FITX difference?</strong> Book your consultation today at <a href="/contact">fitx.pk/contact</a>.</p>
    `,
  },
  "boxing-for-fitness": {
    title: "Boxing for Fitness: More Than Just Fighting",
    category: "Boxing",
    date: "2026-10-12",
    image: "/images/fitx/PHOTO-2026-09-30-13-37-25.jpg",
    content: `
      <p>Boxing has exploded as a fitness modality, and for good reason. At FITX, our boxing and conditioning sessions deliver a full-body workout that torches calories while building real skills.</p>
      
      <h2>Full-Body Conditioning</h2>
      <p>Boxing engages your entire body - legs for footwork and power, core for rotation and stability, and upper body for punches. It's a true functional workout.</p>
      
      <h2>Cardiovascular Powerhouse</h2>
      <p>A typical boxing session will have your heart rate soaring. The combination of high-intensity bursts and active recovery is excellent for building cardiovascular endurance.</p>
      
      <h2>Stress Relief</h2>
      <p>There's nothing quite like hitting pads to relieve stress. Boxing provides a healthy outlet for tension while building mental toughness.</p>
      
      <h2>Confidence Building</h2>
      <p>Learning a new skill builds confidence that extends far beyond the gym. Our boxing coach focuses on technique first, creating a supportive environment for all skill levels.</p>
      
      <p>Ready to throw your first punch? Join us for a boxing session at FITX Sahiwal.</p>
    `,
  },
  "recovery-and-mobility": {
    title: "The Power of Recovery & Mobility",
    category: "Recovery",
    date: "2026-10-08",
    image: "/images/fitx/PHOTO-2026-09-30-14-06-02.jpg",
    content: `
      <p>In the pursuit of fitness goals, many people overlook the most crucial component: recovery. At FITX, we integrate yoga and mobility work into our programs for optimal results.</p>
      
      <h2>Why Recovery Matters</h2>
      <p>Growth happens outside the gym. Your muscles repair and strengthen during rest periods. Skimping on recovery leads to burnout, plateaus, and increased injury risk.</p>
      
      <h2>Benefits of Mobility Work</h2>
      <ul>
        <li>Improved range of motion and movement quality</li>
        <li>Reduced risk of injury</li>
        <li>Better performance in strength and conditioning</li>
        <li>Decreased muscle soreness</li>
        <li>Improved posture and body awareness</li>
      </ul>
      
      <h2>Yoga at FITX</h2>
      <p>Our yoga and mobility sessions focus on functional movement that directly complements your training. Whether you're a seasoned athlete or just starting, these sessions will help you move better and feel better.</p>
      
      <p>Recovery isn't lazy - it's strategic. Make it part of your FITX training plan.</p>
    `,
  },
  "nutrition-for-gym-goals": {
    title: "Nutrition Coaching: Fueling Your Fitness Journey",
    category: "Nutrition",
    date: "2026-10-05",
    image: "/images/fitx/PHOTO-2026-09-30-13-49-45.jpg",
    content: `
      <p>You can't out-train a bad diet. At FITX, our nutrition coaching ensures your eating habits align with your training goals for maximum results.</p>
      
      <h2>Sustainable Over Perfect</h2>
      <p>We don't believe in extreme diets or unsustainable restrictions. Our approach focuses on practical changes you can maintain long-term.</p>
      
      <h2>Personalized to Your Life</h2>
      <p>Your nutrition plan should fit your schedule, preferences, budget, and lifestyle in Sahiwal. We work with what you have and what you enjoy.</p>
      
      <h2>What You Get</h2>
      <ul>
        <li>Initial assessment and goal setting</li>
        <li>Customized meal guidelines</li>
        <li>Practical recipes and shopping tips</li>
        <li>Regular check-ins and adjustments</li>
        <li>Education to build lifelong habits</li>
      </ul>
      
      <h2>The FITX Approach</h2>
      <p>Nutrition coaching is integrated with your training program. Your coach tracks both your workouts and your nutrition, making adjustments based on your progress.</p>
      
      <p>Ready to fuel your transformation? Add nutrition coaching to your FITX membership today.</p>
    `,
  },
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = blogPosts[slug];
  if (!post) return {};
  return {
    title: `${post.title} | FITX Blog`,
    description: post.excerpt,
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = blogPosts[slug];

  if (!post) {
    notFound();
  }

  return (
    <main id="main-content">
      <article>
        <section className="relative overflow-hidden bg-ink py-24 sm:py-32">
          <div aria-hidden="true" className="absolute inset-0 bg-arena" />
          <div aria-hidden="true" className="absolute inset-0 bg-grid-overlay opacity-40" />
          <Image
            src={post.image}
            alt={post.title}
            fill
            className="object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/80 to-ink/40" />
          <div className="relative mx-auto max-w-4xl px-4 sm:px-6">
            <Link href="/blog" className="mb-6 inline-flex items-center gap-2 text-sm text-white/70 transition hover:text-accent">
              <span aria-hidden="true">←</span> Back to Blog
            </Link>
            <div className="mt-6 flex items-center gap-4">
              <span className="chip bg-accent text-white">{post.category}</span>
              <time className="text-sm text-white/60">
                {new Date(post.date).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </time>
            </div>
            <h1 className="heading-display mt-6 text-4xl text-white sm:text-5xl lg:text-6xl">
              {post.title}
            </h1>
          </div>
        </section>

        <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
          <div
            className="prose prose-lg max-w-none prose-headings:font-heading prose-headings:font-bold prose-headings:uppercase prose-headings:tracking-tight prose-h2:mt-12 prose-h2:text-2xl prose-p:leading-relaxed prose-p:text-ink/80 prose-a:text-accent prose-a:no-underline hover:prose-a:underline prose-strong:text-ink prose-ul:text-ink/80"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
          <div className="mt-12 border-t border-line pt-8">
            <Link href="/blog" className="btn btn-accent">
              View All Posts <span aria-hidden="true">→</span>
            </Link>
          </div>
        </section>
      </article>
    </main>
  );
}
