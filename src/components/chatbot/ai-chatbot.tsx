"use client";

import { useState, useRef, useEffect } from "react";

const knowledgeBase = [
  {
    keywords: ["hours", "timing", "open", "close", "time"],
    answer: "FITX is open Mon–Sat · 6:00am – 10:00pm. We're closed on Sundays.",
  },
  {
    keywords: ["location", "address", "where", "sahiwal"],
    answer: "We're located in Shadman Town, Faisalabad Road, Sahiwal, Punjab, Pakistan.",
  },
  {
    keywords: ["price", "cost", "plan", "membership", "fee"],
    answer: "Our plans: Starter PKR 8,000/month (4 sessions), Commit PKR 15,000/month (8 sessions + nutrition), Transform PKR 25,000/month (Unlimited + priority). Visit /plans for details.",
  },
  {
    keywords: ["contact", "phone", "whatsapp", "call"],
    answer: "You can reach us at +92 300 0000000 or WhatsApp us. Or book a consultation at /contact",
  },
  {
    keywords: ["service", "training", "boxing", "yoga", "personal"],
    answer: "We offer Personal Training, Boxing & Conditioning, Group Training, Yoga & Mobility, and Nutrition Coaching. Check /services for details.",
  },
  {
    keywords: ["coach", "trainer"],
    answer: "Our team includes our Head Coach (Founder), Boxing Coach, and Yoga Coach. Meet them at /coaches",
  },
  {
    keywords: ["book", "consultation", "join"],
    answer: "Book your free consultation at /contact. We'll assess your goals and build a custom plan for you!",
  },
];

function getResponse(query: string): string {
  const lower = query.toLowerCase();
  for (const item of knowledgeBase) {
    if (item.keywords.some((k) => lower.includes(k))) {
      return item.answer;
    }
  }
  return "Thanks for reaching out! For specific questions about pricing, schedules, or bookings, I'd recommend booking a consultation at /contact or calling us at +92 300 0000000. What else can I help with?";
}

export function AIChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Array<{ role: "user" | "bot"; text: string }>>([
    { role: "bot", text: "Hey! I'm FITX Bot. Ask me about hours, pricing, services, or how to get started!" },
  ]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    const userMsg = input.trim();
    setMessages((prev) => [...prev, { role: "user", text: userMsg }]);
    setInput("");
    setTimeout(() => {
      const response = getResponse(userMsg);
      setMessages((prev) => [...prev, { role: "bot", text: response }]);
    }, 500);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-accent to-accent-soft shadow-lg transition hover:scale-110"
        aria-label="Open chatbot"
      >
        <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
      </button>

      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-80 overflow-hidden rounded-brand border border-white/10 bg-ink shadow-2xl sm:w-96">
          <div className="flex items-center justify-between bg-gradient-to-r from-accent to-accent-soft px-4 py-3">
            <div>
              <p className="font-heading text-sm font-bold text-white">FITX Bot</p>
              <p className="text-xs text-white/80">Ask me anything</p>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="h-80 overflow-y-auto p-4 space-y-3">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${msg.role === "user" ? "bg-accent text-white" : "bg-white/10 text-white"}`}>
                  {msg.text}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div className="flex gap-2 border-t border-white/10 p-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSend()}
              placeholder="Type your question..."
              className="flex-1 rounded-brand bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-1 focus:ring-accent"
            />
            <button onClick={handleSend} className="rounded-brand bg-accent px-3 py-2 text-white transition hover:bg-accent-soft">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
