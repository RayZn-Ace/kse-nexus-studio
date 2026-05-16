import { createFileRoute } from "@tanstack/react-router";
import { motion, useScroll, useTransform, useSpring, type Variants, type MotionValue } from "framer-motion";
import { useRef } from "react";
import {
  Instagram, Mail, ArrowUpRight, Sparkles, Code2, Film, Rocket,
  Users, MessageSquare, Brain, Palette, ShieldAlert,
} from "lucide-react";
import heroSky from "@/assets/hero-sky.jpg";
import cloud1 from "@/assets/cloud-1.png";
import smoke from "@/assets/smoke.png";
import lifestyle1 from "@/assets/lifestyle-1.jpg";
import lifestyle2 from "@/assets/lifestyle-2.jpg";
import lifestyle3 from "@/assets/lifestyle-3.jpg";
import svcSocial from "@/assets/service-social.jpg";
import svcWeb from "@/assets/service-web.jpg";
import svcFilm from "@/assets/service-film.jpg";
import svcBoost from "@/assets/service-boost.jpg";
import ctaBg from "@/assets/cta-bg.jpg";

export const Route = createFileRoute("/")({ component: Index });

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 60 },
  show: { opacity: 1, y: 0, transition: { duration: 0.9, ease: [0.22, 1, 0.36, 1] as const } },
};

/* ───────────────────────── HEADER ───────────────────────── */
function Header() {
  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
      className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[min(1100px,calc(100%-1.5rem))]"
    >
      <div className="backdrop-blur-xl bg-black/30 border border-white/10 rounded-full px-5 py-2.5 flex items-center justify-between shadow-2xl">
        <a href="#top" className="font-display font-bold text-base tracking-tight text-white">
          KSE<span className="text-accent">.</span>
        </a>
        <nav className="hidden md:flex items-center gap-7 text-[13px] text-white/70">
          <a href="#why" className="hover:text-white transition-colors">Why KSE</a>
          <a href="#services" className="hover:text-white transition-colors">Services</a>
          <a href="#founder" className="hover:text-white transition-colors">Founder</a>
          <a href="#testimonials" className="hover:text-white transition-colors">Stimmen</a>
        </nav>
        <a href="#contact" className="group inline-flex items-center gap-1.5 bg-white text-black rounded-full px-4 py-1.5 text-[13px] font-semibold hover:scale-105 transition-transform">
          Kontakt <ArrowUpRight className="w-3.5 h-3.5 group-hover:rotate-45 transition-transform" />
        </a>
      </div>
    </motion.header>
  );
}

