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
import { Intro } from "@/components/Intro";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export const Route = createFileRoute("/")({ component: Index });

const EASE = [0.77, 0, 0.175, 1] as const;

/* ───────────── magnetic button ───────────── */

function MagneticButton({
  href, children, external, className, radius = 55, style,
}: {
  href: string;
  children: React.ReactNode;
  external?: boolean;
  className?: string;
  radius?: number;
  style?: React.CSSProperties;
}) {
  const ref = useRef<HTMLAnchorElement>(null);
  const inner = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    const label = inner.current;
    if (!el || !label) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let raf = 0;
    let tx = 0, ty = 0, cx = 0, cy = 0;
    // spring-like damped follow (heavier lerp for return-to-origin)
    const strength = 0.3;
    const labelStrength = 0.6;

    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const midX = r.left + r.width / 2;
      const midY = r.top + r.height / 2;
      // distance from cursor to nearest edge of the button rect
      const hx = Math.max(0, Math.abs(e.clientX - midX) - r.width / 2);
      const hy = Math.max(0, Math.abs(e.clientY - midY) - r.height / 2);
      const dist = Math.hypot(hx, hy);
      if (dist <= radius) {
        tx = (e.clientX - midX) * strength;
        ty = (e.clientY - midY) * strength;
      } else {
        tx = 0;
        ty = 0;
      }
      if (!raf) raf = requestAnimationFrame(loop);
    };
    const onLeave = () => {
      tx = 0; ty = 0;
      if (!raf) raf = requestAnimationFrame(loop);
    };
    const loop = () => {
      // damped spring: soft return, no linear pop-back
      cx += (tx - cx) * 0.09;
      cy += (ty - cy) * 0.09;
      el.style.transform = `translate(${cx.toFixed(2)}px, ${cy.toFixed(2)}px)`;
      label.style.transform = `translate(${(cx * labelStrength).toFixed(2)}px, ${(cy * labelStrength).toFixed(2)}px)`;
      if (
        Math.abs(tx - cx) > 0.05 ||
        Math.abs(ty - cy) > 0.05
      ) {
        raf = requestAnimationFrame(loop);
      } else {
        el.style.transform = `translate(0px, 0px)`;
        label.style.transform = `translate(0px, 0px)`;
        raf = 0;
      }
    };
    window.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);
    return () => {
      window.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [radius]);

  return (
    <a
      ref={ref}
      href={href}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      style={style}
      className={
        className ??
        "inline-flex items-center justify-center gap-3 border border-foreground/40 px-8 py-5 text-[11px] uppercase tracking-[0.4em] font-medium hover:bg-[color:var(--accent)] hover:text-[color:var(--accent-foreground)] hover:border-[color:var(--accent)] transition-colors will-change-transform"
      }
    >
      <span ref={inner} className="inline-block will-change-transform">{children}</span>
    </a>
  );
}

/* ───────────── section fade (seamless transitions) ───────────── */

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const on = () => setReduced(mq.matches);
    mq.addEventListener?.("change", on);
    return () => mq.removeEventListener?.("change", on);
  }, []);
  return reduced;
}

