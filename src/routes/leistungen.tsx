import { createFileRoute, Link } from "@tanstack/react-router";
import { motion, useScroll, useTransform, useSpring, type MotionValue } from "framer-motion";
import { useRef } from "react";

export const Route = createFileRoute("/leistungen")({
  head: () => ({
    meta: [
      { title: "Leistungen — KSE Group" },
      {
        name: "description",
        content:
          "Unsere vier Disziplinen, ausgepackt: Social Media, Web Design, Werbefilm und Branding. Pakete, Inhalte und Prozesse — Schritt für Schritt.",
      },
      { property: "og:title", content: "Leistungen — KSE Group" },
      {
        property: "og:description",
        content:
          "Unsere vier Disziplinen, ausgepackt: Social Media, Web Design, Werbefilm und Branding. Pakete, Inhalte und Prozesse — Schritt für Schritt.",
      },
    ],
  }),
  component: LeistungenPage,
});

const EASE = [0.77, 0, 0.175, 1] as const;
const ACCENT = "#e8ff00";

type Pkg = {
  n: string;
  title: string;
  kicker: string;
  intro: string;
  items: { label: string; detail: string }[];
  price: string;
};

const PACKAGES: Pkg[] = [
  {
    n: "01",
    title: "Social Media",
    kicker: "Kanäle, denen man folgen will.",
    intro:
      "Wir bauen Auftritte, die nicht laut sind — sondern unverwechselbar. Strategie, Ästhetik und Community in einem Paket.",
    items: [
      { label: "Content-Strategie", detail: "Zielgruppen, Tonalität, Pillars. Schwarz auf weiß." },
      { label: "Shootings & Reels", detail: "Monatlich. Cinematic. On Brand." },
      { label: "Community & Ads", detail: "Antworten, moderieren, Reichweite gezielt skalieren." },
      { label: "Reporting", detail: "Was funktioniert, was nicht — ohne Schönfärben." },
    ],
    price: "ab 2.490 € / Monat",
  },
  {
    n: "02",
    title: "Web Design",
    kicker: "Drei Sekunden, alles gesagt.",
    intro:
      "Websites mit Haltung. Keine Templates, keine Baukästen — nur Seiten, die in der ersten Sekunde wirken.",
    items: [
      { label: "UX & Wireframes", detail: "Struktur vor Schönheit. Klick für Klick durchdacht." },
      { label: "Custom Design", detail: "Typografie, Motion, Identität — aus einem Guss." },
      { label: "Entwicklung", detail: "Schnell, sauber, SEO-ready. Kein Bloat." },
      { label: "Launch & Care", detail: "Hosting, Updates, Iteration nach echtem Feedback." },
    ],
    price: "ab 6.900 € / Projekt",
  },
  {
    n: "03",
    title: "Werbefilm",
    kicker: "Bilder, die hängen bleiben.",
    intro:
      "Vom Konzept bis zum Final Cut. Wir produzieren Filme, die nicht wie Werbung wirken — sondern wie Kino.",
    items: [
      { label: "Konzept & Drehbuch", detail: "Eine Idee, die zur Marke passt. Nicht andersherum." },
      { label: "Produktion", detail: "Crew, Cast, Locations, Equipment — alles aus einer Hand." },
      { label: "Post Production", detail: "Schnitt, Color, Sound, VFX in einer Pipeline." },
      { label: "Distribution", detail: "Cut-Downs für jeden Kanal, vom 9:16 Reel bis zum Spot." },
    ],
    price: "ab 9.500 € / Produktion",
  },
  {
    n: "04",
    title: "Branding",
    kicker: "Charakter, nicht Kostüm.",
    intro:
      "Identitäten von Grund auf — strategisch, visuell und sprachlich. So, dass dein Name für etwas steht.",
    items: [
      { label: "Positionierung", detail: "Was du bist. Was du nicht bist. Und für wen." },
      { label: "Naming & Verbal", detail: "Name, Claim, Tonalität — präzise und besitzbar." },
      { label: "Visual System", detail: "Logo, Farbe, Typo, Bildwelt. Skalierbar." },
      { label: "Brand Guidelines", detail: "Damit alle Kanäle gleich klingen, ohne dich zu fragen." },
    ],
    price: "ab 4.900 € / Projekt",
  },
];

/* ───────────── header (mini, page-scoped) ───────────── */

