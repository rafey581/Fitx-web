import { JetBrains_Mono } from "next/font/google";

import { AIChatbot } from "@/components/chatbot/ai-chatbot";
import { WhatsAppButton } from "@/components/site/whatsapp-button";
import { studio } from "@/lib/fitx/knowledge";
import { env } from "@/lib/env";
import { gymJsonLd, jsonLd, websiteJsonLd } from "@/lib/fitx/seo";
import { getSiteSettings } from "@/lib/site/settings";

const monoFont = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500"],
  display: "swap",
});

/** Shell for the full-screen 3D home film: no header/footer, just the film. */
export default async function ExperienceLayout({ children }: { children: React.ReactNode }) {
  const { general } = await getSiteSettings();
  return (
    <div className={`${monoFont.variable} w-full`}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd([gymJsonLd(env.APP_URL, general), websiteJsonLd(env.APP_URL)]) }}
      />
      {children}
      <WhatsAppButton number={general.whatsapp || studio.whatsapp} />
      <AIChatbot />
    </div>
  );
}
