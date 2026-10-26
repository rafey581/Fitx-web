import Link from "next/link";

import type { FilmContent } from "./content";

/**
 * Text that plays over the film. Every chapter is a fixed, full-screen frame;
 * the frame loop in Experience.tsx fades frames (and their `data-sub` beats)
 * in and out from the same chapter time that drives the camera.
 *
 * `data-sub="center,width"` marks a beat inside a chapter: it is fully shown
 * when the chapter's local progress is within `width` of `center`.
 */

const pad = (n: number) => String(n).padStart(2, "0");

function Tag({ index, children }: { index: number; children: React.ReactNode }) {
  return (
    <p className="film-mono flex items-center gap-3 text-[11px] text-white/60">
      <span className="text-accent">[ {pad(index)} ]</span>
      <span className="h-px w-8 bg-white/30" />
      <span data-scramble>{children}</span>
    </p>
  );
}

export const programBeat = (k: number) => 0.135 + k * 0.185;
export const coachBeat = (k: number) => 0.225 + k * 0.29;

export function Chapters({ content }: { content: FilmContent }) {
  const services = content.services.slice(0, 5);
  const coaches = content.coaches.slice(0, 3);
  const plans = content.plans.slice(0, 3);
  const whatsapp = content.whatsapp.replace(/[^\d]/g, "");

  return (
    <div className="film-frames">
      {/* 00 · Origin */}
      <section data-frame="0" className="film-frame" aria-label="FITX">
        <div className="absolute inset-x-0 bottom-0 flex flex-col gap-10 px-5 pb-24 sm:px-10 md:flex-row md:items-end md:justify-between md:pb-14">
          <div>
            <Tag index={0}>Sahiwal · Punjab</Tag>
            <h1 className="film-display mt-5 text-[13vw] md:text-[7.2vw]">
              <span className="block" data-scramble>
                The most
              </span>
              <span className="block text-accent" data-scramble>
                premium
              </span>
              <span className="block" data-scramble>
                training
              </span>
            </h1>
          </div>
          <div className="max-w-xs md:text-right">
            <p className="text-sm leading-relaxed text-white/70">
              One-on-one coaching built around your body, your schedule and your goals.
            </p>
            <p className="film-mono mt-6 flex items-center gap-3 text-[11px] text-white/50 md:justify-end">
              <span className="film-scroll-cue" aria-hidden="true" />
              Scroll to enter
            </p>
          </div>
        </div>
      </section>

      {/* 01 · Forge */}
      <section data-frame="1" className="film-frame" aria-label="Disciplines">
        <div className="absolute left-5 top-28 sm:left-10">
          <Tag index={1}>The forge</Tag>
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          {["Strength.", "Boxing.", "Yoga."].map((word, i) => (
            <h2
              key={word}
              data-sub={`${0.18 + i * 0.27},0.13`}
              className="film-display absolute text-[16vw] md:text-[11vw]"
            >
              {word}
            </h2>
          ))}
        </div>
        <p className="absolute bottom-24 left-1/2 w-[min(90vw,28rem)] -translate-x-1/2 text-center text-sm leading-relaxed text-white/70 md:bottom-14">
          Every session is programmed and tracked, so progress is never left to chance.
        </p>
      </section>

      {/* 02 · Programs */}
      <section data-frame="2" className="film-frame" aria-label="Programs">
        <div className="absolute left-5 top-28 sm:left-10">
          <Tag index={2}>What we do</Tag>
          <ol className="film-mono mt-8 hidden space-y-2 text-[11px] text-white/40 md:block">
            {services.map((s, k) => (
              <li key={s.title} data-sub-highlight={`${programBeat(k)},0.0925`} className="flex gap-3 transition-colors">
                <span>{pad(k + 1)}</span>
                <span>{s.title}</span>
              </li>
            ))}
          </ol>
        </div>
        <div className="absolute inset-x-5 bottom-24 sm:left-10 sm:right-auto md:bottom-auto md:top-1/2 md:-translate-y-1/2 md:pl-[14vw]">
          {services.map((s, k) => (
            <article key={s.title} data-sub={`${programBeat(k)},0.06`} className="film-beat max-w-xl">
              <p className="film-mono text-[11px] text-accent">
                {pad(k + 1)} / {pad(services.length)}
              </p>
              <h2 className="film-display mt-3 text-[11vw] md:text-[5.4vw]">{s.title}</h2>
              <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/70 md:text-base">{s.description}</p>
              <Link href={s.href} className="film-link mt-6">
                Explore program
              </Link>
            </article>
          ))}
        </div>
      </section>

      {/* 03 · Studio */}
      <section data-frame="3" className="film-frame" aria-label="Inside FITX">
        <div className="absolute left-5 top-28 sm:left-10">
          <Tag index={3}>The studio</Tag>
        </div>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <h2 className="film-display text-[15vw] md:text-[10vw]">
            <span className="block" data-scramble>
              Inside
            </span>
            <span className="block text-accent" data-scramble>
              FITX
            </span>
          </h2>
          <p className="mt-4 max-w-sm px-5 text-sm text-white/70">
            The studio, the sessions and the community — straight from the floor.
          </p>
        </div>
        <dl className="absolute inset-x-5 bottom-24 grid grid-cols-3 gap-4 sm:inset-x-10 md:bottom-14">
          {[
            ["500+", "Clients trained"],
            ["10", "Years coaching"],
            ["05", "Disciplines"],
          ].map(([n, label]) => (
            <div key={label} className="border-t border-white/20 pt-3">
              <dt className="film-mono text-[10px] text-white/50">{label}</dt>
              <dd className="film-display text-3xl md:text-5xl">{n}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* 04 · Coaches */}
      <section data-frame="4" className="film-frame" aria-label="Coaches">
        <div className="absolute left-5 top-28 sm:left-10">
          <Tag index={4}>Your coaches</Tag>
        </div>
        <div className="absolute inset-x-5 bottom-24 sm:left-10 sm:right-auto md:bottom-auto md:top-1/2 md:-translate-y-1/2">
          {coaches.map((c, k) => (
            <article key={c.name + k} data-sub={`${coachBeat(k)},0.1`} className="film-beat max-w-md">
              <p className="film-mono text-[11px] text-accent">{c.role}</p>
              <h2 className="film-display mt-3 text-[12vw] md:text-[5vw]">{c.name}</h2>
              <p className="mt-4 text-sm leading-relaxed text-white/70 md:text-base">{c.bio}</p>
              <Link href={c.href} className="film-link mt-6">
                Meet the team
              </Link>
            </article>
          ))}
        </div>
      </section>

      {/* 05 · Plans */}
      <section data-frame="5" className="film-frame" aria-label="Membership plans">
        <div className="absolute inset-x-5 top-28 text-center">
          <div className="flex justify-center">
            <Tag index={5}>Plans</Tag>
          </div>
          <h2 className="film-display mt-4 text-[9vw] md:text-[4.6vw]">
            No lock-ins. <span className="text-accent">No hidden fees.</span>
          </h2>
        </div>
        <div className="absolute inset-x-3 bottom-20 grid grid-cols-3 gap-2 sm:inset-x-10 sm:gap-6 md:bottom-12">
          {plans.map((p) => (
            <Link
              key={p.name}
              href={p.href}
              className={`film-glass group block p-3 sm:p-6 ${p.highlighted ? "film-glass-hot" : ""}`}
            >
              <p className="film-mono flex justify-between text-[10px] text-white/60">
                <span>{p.name}</span>
                {p.highlighted ? <span className="hidden text-accent sm:inline">Most popular</span> : null}
              </p>
              <p className="film-display mt-3 text-lg sm:text-3xl">{p.price}</p>
              <p className="film-mono text-[10px] text-white/50">{p.period}</p>
              <ul className="mt-4 hidden space-y-1.5 text-sm text-white/70 sm:block">
                {p.features.map((f) => (
                  <li key={f} className="flex gap-2">
                    <span className="text-accent">+</span>
                    {f}
                  </li>
                ))}
              </ul>
              <span className="film-link mt-4 text-[10px] sm:mt-6">Choose</span>
            </Link>
          ))}
        </div>
      </section>

      {/* 06 · Join */}
      <section data-frame="6" className="film-frame" aria-label="Start training">
        <div className="absolute inset-x-0 bottom-[22svh] flex flex-col items-center px-5 text-center md:bottom-[17svh]">
          <Tag index={6}>Your move</Tag>
          <h2 className="film-display mt-5 text-[14vw] md:text-[6.4vw]">
            <span className="block" data-scramble>
              Start
            </span>
            <span className="block text-accent" data-scramble>
              training
            </span>
          </h2>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/contact" className="film-btn film-btn-hot">
              Book a consultation
            </Link>
            {whatsapp ? (
              <a href={`https://wa.me/${whatsapp}`} className="film-btn" target="_blank" rel="noreferrer">
                WhatsApp us
              </a>
            ) : null}
          </div>
        </div>
        <footer className="film-mono absolute inset-x-5 bottom-16 hidden gap-4 text-[10px] text-white/50 sm:left-10 sm:right-28 md:bottom-16 md:grid md:grid-cols-4">
          <p>
            <span className="block text-white/30">Visit</span>
            {content.address}
          </p>
          <p>
            <span className="block text-white/30">Call</span>
            {content.phone}
          </p>
          <p>
            <span className="block text-white/30">Hours</span>
            {content.hours}
          </p>
          <p className="md:text-right">
            <span className="block text-white/30">© {new Date().getFullYear()}</span>
            {content.businessName}
          </p>
        </footer>
      </section>
    </div>
  );
}
