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
import CinemaStage from "@/components/CinemaStage";

export const Route = createFileRoute("/")({ component: Index });

const EASE = [0.77, 0, 0.175, 1] as const;

/* ───────────── primitives ───────────── */

function SplitReveal({
  text,
  className = "",
  delay = 0,
  stagger = 0.06,
}: { text: string; className?: string; delay?: number; stagger?: number }) {
  const words = text.split(" ");
  return (
    <span className={className}>
      {words.map((w, i) => (
        <span key={i} className="inline-block overflow-hidden align-bottom mr-[0.25em]">
          <motion.span
            className="inline-block"
            initial={{ y: "110%" }}
            whileInView={{ y: "0%" }}
            viewport={{ once: true, margin: "-10%" }}
            transition={{ duration: 1, ease: EASE, delay: delay + i * stagger }}
          >
            {w}
          </motion.span>
        </span>
      ))}
    </span>
  );
}

function CountUp({ to, pad = 0, suffix = "" }: { to: number; pad?: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-15%" });
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!inView) return;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / 1500);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(to * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, to]);
  const text = pad ? String(val).padStart(pad, "0") : String(val);
  return (
    <span ref={ref}>{text}{suffix}</span>
  );
}

/* ───────────── chrome ───────────── */

function ScrollProgress({ progress }: { progress: MotionValue<number> }) {
  const scaleX = useSpring(progress, { stiffness: 140, damping: 30, mass: 0.3 });
  return (
    <motion.div
      style={{ scaleX, transformOrigin: "left", background: "#e8ff00" }}
      className="fixed top-0 left-0 right-0 h-[2px] z-[80]"
    />
  );
}

function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-[70] mix-blend-difference">
      <div className="flex items-center justify-between px-5 md:px-10 py-4 md:py-5 text-[10px] md:text-[11px] tracking-[0.3em] uppercase font-medium">
        <a href="#top" className="font-black tracking-[-0.04em] text-[14px] md:text-[15px]">
          KSE / GROUP
        </a>
        <nav className="hidden md:flex items-center gap-8">
          <a href="#manifest" className="hover:text-[color:var(--accent)] transition-colors">Manifest</a>
          <a href="#services" className="hover:text-[color:var(--accent)] transition-colors">Leistungen</a>
          <a href="#about" className="hover:text-[color:var(--accent)] transition-colors">Über</a>
          <a href="#contact" className="hover:text-[color:var(--accent)] transition-colors">Kontakt</a>
        </nav>
        <a href="mailto:info@ksegroup.eu" className="hidden md:inline hover:text-[color:var(--accent)] transition-colors">
          info@ksegroup.eu →
        </a>
      </div>
    </header>
  );
}

/* ───────────── HERO (sec 1) ───────────── */

function Hero({ progress }: { progress: MotionValue<number> }) {
  const labelOpacity = useTransform(progress, [0, 0.08], [1, 0]);
  const titleY = useTransform(progress, [0, 0.15], [0, -120]);
  const titleOpacity = useTransform(progress, [0, 0.1], [1, 0]);

  return (
    <section id="top" className="relative h-screen w-full flex flex-col items-center justify-between py-[18vh] z-[1]">
      <motion.div style={{ opacity: labelOpacity }} className="text-center">
        <span
          className="text-[10px] md:text-[11px] tracking-[0.5em] uppercase font-semibold"
          style={{ color: "#f0ede8", textShadow: "0 0 18px rgba(0,0,0,0.9)" }}
        >
          KSE / GROUP — Independent Studio
        </span>
      </motion.div>

      <motion.div style={{ y: titleY, opacity: titleOpacity }} className="text-center px-4">
        <h1
          className="font-black leading-[0.9]"
          style={{ fontSize: "clamp(2rem, 6vw, 5rem)", letterSpacing: "-0.04em" }}
        >
          <SplitReveal text="Fang niemals" delay={0.2} />
          <br />
          <SplitReveal text="an aufzuhören." delay={0.5} />
        </h1>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4, duration: 1 }}
        className="flex flex-col items-center gap-2"
      >
        <span className="text-[9px] tracking-[0.5em] uppercase text-foreground/60">scroll</span>
        <motion.span
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          className="block w-px h-10"
          style={{ background: "linear-gradient(to bottom, transparent, #e8ff00)" }}
        />
      </motion.div>
    </section>
  );
}

