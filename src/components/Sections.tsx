import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ScrollTrail } from "@/components/ScrollTrail";
import { ProjectTile, type ProjectTileData } from "@/components/ProjectTile";

gsap.registerPlugin(ScrollTrigger);

/** Fades + lifts an element in via ScrollTrigger the moment it enters view. */
function useRevealOnScroll<T extends HTMLElement>(ref: React.RefObject<T | null>) {
  useEffect(() => {
    if (!ref.current) return;
    const targets = ref.current.querySelectorAll<HTMLElement>("[data-reveal]");
    const ctx = gsap.context(() => {
      targets.forEach((el, i) => {
        gsap.fromTo(
          el,
          { opacity: 0, y: 40 },
          {
            opacity: 1,
            y: 0,
            duration: 0.9,
            ease: "power3.out",
            delay: i * 0.05,
            scrollTrigger: { trigger: el, start: "top 85%", once: true },
          },
        );
      });
    }, ref);
    return () => ctx.revert();
  }, [ref]);
}

/* ───────────── Hero ───────────── */

export function Hero() {
  const ref = useRef<HTMLElement>(null);
  useRevealOnScroll(ref);
  return (
    <section
      ref={ref}
      className="relative min-h-screen flex flex-col justify-center px-6 md:px-12 lg:px-20 pt-32 pb-24"
    >
      <h1 className="sr-only">KSE / GROUP — Creative Tech Studio</h1>
      <motion.div
        data-reveal
        className="font-black leading-[0.88] max-w-[18ch]"
        style={{ fontSize: "clamp(3rem, 10vw, 9rem)", letterSpacing: "-0.05em" }}
      >
        <span className="block">Wir bauen Marken,</span>
        <span className="block" style={{ color: "#a855f7" }}>
          an die man sich erinnert.
        </span>
      </motion.div>
      <p
        data-reveal
        className="mt-10 max-w-xl text-white/60 text-base md:text-lg"
        style={{ letterSpacing: "0.01em" }}
      >
        Social · Web · Film · Branding — aus Hannover.
      </p>
      <div
        data-reveal
        className="mt-20 flex items-center gap-3 text-[10px] uppercase tracking-[0.4em] text-white/40"
      >
        <span>scroll</span>
        <span aria-hidden className="block w-10 h-px bg-white/30" />
      </div>
    </section>
  );
}

/* ───────────── Selected Work ───────────── */

const WORK: ProjectTileData[] = [
  {
    index: "01",
    title: "Social Media",
    description:
      "Kanäle, denen Menschen folgen wollen — nicht müssen. Strategie, Ästhetik, Community.",
    tags: ["Instagram", "TikTok", "Meta"],
    accent: "blue",
  },
  {
    index: "02",
    title: "Web Design",
    description: "Sites, die in 3 Sekunden alles sagen: wer du bist, was dich unterscheidet.",
    tags: ["Design", "Entwicklung", "SEO"],
    accent: "violet",
  },
  {
    index: "03",
    title: "Werbefilm",
    description: "Bilder, die zeigen statt erklären. Cinematic, präzise, unvergesslich.",
    tags: ["Reels", "Ads", "Brand Film"],
    accent: "red",
  },
  {
    index: "04",
    title: "Branding",
    description: "Identitäten von Grund auf — visuell, sprachlich, strategisch.",
    tags: ["Logo", "CI", "Naming"],
    accent: "blue",
  },
];

export function SelectedWork() {
  const ref = useRef<HTMLElement>(null);
  useRevealOnScroll(ref);
  return (
    <section ref={ref} className="relative px-6 md:px-12 lg:px-20 py-32 md:py-48">
      <div className="max-w-7xl mx-auto">
        <div data-reveal className="mb-16 md:mb-24">
          <span className="block text-[10px] uppercase tracking-[0.4em] text-white/40 mb-6">
            / 01 — Selected Work
          </span>
          <h2
            className="font-black leading-[0.9] max-w-[16ch]"
            style={{ fontSize: "clamp(2.5rem, 8vw, 7rem)", letterSpacing: "-0.04em" }}
          >
            Was wir bauen.
          </h2>
        </div>
        <div className="grid grid-cols-12 gap-6 md:gap-8">
          <ProjectTile data={WORK[0]} span="col-span-12 md:col-span-7" offset={0} />
          <ProjectTile data={WORK[1]} span="col-span-12 md:col-span-5" offset={80} />
          <ProjectTile data={WORK[2]} span="col-span-12 md:col-span-5" offset={40} />
          <ProjectTile data={WORK[3]} span="col-span-12 md:col-span-7" offset={120} />
        </div>
      </div>
    </section>
  );
}

/* ───────────── About ───────────── */