function PageHeader() {
  return (
    <header className="fixed top-0 left-0 right-0 z-[70] mix-blend-difference">
      <div className="flex items-center justify-between px-6 md:px-10 py-5 text-[11px] tracking-[0.3em] uppercase font-medium">
        <Link to="/" className="link-underline font-black tracking-[-0.04em] text-[15px]">
          KSE / GROUP
        </Link>
        <nav className="hidden md:flex items-center gap-8">
          <Link to="/" hash="manifesto" className="link-underline">Manifest</Link>
          <Link to="/leistungen" className="link-underline" activeProps={{ style: { color: ACCENT } }}>Leistungen</Link>
          <Link to="/" hash="about" className="link-underline">Über</Link>
          <Link to="/" hash="contact" className="link-underline">Kontakt</Link>
        </nav>
        <a href="mailto:info@ksegroup.eu" className="link-underline hidden md:inline">
          info@ksegroup.eu →
        </a>
      </div>
    </header>
  );
}

/* ───────────── intro ───────────── */

function Intro() {
  return (
    <section className="relative min-h-[90vh] flex items-end px-6 md:px-12 pb-20 pt-40 border-b border-foreground/15">
      <div className="max-w-6xl">
        <div className="text-[10px] uppercase tracking-[0.4em] text-foreground/50 mb-8">
          // Leistungen · 04 Pakete · ausgepackt
        </div>
        <h1
          className="font-black leading-[0.85] tracking-tight"
          style={{ fontSize: "clamp(2.6rem, 9vw, 9rem)", letterSpacing: "-0.05em" }}
        >
          <span className="block overflow-hidden">
            <motion.span
              className="inline-block"
              initial={{ y: "110%" }}
              animate={{ y: "0%" }}
              transition={{ duration: 1, ease: EASE }}
            >
              Pakete,
            </motion.span>
          </span>
          <span className="block overflow-hidden">
            <motion.span
              className="inline-block"
              initial={{ y: "110%" }}
              animate={{ y: "0%" }}
              transition={{ duration: 1, ease: EASE, delay: 0.1 }}
              style={{ color: ACCENT }}
            >
              ausgepackt.
            </motion.span>
          </span>
        </h1>
        <p className="mt-10 max-w-xl text-base md:text-lg text-foreground/70 leading-relaxed">
          Scroll dich durch unsere vier Disziplinen. Jedes Paket dreht sich, öffnet sich
          und legt seinen Inhalt vor dir aus — Schritt für Schritt.
        </p>
        <div className="mt-12 flex items-center gap-2 text-[10px] uppercase tracking-[0.4em] text-foreground/50">
          <span className="inline-block w-8 h-px bg-foreground/40" /> scroll down
        </div>
      </div>
    </section>
  );
}

/* ───────────── unbox section ───────────── */