/* ───────────────────────── HERO (parallax sky + clouds reveal) ───────────────────────── */
function Hero() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const smooth = useSpring(scrollYProgress, { stiffness: 120, damping: 25, mass: 0.4 });

  const skyY = useTransform(smooth, [0, 1], ["0%", "30%"]);
  const skyScale = useTransform(smooth, [0, 1], [1.1, 1.3]);
  const cloudLeftX = useTransform(smooth, [0, 1], ["0%", "-60%"]);
  const cloudRightX = useTransform(smooth, [0, 1], ["0%", "60%"]);
  const cloudTopY = useTransform(smooth, [0, 1], ["0%", "-50%"]);
  const titleScale = useTransform(smooth, [0, 0.5], [1, 1.6]);
  const titleY = useTransform(smooth, [0, 1], ["0%", "-30%"]);
  const titleOpacity = useTransform(smooth, [0, 0.55], [1, 0]);

  const words = ["Fang", "Niemals", "An", "Aufzuhören."];

  return (
    <section ref={ref} id="top" className="relative h-[140vh]">
      {/* fixed-feel sky */}
      <div className="sticky top-0 h-screen overflow-hidden">
        <motion.img
          src={heroSky}
          alt=""
          width={1920}
          height={1280}
          style={{ y: skyY, scale: skyScale }}
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* darken */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black" />

        {/* big headline behind clouds */}
        <motion.div
          style={{ scale: titleScale, y: titleY, opacity: titleOpacity }}
          className="absolute inset-0 flex flex-col items-center justify-center px-4 text-center"
        >
          <motion.p
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="text-white/80 tracking-[0.4em] uppercase text-[10px] md:text-xs mb-6 font-medium"
          >
            ✦ KSE Group — New Media · Marketing · Magic ✦
          </motion.p>
          <h1 className="font-display font-bold text-white leading-[0.95] tracking-[-0.04em] text-[18vw] md:text-[14vw] lg:text-[11rem]">
            {words.map((w, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, y: 120, filter: "blur(20px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{ delay: 0.3 + i * 0.15, duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
                className="inline-block mr-[0.15em]"
                style={{
                  color: i === words.length - 1 ? "transparent" : "white",
                  WebkitTextStroke: i === words.length - 1 ? "2px white" : undefined,
                }}
              >
                {w}
              </motion.span>
            ))}
          </h1>
          <motion.p
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.3, duration: 1 }}
            className="text-white/85 max-w-xl mx-auto mt-6 text-sm md:text-base font-light"
          >
            Wir bauen Marken, die Menschen <span className="italic">fühlen</span>. Social, Web, Film — alles aus einer Hand.
          </motion.p>
          <motion.a
            href="#why"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.5, duration: 0.8 }}
            className="mt-8 inline-flex items-center gap-2 bg-white text-black px-7 py-3.5 rounded-full text-sm font-semibold hover:scale-105 transition-transform"
          >
            Reise starten <ArrowUpRight className="w-4 h-4" />
          </motion.a>
        </motion.div>

        {/* drifting clouds in front of text */}
        <motion.img src={cloud1} alt="" width={1600} height={896} style={{ x: cloudLeftX }} className="absolute -left-32 top-[20%] w-[70%] max-w-[900px] pointer-events-none select-none opacity-90" />
        <motion.img src={cloud1} alt="" width={1600} height={896} style={{ x: cloudRightX }} className="absolute -right-40 bottom-[10%] w-[80%] max-w-[1100px] pointer-events-none select-none opacity-95 scale-x-[-1]" />
        <motion.img src={cloud1} alt="" width={1600} height={896} style={{ y: cloudTopY }} className="absolute left-1/4 -top-20 w-[55%] max-w-[800px] pointer-events-none select-none opacity-70" />
        <img src={smoke} alt="" width={1600} height={896} className="absolute inset-0 w-full h-full object-cover mix-blend-screen opacity-60 pointer-events-none" />
      </div>
    </section>
  );
}

/* ───────────────────────── SCROLL PROGRESS BAR ───────────────────────── */
function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 140, damping: 30, mass: 0.3 });
  return (
    <motion.div
      style={{ scaleX }}
      className="fixed top-0 left-0 right-0 h-[2px] origin-left z-[60] bg-gradient-to-r from-accent via-primary to-accent"
    />
  );
}

/* ───────────────────────── WHY KSE (word reveal) ───────────────────────── */
function RevealWord({ progress, range, children }: { progress: MotionValue<number>; range: [number, number]; children: string }) {
  const opacity = useTransform(progress, range, [0.15, 1]);
  return <motion.span style={{ opacity }} className="inline-block mr-[0.25em]">{children}</motion.span>;
}

const WHY_TEXT =
  "Dein Brand verändert sich. Bau nicht nur eine Präsenz — bau das, was als Nächstes kommt. Wir helfen dir, mit Klarheit, Mut und dem richtigen Team an deiner Seite, einfach vorwärts zu gehen.";
const WHY_WORDS = WHY_TEXT.split(" ");

/* ───────────────────────── MANIFESTO (mission-control / terminal HUD) ───────────────────────── */
function RevealChar({ progress, range, children }: { progress: MotionValue<number>; range: [number, number]; children: string }) {
  const opacity = useTransform(progress, range, [0.05, 1]);
  const y = useTransform(progress, range, [40, 0]);
  const blur = useTransform(progress, range, ["12px", "0px"]);
  return (
    <motion.span style={{ opacity, y, filter: blur }} className="inline-block">
      {children === " " ? "\u00A0" : children}
    </motion.span>
  );
}

function ManifestoLine({ text, progress, from, to }: { text: string; progress: MotionValue<number>; from: number; to: number }) {
  const chars = text.split("");
  return (
    <span className="block">
      {chars.map((c, i) => {
        const span = to - from;
        const start = from + (i / chars.length) * span;
        const end = Math.min(to, start + span * 0.25);
        return <RevealChar key={i} progress={progress} range={[start, end]}>{c}</RevealChar>;
      })}
    </span>
  );
}