function SectionFade({
  children,
  className,
  id,
  style,
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
  style?: React.CSSProperties;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  // fade in over first 15%, fade out over last 15%
  // seamless outro: hold full opacity, then fade over the last ~15% before
  // handing off to the next section.
  const opacity = useTransform(
    scrollYProgress,
    [0, 0.9, 1],
    reduced ? [1, 1, 1] : [1, 1, 0.05]
  );
  return (
    <motion.div ref={ref} id={id} className={className} style={{ ...style, opacity }}>
      {children}
    </motion.div>
  );
}

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

/* Curved path through the section. viewBox: 100 x 1000, path goes top→bottom
   in a smooth sinusoidal S-curve. Tile anchor points are pre-computed
   percentages down the section so tiles sit alternating left/right of path. */
const PATH_D =
  "M 50 0 C 90 120, 10 240, 50 360 C 90 480, 10 600, 50 720 C 90 840, 10 940, 50 1000";

const TILE_ANCHORS = [
  { top: 12, side: "left" as const },
  { top: 36, side: "right" as const },
  { top: 60, side: "left" as const },
  { top: 84, side: "right" as const },
];

function Services() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const cardsRef = useRef<Array<HTMLElement | null>>([]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    gsap.registerPlugin(ScrollTrigger);

    const section = sectionRef.current;
    const path = pathRef.current;
    if (!section || !path) return;

    const len = path.getTotalLength();
    gsap.set(path, { strokeDasharray: len, strokeDashoffset: len });

    const trig = ScrollTrigger.create({
      trigger: section,
      start: "top top",
      end: "bottom bottom",
      scrub: 0.8,
      onUpdate: (self) => {
        gsap.set(path, { strokeDashoffset: len * (1 - self.progress) });
      },
    });

    const cardTweens = cardsRef.current.map((el, i) => {
      if (!el) return null;
      const side = TILE_ANCHORS[i].side;
      gsap.set(el, {
        opacity: 0,
        scale: 0.85,
        x: side === "left" ? 120 : -120,
      });
      return gsap.to(el, {
        opacity: 1,
        scale: 1,
        x: 0,
        ease: "none",
        scrollTrigger: {
          trigger: el,
          start: "top 85%",
          end: "top 45%",
          scrub: 0.8,
        },
      });
    });

    return () => {
      trig.kill();
      cardTweens.forEach((t) => t?.scrollTrigger?.kill());
      cardTweens.forEach((t) => t?.kill());
    };
  }, []);

  return (
    <section
      id="services"
      ref={sectionRef}
      className="relative z-[1] overflow-hidden"
      style={{ minHeight: "360vh" }}
    >
      <div className="sticky top-0 pt-24 pb-8 px-6 md:px-10 z-10 pointer-events-none">
        <div className="flex justify-between text-[10px] uppercase tracking-[0.4em] text-foreground/50">
          <span>// Leistungen · 04 Disziplinen</span>
          <span>scroll ↓</span>
        </div>
      </div>

      <div className="relative max-w-6xl mx-auto px-6 md:px-10 -mt-16">
        <div className="mb-24 md:mb-40">
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

        {/* Curved path — spans the whole tile grid area */}
        <div className="relative">
          <svg
            aria-hidden
            className="absolute inset-0 w-full h-full pointer-events-none"
            viewBox="0 0 100 1000"
            preserveAspectRatio="none"
          >
            <path
              ref={pathRef}
              d={PATH_D}
              fill="none"
              stroke="#e8ff00"
              strokeWidth="0.4"
              strokeLinecap="round"
              style={{ opacity: 0.2 }}
            />
          </svg>

          {/* Tile grid — 4 tiles stacked, each aligned left or right */}
          <div className="relative" style={{ minHeight: "260vh" }}>
            {SERVICES.map((s, i) => {
              const anchor = TILE_ANCHORS[i];
              return (
                <article
                  key={s.n}
                  ref={(el) => { cardsRef.current[i] = el; }}
                  className={`absolute w-[85%] md:w-[46%] ${
                    anchor.side === "left" ? "left-0" : "right-0"
                  }`}
                  style={{ top: `${anchor.top}%` }}
                >
                  <ServiceTile s={s} />
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

function ServiceTile({ s }: { s: (typeof SERVICES)[number] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const resize = () => {
      const r = canvas.getBoundingClientRect();
      canvas.width = r.width * dpr;
      canvas.height = r.height * dpr;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const N = 5;
    const blobs = Array.from({ length: N }, (_, k) => ({
      x: Math.random(),
      y: Math.random(),
      r: 0.25 + Math.random() * 0.35,
      phase: k * 1.7,
      speed: 0.00008 + Math.random() * 0.00012,
    }));

    let raf = 0;
    const draw = (t: number) => {
      const w = canvas.width, h = canvas.height;
      ctx.clearRect(0, 0, w, h);
      for (const b of blobs) {
        const cx = (b.x + Math.sin(t * b.speed + b.phase) * 0.15) * w;
        const cy = (b.y + Math.cos(t * b.speed * 0.8 + b.phase) * 0.15) * h;
        const rad = b.r * Math.min(w, h);
        const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, rad);
        g.addColorStop(0, "rgba(232,255,0,0.14)");
        g.addColorStop(1, "rgba(232,255,0,0)");
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, []);

  return (
    <div className="relative border border-foreground/10 bg-background/40 p-8 md:p-12 overflow-hidden transition-[transform,filter] duration-500 ease-out hover:scale-[1.02] hover:brightness-125">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />
      <div className="relative">
        <span className="text-[11px] uppercase tracking-[0.4em] text-foreground/45">
          / {s.n}
        </span>
        <h3
          className="font-black mt-6 mb-6"
          style={{ fontSize: "clamp(1.75rem, 3.5vw, 3rem)", letterSpacing: "-0.04em", lineHeight: 0.95 }}
        >
          {s.title.toUpperCase()}
        </h3>
        <p className="text-foreground/70 text-sm md:text-base leading-relaxed max-w-sm">
          {s.body}
        </p>
        <div className="mt-6 text-[10px] uppercase tracking-[0.3em] text-foreground/40">
          {s.tags.join(" · ")}
        </div>
        <div className="mt-8 inline-block">
          <MagneticButton
            href="#contact"
            className="inline-block text-[11px] tracking-[0.35em] uppercase border-b border-transparent hover:border-current will-change-transform"
            style={{ color: "#e8ff00" }}
          >
            Projekt anfragen →
          </MagneticButton>
        </div>
      </div>
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
          <MagneticButton href="mailto:info@ksegroup.eu">Projekt starten →</MagneticButton>
          <MagneticButton href="https://instagram.com/ksegroup" external>Auf Instagram →</MagneticButton>
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
      <Intro />
      <CinemaStage progress={scrollYProgress} />
      <ScrollProgress progress={scrollYProgress} />
      <Header />
      <SectionFade><Hero progress={scrollYProgress} /></SectionFade>
      <SectionFade><Manifest /></SectionFade>
      <SectionFade><Services /></SectionFade>
      <SectionFade><About /></SectionFade>
      <SectionFade><Contact /></SectionFade>
      <Footer />
    </main>
  );
}