export function About() {
  const ref = useRef<HTMLElement>(null);
  useRevealOnScroll(ref);
  return (
    <section ref={ref} className="relative px-6 md:px-12 lg:px-20 py-32 md:py-48">
      <div className="max-w-7xl mx-auto grid grid-cols-12 gap-6 md:gap-12">
        <div data-reveal className="col-span-12 md:col-span-7">
          <span className="block text-[10px] uppercase tracking-[0.4em] text-white/40 mb-6">
            / 02 — About
          </span>
          <h2
            className="font-black leading-[0.9]"
            style={{ fontSize: "clamp(2rem, 7vw, 6rem)", letterSpacing: "-0.04em" }}
          >
            <span className="block">Independent Studio.</span>
            <span className="block" style={{ color: "#4f7dff" }}>
              Hannover · Seit 2021.
            </span>
          </h2>
        </div>
        <p
          data-reveal
          className="col-span-12 md:col-span-5 text-white/60 text-base md:text-lg leading-relaxed self-end"
        >
          KSE ist kein Dienstleister, der Abgabetermine erfüllt. Wir sind das Team, das dafür sorgt,
          dass dein Name fällt, wenn du nicht im Raum bist. Strategie, Design, Content, Performance
          — aus einer Hand, ohne Agentur-Theater.
        </p>
      </div>
    </section>
  );
}

/* ───────────── Capabilities ───────────── */

const CAPS = [
  "Strategie",
  "Social Media",
  "Webdesign",
  "Entwicklung",
  "Werbefilm",
  "Branding",
  "Content",
  "Performance",
];

export function Capabilities() {
  const ref = useRef<HTMLElement>(null);
  useRevealOnScroll(ref);
  return (
    <section ref={ref} className="relative px-6 md:px-12 lg:px-20 py-32 md:py-48">
      <div className="max-w-7xl mx-auto">
        <span
          data-reveal
          className="block text-[10px] uppercase tracking-[0.4em] text-white/40 mb-10"
        >
          / 03 — Capabilities
        </span>
        <ul className="flex flex-wrap gap-x-8 gap-y-4 md:gap-x-14 md:gap-y-6">
          {CAPS.map((c, i) => (
            <li
              key={c}
              data-reveal
              className="font-black leading-[0.95]"
              style={{
                fontSize: "clamp(1.75rem, 5vw, 4rem)",
                letterSpacing: "-0.03em",
                color: i % 3 === 0 ? "#a855f7" : i % 3 === 1 ? "#f0ede8" : "#4f7dff",
              }}
            >
              {c}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ───────────── Contact CTA ───────────── */

export function ContactCTA() {
  const ref = useRef<HTMLElement>(null);
  useRevealOnScroll(ref);
  return (
    <section ref={ref} className="relative px-6 md:px-12 lg:px-20 py-32 md:py-48">
      <div className="max-w-7xl mx-auto">
        <span
          data-reveal
          className="block text-[10px] uppercase tracking-[0.4em] text-white/40 mb-8"
        >
          / 04 — Kontakt
        </span>
        <h2
          data-reveal
          className="font-black leading-[0.9]"
          style={{ fontSize: "clamp(2.5rem, 9.5vw, 9.5rem)", letterSpacing: "-0.05em" }}
        >
          Lass uns reden.
        </h2>
        <a
          data-reveal
          href="mailto:info@ksegroup.eu"
          className="mt-10 inline-block font-black break-words"
          style={{
            fontSize: "clamp(1.25rem, 5vw, 3.5rem)",
            letterSpacing: "-0.03em",
            color: "#a855f7",
          }}
        >
          info@ksegroup.eu
        </a>
        <div data-reveal className="mt-14 flex flex-wrap gap-4">
          <a
            href="mailto:info@ksegroup.eu"
            className="inline-flex items-center justify-center gap-3 border border-white/25 rounded-full px-8 py-4 text-[11px] uppercase tracking-[0.35em] font-medium hover:border-white/60 transition-colors"
          >
            Projekt starten →
          </a>
          <a
            href="https://instagram.com/ksegroup.eu"
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex items-center justify-center gap-3 border border-white/10 rounded-full px-8 py-4 text-[11px] uppercase tracking-[0.35em] font-medium text-white/60 hover:text-white hover:border-white/40 transition-colors"
          >
            Auf Instagram →
          </a>
        </div>
      </div>
    </section>
  );
}

/**
 * Wraps Selected Work + About + Capabilities in a shared relative container
 * so a single ScrollTrail can run behind all three.
 */
export function TrailedSections() {
  const trailWrap = useRef<HTMLDivElement>(null);
  return (
    <div ref={trailWrap} className="relative">
      <ScrollTrail targetRef={trailWrap} />
      <SelectedWork />
      <About />
      <Capabilities />
    </div>
  );
}