function Manifesto() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const smooth = useSpring(scrollYProgress, { stiffness: 120, damping: 28, mass: 0.4 });
  const gridY = useTransform(smooth, [0, 1], ["0%", "-25%"]);
  const tickerX = useTransform(smooth, [0, 1], ["10%", "-40%"]);
  const coordY = useTransform(smooth, [0, 1], [0, -80]);

  // word-by-word reveal driver
  const lineProgress = useTransform(smooth, [0.05, 0.7], [0, 1]);

  return (
    <section
      ref={ref}
      className="relative min-h-[160vh] bg-black overflow-hidden border-y border-white/10"
    >
      {/* telemetry grid */}
      <motion.div
        style={{ y: gridY }}
        aria-hidden
        className="absolute inset-0 opacity-[0.18]"
      >
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(to right, oklch(1 0 0 / 0.25) 1px, transparent 1px), linear-gradient(to bottom, oklch(1 0 0 / 0.15) 1px, transparent 1px)",
            backgroundSize: "80px 80px",
            maskImage: "radial-gradient(ellipse at 50% 40%, black 30%, transparent 80%)",
          }}
        />
      </motion.div>

      {/* radial glow */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse 60% 50% at 50% 30%, oklch(0.62 0.24 255 / 0.25), transparent 70%)" }}
      />

      {/* sticky stage */}
      <div className="sticky top-0 h-screen flex flex-col justify-between py-10 md:py-14 px-5 md:px-10">
        {/* TOP HUD ROW */}
        <div className="flex items-start justify-between font-mono text-[10px] md:text-[11px] tracking-[0.2em] text-white/60 uppercase">
          <motion.div style={{ y: coordY }} className="flex flex-col gap-1">
            <span className="text-accent">● LIVE</span>
            <span>52.3759° N / 9.7320° E</span>
            <span>STATION: KSE-01</span>
          </motion.div>
          <div className="hidden md:flex flex-col items-center gap-1">
            <span className="text-white/40">// transmission 002</span>
            <span>MANIFEST / CHARACTER ENGINE</span>
          </div>
          <motion.div style={{ y: coordY }} className="flex flex-col items-end gap-1">
            <span>T-{new Date().getFullYear()}</span>
            <span className="text-white/40">SIGNAL: STABLE</span>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
              REC
            </span>
          </motion.div>
        </div>

        {/* CENTER STAGE — slogans */}
        <div className="relative flex-1 flex flex-col items-center justify-center text-center">
          {/* small label */}
          <motion.p
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="font-mono text-[10px] md:text-[11px] tracking-[0.5em] text-accent uppercase mb-8 md:mb-12"
          >
            ✦ Mission Statement ✦
          </motion.p>

          {/* slogan 1 */}
          <h2 className="font-display font-semibold leading-[0.92] tracking-[-0.04em] text-white text-[14vw] md:text-[10vw] lg:text-[9rem]">
            <ManifestoLine text="Wir bauen keine" progress={lineProgress} from={0.0} to={0.3} />
            <span className="block italic" style={{ WebkitTextStroke: "1.5px white", color: "transparent" }}>
              <ManifestoLine text="Brands." progress={lineProgress} from={0.25} to={0.45} />
            </span>
          </h2>

          {/* divider w/ telemetry */}
          <div className="my-6 md:my-10 flex items-center gap-3 md:gap-5 font-mono text-[9px] md:text-[11px] text-white/40 tracking-[0.3em]">
            <span>—</span>
            <span>// 01</span>
            <span className="w-16 md:w-32 h-px bg-white/30" />
            <span className="text-accent">CHARACTER.SYS</span>
            <span className="w-16 md:w-32 h-px bg-white/30" />
            <span>// 02</span>
            <span>—</span>
          </div>

          {/* slogan 2 */}
          <h2 className="font-display font-semibold leading-[0.92] tracking-[-0.04em] text-white text-[14vw] md:text-[10vw] lg:text-[9rem]">
            <ManifestoLine text="Wir bauen" progress={lineProgress} from={0.45} to={0.62} />
            <span className="block text-gradient">
              <ManifestoLine text="Charakter." progress={lineProgress} from={0.6} to={0.85} />
            </span>
          </h2>

          {/* secondary line */}
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5, duration: 1 }}
            className="mt-10 md:mt-14 max-w-xl font-mono text-[11px] md:text-sm text-white/55 tracking-wide leading-relaxed"
          >
            &gt;&nbsp; Marken werden vergessen. Charakter bleibt.
            <br />
            &gt;&nbsp; Deshalb arbeiten wir an dem Teil, der nicht kopiert werden kann.
          </motion.p>
        </div>

        {/* BOTTOM HUD — scrolling slogan ticker */}
        <div className="relative border-t border-white/15 pt-4">
          <motion.div
            style={{ x: tickerX }}
            className="flex gap-12 whitespace-nowrap font-mono text-[11px] md:text-xs uppercase tracking-[0.35em] text-white/70"
          >
            {Array.from({ length: 6 }).map((_, i) => (
              <span key={i} className="flex items-center gap-12">
                <span className="text-accent">◆</span>
                <span>Fang niemals an aufzuhören</span>
                <span className="text-white/30">/ /</span>
                <span>Never stop starting</span>
                <span className="text-white/30">/ /</span>
                <span className="text-accent">KSE — CHARACTER ENGINE v.{new Date().getFullYear()}</span>
                <span className="text-white/30">/ /</span>
              </span>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function Why() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.8", "end 0.4"] });
  return (
    <section id="why" ref={ref} className="relative py-40 px-6 bg-background">
      <div className="max-w-5xl mx-auto">
        <motion.p
          variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}
          className="text-accent uppercase tracking-[0.4em] text-[11px] mb-8 font-semibold"
        >
          Warum KSE
        </motion.p>
        <p className="font-display text-3xl md:text-5xl lg:text-6xl leading-[1.15] tracking-tight">
          {WHY_WORDS.map((w, i) => {
            const start = i / WHY_WORDS.length;
            const end = Math.min(1, start + 1.5 / WHY_WORDS.length);
            return <RevealWord key={i} progress={scrollYProgress} range={[start, end]}>{w}</RevealWord>;
          })}
        </p>
      </div>
    </section>
  );
}

/* ───────────────────────── LIFESTYLE (pinned horizontal scroll) ───────────────────────── */
const lifestylePanels = [
  { img: lifestyle1, kicker: "01 — Identität", title: "Marken, die man fühlt." },
  { img: lifestyle2, kicker: "02 — Fortschritt", title: "Bewegung statt Stillstand." },
  { img: lifestyle3, kicker: "03 — Resonanz", title: "Reichweite ist nicht genug." },
];

function Lifestyle() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  // 3 panels → translate the track from 0% to -66.66%
  const x = useTransform(scrollYProgress, [0, 1], ["0%", "-66.666%"]);
  const xSmooth = useSpring(x, { stiffness: 90, damping: 22, mass: 0.5 });

  return (
    <section ref={ref} className="relative h-[320vh] bg-black">
      <div className="sticky top-0 h-screen overflow-hidden">
        {/* heading overlay */}
        <div className="absolute top-0 left-0 right-0 z-20 px-6 md:px-10 pt-24 md:pt-28 pointer-events-none">
          <motion.h2
            initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.9 }}
            className="font-display text-3xl md:text-5xl font-semibold tracking-tight max-w-2xl text-white"
          >
            Hier geht's nicht nur ums <span className="italic text-gradient">Marketing.</span>
          </motion.h2>
          <p className="mt-3 font-mono text-[10px] md:text-xs uppercase tracking-[0.4em] text-white/50">
            ◆ scroll →
          </p>
        </div>

        {/* horizontal track */}
        <motion.div style={{ x: xSmooth }} className="flex h-full w-[300%]">
          {lifestylePanels.map((p, i) => (
            <div key={i} className="relative w-1/3 h-full shrink-0 px-4 md:px-10 flex items-center">
              <div className="relative w-full h-[78%] rounded-3xl overflow-hidden">
                <img
                  src={p.img}
                  alt={p.title}
                  width={1280}
                  height={1600}
                  loading="lazy"
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-7 md:p-12">
                  <p className="font-mono text-[10px] md:text-xs tracking-[0.3em] uppercase text-accent mb-3">
                    {p.kicker}
                  </p>
                  <h3 className="font-display text-3xl md:text-6xl font-semibold tracking-tight text-white max-w-md leading-[1.05]">
                    {p.title}
                  </h3>
                </div>
                {/* panel index HUD */}
                <div className="absolute top-6 right-6 font-mono text-[10px] md:text-xs tracking-[0.3em] uppercase text-white/60">
                  0{i + 1} / 03
                </div>
              </div>
            </div>
          ))}
        </motion.div>

        {/* progress line */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-[40vw] max-w-md h-px bg-white/20 overflow-hidden">
          <motion.div style={{ scaleX: scrollYProgress }} className="origin-left h-full bg-accent" />
        </div>
      </div>
    </section>
  );
}

