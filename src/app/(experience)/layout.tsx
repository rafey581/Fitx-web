import { JetBrains_Mono } from "next/font/google";

import { AIChatbot } from "@/components/chatbot/ai-chatbot";
import { WhatsAppButton } from "@/components/site/whatsapp-button";
import { studio } from "@/lib/fitx/knowledge";
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
      {children}
      <WhatsAppButton number={general.whatsapp || studio.whatsapp} />
      <AIChatbot />
    </div>
  );
}
