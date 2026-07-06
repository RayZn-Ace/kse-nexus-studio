import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "KSE GROUP — Software, AI & Digital Brands aus Hannover" },
      {
        name: "description",
        content:
          "KSE GROUP baut Software, AI-Automationen, High-End Websites und Marketing-Systeme. Full-Service Tech- & Kreativ-Agentur aus Hannover.",
      },
      { property: "og:title", content: "KSE GROUP — Software, AI & Digital Brands" },
      {
        property: "og:description",
        content:
          "Wenn es automatisiert, optimiert oder digitalisiert werden kann — wir bauen es. Software, AI, Web, Marketing, Branding.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

/* ─────────────────────────  Primitives  ───────────────────────── */

function Tile({
  className = "",
  children,
  as: As = "div",
  hover = false,
  ...rest
}: {
  className?: string;
  children: React.ReactNode;
  as?: "div" | "a" | "button" | "section";
  hover?: boolean;
  [k: string]: unknown;
}) {
  const cls = `brutal-tile ${hover ? "brutal-tile-hover" : ""} ${className}`;
  // Runtime-typed spread — TanStack Start's TS-strict build tolerates this
  // narrowly typed passthrough on primitive HTML elements.
  const Comp = As as unknown as React.ElementType;
  return (
    <Comp className={cls} {...rest}>
      {children}
    </Comp>
  );
}

function Label({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={`block font-bold uppercase text-[10px] tracking-[0.28em] ${className}`}
      style={{ fontFamily: "var(--font-sans)" }}
    >
      {children}
    </span>
  );
}

function CountUp({ target, duration = 1400 }: { target: number; duration?: number }) {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-15% 0px" });
  const [value, setValue] = useState(reduced ? target : 0);
  useEffect(() => {
    if (reduced) return;
    if (!inView) return;
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(Math.round(target * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, target, duration, reduced]);
  return <span ref={ref}>{value}</span>;
}

/* ─────────────────────────  Nav  ───────────────────────── */

function Nav() {
  return (
    <header className="sticky top-0 z-50 bg-white border-b-4 border-[#0a0a0a]">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
        <a href="#top" className="flex min-w-0 items-center gap-3">
          <span className="grid place-items-center h-9 w-9 shrink-0 border-2 border-[#0a0a0a] bg-[#ff5722] text-white font-black" style={{ fontFamily: "var(--font-display)" }}>K</span>
          <span
            className="truncate font-black tracking-tighter uppercase text-lg md:text-xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            KSE GROUP
          </span>
        </a>
        <a
          href="#kontakt"
          className="shrink-0 inline-flex items-center gap-2 border-2 border-[#0a0a0a] bg-[#0a0a0a] text-white px-4 py-2 text-[11px] uppercase tracking-[0.2em] font-bold hover:bg-[#ff5722] hover:border-[#ff5722] transition-colors"
        >
          Projekt starten →
        </a>
      </div>
    </header>
  );
}

/* ─────────────────────────  Bento Hero  ───────────────────────── */

function BentoHero() {
  return (
    <section id="top" className="px-4 md:px-8 py-8 md:py-12">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-4 auto-rows-auto">
        {/* HERO CLAIM */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }}
          className="md:col-span-8 md:row-span-2 brutal-tile p-8 md:p-10 flex flex-col justify-between min-h-[420px] md:min-h-[520px]"
        >
          <div className="flex items-center justify-between">
            <Label className="text-[#0a0a0a]/60">/ Hannover · New Media</Label>
            <Label className="text-[#0a0a0a]/60">Est. 2021</Label>
          </div>
          <h1
            className="mt-8 text-5xl md:text-7xl lg:text-[6.5rem] font-black leading-[0.88] tracking-tighter uppercase"
            style={{ fontFamily: "var(--font-display)" }}
          >
            KSE GROUP —<br />
            <span className="bg-[#ffeb3b] px-2 box-decoration-clone">Ihre Experten</span>
            <br />
            für <span className="text-[#ff5722]">New Media</span>
            <span className="inline-block w-3 md:w-4 h-[0.9em] align-[-0.05em] ml-2 bg-[#0a0a0a] animate-pulse" aria-hidden />
          </h1>
          <div className="mt-8 flex items-center gap-4">
            <div className="h-4 w-4 bg-[#ff5722] shrink-0" />
            <p className="text-base md:text-xl font-medium tracking-tight max-w-xl">
              Social · Web · Werbefilm · Branding. Full-Service Agency, kompromisslos umgesetzt.
            </p>
          </div>
        </motion.div>

        {/* AVAILABILITY */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.05 }}
          className="md:col-span-4 brutal-tile brutal-tile-hover p-6 flex flex-col justify-between"
          style={{ background: "#ff5722" }}
        >
          <div className="flex items-center gap-2">
            <span className="relative inline-block h-3 w-3">
              <span className="absolute inset-0 rounded-full bg-white" />
              <span className="absolute inset-0 rounded-full bg-white animate-ping" />
            </span>
            <span className="text-[10px] font-bold uppercase tracking-[0.28em] text-white">
              Status
            </span>
          </div>
          <div className="mt-4">
            <h3
              className="text-2xl md:text-3xl font-black text-white leading-none uppercase"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Jetzt<br />verfügbar
            </h3>
            <p className="text-sm mt-3 font-medium text-white/90">
              24h-Antwort-Versprechen. Erstgespräch kostenlos & unverbindlich.
            </p>
          </div>
        </motion.div>

        {/* PRIMARY CTA */}
        <motion.a
          href="#kontakt"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="md:col-span-4 brutal-tile brutal-tile-hover brutal-tile-press p-6 flex items-center justify-between group cursor-pointer shadow-signal"
          style={{ background: "#0a0a0a" }}
        >
          <span
            className="text-xl md:text-2xl font-black text-white uppercase leading-none"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Projekt<br />starten
          </span>
          <svg
            className="w-10 h-10 text-[#ff5722] group-hover:translate-x-2 transition-transform shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="square"
              strokeLinejoin="miter"
              strokeWidth="3"
              d="M17 8l4 4m0 0l-4 4m4-4H3"
            />
          </svg>
        </motion.a>
      </div>
    </section>
  );
}

/* ─────────────────────────  Marquee  ───────────────────────── */

function Marquee() {
  const reduced = useReducedMotion();
  const items = [
    "Social Media",
    "★",
    "Web & Tech",
    "★",
    "Werbefilm",
    "★",
    "Branding",
    "★",
    "Performance",
    "★",
    "Content",
    "★",
    "Strategie",
    "★",
  ];
  const doubled = [...items, ...items];
  return (
    <div className="border-y-4 border-[#0a0a0a] bg-[#ffeb3b] overflow-hidden">
      <div
        className={reduced ? "flex gap-12 py-4 px-4" : "marquee py-4"}
        style={{ fontFamily: "var(--font-display)" }}
      >
        {doubled.map((t, i) => (
          <span
            key={i}
            className="text-2xl md:text-4xl font-black uppercase tracking-tight text-[#0a0a0a] shrink-0"
          >
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────  Bento Middle (Services + Stats + Testimonial)  ───────────────────────── */

const SERVICES = [
  { title: "Social Media", body: "Kanäle, denen Menschen folgen wollen — nicht müssen." },
  { title: "Web & Tech", body: "Sites, die in 3 Sekunden alles sagen: wer, was, warum." },
  { title: "Werbefilm", body: "Bilder, die zeigen statt erklären. Cinematic, präzise." },
  { title: "Branding", body: "Identitäten von Grund auf — visuell, sprachlich, strategisch." },
];

function BentoMiddle() {
  return (
    <section id="leistungen" className="px-4 md:px-8 py-8 md:py-12">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-4 auto-rows-auto">
        {/* SERVICES */}
        <Tile className="md:col-span-6 p-8 md:p-10">
          <Label className="opacity-40">/ 01 — Expertise</Label>
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
            {SERVICES.map((s) => (
              <div key={s.title} className="group">
                <div
                  className="text-2xl md:text-3xl font-black uppercase border-b-2 border-[#0a0a0a] pb-2 group-hover:text-[#ff5722] transition-colors"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {s.title}
                </div>
                <p className="text-sm mt-3 text-[#0a0a0a]/70 leading-relaxed">{s.body}</p>
              </div>
            ))}
          </div>
        </Tile>

        {/* STATS BIG */}
        <Tile
          className="md:col-span-3 p-6 flex flex-col justify-end"
          hover
          {...{ style: { background: "#ffeb3b" } }}
        >
          <Label className="opacity-60">/ 02 — Projekte</Label>
          <div
            className="text-6xl md:text-7xl font-black leading-none mt-4"
            style={{ fontFamily: "var(--font-display)" }}
          >
            <CountUp target={50} />+
          </div>
          <div className="text-sm font-bold uppercase mt-2">Erfolgreich umgesetzt</div>
        </Tile>

        {/* TESTIMONIAL */}
        <Tile className="md:col-span-3 p-6 flex flex-col justify-between">
          <Label className="opacity-40">/ 03 — Stimme</Label>
          <div>
            <p className="text-sm leading-relaxed italic mb-4">
              „KSE hat unsere Erwartungen nicht erfüllt — sie hat sie neu definiert."
            </p>
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#ff5722]">
              — Name, Position (Platzhalter)
            </span>
          </div>
        </Tile>
      </div>
    </section>
  );
}

/* ─────────────────────────  Stats Row  ───────────────────────── */

const STATS = [
  { value: 50, suffix: "+", label: "Projekte umgesetzt", bg: "#ffffff", fg: "#0a0a0a" },
  { value: 5, suffix: "", label: "Jahre am Markt", bg: "#ff5722", fg: "#ffffff" },
  { value: 12, suffix: " Mio.+", label: "Erzielte Reichweite", bg: "#0a0a0a", fg: "#ffeb3b" },
  { value: 100, suffix: "%", label: "Inhabergeführt", bg: "#ffeb3b", fg: "#0a0a0a" },
];

function StatsRow() {
  return (
    <section id="zahlen" className="px-4 md:px-8 pb-8 md:pb-12">
      <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
        {STATS.map((s) => (
          <Tile
            key={s.label}
            className="p-6 md:p-8 flex flex-col justify-end min-h-[180px] md:min-h-[220px]"
            hover
            {...{ style: { background: s.bg, color: s.fg } }}
          >
            <div
              className="text-5xl md:text-6xl font-black leading-none"
              style={{ fontFamily: "var(--font-display)" }}
            >
              <CountUp target={s.value} />
              <span>{s.suffix}</span>
            </div>
            <div className="text-[11px] font-bold uppercase mt-3 tracking-widest">{s.label}</div>
          </Tile>
        ))}
      </div>
    </section>
  );
}

/* ─────────────────────────  Process  ───────────────────────── */

const STEPS = [
  {
    n: "01",
    title: "Erstgespräch",
    body: "Unverbindlich, 30 Minuten. Wir hören zu und sagen ehrlich, ob und wie wir helfen können.",
  },
  {
    n: "02",
    title: "Konzept & Fahrplan",
    body: "Klarer Plan mit Timeline und Festpreis — keine versteckten Kosten, keine Überraschungen.",
  },
  {
    n: "03",
    title: "Umsetzung & Betreuung",
    body: "Wir liefern, messen und optimieren. Du wirst nie im Unklaren gelassen.",
  },
];

function ProcessSection() {
  return (
    <section id="ablauf" className="px-4 md:px-8 pb-8 md:pb-12">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-4">
        <Tile className="md:col-span-9 p-8 md:p-12">
          <Label className="opacity-40">/ 04 — Der Ablauf</Label>
          <h2
            className="mt-6 text-4xl md:text-6xl font-black leading-[0.9] tracking-tighter uppercase max-w-3xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Von Anfrage bis Ergebnis.
          </h2>
          <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {STEPS.map((s) => (
              <div key={s.n} className="border-t-4 border-[#0a0a0a] pt-4">
                <div
                  className="text-5xl font-black text-[#ff5722] leading-none"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {s.n}
                </div>
                <h4
                  className="mt-3 font-black uppercase text-lg"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {s.title}
                </h4>
                <p className="text-sm text-[#0a0a0a]/70 leading-relaxed mt-2">{s.body}</p>
              </div>
            ))}
          </div>
        </Tile>

        <Tile
          className="md:col-span-3 p-8 flex flex-col justify-between"
          hover
          {...{ style: { background: "#0a0a0a" } }}
        >
          <div>
            <Label className="text-[#ffeb3b]">/ Versprechen</Label>
            <h3
              className="mt-6 text-3xl md:text-4xl font-black leading-[0.95] uppercase text-white"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Antwort in <span className="text-[#ff5722]">24h</span>.
            </h3>
          </div>
          <p className="text-sm mt-6 text-white/70">
            Kein Warteschleifen-Theater. Kein Agentur-Blabla. Direkt zum Punkt.
          </p>
        </Tile>
      </div>
    </section>
  );
}

/* ─────────────────────────  Contact  ───────────────────────── */

function ContactSection() {
  return (
    <section id="kontakt" className="px-4 md:px-8 pb-8 md:pb-16">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-4">
        <Tile
          className="md:col-span-8 p-8 md:p-12"
          {...{ style: { background: "#ff5722" } }}
        >
          <Label className="text-white/80">/ 05 — Kontakt</Label>
          <h2
            className="mt-6 text-5xl md:text-7xl lg:text-8xl font-black text-white leading-[0.88] tracking-tighter uppercase"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Lass uns<br />reden.
          </h2>
          <div className="mt-10 flex flex-wrap gap-3 items-center">
            <a
              href="mailto:info@ksegroup.eu"
              className="inline-flex items-center gap-3 bg-white border-2 border-[#0a0a0a] px-6 py-4 text-sm uppercase tracking-[0.2em] font-black hover:bg-[#ffeb3b] transition-colors"
              style={{ fontFamily: "var(--font-display)" }}
            >
              info@ksegroup.eu →
            </a>
            <a
              href="https://instagram.com/ksegroup.eu"
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex items-center gap-3 border-2 border-white text-white px-6 py-4 text-sm uppercase tracking-[0.2em] font-black hover:bg-white hover:text-[#ff5722] transition-colors"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Instagram ↗
            </a>
          </div>
          <p className="mt-6 text-sm text-white/90">
            Antwort innerhalb von 24 Stunden · Erstgespräch kostenlos & unverbindlich.
          </p>
        </Tile>

        <Tile className="md:col-span-4 p-8 flex flex-col justify-between">
          <div>
            <Label className="opacity-40">/ Standort</Label>
            <h3
              className="mt-6 text-3xl md:text-4xl font-black leading-none uppercase"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Hannover<br />Deutschland
            </h3>
          </div>
          <div className="mt-8 space-y-2 text-sm">
            <div className="flex justify-between border-b border-[#0a0a0a]/20 pb-2">
              <span className="font-bold uppercase text-[11px] tracking-widest">E-Mail</span>
              <a href="mailto:info@ksegroup.eu" className="hover:text-[#ff5722]">info@ksegroup.eu</a>
            </div>
            <div className="flex justify-between border-b border-[#0a0a0a]/20 pb-2">
              <span className="font-bold uppercase text-[11px] tracking-widest">Instagram</span>
              <a href="https://instagram.com/ksegroup.eu" target="_blank" rel="noreferrer noopener" className="hover:text-[#ff5722]">@ksegroup.eu</a>
            </div>
            <div className="flex justify-between">
              <span className="font-bold uppercase text-[11px] tracking-widest">Web</span>
              <span>ksegroup.eu</span>
            </div>
          </div>
        </Tile>
      </div>
    </section>
  );
}

/* ─────────────────────────  Footer  ───────────────────────── */

function Footer() {
  const [time, setTime] = useState<string | null>(null);
  useEffect(() => {
    const fmt = () =>
      new Intl.DateTimeFormat("de-DE", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Europe/Berlin",
      }).format(new Date());
    setTime(fmt());
    const id = setInterval(() => setTime(fmt()), 30000);
    return () => clearInterval(id);
  }, []);
  return (
    <footer className="border-t-4 border-[#0a0a0a] bg-[#0a0a0a] text-white">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-10 grid grid-cols-2 md:grid-cols-4 gap-6 text-[11px] uppercase tracking-[0.2em] font-bold">
        <span>© 2026 KSE Group</span>
        <span>Ihre Experten für New Media</span>
        <span>Hannover · Deutschland</span>
        <span className="text-[#ffeb3b]">{time ? `${time} Uhr` : "\u00A0"}</span>
      </div>
    </footer>
  );
}

/* ─────────────────────────  Page  ───────────────────────── */

function Index() {
  return (
    <div className="min-h-screen bg-white text-[#0a0a0a]">
      <Nav />
      <main>
        <BentoHero />
        <Marquee />
        <BentoMiddle />
        <StatsRow />
        <ProcessSection />
        <ContactSection />
      </main>
      <Footer />
    </div>
  );
}