/* ───────────── MANIFEST (sec 2) — pinned word stage ───────────── */

const MANIFEST_LINES = [
  ["Die meisten Marken", "sind laut."],
  ["Wenige", "sind unvergesslich."],
  ["Wir bauen keine Marken.", "Wir bauen Charakter."],
];

function Manifest() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const counter = useTransform(scrollYProgress, (v) => String(Math.round(v * 100)).padStart(3, "0"));

  return (
    <section
      ref={ref}
      id="manifest"
      className="relative z-[1]"
      style={{ height: "320vh" }}
    >
      <div className="sticky top-0 h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute top-8 left-6 text-[10px] uppercase tracking-[0.4em]" style={{ color: "#e8ff00" }}>
          // MANIFEST
        </div>
        <div className="absolute top-8 right-6 text-[10px] uppercase tracking-[0.4em]" style={{ color: "#e8ff00" }}>
          <motion.span>{counter}</motion.span>
          <span className="text-foreground/40"> / 100</span>
        </div>

        {MANIFEST_LINES.map((pair, i) => {
          const segs = MANIFEST_LINES.length;
          const start = i / segs;
          const end = (i + 1) / segs;
          const mid = start + (end - start) * 0.5;
          return (
            <ManifestLine
              key={i}
              progress={scrollYProgress}
              start={start}
              mid={mid}
              end={end}
              top={pair[0]}
              bottom={pair[1]}
              accent={i === MANIFEST_LINES.length - 1}
            />
          );
        })}
      </div>
    </section>
  );
}

function ManifestLine({
  progress, start, mid, end, top, bottom, accent,
}: {
  progress: MotionValue<number>;
  start: number; mid: number; end: number;
  top: string; bottom: string; accent?: boolean;
}) {
  const opacity = useTransform(progress, [start, start + 0.05, end - 0.05, end], [0, 1, 1, 0]);
  const y = useTransform(progress, [start, mid, end], [60, 0, -60]);
  const blur = useTransform(progress, [start, start + 0.05, end - 0.05, end], [12, 0, 0, 12]);
  const filter = useTransform(blur, (b) => `blur(${b}px)`);

  return (
    <motion.h2
      className="absolute font-black text-center px-4"
      style={{
        opacity, y, filter,
        fontSize: "clamp(1.75rem, 7vw, 7rem)",
        letterSpacing: "-0.04em",
        lineHeight: 1.05,
        color: "#f0ede8",
        textShadow: "0 0 32px rgba(0,0,0,0.7)",
      }}
    >
      <span className="block">{top}</span>
      <span className="block" style={accent ? { color: "#e8ff00" } : undefined}>
        {bottom}
      </span>
    </motion.h2>
  );
}

/* ───────────── SERVICES (sec 3) — horizontal track ───────────── */

const SERVICES = [
  {
    n: "01",
    title: "Social Media",
    body: "Deine Konkurrenz postet auch. Wir bauen Kanäle, denen Menschen folgen wollen — nicht müssen. Strategie, Ästhetik, Community.",
    tags: ["Instagram", "TikTok", "Meta", "LinkedIn", "YouTube"],
  },
  {
    n: "02",
    title: "Web Design",
    body: "Eine Website hat 3 Sekunden. Danach hat der Besucher entschieden. Wir bauen Sites, die in dieser Zeit alles sagen.",
    tags: ["Design", "Entwicklung", "SEO", "Performance"],
  },
  {
    n: "03",
    title: "Werbefilm",
    body: "Menschen kaufen keine Produkte. Sie kaufen Bilder, Gefühle, Identitäten. Cinematic. Präzise. Unvergesslich.",
    tags: ["Reels", "Ads", "Brand Film", "Events", "Docs"],
  },
  {
    n: "04",
    title: "Branding",
    body: "Dein Logo ist nicht deine Marke. Deine Haltung ist es. Identitäten von Grund auf — visuell, sprachlich, strategisch.",
    tags: ["Logo", "CI", "Strategie", "Positionierung", "Naming"],
  },
];

