import { JetBrains_Mono } from "next/font/google";

import { AIChatbot } from "@/components/chatbot/ai-chatbot";

const monoFont = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500"],
  display: "swap",
});

/** Shell for the full-screen 3D home film: no header/footer, just the film. */
export default function ExperienceLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${monoFont.variable} w-full`}>
      {children}
      <AIChatbot />
    </div>
  );
}
