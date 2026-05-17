import { createFileRoute, Link } from "@tanstack/react-router";
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  useInView,
  type MotionValue,
} from "framer-motion";
import { useEffect, useRef, useState } from "react";
import VillaBuilder from "@/components/VillaBuilder";

export const Route = createFileRoute("/")({ component: Index });

/* ═════════════════════════════════════════════════════════════════
   KSE GROUP — character-driven brand site
   Style: dark editorial, kinetic typography, raw lines, no rounding.
   Animations: Framer Motion only (GSAP intentionally omitted — FM
   covers scroll-trigger, parallax, and text reveals natively in SSR).
   ═════════════════════════════════════════════════════════════════ */

/* ───────────── primitives ───────────── */

const EASE = [0.77, 0, 0.175, 1] as const;

/** Split children into spans per word with overflow-hidden mask reveal. */
function SplitReveal({
  text,
  className = "",
  delay = 0,
  stagger = 0.06,
  once = true,
}: {
  text: string;
  className?: string;
  delay?: number;
  stagger?: number;
  once?: boolean;
}) {
  const words = text.split(" ");
  return (
    <span className={className}>
      {words.map((w, i) => (
        <span key={i} className="inline-block overflow-hidden align-bottom mr-[0.25em]">
          <motion.span
            className="inline-block"
            initial={{ y: "110%" }}
            whileInView={{ y: "0%" }}
            viewport={{ once, margin: "-10%" }}
            transition={{ duration: 1, ease: EASE, delay: delay + i * stagger }}
          >
            {w}
          </motion.span>
        </span>
      ))}
    </span>
  );
}

/** Letter-scramble effect that resolves on first view. */
function Scramble({ text, className = "" }: { text: string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-15%" });
  const [out, setOut] = useState(text);

  useEffect(() => {
    if (!inView) return;
    const pool = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#/\\<>*";
    let frame = 0;
    const total = 28;
    const id = window.setInterval(() => {
      frame++;
      const progress = frame / total;
      const reveal = Math.floor(progress * text.length);
      setOut(
        text
          .split("")
          .map((c, i) => {
            if (i < reveal || c === " ") return c;
            return pool[Math.floor(Math.random() * pool.length)];
          })
          .join("")
      );
      if (frame >= total) {
        setOut(text);
        window.clearInterval(id);
      }
    }, 35);
    return () => window.clearInterval(id);
  }, [inView, text]);

  return (
    <span ref={ref} className={className}>
      {out}
    </span>
  );
}

/* ───────────── chrome ───────────── */

function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 140, damping: 30, mass: 0.3 });
  return (
    <motion.div
      style={{ scaleX }}
      className="fixed top-0 left-0 right-0 h-[2px] origin-left z-[80]"
      // Accent bar grows as user scrolls
      // (color via inline style to keep raw)
    >
      <div className="w-full h-full" style={{ background: "#e8ff00" }} />
    </motion.div>
  );
}

function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-[70] mix-blend-difference">
      <div className="flex items-center justify-between px-5 md:px-10 py-4 md:py-5 text-[10px] md:text-[11px] tracking-[0.25em] md:tracking-[0.3em] uppercase font-medium">
        <a href="#top" className="link-underline font-black tracking-[-0.04em] text-[14px] md:text-[15px]">
          KSE / GROUP
        </a>
        <nav className="hidden md:flex items-center gap-8">
          <a href="#manifesto" className="link-underline">Manifest</a>
          <Link to="/leistungen" className="link-underline">Leistungen</Link>
          <a href="#about" className="link-underline">Über</a>
          <a href="#contact" className="link-underline">Kontakt</a>
        </nav>
        <a href="mailto:info@ksegroup.eu" className="link-underline hidden md:inline">
          info@ksegroup.eu →
        </a>
      </div>
    </header>
  );
}

/* ───────────── hero ───────────── */

