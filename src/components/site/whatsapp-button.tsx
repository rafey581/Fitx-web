/** WhatsApp link for a Pakistani number: "0322-6900206" → https://wa.me/923226900206 */
export function whatsappHref(number: string) {
  const digits = number.replace(/\D/g, "").replace(/^0(?=3)/, "92");
  return digits ? `https://wa.me/${digits}` : null;
}

/** "0322-6900206" → "0322 6900206" for display. */
const display = (number: string) => number.replace(/[-.]/g, " ").replace(/\s+/g, " ").trim();

/** Floating WhatsApp button: above the chatbot launcher on phones, beside it (with the number) on larger screens. */
export function WhatsAppButton({ number }: { number: string }) {
  const href = whatsappHref(number);
  if (!href) return null;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Chat with FITX on WhatsApp: ${number}`}
      className="fixed right-5 bottom-[5.5rem] z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#25d366] font-medium text-[#062b14] shadow-[0_8px_30px_-8px_rgb(37_211_102/0.7)] transition hover:scale-[1.03] hover:bg-[#2ee072] sm:right-[5.25rem] sm:bottom-5 sm:w-auto sm:gap-2.5 sm:pr-5 sm:pl-3.5"
    >
      <svg className="h-7 w-7 shrink-0" viewBox="0 0 32 32" fill="currentColor" aria-hidden="true">
        <path d="M16.04 3C8.86 3 3.03 8.83 3.03 16c0 2.3.6 4.53 1.74 6.5L3 29l6.67-1.74A12.96 12.96 0 0 0 16.04 29C23.2 29 29.03 23.17 29.03 16S23.2 3 16.04 3Zm0 23.8c-2.02 0-4-.54-5.72-1.57l-.41-.24-3.96 1.03 1.06-3.86-.27-.4A10.73 10.73 0 0 1 5.24 16c0-5.95 4.85-10.8 10.8-10.8 5.95 0 10.79 4.85 10.79 10.8 0 5.95-4.84 10.8-10.79 10.8Zm5.92-8.08c-.32-.16-1.92-.95-2.22-1.06-.3-.11-.51-.16-.73.16-.21.32-.84 1.06-1.03 1.27-.19.22-.38.24-.7.08-.33-.16-1.37-.5-2.6-1.6-.96-.86-1.61-1.92-1.8-2.24-.19-.32-.02-.5.14-.66.15-.14.33-.38.49-.57.16-.19.21-.32.32-.54.11-.21.05-.4-.03-.56-.08-.16-.73-1.76-1-2.41-.26-.63-.53-.55-.73-.56h-.62c-.21 0-.56.08-.86.4-.3.32-1.13 1.1-1.13 2.7 0 1.59 1.16 3.13 1.32 3.35.16.21 2.28 3.48 5.52 4.88.77.33 1.37.53 1.84.68.77.25 1.48.21 2.04.13.62-.09 1.92-.79 2.19-1.55.27-.76.27-1.41.19-1.55-.08-.13-.3-.21-.62-.37Z" />
      </svg>
      <span className="hidden text-sm leading-tight whitespace-nowrap sm:inline">{display(number)}</span>
    </a>
  );
}
