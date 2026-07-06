import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  useInView,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";
import softwareVideo from "@/assets/service-software.mp4.asset.json";
import aiVideo from "@/assets/service-ai.mp4.asset.json";
import webVideo from "@/assets/service-web.mp4.asset.json";
import marketingVideo from "@/assets/service-marketing.mp4.asset.json";
import { TrustBar } from "@/components/site/TrustBar";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "KSE GROUP — Ihre Experten für New Media" },
      {
        name: "description",
        content:
          "KSE GROUP baut Software, AI-Automationen, High-End Websites und Marketing-Systeme. Full-Service Tech- & Kreativ-Agentur aus Hannover.",
      },
      { property: "og:title", content: "KSE GROUP — Ihre Experten für New Media" },
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
  const reduced = useReducedMotion();
  const ref = useRef<HTMLElement | null>(null);

  // Normalized cursor position over the tile (-0.5 .. 0.5)
  const px = useMotionValue(0);
  const py = useMotionValue(0);

  const springCfg = { stiffness: 200, damping: 18, mass: 0.5 };
  const rotateX = useSpring(useTransform(py, [-0.5, 0.5], [7, -7]), springCfg);
  const rotateY = useSpring(useTransform(px, [-0.5, 0.5], [-7, 7]), springCfg);
  const translateZ = useSpring(0, springCfg);

  const handleMove = (e: React.MouseEvent<HTMLElement>) => {
    if (reduced || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    px.set((e.clientX - rect.left) / rect.width - 0.5);
    py.set((e.clientY - rect.top) / rect.height - 0.5);
    translateZ.set(12);
  };
  const handleLeave = () => {
    px.set(0);
    py.set(0);
    translateZ.set(0);
  };

  const MotionComp = (motion as unknown as Record<string, React.ElementType>)[As];

  return (
    <MotionComp
      ref={ref}
      className={cls}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      style={{
        rotateX,
        rotateY,
        translateZ,
        transformPerspective: 900,
        transformStyle: "preserve-3d",
      }}
      {...rest}
    >
      {children}
    </MotionComp>
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
        <div className="shrink-0 flex items-center gap-2">
          <Link
            to="/konfigurator"
            className="hidden sm:inline-flex items-center gap-2 border-2 border-[#0a0a0a] bg-[#ffeb3b] text-[#0a0a0a] px-4 py-2 text-[11px] uppercase tracking-[0.2em] font-bold hover:bg-[#0a0a0a] hover:text-white transition-colors"
          >
            Konfigurator
          </Link>
          <a
            href="#kontakt"
            className="inline-flex items-center gap-2 border-2 border-[#0a0a0a] bg-[#0a0a0a] text-white px-4 py-2 text-[11px] uppercase tracking-[0.2em] font-bold hover:bg-[#ff5722] hover:border-[#ff5722] transition-colors"
          >
            Projekt starten →
          </a>
        </div>
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
        <div className="md:col-span-8 md:row-span-2 brutal-tile p-8 md:p-10 flex flex-col justify-between min-h-[420px] md:min-h-[520px]">
          <div className="flex items-center justify-between">
            <Label className="text-[#0a0a0a]/60">/ Hannover · New Media</Label>
            <Label className="text-[#0a0a0a]/60">Est. 2021</Label>
          </div>
          <h1
            className="mt-8 text-5xl md:text-7xl lg:text-[6.5rem] font-black leading-[1.02] tracking-tighter uppercase"
            style={{ fontFamily: "var(--font-display)" }}
          >
            <span className="block">KSE GROUP</span>
            <span className="block mt-3 md:mt-4">
              <span className="bg-[#ffeb3b] px-3 py-1 box-decoration-clone leading-[1.15]">
                Ihre Experten
              </span>
            </span>
            <span className="block mt-3 md:mt-4">
              für <span className="text-[#ff5722]">New Media</span>
              <span className="inline-block w-3 md:w-4 h-[0.8em] align-[-0.05em] ml-2 bg-[#0a0a0a] animate-pulse" aria-hidden />
            </span>
          </h1>
          <div className="mt-8 flex items-center gap-4">
            <div className="h-4 w-4 bg-[#ff5722] shrink-0" />
            <p className="text-base md:text-xl font-medium tracking-tight max-w-xl">
              Wenn es automatisiert, optimiert oder digitalisiert werden kann — wir bauen es.
            </p>
          </div>
        </div>

        {/* AVAILABILITY */}
        <div
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
        </div>

        {/* PRIMARY CTA */}
        <a
          href="#kontakt"
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
        </a>
      </div>
    </section>
  );
}