/* ───────────────────────── SERVICES (big image cards) ───────────────────────── */
const services = [
  { img: svcSocial, title: "Social Media Marketing", tag: "01 — Social", desc: "Erstellung, Planung, Analyse & Verwaltung. Wir etablieren deine Marke, erreichen deine Zielgruppe und steigern Engagement nachhaltig." , icon: Sparkles },
  { img: svcWeb, title: "Web Development", tag: "02 — Web", desc: "Maßgeschneiderte Websites, perfekt auf Marke und Zielgruppe zugeschnitten — performant, modern, skalierbar.", icon: Code2 },
  { img: svcFilm, title: "Werbefilme", tag: "03 — Film", desc: "Professionelle, fesselnde Werbevideos, die deine Botschaft effektiv vermitteln und dein Publikum bewegen.", icon: Film },
  { img: svcBoost, title: "Web & Social Boost", tag: "04 — Reach", desc: "Gezielte Kampagnen für maximale Reichweite, mehr Traffic und stärkere Online-Sichtbarkeit.", icon: Rocket },
];

function ServiceStackCard({ s, index, total }: { s: typeof services[number]; index: number; total: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  // each card scales down + fades slightly when the next slides over
  const scale = useTransform(scrollYProgress, [0, 1], [1, 0.88]);
  const opacity = useTransform(scrollYProgress, [0, 1], [1, 0.4]);
  const rotate = useTransform(scrollYProgress, [0, 1], [0, -2]);
  const topOffset = `${8 + index * 2}vh`;

  return (
    <div
      ref={ref}
      className="sticky h-screen flex items-center justify-center px-4 md:px-8"
      style={{ top: topOffset }}
    >
      <motion.a
        href="#contact"
        style={{ scale, opacity, rotate }}
        className="group relative w-full max-w-6xl aspect-[16/10] md:aspect-[16/9] rounded-3xl overflow-hidden block shadow-2xl"
      >
        <img
          src={s.img}
          alt={s.title}
          width={1920}
          height={1080}
          loading="lazy"
          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-[1200ms] ease-out"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-black/10" />
        <div className="absolute inset-0 p-8 md:p-14 flex flex-col justify-between">
          <div className="flex items-center justify-between font-mono text-[10px] md:text-xs uppercase tracking-[0.35em] text-white/70">
            <span>{s.tag}</span>
            <span>0{index + 1} / 0{total}</span>
          </div>
          <div className="max-w-2xl">
            <s.icon className="w-7 h-7 md:w-9 md:h-9 text-accent mb-5" />
            <h3 className="font-display text-4xl md:text-7xl font-semibold text-white tracking-tight mb-4 leading-[0.98]">
              {s.title}
            </h3>
            <p className="text-white/80 text-sm md:text-lg max-w-xl mb-6 leading-relaxed">{s.desc}</p>
            <span className="inline-flex items-center gap-2 text-white text-sm font-semibold border-b border-white/40 pb-1">
              Mehr erfahren <ArrowUpRight className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
            </span>
          </div>
        </div>
      </motion.a>
    </div>
  );
}

function Services() {
  return (
    <section id="services" className="relative bg-background">
      {/* intro */}
      <div className="px-6 pt-32 pb-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}>
            <p className="text-accent uppercase tracking-[0.4em] text-[11px] mb-4 font-semibold">Services</p>
            <h2 className="font-display text-4xl md:text-6xl font-semibold tracking-tight leading-[1.05]">
              Wie KSE dich<br /><span className="italic text-gradient">durchstarten</span> lässt.
            </h2>
          </motion.div>
          <p className="text-muted-foreground text-sm md:text-base max-w-sm">
            Vier Disziplinen. Ein Team. Eine Mission: deine Marke zur ersten Wahl machen.
          </p>
        </div>
      </div>

      {/* stacking cards */}
      <div className="relative">
        {services.map((s, i) => (
          <ServiceStackCard key={s.title} s={s} index={i} total={services.length} />
        ))}
      </div>
      {/* spacer so last card has room before next section */}
      <div className="h-[20vh]" />
    </section>
  );
}

/* ───────────────────────── MARQUEE ───────────────────────── */
function Marquee() {
  const items = ["NEW MEDIA", "SOCIAL MEDIA", "MARKETING", "ARTISTS", "WEBDESIGN", "WERBEFILME"];
  return (
    <div className="relative overflow-hidden border-y border-border py-6 bg-background">
      <motion.div
        className="flex gap-12 whitespace-nowrap font-display text-3xl md:text-5xl font-semibold tracking-tight"
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
      >
        {[...items, ...items, ...items].map((t, i) => (
          <span key={i} className="inline-flex items-center gap-12">
            <span className={i % 2 === 0 ? "text-foreground" : "text-foreground/30"} style={i % 3 === 0 ? { WebkitTextStroke: "1.5px white", color: "transparent" } : undefined}>{t}</span>
            <span className="text-accent text-2xl">✦</span>
          </span>
        ))}
      </motion.div>
    </div>
  );
}

/* ───────────────────────── FOUNDER ───────────────────────── */
const skills = [
  { icon: Sparkles, label: "Social Media Marketing" },
  { icon: MessageSquare, label: "Content Management" },
  { icon: Users, label: "Artist Consulting" },
  { icon: Palette, label: "Web Design" },
  { icon: ShieldAlert, label: "Krisenmanagement" },
  { icon: Brain, label: "Strategie & Beratung" },
];

function Founder() {
  return (
    <section id="founder" className="relative py-32 px-6 bg-background">
      <div className="max-w-6xl mx-auto grid md:grid-cols-[0.9fr_1.1fr] gap-12 md:gap-20 items-center">
        <motion.div
          initial={{ opacity: 0, x: -60 }} whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }} transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          className="relative max-w-sm mx-auto md:mx-0"
        >
          <div className="relative aspect-[3/4] rounded-3xl overflow-hidden">
            <img
              src="https://ksegroup.eu/wp-content/uploads/2024/06/meet-me-768x1024.png"
              alt="Kay Engelmann — Founder KSE Group"
              loading="lazy" width={768} height={1024}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
          </div>
          <motion.div
            animate={{ rotate: 360 }} transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
            className="absolute -top-6 -right-6 w-28 h-28 rounded-full border border-accent/50 flex items-center justify-center text-accent text-[10px] tracking-[0.25em]"
          >
            ✦ MEET • THE • FOUNDER •
          </motion.div>
        </motion.div>

        <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}>
          <p className="text-accent uppercase tracking-[0.4em] text-[11px] mb-4 font-semibold">Wer ist das denn?</p>
          <h2 className="font-display text-4xl md:text-6xl font-semibold leading-[1.05] mb-6 tracking-tight">
            Kay <span className="italic text-gradient">Engelmann.</span>
          </h2>
          <p className="text-muted-foreground text-base md:text-lg leading-relaxed mb-8">
            Studierter Medien- und Kommunikationswissenschaftler. Nach Stationen bei verschiedenen Fernsehsendern in Köln machte er sich in Hannover selbstständig.
            Sein Ziel: Musiker, Influencer und Unternehmen dabei zu unterstützen, ihre Reichweite zu vergrößern — und besonders talentierten Newcomern zum Durchbruch zu verhelfen.
          </p>
          <p className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground mb-4">Was er drauf hat</p>
          <div className="grid grid-cols-2 gap-2.5">
            {skills.map((sk, i) => (
              <motion.div
                key={sk.label}
                initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.06 }}
                className="flex items-center gap-2.5 bg-white/5 border border-white/10 rounded-xl px-3.5 py-3"
              >
                <sk.icon className="w-4 h-4 text-accent shrink-0" />
                <span className="text-xs md:text-sm font-medium">{sk.label}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ───────────────────────── TESTIMONIALS ───────────────────────── */
const testimonials = [
  { name: "Alexander Falke", role: "Restaurant 993 Hannover",
    quote: "Selten habe ich ein Team erlebt, das so effizient und kundenorientiert agiert wie KSE. Jedes Problem wird blitzschnell behoben — kreativ, professionell, unverzichtbar." },
  { name: "Marcus Dyck", role: "Büro & System Montagen",
    quote: "Seit KSE an unserer Seite ist, gibt es kein Problem mehr ohne Lösung. Die Webseite spiegelt Professionalität wider, Kay gibt niemals auf — Kundenservice auf höchstem Niveau!" },
  { name: "Sarah M.", role: "Influencer / Hannover",
    quote: "Die Zusammenarbeit ist herausragend. Meine Online-Präsenz wurde komplett transformiert — moderne Designs, smarte Strategien und messbare Ergebnisse." },
];

function Testimonials() {
  return (
    <section id="testimonials" className="py-32 px-6 bg-background">
      <div className="max-w-7xl mx-auto">
        <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }} className="mb-14 text-center">
          <p className="text-accent uppercase tracking-[0.4em] text-[11px] mb-4 font-semibold">Stimmen</p>
          <h2 className="font-display text-4xl md:text-6xl font-semibold tracking-tight">
            Glaub nicht <span className="italic text-gradient">uns.</span>
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-5">
          {testimonials.map((t, i) => (
            <motion.blockquote
              key={i}
              initial={{ opacity: 0, y: 60 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ delay: i * 0.12, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -6 }}
              className="rounded-3xl p-7 md:p-8 bg-white/[0.04] border border-white/10 flex flex-col justify-between"
            >
              <div>
                <div className="text-5xl text-accent/80 leading-none mb-4 font-display">"</div>
                <p className="text-base text-foreground/90 leading-relaxed">{t.quote}</p>
              </div>
              <footer className="mt-8 pt-5 border-t border-white/10">
                <div className="text-sm font-semibold">{t.name}</div>
                <div className="text-xs text-muted-foreground">{t.role}</div>
              </footer>
            </motion.blockquote>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ───────────────────────── CTA ───────────────────────── */
function CTA() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const bgY = useTransform(scrollYProgress, [0, 1], ["-20%", "20%"]);
  const bgScale = useTransform(scrollYProgress, [0, 1], [1.1, 1.3]);

  return (
    <section id="contact" ref={ref} className="relative h-[90vh] overflow-hidden flex items-center justify-center">
      <motion.img
        src={ctaBg}
        alt=""
        width={1920}
        height={1280}
        style={{ y: bgY, scale: bgScale }}
        loading="lazy"
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/40 to-black" />
      <div className="relative z-10 text-center px-6 max-w-4xl">
        <motion.h2
          initial={{ opacity: 0, y: 60 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          className="font-display text-6xl md:text-9xl font-bold leading-[0.9] mb-8 tracking-[-0.04em] text-white"
        >
          Find <span className="italic" style={{ WebkitTextStroke: "2px white", color: "transparent" }}>You.</span><br/>
          We'll help you<br/>get there.
        </motion.h2>
        <motion.p
          variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}
          className="text-white/85 text-base md:text-xl max-w-xl mx-auto mb-10 font-light"
        >
          Entfessle dein Potenzial — werde mit unserer Unterstützung zum nächsten Star.
        </motion.p>
        <motion.a
          href="mailto:info@ksegroup.eu"
          initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}
          className="inline-flex items-center gap-2 bg-white text-black px-8 py-4 rounded-full text-sm md:text-base font-semibold"
        >
          <Mail className="w-4 h-4" />
          info@ksegroup.eu
          <ArrowUpRight className="w-4 h-4" />
        </motion.a>
      </div>
    </section>
  );
}

/* ───────────────────────── FOOTER ───────────────────────── */
function Footer() {
  return (
    <footer className="border-t border-white/10 py-10 px-6 bg-background">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="font-display font-bold text-lg">KSE<span className="text-accent">.</span></div>
        <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} KSE Group. Fang niemals an aufzuhören.</p>
        <div className="flex items-center gap-4 text-muted-foreground">
          <a href="mailto:info@ksegroup.eu" aria-label="Email" className="hover:text-foreground transition-colors"><Mail className="w-4 h-4" /></a>
          <a href="https://instagram.com" aria-label="Instagram" className="hover:text-foreground transition-colors"><Instagram className="w-4 h-4" /></a>
        </div>
      </div>
    </footer>
  );
}

function Index() {
  return (
    <main className="relative bg-background overflow-x-hidden">
      <Header />
      <Hero />
      <Manifesto />
      <Why />
      <Lifestyle />
      <Services />
      <Marquee />
      <Founder />
      <Testimonials />
      <CTA />
      <Footer />
    </main>
  );
}