function Hero() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  // Parallax: background glyph drifts faster than foreground text
  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "-30%"]);
  const txtY = useTransform(scrollYProgress, [0, 1], ["0%", "-10%"]);

  const headline = ["FANG", "NIEMALS", "AN", "AUFZUHÖREN."];

  return (
    <section id="top" ref={ref} className="relative h-screen w-full overflow-hidden">
      {/* z-index:1 wrapper so hero content sits above the global cinema layer */}
      <div className="relative z-[1] h-full w-full">
      {/* Parallax oversized glyph */}
      <motion.div
        aria-hidden
        style={{ y: bgY }}
        className="absolute inset-0 flex items-center justify-center pointer-events-none select-none"
      >
        <span
          className="font-black leading-none"
          style={{
            fontSize: "min(82vw, 1100px)",
            color: "transparent",
            WebkitTextStroke: "1px rgba(240,237,232,0.07)",
            letterSpacing: "-0.06em",
          }}
        >
          KSE
        </span>
      </motion.div>

      {/* Top meta row */}
      <div className="absolute top-20 md:top-24 left-6 right-6 flex justify-between text-[9px] md:text-[10px] tracking-[0.3em] md:tracking-[0.4em] uppercase text-foreground/50">
        <span>[ 01 / Hannover · DE ]</span>
        <span className="hidden md:inline">Est. — Independent Studio</span>
      </div>

      {/* Headline */}
      <motion.div
        style={{ y: txtY }}
        className="relative z-10 h-full flex flex-col items-center justify-center px-4 text-center"
      >
        <h1
          className="font-black leading-[0.85]"
          style={{
            fontSize: "clamp(3.5rem, 13vw, 12rem)",
            letterSpacing: "-0.05em",
          }}
        >
        {headline.map((w, i) => (
            <span key={i} className="inline-block overflow-hidden align-bottom mr-[0.18em]">
              <motion.span
                className="inline-block"
                initial={{ y: 80, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 1.1, ease: EASE, delay: 0.2 + i * 0.12 }}
              >
                {i === headline.length - 1 ? (
                  <span style={{ WebkitTextStroke: "1.5px #f0ede8", color: "transparent" }}>
                    {w}
                  </span>
                ) : (
                  w
                )}
              </motion.span>
            </span>
          ))}
        </h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.9, ease: EASE }}
          className="mt-8 md:mt-10 max-w-xl text-[11px] md:text-sm uppercase tracking-[0.25em] md:tracking-[0.3em] text-foreground/70 px-2"
        >
          Die meisten Marken sind laut.
          <br />
          <span className="text-foreground">Wenige sind unvergesslich.</span>
        </motion.p>
      </motion.div>

      {/* Bottom ticker */}
      <div className="absolute bottom-0 left-0 right-0 border-t border-foreground/15 overflow-hidden py-3 md:py-4">
        <motion.div
          className="flex whitespace-nowrap text-[10px] md:text-[13px] tracking-[0.3em] md:tracking-[0.4em] uppercase font-medium"
          style={{ color: "#e8ff00" }}
          animate={{ x: ["0%", "-50%"] }}
          transition={{ duration: 28, repeat: Infinity, ease: "linear" }}
        >
          {Array.from({ length: 12 }).map((_, i) => (
            <span key={i} className="px-8 flex items-center gap-8">
              KSE Group <span className="text-foreground/30">·</span> Hannover
              <span className="text-foreground/30">·</span> Charakter
              <span className="text-foreground/30">·</span> ksegroup.eu
              <span className="text-foreground/30">·</span> Seit 2018
              <span className="text-foreground/30">·</span>
            </span>
          ))}
        </motion.div>
      </div>
      </div>
    </section>
  );
}

/* ───────────── pinned word ───────────── */