/* ─────────────────────────  Marquee  ───────────────────────── */

function Marquee() {
  const reduced = useReducedMotion();
  const items = [
    "Software Development",
    "★",
    "AI & Automation",
    "★",
    "Web & Apps",
    "★",
    "Marketing",
    "★",
    "Branding",
    "★",
    "Film & Content",
    "★",
    "Events & Ticketing",
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
  {
    key: "software",
    title: "Software Development",
    body:
      "Web-Apps, SaaS-Plattformen, Mobile Apps, CRM, Dashboards, Booking- & Ticketing-Systeme. React, Next.js, TypeScript, Supabase.",
  },
  {
    key: "ai",
    title: "AI & Automation",
    body:
      "WhatsApp-CRM, Chatbots, Marketing- & Lead-Automation, interne AI-Assistenten. OpenAI, Claude, Meta- & TikTok-APIs.",
  },
  {
    key: "web",
    title: "Web & UX",
    body:
      "High-End Sites mit Motion, Typografie und Conversion-Fokus. Kein Template. Jede Site custom gebaut.",
  },
  {
    key: "marketing",
    title: "Marketing & Brand",
    body:
      "Content, Paid Ads (Meta, TikTok, Snap), Performance, Branding, Film & Content-Produktion — aus einer Hand.",
  },
] as const;

type ServiceKey = (typeof SERVICES)[number]["key"];

const SERVICE_DETAILS: Record<
  ServiceKey,
  {
    label: string;
    title: string;
    video: string;
    pitch: string;
    bullets: string[];
    stack: string[];
    accent: string;
  }
> = {
  software: {
    label: "/ 01 — Software Development",
    title: "Wir bauen die Software, die dein Business skaliert.",
    video: softwareVideo.url,
    pitch:
      "Keine Templates. Kein Baukasten. Custom-Software, die exakt zu deinem Prozess passt — schnell, sauber, skalierbar.",
    bullets: [
      "SaaS, Web-Apps & Mobile Apps",
      "CRM, Dashboards & interne Tools",
      "Booking- & Ticketing-Systeme",
      "Festpreis, klare Timeline, kein Blabla",
    ],
    stack: ["React", "Next.js", "TypeScript", "Supabase", "TanStack"],
    accent: "#ff5722",
  },
  ai: {
    label: "/ 02 — AI & Automation",
    title: "Automatisiere alles. Skaliere ohne mehr Personal.",
    video: aiVideo.url,
    pitch:
      "Wir bauen AI-Systeme, die für dich verkaufen, antworten und arbeiten — 24/7, ohne Kaffeepause.",
    bullets: [
      "WhatsApp-CRM & Chatbots die verkaufen",
      "Marketing- & Lead-Automation",
      "Interne AI-Assistenten fürs Team",
      "Meta, TikTok & Instagram APIs",
    ],
    stack: ["OpenAI", "Claude", "n8n", "Zapier", "Meta API"],
    accent: "#ffeb3b",
  },
  web: {
    label: "/ 03 — Web & UX",
    title: "Deine Website ist dein bester Verkäufer.",
    video: webVideo.url,
    pitch:
      "High-End Sites mit Motion, Typografie und Conversion-Fokus. Sites, bei denen Kunden hängenbleiben — nicht wegklicken.",
    bullets: [
      "Custom Design — kein Template",
      "Motion, Typografie & Micro-Interactions",
      "Conversion-optimiert & SEO-ready",
      "Blitzschnell auf jedem Gerät",
    ],
    stack: ["React", "Framer Motion", "Tailwind", "Vite", "GSAP"],
    accent: "#ff5722",
  },
  marketing: {
    label: "/ 04 — Marketing & Brand",
    title: "Wir machen deine Marke unübersehbar.",
    video: marketingVideo.url,
    pitch:
      "Content, Ads, Branding, Film — aus einer Hand. Wir bauen Marken, die Leute lieben und Algorithmen belohnen.",
    bullets: [
      "Paid Ads: Meta, TikTok, Snap",
      "Content- & Film-Produktion",
      "Branding, Corporate Design, Logo",
      "Performance & Growth-Strategie",
    ],
    stack: ["Meta Ads", "TikTok", "Adobe", "DaVinci", "Figma"],
    accent: "#ffeb3b",
  },
};

function ServiceModal({
  serviceKey,
  onClose,
}: {
  serviceKey: ServiceKey | null;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!serviceKey) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [serviceKey, onClose]);

  return (
    <AnimatePresence>
      {serviceKey && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-[#0a0a0a]/85 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Modal card */}
          <motion.div
            className="relative w-full max-w-6xl max-h-[92vh] overflow-y-auto bg-white border-4 border-[#0a0a0a] shadow-signal"
            initial={{ y: 40, opacity: 0, scale: 0.97 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 40, opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.35, ease: [0.2, 0.8, 0.2, 1] }}
            onClick={(e) => e.stopPropagation()}
          >
            {(() => {
              const d = SERVICE_DETAILS[serviceKey];
              return (
                <div className="grid grid-cols-1 md:grid-cols-2">
                  {/* VIDEO */}
                  <div className="relative bg-[#0a0a0a] aspect-video md:aspect-auto md:min-h-[500px] overflow-hidden">
                    <video
                      key={d.video}
                      src={d.video}
                      autoPlay
                      muted
                      loop
                      playsInline
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                    <div className="absolute top-4 left-4">
                      <span
                        className="inline-block px-3 py-1.5 border-2 border-white text-white text-[10px] font-bold uppercase tracking-[0.28em]"
                        style={{ fontFamily: "var(--font-sans)" }}
                      >
                        {d.label}
                      </span>
                    </div>
                  </div>

                  {/* CONTENT */}
                  <div className="p-8 md:p-10 flex flex-col justify-between gap-8">
                    <div>
                      <h2
                        className="text-3xl md:text-5xl font-black uppercase leading-[0.95] tracking-tighter"
                        style={{ fontFamily: "var(--font-display)" }}
                      >
                        {d.title}
                      </h2>
                      <p className="mt-5 text-base md:text-lg font-medium text-[#0a0a0a]/80 leading-relaxed">
                        {d.pitch}
                      </p>

                      <ul className="mt-6 space-y-3">
                        {d.bullets.map((b, i) => (
                          <motion.li
                            key={b}
                            initial={{ opacity: 0, x: -12 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.25 + i * 0.06 }}
                            className="flex items-start gap-3 text-sm md:text-base font-medium"
                          >
                            <span
                              className="mt-1.5 h-3 w-3 shrink-0 border-2 border-[#0a0a0a]"
                              style={{ background: d.accent }}
                            />
                            <span>{b}</span>
                          </motion.li>
                        ))}
                      </ul>

                      <div className="mt-6 flex flex-wrap gap-2">
                        {d.stack.map((s) => (
                          <span
                            key={s}
                            className="text-[10px] font-bold uppercase tracking-widest border-2 border-[#0a0a0a] px-2 py-1"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                      <a
                        href="#kontakt"
                        onClick={onClose}
                        className="flex-1 inline-flex items-center justify-center gap-2 bg-[#0a0a0a] text-white border-2 border-[#0a0a0a] px-6 py-4 text-sm uppercase tracking-[0.2em] font-black hover:bg-[#ff5722] hover:border-[#ff5722] transition-colors"
                        style={{ fontFamily: "var(--font-display)" }}
                      >
                        Jetzt anfragen →
                      </a>
                      <button
                        onClick={onClose}
                        className="inline-flex items-center justify-center gap-2 border-2 border-[#0a0a0a] px-6 py-4 text-sm uppercase tracking-[0.2em] font-black hover:bg-[#ffeb3b] transition-colors"
                        style={{ fontFamily: "var(--font-display)" }}
                      >
                        Schließen
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Close X */}
            <button
              onClick={onClose}
              aria-label="Schließen"
              className="absolute top-3 right-3 grid place-items-center h-10 w-10 bg-white border-2 border-[#0a0a0a] hover:bg-[#ff5722] hover:text-white transition-colors font-black"
            >
              ✕
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function BentoMiddle() {
  const [openService, setOpenService] = useState<ServiceKey | null>(null);
  return (
    <section id="leistungen" className="px-4 md:px-8 py-8 md:py-12">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-4 auto-rows-auto">
        {/* SERVICES */}
        <Tile className="md:col-span-8 md:row-span-2 p-8 md:p-10">
          <Label className="opacity-40">/ 01 — Expertise</Label>
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
            {SERVICES.map((s) => (
              <button
                key={s.title}
                onClick={() => setOpenService(s.key)}
                className="group text-left cursor-pointer"
              >
                <div
                  className="flex items-center justify-between text-2xl md:text-3xl font-black uppercase border-b-2 border-[#0a0a0a] pb-2 group-hover:text-[#ff5722] transition-colors"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  <span>{s.title}</span>
                  <span className="text-[#ff5722] opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all text-2xl shrink-0 ml-2">
                    ▶
                  </span>
                </div>
                <p className="text-sm mt-3 text-[#0a0a0a]/70 leading-relaxed">{s.body}</p>
                <span className="mt-3 inline-block text-[10px] font-bold uppercase tracking-widest text-[#ff5722] opacity-70 group-hover:opacity-100 transition-opacity">
                  Mehr erfahren →
                </span>
              </button>
            ))}
          </div>
        </Tile>

        {/* STATS BIG */}
        <Tile
          className="md:col-span-4 p-6 flex flex-col justify-end min-h-[260px]"
          hover
          {...{ style: { background: "#ffeb3b" } }}
        >
          <Label className="opacity-60">/ 02 — Mission</Label>
          <div
            className="text-7xl md:text-8xl font-black leading-none mt-4 flex items-baseline gap-3"
            style={{ fontFamily: "var(--font-display)" }}
          >
            <CountUp target={1} />
            <span className="text-2xl md:text-3xl">Ziel</span>
          </div>
          <div className="text-sm font-bold uppercase mt-3 leading-tight">
            Dich messbar besser machen. Punkt.
          </div>
        </Tile>

        {/* TESTIMONIAL */}
        <Tile className="md:col-span-4 p-6 flex flex-col gap-4 min-h-[260px]">
          <Label className="opacity-40">/ 03 — Stimme</Label>
          <p className="text-base leading-relaxed italic font-medium">
            „KSE hat unsere Erwartungen nicht erfüllt — sie hat sie neu definiert."
          </p>
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#ff5722] mt-auto">
            — Name, Position (Platzhalter)
          </span>
        </Tile>
      </div>
      <ServiceModal serviceKey={openService} onClose={() => setOpenService(null)} />
    </section>
  );
}

/* ─────────────────────────  Stats Row  ───────────────────────── */

const STATS = [
  { value: 49, suffix: "+", label: "Projekte ausgeliefert", bg: "#ffffff", fg: "#0a0a0a" },
  { value: 30, suffix: "+", label: "Automatisierte Prozesse", bg: "#ff5722", fg: "#ffffff" },
  { value: 50, suffix: " Mio.+", label: "Erzielte Reichweite", bg: "#0a0a0a", fg: "#ffeb3b" },
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
    when: "Tag 0",
    title: "Erstgespräch",
    body:
      "Unverbindlich, 30 Minuten. Wir hören zu, stellen die richtigen Fragen — und sagen ehrlich, ob und wie wir helfen können.",
  },
  {
    n: "02",
    when: "Tag 1–3",
    title: "Konzept & Angebot",
    body:
      "Klarer Fahrplan mit Scope, Stack, Milestones und Festpreis. Keine versteckten Kosten, keine Überraschungen — schwarz auf weiß.",
  },
  {
    n: "03",
    when: "Woche 1–2",
    title: "Design & Architektur",
    body:
      "UI, UX, Datenmodell, Automatisierungs-Flows. Du siehst nach wenigen Tagen erste klickbare Prototypen, kein monatelanges Warten.",
  },
  {
    n: "04",
    when: "Woche 2–6",
    title: "Build & Ship",
    body:
      "Wir bauen in wöchentlichen Sprints. Du bekommst Zugriff, siehst live Fortschritt, gibst Feedback — wir launchen sauber & getestet.",
  },
  {
    n: "05",
    when: "Ab Launch",
    title: "Scale & Betrieb",
    body:
      "Monitoring, Updates, neue Features, Automatisierungen. Wir bleiben dein Tech-Partner — langfristig, nicht nach Rechnung weg.",
  },
];

function ProcessSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start 75%", "end 60%"],
  });
  const smooth = useSpring(scrollYProgress, { stiffness: 120, damping: 24, mass: 0.4 });
  const lineHeight = useTransform(smooth, [0, 1], ["0%", "100%"]);

  return (
    <section id="ablauf" className="px-4 md:px-8 pb-8 md:pb-12">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-4">
        <Tile className="md:col-span-9 p-6 md:p-12">
          <Label className="opacity-40">/ 04 — Der Ablauf</Label>
          <h2
            className="mt-6 text-4xl md:text-6xl font-black leading-[0.9] tracking-tighter uppercase max-w-3xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Von Anfrage bis Ergebnis.
          </h2>
          <p className="mt-4 text-sm md:text-base text-[#0a0a0a]/70 max-w-2xl">
            5 Schritte. Kein Agentur-Ping-Pong, keine 6-Monats-Konzeptphasen. Du weißt jederzeit, wo dein Projekt steht.
          </p>

          <div ref={sectionRef} className="relative mt-10 md:mt-14 pl-10 md:pl-14">
            {/* Static rail */}
            <div className="absolute left-3 md:left-5 top-2 bottom-2 w-[3px] bg-[#0a0a0a]/10" aria-hidden />
            {/* Progress fill */}
            <motion.div
              aria-hidden
              className="absolute left-3 md:left-5 top-2 w-[3px] bg-[#ff5722] origin-top"
              style={{ height: lineHeight }}
            />

            <ol className="space-y-10 md:space-y-14">
              {STEPS.map((s, i) => {
                const point = i / (STEPS.length - 1);
                return <TimelineStep key={s.n} step={s} progress={smooth} point={point} />;
              })}
            </ol>
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
            <p className="text-sm mt-4 text-white/60 leading-relaxed">
              Kein Warteschleifen-Theater. Kein Agentur-Blabla. Direkt zum Punkt.
            </p>
          </div>

          {/* Live status */}
          <div className="mt-8 border-2 border-white/15 p-4">
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-white/60 font-bold">
              <span className="inline-block h-2 w-2 rounded-full bg-[#22c55e] animate-pulse" />
              Live
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span
                className="text-4xl font-black text-white"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Ø 1h 47m
              </span>
            </div>
            <p className="text-[11px] text-white/50 mt-1">Antwortzeit letzte 30 Tage</p>
          </div>

          {/* Channels */}
          <div className="mt-6 space-y-2">
            {[
              { label: "WhatsApp", value: "+49 157 5797 1457", href: "https://wa.me/4915757971457" },
              { label: "E-Mail", value: "hi@ksegroup.eu", href: "mailto:hi@ksegroup.eu" },
              { label: "Konfigurator", value: "In 60s starten", href: "/konfigurator" },
            ].map((c) => (
              <a
                key={c.label}
                href={c.href}
                className="group flex items-center justify-between border-t border-white/10 pt-2 text-white hover:text-[#ffeb3b] transition-colors"
              >
                <span className="text-[10px] uppercase tracking-[0.2em] text-white/50 font-bold">
                  {c.label}
                </span>
                <span className="text-xs font-bold flex items-center gap-1">
                  {c.value}
                  <span className="opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all">→</span>
                </span>
              </a>
            ))}
          </div>

          {/* Guarantees */}
          <ul className="mt-6 pt-6 border-t border-white/10 space-y-2 text-[11px] text-white/60">
            {[
              "Erstgespräch kostenlos & unverbindlich",
              "Fixpreis nach Discovery — keine Überraschungen",
              "Wöchentliches Update, direkter Draht zum Team",
            ].map((g) => (
              <li key={g} className="flex gap-2">
                <span className="text-[#ff5722] font-black">+</span>
                <span>{g}</span>
              </li>
            ))}
          </ul>
        </Tile>
      </div>
    </section>
  );
}

function TimelineStep({
  step,
  progress,
  point,
}: {
  step: { n: string; when: string; title: string; body: string };
  progress: ReturnType<typeof useSpring>;
  point: number;
}) {
  const [active, setActive] = useState(false);
  useEffect(() => {
    const unsub = progress.on("change", (v) => setActive(v >= point - 0.02));
    return () => unsub();
  }, [progress, point]);

  return (
    <li className="relative">
      {/* Marker */}
      <div
        className={`absolute -left-10 md:-left-14 top-1 grid place-items-center h-7 w-7 md:h-9 md:w-9 border-2 border-[#0a0a0a] transition-colors duration-300 ${
          active ? "bg-[#ff5722] text-white" : "bg-white text-[#0a0a0a]"
        }`}
        style={{ fontFamily: "var(--font-display)" }}
        aria-hidden
      >
        <span className="text-[11px] md:text-xs font-black">{step.n}</span>
      </div>

      <div className="flex flex-col md:flex-row md:items-baseline md:gap-4">
        <span
          className={`inline-block border-2 border-[#0a0a0a] px-2 py-[2px] text-[10px] font-bold uppercase tracking-[0.2em] transition-colors ${
            active ? "bg-[#ffeb3b] text-[#0a0a0a]" : "bg-white text-[#0a0a0a]/60"
          }`}
        >
          {step.when}
        </span>
        <h4
          className="mt-2 md:mt-0 font-black uppercase text-xl md:text-2xl tracking-tight"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {step.title}
        </h4>
      </div>
      <p className="mt-3 text-sm md:text-base text-[#0a0a0a]/70 leading-relaxed max-w-2xl">
        {step.body}
      </p>
    </li>
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
        <span>Software · AI · Digital Brands</span>
        <span>Hannover · Deutschland</span>
        <span className="text-[#ffeb3b]">{time ? `${time} Uhr` : "\u00A0"}</span>
      </div>
      <div className="max-w-7xl mx-auto px-4 md:px-8 pb-8 flex flex-wrap gap-x-6 gap-y-2 text-[11px] uppercase tracking-[0.2em] font-bold text-white/60">
        <Link to="/impressum" className="hover:text-[#ffeb3b] transition-colors">Impressum</Link>
        <Link to="/datenschutz" className="hover:text-[#ffeb3b] transition-colors">Datenschutz</Link>
      </div>
    </footer>
  );
}

/* ─────────────────────────  Page  ───────────────────────── */

/* ─────────────────────────  Scroll Heroes (animated, section-anchored)  ───────────────────────── */

function ComicWebSlinger() {
  return (
    <svg className="comic-hero comic-web-slinger" viewBox="0 0 120 220" aria-hidden="true">
      <line className="web-line" x1="60" y1="0" x2="60" y2="92" />
      <g className="web-slinger-body">
        <path className="hero-ink" d="M39 98c5-18 35-18 42 0l8 35c4 20-14 38-30 38s-33-18-28-38z" />
        <path className="hero-red" d="M43 100c6-12 28-13 34 0l6 29c3 14-10 27-24 27s-27-13-24-27z" />
        <path className="hero-blue" d="M38 134c9 11 35 11 44 0 3 15-9 27-23 27s-25-12-21-27z" />
        <ellipse className="hero-ink" cx="60" cy="82" rx="24" ry="23" />
        <path className="hero-red" d="M39 83c0-14 9-24 21-24s21 10 21 24c0 12-9 22-21 22s-21-10-21-22z" />
        <path className="hero-eye" d="M47 78l11 4-10 6c-5-2-5-7-1-10zM73 78l-11 4 10 6c5-2 5-7 1-10z" />
        <g className="web-arm-left">
          <path className="hero-ink" d="M42 105c-19 4-28 19-30 36" />
          <path className="hero-red stroke-red" d="M42 105c-17 5-25 19-27 34" />
        </g>
        <g className="web-arm-right">
          <path className="hero-ink" d="M78 105c15-13 23-30 25-52" />
          <path className="hero-red stroke-red" d="M78 105c14-12 21-29 23-50" />
        </g>
        <g className="web-leg-left">
          <path className="hero-ink" d="M49 156c-13 17-22 26-35 32" />
          <path className="hero-blue stroke-blue" d="M50 155c-12 15-21 24-33 30" />
        </g>
        <g className="web-leg-right">
          <path className="hero-ink" d="M70 155c12 14 23 22 39 24" />
          <path className="hero-blue stroke-blue" d="M70 155c12 13 22 20 36 22" />
        </g>
      </g>
    </svg>
  );
}

function CornerSpiderman() {
  const reduced = useReducedMotion();
  if (reduced) return null;
  return (
    <div
      className="absolute right-[4vw] md:right-[3vw] z-[60] w-[58px] md:w-[90px] lg:w-[110px] pointer-events-none select-none top-[80px] md:top-[100px] lg:top-[115px]"
      aria-hidden="true"
      style={{ transformOrigin: "top center" }}
    >
      <motion.div
        style={{ transformOrigin: "top center" }}
        animate={{ rotate: [-6, 6, -6] }}
        transition={{ duration: 4.2, repeat: Infinity, ease: "easeInOut" }}
      >
        <ComicWebSlinger />
      </motion.div>
    </div>
  );
}

function Index() {
  return (
    <div className="min-h-screen bg-white text-[#0a0a0a] overflow-x-hidden relative">
      <TrustBar />
      <Nav />
      <CornerSpiderman />
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