function UnboxSection({ pkg, index }: { pkg: Pkg; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });
  const p = useSpring(scrollYProgress, { stiffness: 80, damping: 24, mass: 0.5 });

  // Phases:
  // 0.00 – 0.18  : box flies in + rotates into view
  // 0.18 – 0.40  : continuous 3D rotation (showcase)
  // 0.40 – 0.58  : lid opens
  // 0.58 – 1.00  : items pop out one by one

  const boxOpacity = useTransform(p, [0, 0.05, 0.95, 1], [0, 1, 1, 1]);
  const boxScale = useTransform(p, [0, 0.18, 0.4, 0.58], [0.6, 1, 1, 0.95]);
  const boxRotY = useTransform(p, [0, 0.18, 0.4], [-60, 25, 25]);
  const boxRotX = useTransform(p, [0, 0.18, 0.4, 0.58], [40, -15, -15, -5]);
  const boxY = useTransform(p, [0, 0.18, 0.58, 1], [120, 0, 0, -40]);

  // Showcase spin between 0.18 → 0.40
  const showcaseSpin = useTransform(p, [0.18, 0.4], [0, 360]);

  // Lid open between 0.40 → 0.58
  const lidRotX = useTransform(p, [0.4, 0.58], [0, -135]);
  const lidLift = useTransform(p, [0.4, 0.58], [0, -30]);

  // Box dims gently as items emerge (never fully gone, stays as backdrop)
  const boxFade = useTransform(p, [0.58, 0.95], [1, 0.18]);

  // Title parallax
  const titleY = useTransform(p, [0, 1], [60, -60]);

  return (
    <section
      ref={ref}
      className="relative border-b border-foreground/15"
      style={{ height: "420vh" }}
    >
      <div
        className="sticky top-0 h-screen w-full overflow-hidden"
        style={{ perspective: "1600px" }}
      >
        {/* faint grid */}
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(232,255,0,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(232,255,0,0.5) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />

        {/* number + title (left) */}
        <motion.div
          style={{ y: titleY }}
          className="absolute left-6 md:left-12 top-1/2 -translate-y-1/2 z-10 max-w-md pointer-events-none"
        >
          <div className="text-[10px] uppercase tracking-[0.4em] text-foreground/50 mb-4">
            // Paket {pkg.n} · {String(index + 1).padStart(2, "0")} von 04
          </div>
          <h2
            className="font-black leading-[0.85] tracking-tight"
            style={{ fontSize: "clamp(2rem, 5.5vw, 5rem)", letterSpacing: "-0.04em" }}
          >
            {pkg.title}
          </h2>
          <p className="mt-5 text-base md:text-lg text-foreground/70 max-w-sm">
            {pkg.kicker}
          </p>
          <p className="mt-4 text-sm text-foreground/55 max-w-sm leading-relaxed">
            {pkg.intro}
          </p>
          <div
            className="mt-6 text-[11px] uppercase tracking-[0.35em]"
            style={{ color: ACCENT }}
          >
            {pkg.price}
          </div>
        </motion.div>

        {/* 3D BOX (right) */}
        <div className="absolute inset-0 flex items-center justify-end pr-[6vw] md:pr-[10vw] pointer-events-none">
          <motion.div
            style={{
              opacity: boxOpacity,
              transformStyle: "preserve-3d",
              y: boxY,
              scale: boxScale,
            }}
            className="relative"
          >
            <motion.div
              style={{
                transformStyle: "preserve-3d",
                rotateY: boxRotY,
                rotateX: boxRotX,
              }}
            >
              <motion.div
                style={{
                  transformStyle: "preserve-3d",
                  rotateY: showcaseSpin,
                  opacity: boxFade,
                }}
              >
                <Box3D pkg={pkg} lidRotX={lidRotX} lidLift={lidLift} />
              </motion.div>
            </motion.div>
          </motion.div>
        </div>

        {/* UNPACKED ITEMS */}
        <div className="absolute inset-0 flex items-center justify-end pr-[6vw] md:pr-[10vw] pointer-events-none">
          <div className="w-[min(560px,46vw)] flex flex-col gap-3">
            {pkg.items.map((it, i) => (
              <UnpackedItem
                key={it.label}
                item={it}
                i={i}
                total={pkg.items.length}
                progress={p}
              />
            ))}
          </div>
        </div>

        {/* progress dots */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2">
          {[0, 1, 2, 3].map((d) => (
            <span
              key={d}
              className="block w-1.5 h-1.5 rounded-full"
              style={{
                background:
                  d === index ? ACCENT : "rgba(255,255,255,0.2)",
              }}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function UnpackedItem({
  item,
  i,
  total,
  progress,
}: {
  item: { label: string; detail: string };
  i: number;
  total: number;
  progress: MotionValue<number>;
}) {
  // Items emerge continuously between 0.55 and 1.0 with HEAVY overlap so the
  // motion reads as a smooth flow, not 4 separate pops.
  const windowStart = 0.55;
  const windowEnd = 1.0;
  const stride = (windowEnd - windowStart) / (total + 1.2); // smaller stride → more overlap
  const start = windowStart + i * stride;
  const dur = stride * 2.6; // each item animates over a long range (overlapping siblings)
  const end = Math.min(start + dur, windowEnd);
  const mid = start + (end - start) * 0.55;

  // Start state: deep inside the box (right side of screen, below center, tiny, tilted back)
  // End state: settled in its slot (0,0,1,0)
  const rawOpacity = useTransform(progress, [start, start + (end - start) * 0.25, end], [0, 1, 1]);
  const rawX = useTransform(progress, [start, end], [180, 0]);
  const rawY = useTransform(progress, [start, mid, end], [-220 + i * 8, -40, 0]);
  const rawScale = useTransform(progress, [start, mid, end], [0.35, 0.92, 1]);
  const rawRotX = useTransform(progress, [start, end], [-65, 0]);
  const rawRotY = useTransform(progress, [start, end], [25, 0]);
  const rawBlur = useTransform(progress, [start, mid], [6, 0]);

  // Per-item spring smoothing so any scroll jitter is absorbed.
  const spring = { stiffness: 70, damping: 22, mass: 0.6 };
  const opacity = useSpring(rawOpacity, spring);
  const x = useSpring(rawX, spring);
  const y = useSpring(rawY, spring);
  const scale = useSpring(rawScale, spring);
  const rotateX = useSpring(rawRotX, spring);
  const rotateY = useSpring(rawRotY, spring);
  const filter = useTransform(rawBlur, (b) => `blur(${b}px)`);

  return (
    <motion.div
      style={{
        opacity,
        x,
        y,
        scale,
        rotateX,
        rotateY,
        filter,
        transformPerspective: 1200,
        transformOrigin: "100% 0%",
        background: "rgba(10,10,10,0.82)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        borderLeft: `2px solid ${ACCENT}`,
        willChange: "transform, opacity",
      }}
      className="px-5 py-4 border border-foreground/15"
    >
      <div className="flex items-baseline gap-3">
        <span
          className="text-[10px] uppercase tracking-[0.35em]"
          style={{ color: ACCENT }}
        >
          {String(i + 1).padStart(2, "0")}
        </span>
        <h3 className="font-semibold text-base md:text-lg tracking-tight">
          {item.label}
        </h3>
      </div>
      <p className="mt-1.5 text-sm text-foreground/65 leading-relaxed">
        {item.detail}
      </p>
    </motion.div>
  );
}

/* ───────────── 3D box primitive ───────────── */

function Box3D({
  pkg,
  lidRotX,
  lidLift,
}: {
  pkg: Pkg;
  lidRotX: MotionValue<number>;
  lidLift: MotionValue<number>;
}) {
  const W = 280; // width
  const H = 200; // height (depth of opening)
  const D = 220; // depth

  const baseFace =
    "absolute inset-0 flex items-center justify-center text-foreground border";
  const faceStyle: React.CSSProperties = {
    background:
      "linear-gradient(135deg, rgba(20,20,20,0.95), rgba(8,8,8,0.95))",
    borderColor: "rgba(232,255,0,0.25)",
  };

  return (
    <div
      style={{
        width: W,
        height: H,
        transformStyle: "preserve-3d",
        position: "relative",
      }}
    >
      {/* FRONT */}
      <div
        className={baseFace}
        style={{
          ...faceStyle,
          width: W,
          height: H,
          transform: `translateZ(${D / 2}px)`,
        }}
      >
        <BoxFaceContent pkg={pkg} variant="front" />
      </div>
      {/* BACK */}
      <div
        className={baseFace}
        style={{
          ...faceStyle,
          width: W,
          height: H,
          transform: `rotateY(180deg) translateZ(${D / 2}px)`,
        }}
      >
        <BoxFaceContent pkg={pkg} variant="back" />
      </div>
      {/* LEFT */}
      <div
        className={baseFace}
        style={{
          ...faceStyle,
          width: D,
          height: H,
          left: (W - D) / 2,
          transform: `rotateY(-90deg) translateZ(${W / 2}px)`,
        }}
      >
        <BoxFaceContent pkg={pkg} variant="side" />
      </div>
      {/* RIGHT */}
      <div
        className={baseFace}
        style={{
          ...faceStyle,
          width: D,
          height: H,
          left: (W - D) / 2,
          transform: `rotateY(90deg) translateZ(${W / 2}px)`,
        }}
      >
        <BoxFaceContent pkg={pkg} variant="side" />
      </div>
      {/* BOTTOM */}
      <div
        className={baseFace}
        style={{
          ...faceStyle,
          width: W,
          height: D,
          top: (H - D) / 2,
          transform: `rotateX(-90deg) translateZ(${H / 2}px)`,
        }}
      />
      {/* INSIDE (visible when lid open) */}
      <div
        className="absolute"
        style={{
          width: W,
          height: D,
          top: (H - D) / 2,
          transform: `rotateX(-90deg) translateZ(${H / 2 - 2}px)`,
          background:
            "radial-gradient(ellipse at center, rgba(232,255,0,0.18), rgba(0,0,0,0.9) 70%)",
          border: "1px solid rgba(232,255,0,0.3)",
        }}
      />

      {/* LID — hinged at the back-top edge */}
      <motion.div
        style={{
          position: "absolute",
          width: W,
          height: D,
          top: -D / 2 + H / 2,
          transformOrigin: `50% 0% 0`,
          transform: `translateZ(${H / 2}px)`,
          rotateX: lidRotX,
          y: lidLift,
          transformStyle: "preserve-3d",
        }}
      >
        {/* lid outer */}
        <div
          className="absolute inset-0 border flex items-center justify-center"
          style={{
            background:
              "linear-gradient(135deg, rgba(28,28,28,0.98), rgba(12,12,12,0.98))",
            borderColor: "rgba(232,255,0,0.35)",
          }}
        >
          <span
            className="text-[10px] uppercase tracking-[0.4em]"
            style={{ color: ACCENT }}
          >
            KSE · {pkg.n}
          </span>
        </div>
        {/* lid inner (only visible when open) */}
        <div
          className="absolute inset-0 border flex items-center justify-center"
          style={{
            transform: "rotateX(180deg) translateZ(1px)",
            background:
              "linear-gradient(135deg, rgba(8,8,8,0.98), rgba(20,20,20,0.98))",
            borderColor: "rgba(232,255,0,0.2)",
          }}
        >
          <span className="text-[10px] uppercase tracking-[0.35em] text-foreground/40">
            {pkg.title}
          </span>
        </div>
      </motion.div>
    </div>
  );
}

function BoxFaceContent({
  pkg,
  variant,
}: {
  pkg: Pkg;
  variant: "front" | "back" | "side";
}) {
  if (variant === "side") {
    return (
      <div className="text-[10px] uppercase tracking-[0.4em] text-foreground/40 rotate-90">
        KSE GROUP · CHARAKTER
      </div>
    );
  }
  return (
    <div className="flex flex-col items-center justify-center gap-3 p-6 text-center">
      <span
        className="text-[10px] uppercase tracking-[0.4em]"
        style={{ color: ACCENT }}
      >
        Paket {pkg.n}
      </span>
      <span
        className="font-black tracking-tight"
        style={{ fontSize: "1.5rem", letterSpacing: "-0.03em" }}
      >
        {pkg.title}
      </span>
      <span
        aria-hidden
        className="block w-10 h-px"
        style={{ background: ACCENT }}
      />
      <span className="text-[10px] uppercase tracking-[0.3em] text-foreground/40">
        {variant === "front" ? "Inhalt: 4 Module" : "Versiegelt · Original"}
      </span>
    </div>
  );
}

/* ───────────── outro / CTA ───────────── */

function Outro() {
  return (
    <section className="relative min-h-[90vh] flex items-center px-6 md:px-12 py-32 border-t border-foreground/15">
      <div className="max-w-5xl">
        <div className="text-[10px] uppercase tracking-[0.4em] text-foreground/50 mb-8">
          // Bereit auszupacken?
        </div>
        <h2
          className="font-black leading-[0.9] tracking-tight"
          style={{ fontSize: "clamp(2rem, 6vw, 6rem)", letterSpacing: "-0.05em" }}
        >
          Du schreibst Basti.
          <br />
          <span style={{ color: ACCENT }}>Basti antwortet.</span>
        </h2>
        <p className="mt-8 max-w-xl text-base md:text-lg text-foreground/70 leading-relaxed">
          Kein Account Manager, kein Ticket-System. Sag uns, welches Paket dich
          reizt — oder ob du eine Kombination brauchst.
        </p>
        <div className="mt-10 flex flex-wrap gap-4">
          <a
            href="mailto:info@ksegroup.eu"
            className="inline-flex items-center gap-3 px-6 py-4 text-[11px] uppercase tracking-[0.35em] font-semibold"
            style={{ background: ACCENT, color: "#0a0a0a" }}
          >
            Anfrage starten →
          </a>
          <Link
            to="/"
            className="inline-flex items-center gap-3 px-6 py-4 text-[11px] uppercase tracking-[0.35em] font-semibold border border-foreground/20 hover:border-foreground/60 transition-colors"
          >
            ← Zurück zur Startseite
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ───────────── page ───────────── */

function LeistungenPage() {
  return (
    <div className="relative min-h-screen bg-background text-foreground">
      <PageHeader />
      <Intro />
      {PACKAGES.map((pkg, i) => (
        <UnboxSection key={pkg.n} pkg={pkg} index={i} />
      ))}
      <Outro />
    </div>
  );
}