function Services() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const x = useTransform(scrollYProgress, [0, 1], ["0%", "-75%"]);
  const xS = useSpring(x, { stiffness: 90, damping: 22, mass: 0.5 });

  return (
    <section id="services" ref={ref} className="relative z-[1]" style={{ height: "400vh" }}>
      <div className="sticky top-0 h-screen overflow-hidden">
        <div className="absolute top-8 left-6 right-6 z-10 flex justify-between text-[10px] uppercase tracking-[0.4em] text-foreground/50">
          <span>// Leistungen · 04 Disziplinen</span>
          <span>scroll →</span>
        </div>

        <motion.div style={{ x: xS }} className="services-track group/track flex h-full w-[400%] items-center pt-24">
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

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-[40vw] max-w-md h-px bg-foreground/15 overflow-hidden">
          <motion.div style={{ scaleX: scrollYProgress, background: "#e8ff00", transformOrigin: "left" }} className="h-full" />
        </div>
      </div>
    </section>
  );
}

function ServiceCard({
  s, i, progress,
}: { s: (typeof SERVICES)[number]; i: number; progress: MotionValue<number> }) {
  const start = 0.05 + i * 0.18;
  const opacity = useTransform(progress, [start, start + 0.06], [0, 1]);
  const tx = useTransform(progress, [start, start + 0.1], [120, 0]);

  return (
    <div className="service-card group/card w-1/4 h-full shrink-0 flex items-center px-6 md:px-10 transition-[opacity,transform] duration-500 ease-out group-hover/track:opacity-40 group-hover/track:scale-[0.98] hover:!opacity-100 hover:!scale-100">
      <motion.article
        className="relative w-full h-[70vh] flex flex-col md:flex-row overflow-hidden"
        style={{
          opacity, x: tx,
          background: "rgba(10,10,20,0.65)",
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
          border: "1px solid rgba(232,255,0,0.18)",
          borderRadius: "2px",
        }}
      >
        <span aria-hidden className="absolute top-0 left-0 right-0 h-px" style={{ background: "#e8ff00" }} />

        <div className="relative md:w-2/5 h-1/3 md:h-full border-b md:border-b-0 md:border-r border-foreground/15 overflow-hidden flex items-center justify-center">
          <svg aria-hidden className="absolute inset-0 w-full h-full" style={{ opacity: 0.05 }}>
            <defs>
              <pattern id={`grid-${s.n}`} width="32" height="32" patternUnits="userSpaceOnUse">
                <path d="M 32 0 L 0 0 0 32" fill="none" stroke="#e8ff00" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill={`url(#grid-${s.n})`} />
          </svg>
          <span
            className="relative font-black leading-none select-none"
            style={{ fontSize: "20vw", color: "#e8ff00", opacity: 0.1, letterSpacing: "-0.06em" }}
          >
            {s.n}
          </span>
          <span className="absolute top-6 left-6 text-[11px] uppercase tracking-[0.4em] text-foreground/50">
            / {s.n}
          </span>
        </div>

        <div className="relative md:w-3/5 h-2/3 md:h-full flex flex-col justify-between p-6 md:p-10">
          <span className="text-[11px] uppercase tracking-[0.4em] text-foreground/50">/ Service</span>
          <div>
            <h3
              className="font-black mb-4"
              style={{ fontSize: "clamp(1.5rem, 3.5vw, 3.4rem)", letterSpacing: "-0.04em", lineHeight: 0.95 }}
            >
              {s.title.toUpperCase()}
            </h3>
            <p className="text-foreground/85 text-sm md:text-base leading-relaxed max-w-sm">{s.body}</p>
            <div className="mt-5 text-[10px] uppercase tracking-[0.3em] text-foreground/60">
              {s.tags.join(" · ")}
            </div>
            <a
              href="#contact"
              className="mt-6 inline-block text-[11px] tracking-[0.35em] uppercase border-b border-transparent hover:border-current"
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

/* ───────────── ABOUT (sec 4) ───────────── */

type Stat =
  | { kind: "count"; value: number; suffix?: string; pad?: number; label: string; body: string }
  | { kind: "static"; value: number; pad?: number; suffix?: string; label: string; body: string }
  | { kind: "industries"; industries: string; label: string; body: string };

const STATS: Stat[] = [
  {
    kind: "count",
    value: new Date().getFullYear() - 2021,
    suffix: "+",
    label: "Jahre im Business",
    body: "Von TV-Studios in Köln über Festival-Bühnen bis ins eigene Studio in Hannover.",
  },
  {
    kind: "industries",
    industries: "Nightlife · Gastronomie · Handwerk · Musik",
    label: "Branchen, in denen wir liefern",
    body: "Für Restaurants, Handwerk, Influencer und Musik-Acts — von 0 auf signifikant.",
  },
  {
    kind: "static",
    value: 0,
    pad: 2,
    label: "Fokus. Kein Konzern.",
    body: "Ein Team, das dich beim Vornamen kennt. Du schreibst Basti — Basti antwortet.",
  },
];

function About() {
  return (
    <section id="about" className="relative z-[1] px-6 md:px-10 py-32 md:py-44">
      <div className="max-w-6xl mx-auto mb-12">
        <h2 className="font-black leading-[0.85]" style={{ fontSize: "clamp(2.5rem, 7vw, 7rem)", letterSpacing: "-0.05em" }}>
          <SplitReveal text="KSE / GROUP" />
        </h2>
        <div className="mt-6 text-[11px] uppercase tracking-[0.4em]" style={{ color: "#e8ff00" }}>
          Hannover · Independent · Seit 2021
        </div>
        <div className="mt-6 h-px w-full" style={{ background: "#e8ff00" }} />
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-20 mb-24">
        <p
          className="font-black tracking-tight"
          style={{ fontSize: "clamp(1.75rem, 5vw, 3.75rem)", lineHeight: 1.05, letterSpacing: "-0.04em" }}
        >
          Wir bauen Marken, an denen man nicht vorbeiscrollen kann.
        </p>
        <p className="text-foreground/85 text-base md:text-lg leading-relaxed self-center">
          KSE ist kein Dienstleister, der Abgabetermine erfüllt. Wir sind das Team, das dafür sorgt, dass dein Name fällt, wenn du nicht im Raum bist. Strategie, Design, Content, Performance — aus einer Hand, ohne Agentur-Theater. Wir nehmen wenige Kunden im Jahr. Dafür liefern wir Arbeit, die Wettbewerber nervös macht.
        </p>
      </div>

      <div className="max-w-6xl mx-auto grid gap-px bg-foreground/15 border border-foreground/15">
        {STATS.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 60 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-15%" }}
            transition={{ duration: 0.9, ease: EASE, delay: i * 0.12 }}
            className="grid grid-cols-1 md:grid-cols-[0.9fr_1.1fr] gap-8 md:gap-16 px-6 md:px-12 py-12 md:py-16"
            style={{ background: "rgba(8,8,16,0.78)", backdropFilter: "blur(8px)" }}
          >
            <div>
              {s.kind === "industries" ? (
                <div
                  className="font-black"
                  style={{ fontSize: "clamp(1.75rem, 4.5vw, 4rem)", letterSpacing: "-0.04em", lineHeight: 0.95 }}
                >
                  {s.industries}
                </div>
              ) : (
                <div
                  className="font-black"
                  style={{ fontSize: "clamp(4rem, 12vw, 11rem)", letterSpacing: "-0.06em", lineHeight: 0.85 }}
                >
                  {s.kind === "static" ? (
                    <span>
                      {s.pad ? String(s.value).padStart(s.pad, "0") : String(s.value)}
                      {s.suffix ?? ""}
                    </span>
                  ) : (
                    <CountUp to={s.value} pad={s.pad ?? 0} suffix={s.suffix ?? ""} />
                  )}
                </div>
              )}
              <div className="mt-3 text-[11px] uppercase tracking-[0.4em] text-foreground/50">{s.label}</div>
            </div>
            <p className="text-foreground/80 text-base md:text-xl leading-relaxed self-center max-w-xl">{s.body}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

/* ───────────── LEISTUNGEN LINK + CONTACT (sec 5) ───────────── */

function Contact() {
  return (
    <section id="contact" className="relative z-[1] px-6 md:px-10 py-32 md:py-44 overflow-hidden">
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

        <a href="mailto:info@ksegroup.eu" className="block group">
          <span
            className="font-black block leading-[0.9] transition-colors group-hover:[color:var(--accent)]"
            style={{ fontSize: "clamp(1.5rem, 8vw, 8rem)", letterSpacing: "-0.05em", wordBreak: "break-word" }}
          >
            info@ksegroup.eu
          </span>
          <span
            className="block mt-3 h-[3px] w-0 group-hover:w-full transition-[width] duration-700 ease-[cubic-bezier(.77,0,.175,1)]"
            style={{ background: "#e8ff00" }}
          />
        </a>

        <div className="mt-12 flex flex-wrap gap-x-6 gap-y-3 md:gap-8 text-[10px] md:text-[11px] uppercase tracking-[0.4em] text-foreground/55">
          <span>Hannover · DE</span>
          <span>—</span>
          <a href="https://instagram.com/ksegroup" className="hover:text-[color:var(--accent)] transition-colors">Instagram</a>
          <span>—</span>
          <a href="https://ksegroup.eu" className="hover:text-[color:var(--accent)] transition-colors">ksegroup.eu</a>
          <span>—</span>
          <Link to="/leistungen" className="hover:text-[color:var(--accent)] transition-colors">Leistungen ↗</Link>
        </div>

        <div className="mt-16 flex flex-col md:flex-row gap-4">
          <a
            href="mailto:info@ksegroup.eu"
            className="inline-flex items-center justify-center gap-3 border border-foreground/40 px-8 py-5 text-[11px] uppercase tracking-[0.4em] font-medium hover:bg-[color:var(--accent)] hover:text-[color:var(--accent-foreground)] hover:border-[color:var(--accent)] transition-colors"
          >
            Projekt starten →
          </a>
          <a
            href="https://instagram.com/ksegroup"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-3 border border-foreground/40 px-8 py-5 text-[11px] uppercase tracking-[0.4em] font-medium hover:bg-[color:var(--accent)] hover:text-[color:var(--accent-foreground)] hover:border-[color:var(--accent)] transition-colors"
          >
            Auf Instagram →
          </a>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="relative z-[1] border-t border-foreground/15 px-6 md:px-10 py-8 flex flex-col md:flex-row items-center justify-between gap-3 text-[10px] uppercase tracking-[0.4em] text-foreground/45">
      <span>© 2026 KSE Group</span>
      <span>Fang niemals an aufzuhören.</span>
      <span>Built in Hannover · DE</span>
    </footer>
  );
}

/* ───────────── PAGE ───────────── */

function Index() {
  const { scrollYProgress } = useScroll();

  return (
    <main className="relative text-foreground" style={{ background: "transparent" }}>
      <CinemaStage progress={scrollYProgress} />
      <ScrollProgress progress={scrollYProgress} />
      <Header />
      <Hero progress={scrollYProgress} />
      <Manifest />
      <Services />
      <About />
      <Contact />
      <Footer />
    </main>
  );
}