function PinnedWord() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });

  // Live scroll counter (top-right)
  const counter = useTransform(scrollYProgress, (v) =>
    String(Math.round(v * 100)).padStart(3, "0"),
  );

  const lineOneOpacity = useTransform(scrollYProgress, [0, 0.08, 1], [0, 1, 1]);
  const lineOneY = useTransform(scrollYProgress, [0, 0.08, 1], [30, 0, 0]);
  const lineTwoOpacity = useTransform(scrollYProgress, [0.08, 0.16, 1], [0, 1, 1]);
  const lineTwoY = useTransform(scrollYProgress, [0.08, 0.16, 1], [30, 0, 0]);

  return (
    <section
      ref={ref}
      id="manifesto"
      className="relative border-t border-foreground/15"
      style={{ height: "600vh", background: "rgba(0,0,0,0.55)" }}
    >
      <div
        style={{
          position: "sticky",
          top: 0,
          height: "100vh",
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* Existing content sits above the background */}
        <div style={{ position: "relative", zIndex: 1, width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
        {/* Top-left label */}
        <div
          className="absolute top-8 left-6 text-[10px] uppercase tracking-[0.4em]"
          style={{ color: "#e8ff00" }}
        >
          // MANIFEST
        </div>
        {/* Top-right scroll counter */}
        <div
          className="absolute top-8 right-6 text-[10px] uppercase tracking-[0.4em]"
          style={{ color: "#e8ff00" }}
        >
          <motion.span>{counter}</motion.span>
          <span className="text-foreground/40"> / 100</span>
        </div>

        {/* Word stage */}
        <h2
          className="font-black px-4 text-center"
          style={{
            fontSize: "clamp(1.5rem, 7.5vw, 8rem)",
            fontWeight: 900,
            letterSpacing: "-0.03em",
            color: "#f0ede8",
            lineHeight: 1.05,
            maxWidth: "94vw",
          }}
        >
          <motion.span style={{ opacity: lineOneOpacity, y: lineOneY, display: "block" }}>
            WIR BAUEN KEINE MARKEN.
          </motion.span>
          <motion.span style={{ opacity: lineTwoOpacity, y: lineTwoY, display: "block" }}>
            WIR BAUEN <span style={{ color: "#e8ff00" }}>CHARAKTER!</span>
          </motion.span>
        </h2>
        </div>
      </div>
    </section>
  );
}

/* ───────────── horizontal services ───────────── */

/* ───────────── manifest ───────────── */

function Manifest() {
  const lines = [
    "Wir glauben nicht an Lautstärke",
    "um jeden Preis.",
    "Wir glauben an Substanz.",
    "An Haltung.",
    "An Arbeit, die bleibt.",
  ];
  return (
    <section
      className="relative border-t border-foreground/15"
      style={{ padding: "clamp(10vh, 15vh, 15vh) clamp(1.5rem, 8vw, 8vw)", background: "rgba(0,0,0,0.55)" }}
    >
      <div className="max-w-6xl mx-auto">
        <h2
          className="font-black tracking-tight"
          style={{ fontSize: "clamp(1.5rem, 5.2vw, 3rem)", lineHeight: 1.2, letterSpacing: "-0.03em" }}
        >
          {lines.map((line, i) => (
            <span key={i} className="block overflow-hidden">
              <motion.span
                className="inline-block"
                initial={{ y: "110%" }}
                whileInView={{ y: "0%" }}
                viewport={{ once: true, margin: "-10%" }}
                transition={{ duration: 0.9, ease: EASE, delay: i * 0.08 }}
              >
                {line}
              </motion.span>
            </span>
          ))}
        </h2>
        <div
          className="mt-12 text-right text-[11px] uppercase tracking-[0.4em]"
          style={{ color: "#e8ff00" }}
        >
          // MANIFEST · KSE GROUP
        </div>
      </div>
    </section>
  );
}

const SERVICES = [
  {
    n: "01",
    title: "Social Media",
    body:
      "Deine Konkurrenz postet auch. Der Unterschied: wir bauen Kanäle, die Menschen folgen wollen — nicht müssen. Strategie, Ästhetik, Community. Kein Baukasteninhalt. Kein Copy-Paste. Nur dein Charakter, skaliert.",
    tags: ["Instagram", "TikTok", "Meta", "LinkedIn", "YouTube"],
  },
  {
    n: "02",
    title: "Web Design",
    body:
      "Eine Website hat 3 Sekunden. Danach hat der Besucher entschieden. Wir bauen Sites, die in dieser Zeit alles sagen — wer du bist, was dich unterscheidet, warum genau du. Kein Template. Kein Durchschnitt.",
    tags: ["Design", "Entwicklung", "SEO", "Performance"],
  },
  {
    n: "03",
    title: "Werbefilm",
    body:
      "Menschen kaufen keine Produkte. Sie kaufen Bilder, Gefühle, Identitäten. Wir drehen Werbung, die nicht wie Werbung aussieht — weil gute Bilder nicht erklären, sie zeigen. Cinematic. Präzise. Unvergesslich.",
    tags: ["Reels", "Ads", "Brand Film", "Events", "Docs"],
  },
  {
    n: "04",
    title: "Branding",
    body:
      "Dein Logo ist nicht deine Marke. Deine Haltung ist es. Wir entwickeln Identitäten von Grund auf — visuell, sprachlich, strategisch. So dass dein Name für etwas steht. Nicht für alles. Für genau das Richtige.",
    tags: ["Logo", "CI", "Strategie", "Positionierung", "Naming"],
  },
];

function HorizontalServices() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  // 4 panels → translate -75% across the viewport
  const x = useTransform(scrollYProgress, [0, 1], ["0%", "-75%"]);
  const xSmooth = useSpring(x, { stiffness: 90, damping: 22, mass: 0.5 });

  return (
    <section id="services" ref={ref} className="relative h-[400vh] border-t border-foreground/15">
      <div className="sticky top-0 h-screen overflow-hidden">
        {/* Section label */}
        <div className="absolute top-8 left-6 right-6 z-10 flex justify-between text-[10px] uppercase tracking-[0.4em] text-foreground/50">
          <span>// Leistungen · 04 disziplinen</span>
          <span>scroll →</span>
        </div>

        {/* Section heading inline at left of track */}
        <motion.div style={{ x: xSmooth }} className="flex h-full w-[400%] items-center pt-24">
          {/* intro panel */}
          <div className="w-1/4 h-full shrink-0 flex flex-col justify-center px-8 md:px-16">
            <h2
              className="font-black leading-[0.85]"
              style={{ fontSize: "clamp(2.5rem, 6vw, 6rem)", letterSpacing: "-0.05em" }}
            >
              <SplitReveal text="Was wir" />
              <br />
              <SplitReveal text="bauen." delay={0.15} />
            </h2>
            <p className="mt-6 max-w-sm text-sm text-foreground/60 uppercase tracking-[0.25em]">
              Vier Disziplinen. Ein Team. Null Ausreden.
            </p>
          </div>

          {SERVICES.map((s, i) => (
            <ServiceCard key={s.n} s={s} i={i} progress={scrollYProgress} />
          ))}
        </motion.div>

        {/* progress bar */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-[40vw] max-w-md h-px bg-foreground/15 overflow-hidden">
          <motion.div style={{ scaleX: scrollYProgress, background: "#e8ff00" }} className="origin-left h-full" />
        </div>
      </div>
    </section>
  );
}

function ServiceCard({
  s,
  i,
  progress,
}: {
  s: (typeof SERVICES)[number];
  i: number;
  progress: MotionValue<number>;
}) {
  // Each card slides in from the right as the track passes its midpoint
  const start = 0.05 + i * 0.18;
  const opacity = useTransform(progress, [start, start + 0.06], [0, 1]);
  const tx = useTransform(progress, [start, start + 0.1], [120, 0]);

  return (
    <div className="w-1/4 h-full shrink-0 flex items-center px-6 md:px-10">
      <motion.article
        className="relative w-full h-[70vh] flex flex-row overflow-hidden transition-colors hover:[border-color:var(--accent)]"
        data-cursor="accent"
        style={{
          opacity,
          x: tx,
          background: "rgba(10, 10, 10, 0.75)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          border: "1px solid rgba(232, 255, 0, 0.15)",
          borderRadius: "2px",
        }}
      >
        {/* Thin accent top border */}
        <span
          aria-hidden
          className="absolute top-0 left-0 right-0 h-px"
          style={{ background: "#e8ff00" }}
        />

        {/* LEFT PANEL — big number + grid pattern */}
        <div className="relative w-2/5 h-full border-r border-foreground/15 overflow-hidden flex items-center justify-center">
          {/* SVG grid pattern, stroke only */}
          <svg
            aria-hidden
            className="absolute inset-0 w-full h-full"
            style={{ opacity: 0.05 }}
          >
            <defs>
              <pattern id={`grid-${s.n}`} width="32" height="32" patternUnits="userSpaceOnUse">
                <path d="M 32 0 L 0 0 0 32" fill="none" stroke="#e8ff00" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill={`url(#grid-${s.n})`} />
          </svg>
          {/* Animated diagonal line */}
          <motion.div
            aria-hidden
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(135deg, transparent 48%, rgba(232,255,0,0.08) 50%, transparent 52%)",
              backgroundSize: "200% 200%",
            }}
            animate={{ backgroundPosition: ["0% 0%", "100% 100%"] }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          />
          <span
            className="relative font-black leading-none select-none"
            style={{
              fontSize: "20vw",
              color: "#e8ff00",
              opacity: 0.08,
              letterSpacing: "-0.06em",
            }}
          >
            {s.n}
          </span>
          <span className="absolute top-6 left-6 text-[11px] uppercase tracking-[0.4em] text-foreground/50">
            / {s.n}
          </span>
        </div>

        {/* RIGHT PANEL — content */}
        <div className="relative w-3/5 h-full flex flex-col justify-between" style={{ padding: "2.5rem" }}>
          <span className="text-[11px] uppercase tracking-[0.4em] text-foreground/50">
            / Service
          </span>
          <div>
            <h3
              className="font-black mb-5"
              style={{ fontSize: "clamp(2rem, 3.5vw, 3.4rem)", letterSpacing: "-0.04em", lineHeight: 0.95 }}
            >
              {s.title.toUpperCase()}
            </h3>
            <p className="text-foreground/85 text-sm md:text-base leading-relaxed max-w-sm">
              {s.body}
            </p>
            <div className="mt-6 text-[11px] uppercase tracking-[0.3em] text-foreground/60">
              {s.tags.join(" · ")}
            </div>
            <a
              href="#contact"
              className="link-underline mt-8 inline-block text-[11px] tracking-[0.35em] uppercase"
              style={{ color: "#e8ff00" }}
            >
              Projekt anfragen →
            </a>
          </div>
        </div>
      </motion.article>
    </div>
  );
}

/* ───────────── about (stat / paragraph two-column) ───────────── */

const STATS = [
  {
    value: 6,
    suffix: "+",
    label: "Jahre im Business",
    body: "Aus TV-Studios in Köln über Festival-Bühnen bis ins eigene Studio in Hannover.",
  },
  {
    value: 120,
    suffix: "+",
    label: "Projekte realisiert",
    body: "Für Restaurants, Handwerk, Influencer und Musik-Acts — von 0 auf signifikant.",
  },
  {
    value: 1,
    suffix: "",
    pad: 2,
    label: "Fokus. Kein Konzern.",
    body: "Ein Team, das dich beim Vornamen kennt. Kein Account Manager, kein Ticket-System, kein Wartezimmer. Du schreibst Basti — Basti antwortet.",
  },
];

/** Counts 0 → target when scrolled into view (~1.5s, 60fps). Once only. */
function CountUp({ to, pad = 0, suffix = "" }: { to: number; pad?: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-15%" });
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!inView) return;
    const duration = 1500;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(to * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, to]);
  const text = pad ? String(val).padStart(pad, "0") : String(val);
  return (
    <span ref={ref}>
      {text}
      {suffix}
    </span>
  );
}

function About() {
  return (
    <section id="about" className="relative border-t border-foreground/15 px-6 md:px-10 py-32 md:py-44">
      {/* Heading */}
      <div className="max-w-6xl mx-auto mb-12">
        <h2
          className="font-black leading-[0.85]"
          style={{ fontSize: "clamp(2.5rem, 7vw, 7rem)", letterSpacing: "-0.05em" }}
        >
          <Scramble text="KSE / GROUP" />
        </h2>
        <div className="mt-6 text-[11px] uppercase tracking-[0.4em]" style={{ color: "#e8ff00" }}>
          Hannover · Independent · Seit 2018
        </div>
      </div>

      {/* Accent horizontal rule */}
      <div className="max-w-6xl mx-auto">
        <div className="h-px w-full" style={{ background: "#e8ff00" }} />
      </div>

      {/* Two-column: pull quote + body */}
      <div className="max-w-6xl mx-auto mt-16 grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-20 mb-24">
        <p
          className="font-black tracking-tight"
          style={{ fontSize: "clamp(1.875rem, 5.5vw, 4rem)", lineHeight: 1.05, letterSpacing: "-0.04em" }}
        >
          Wir bauen Marken, an denen man nicht vorbeiscrollen kann.
        </p>
        <p className="text-foreground/90 text-base md:text-lg leading-relaxed self-center">
          KSE ist kein Dienstleister, der Abgabetermine erfüllt. Wir sind das Team, das dafür sorgt, dass dein Name fällt, wenn du nicht im Raum bist. Strategie, Design, Content, Performance — aus einer Hand, ohne Agentur-Theater, ohne Praktikanten an deinem Projekt. Wir nehmen wenige Kunden im Jahr. Dafür liefern wir Arbeit, die Wettbewerber nervös macht. Wenn du willst, dass man dich übersieht: such dir jemand anderen.
        </p>
      </div>

      {/* Stat grid */}
      <div className="max-w-6xl mx-auto grid gap-px bg-foreground/15 border border-foreground/15">
        {STATS.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 60 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-15%" }}
            transition={{ duration: 0.9, ease: EASE, delay: i * 0.12 }}
            className="grid grid-cols-1 md:grid-cols-[0.9fr_1.1fr] gap-10 md:gap-16 px-6 md:px-12 py-12 md:py-16"
            style={{ background: "rgba(10,10,10,0.82)" }}
          >
            <div>
              <div
                className="font-black"
                style={{ fontSize: "clamp(4rem, 12vw, 11rem)", letterSpacing: "-0.06em", lineHeight: 0.85 }}
              >
                <CountUp to={s.value} pad={s.pad ?? 0} suffix={s.suffix} />
              </div>
              <div className="mt-3 text-[11px] uppercase tracking-[0.4em] text-foreground/50">{s.label}</div>
            </div>
            <p className="text-foreground/80 text-base md:text-xl leading-relaxed self-center max-w-xl">
              {s.body}
            </p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

/* ───────────── contact ───────────── */

function Contact() {
  return (
    <section id="contact" className="relative border-t border-foreground/15 px-6 md:px-10 py-32 md:py-44 overflow-hidden">
      <div className="absolute top-8 left-6 text-[10px] uppercase tracking-[0.4em] text-foreground/50">
        // 04 — Kontakt
      </div>

      <div className="max-w-6xl mx-auto">
        <h2
          className="font-black leading-[0.85] mb-12 md:mb-16"
          style={{ fontSize: "clamp(3rem, 11vw, 11rem)", letterSpacing: "-0.05em" }}
        >
          <SplitReveal text="Lass uns" />
          <br />
          <SplitReveal text="reden." delay={0.15} />
        </h2>

        <div className="mb-4 text-[12px] uppercase tracking-[0.4em]" style={{ color: "#e8ff00" }}>
          Schreib uns — bevor es dein Wettbewerb tut.
        </div>

        <a
          href="mailto:info@ksegroup.eu"
          data-cursor="accent"
          className="block group"
        >
          <span
            className="font-black block leading-[0.9] transition-colors group-hover:[color:var(--accent)]"
            style={{
              fontSize: "clamp(1.5rem, 8vw, 8rem)",
              letterSpacing: "-0.05em",
              wordBreak: "break-word",
              overflowWrap: "anywhere",
            }}
          >
            info@ksegroup.eu
          </span>
          <span
            className="block mt-3 h-[3px] w-0 group-hover:w-full transition-[width] duration-700 ease-[cubic-bezier(.77,0,.175,1)]"
            style={{ background: "#e8ff00" }}
          />
        </a>

        <div className="mt-12 md:mt-16 flex flex-wrap gap-x-6 gap-y-3 md:gap-8 text-[10px] md:text-[11px] uppercase tracking-[0.3em] md:tracking-[0.4em] text-foreground/55">
          <span>Hannover · DE</span>
          <span>—</span>
          <a href="https://instagram.com/ksegroup" className="link-underline">Instagram</a>
          <span>—</span>
          <a href="https://ksegroup.eu" className="link-underline">ksegroup.eu</a>
        </div>

        <div className="mt-20 flex flex-col md:flex-row gap-4">
          <a
            href="mailto:info@ksegroup.eu"
            className="btn-sweep inline-flex items-center justify-center gap-3 border border-foreground/40 px-8 py-5 text-[11px] uppercase tracking-[0.4em] font-medium"
          >
            Projekt starten →
          </a>
          <a
            href="https://instagram.com/ksegroup"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-sweep inline-flex items-center justify-center gap-3 border border-foreground/40 px-8 py-5 text-[11px] uppercase tracking-[0.4em] font-medium"
          >
            Auf Instagram →
          </a>
        </div>

        <div
          className="mt-6 text-[10px] uppercase tracking-[0.35em]"
          style={{ color: "rgba(240,237,232,0.4)" }}
        >
          Erstgespräch kostenlos · Antwort in unter 24h · Kein Sales-Pitch — nur Klartext, ob wir zueinander passen.
        </div>
      </div>
    </section>
  );
}

/* ───────────── footer ───────────── */

function Footer() {
  return (
    <footer className="border-t border-foreground/15 px-6 md:px-10 py-8 flex flex-col md:flex-row items-center justify-between gap-3 text-[10px] uppercase tracking-[0.4em] text-foreground/45">
      <span>© 2026 KSE Group</span>
      <span>Fang niemals an aufzuhören.</span>
      <span>Built in Hannover · DE</span>
    </footer>
  );
}

/* ───────────── page ───────────── */

function Index() {
  return (
    <main className="relative text-foreground" style={{ background: "transparent" }}>
      {/* Scroll-driven villa builder canvas */}
      <VillaBuilder />

      {/* All page content sits above the cinema layer */}
      <div className="relative" style={{ zIndex: 1 }}>
      <ScrollProgress />
      <Header />
      <Hero />
      <PinnedWord />
      <Manifest />
      <HorizontalServices />
      <About />
      <Contact />
      <Footer />
      </div>
    </main>
  );
}