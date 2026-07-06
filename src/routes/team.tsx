import { createFileRoute, Link } from "@tanstack/react-router";
import { motion, useReducedMotion } from "framer-motion";
import architect from "@/assets/team-architect.jpg";
import automator from "@/assets/team-automator.jpg";
import pixel from "@/assets/team-pixel.jpg";
import signal from "@/assets/team-signal.jpg";
import oracle from "@/assets/team-oracle.jpg";
import vector from "@/assets/team-vector.jpg";
import cipher from "@/assets/team-cipher.jpg";
import quill from "@/assets/team-quill.jpg";

export const Route = createFileRoute("/team")({
  head: () => ({
    meta: [
      { title: "Team — KSE GROUP Superhelden aus Hannover" },
      {
        name: "description",
        content:
          "Lerne die KSE GROUP kennen — ein Team von Spezialisten für Software, AI, Design und Marketing. Als Superhelden inszeniert, im echten Leben einfach ziemlich gut in dem was sie tun.",
      },
      { property: "og:title", content: "Team — KSE GROUP Superhelden aus Hannover" },
      { property: "og:description", content: "Die Menschen hinter KSE GROUP." },
      { property: "og:type", content: "website" },
    ],
  }),
  component: TeamPage,
});

type Hero = {
  codename: string;
  realName: string;
  role: string;
  origin: string;
  power: string;
  weakness: string;
  stats: { label: string; value: string }[];
  quote: string;
  img: string;
  bg: string;
  accent: string;
};

const TEAM: Hero[] = [
  {
    codename: "The Architect",
    realName: "Kay Steffen Engelmann",
    role: "Founder · Strategy · Systems",
    origin: "Verwandelt chaotische Briefings in Systeme, die skalieren. Sieht die Blaupause bevor die Wände stehen.",
    power: "Zerlegt jedes Problem in 12 saubere Boxen und steckt sie neu zusammen.",
    weakness: "Kann nicht aufhören, an Prozessen zu optimieren — auch im Urlaub.",
    stats: [
      { label: "Systeme gebaut", value: "120+" },
      { label: "Kaffee/Tag", value: "∞" },
      { label: "Response-Time", value: "<2h" },
    ],
    quote: `„Wenn es sich wiederholt, gehört es automatisiert."`,
    img: architect,
    bg: "#ff5722",
    accent: "#ffeb3b",
  },
  {
    codename: "The Automator",
    realName: "Alicia Tuchinsky",
    role: "AI Engineering · Automations · Agents",
    origin: "Baut AI-Agenten, die nachts arbeiten und morgens Reports auf den Tisch legen. Nie müde. Nie beleidigt.",
    power: "Verbindet 40 Tools mit einem einzigen Prompt.",
    weakness: "Redet manchmal in Function-Calls.",
    stats: [
      { label: "Agenten deployed", value: "60+" },
      { label: "Tasks/Tag", value: "12k" },
      { label: "Fehlerquote", value: "0.3%" },
    ],
    quote: `„Manuelle Arbeit ist ein Bug, kein Feature."`,
    img: automator,
    bg: "#ffeb3b",
    accent: "#ff5722",
  },
  {
    codename: "The Pixel Sorcerer",
    realName: "Milan Vukovic",
    role: "UI · UX · Motion · Brand",
    origin: "Zaubert aus einer Notion-Seite ein Interface, das man nicht mehr loslässt. Pixelverliebt bis auf den letzten Kerning-Wert.",
    power: "Materialisiert Layouts direkt aus dem Kopf des Kunden — noch bevor der es sagen kann.",
    weakness: "Kann in einem Comic-Sans-Menü nicht essen.",
    stats: [
      { label: "Sites gelauncht", value: "80+" },
      { label: "Design-Iterationen", value: "unendlich" },
      { label: "Awards", value: "in Arbeit" },
    ],
    quote: `„Wenn's nicht mit Absicht crooked ist, muss es gerade sein."`,
    img: pixel,
    bg: "#0a0a0a",
    accent: "#ff5722",
  },
  {
    codename: "The Signal",
    realName: "Jonas Brehmer",
    role: "Performance · Content · Reach",
    origin: "Verstärkt jede Botschaft, bis sie in der richtigen Zielgruppe einschlägt. Kennt jeden Algorithmus persönlich.",
    power: "Verwandelt 500€ Budget in 5.000 qualifizierte Views.",
    weakness: "Denkt in Hooks, spricht in Hooks, träumt in Hooks.",
    stats: [
      { label: "Kampagnen live", value: "200+" },
      { label: "Ø ROAS", value: "4.2×" },
      { label: "Reels/Woche", value: "so viele wie nötig" },
    ],
    quote: `„Reichweite ohne Substanz ist Lärm. Wir liefern beides."`,
    img: signal,
    bg: "#ff5722",
    accent: "#ffeb3b",
  },
  {
    codename: "The Oracle",
    realName: "Nadia Okonkwo",
    role: "Analytics · Insights · Forecasting",
    origin: "Liest Dashboards wie andere Leute Romane. Weiß, was dein Kunde kauft, bevor er es selbst weiß.",
    power: "Findet in 10 GB Logs den einen Datensatz, der alles erklärt.",
    weakness: "Kann keine Bauchgefühl-Entscheidungen treffen. Nie.",
    stats: [
      { label: "Dashboards live", value: "90+" },
      { label: "Ø Forecast-Genauigkeit", value: "94%" },
      { label: "Excel-Formeln im Kopf", value: "zu viele" },
    ],
    quote: `„Ohne Daten bist du nur eine weitere Person mit einer Meinung."`,
    img: oracle,
    bg: "#ff5722",
    accent: "#ffeb3b",
  },
  {
    codename: "The Vector",
    realName: "Lea Hoffmann-Riedl",
    role: "Branding · Illustration · Identity",
    origin: "Zeichnet Logos, die man nach einmal sehen nie wieder vergisst. Denkt in Kurven, atmet in Pantone.",
    power: "Baut aus einem Wort ein komplettes Brand-System in 48 Stunden.",
    weakness: "Zuckt physisch bei falsch gekicktem Logo.",
    stats: [
      { label: "Brands entwickelt", value: "45+" },
      { label: "Icons gezeichnet", value: "3.2k" },
      { label: "Pantone-Fächer", value: "3" },
    ],
    quote: `„Ein Logo ist keine Dekoration. Es ist ein Versprechen."`,
    img: vector,
    bg: "#ffeb3b",
    accent: "#ff5722",
  },
  {
    codename: "The Cipher",
    realName: "Ferhat Yildirim",
    role: "Backend · Infra · Security",
    origin: "Baut Systeme, die auch dann laufen, wenn das halbe Internet brennt. Verschlüsselt aus Prinzip.",
    power: "Findet den Bug, den seit drei Sprints keiner mehr sucht.",
    weakness: "Erklärt Security-Konzepte mit zu vielen Analogien.",
    stats: [
      { label: "APIs deployed", value: "150+" },
      { label: "Uptime", value: "99.98%" },
      { label: "Passwörter im Kopf", value: "0 — dafür gibt's Vaults" },
    ],
    quote: `„Sicherheit ist kein Feature. Sie ist die Basis."`,
    img: cipher,
    bg: "#0a0a0a",
    accent: "#ff5722",
  },
  {
    codename: "The Quill",
    realName: "Clara Weißmüller",
    role: "Copy · Storytelling · Editorial",
    origin: "Schreibt Sätze, die im Kopf hängen bleiben wie ein guter Song. Kürzt gnadenlos. Immer.",
    power: "Verwandelt ein 40-seitiges Briefing in einen Satz, der verkauft.",
    weakness: "Korrigiert Speisekarten. Ungefragt.",
    stats: [
      { label: "Landingpages betextet", value: "180+" },
      { label: "Ø Conversion-Uplift", value: "+37%" },
      { label: "Wörter gestrichen", value: "Millionen" },
    ],
    quote: `„Wenn du es in einem Satz nicht sagen kannst, hast du es nicht verstanden."`,
    img: quill,
    bg: "#ff5722",
    accent: "#ffeb3b",
  },
];

function TeamPage() {
  return (
    <div className="bg-[#f5f1e8] text-[#0a0a0a] min-h-screen">
      <TeamNav />
      <Hero />
      <Roster />
      <RecruitCTA />
      <Footer />
    </div>
  );
}

function TeamNav() {
  return (
    <header className="sticky top-0 z-50 bg-white border-b-4 border-[#0a0a0a]">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
        <Link to="/" className="flex min-w-0 items-center gap-3">
          <span
            className="grid place-items-center h-9 w-9 shrink-0 border-2 border-[#0a0a0a] bg-[#ff5722] text-white font-black"
            style={{ fontFamily: "var(--font-display)" }}
          >
            K
          </span>
          <span
            className="truncate font-black tracking-tighter uppercase text-lg md:text-xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            KSE GROUP
          </span>
        </Link>
        <div className="shrink-0 flex items-center gap-2">
          <Link
            to="/"
            className="hidden sm:inline-flex items-center gap-2 border-2 border-[#0a0a0a] bg-white text-[#0a0a0a] px-4 py-2 text-[11px] uppercase tracking-[0.2em] font-bold hover:bg-[#0a0a0a] hover:text-white transition-colors"
          >
            ← Zurück
          </Link>
          <Link
            to="/konfigurator"
            className="inline-flex items-center gap-2 border-2 border-[#0a0a0a] bg-[#0a0a0a] text-white px-4 py-2 text-[11px] uppercase tracking-[0.2em] font-bold hover:bg-[#ff5722] hover:border-[#ff5722] transition-colors"
          >
            Projekt starten →
          </Link>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="border-b-4 border-[#0a0a0a] bg-[#ffeb3b] relative overflow-hidden">
      <div className="absolute inset-0 opacity-[0.08] pointer-events-none" style={{
        backgroundImage: "radial-gradient(#0a0a0a 1.2px, transparent 1.2px)",
        backgroundSize: "14px 14px",
      }} />
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-16 md:py-24 relative">
        <div className="inline-flex items-center gap-2 border-2 border-[#0a0a0a] bg-white px-3 py-1 text-[10px] uppercase tracking-[0.25em] font-bold mb-6">
          <span className="h-2 w-2 rounded-full bg-[#ff5722] animate-pulse" />
          Issue #001 · Meet the Roster
        </div>
        <h1
          className="font-black tracking-tighter leading-[0.85] uppercase text-[14vw] md:text-[9vw] lg:text-[128px]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Das <span className="text-[#ff5722]">Team.</span>
          <br />
          Nur cooler.
        </h1>
        <p className="mt-6 max-w-2xl text-base md:text-lg font-medium">
          Im Alltag sind wir Software-Engineers, Designer, AI-Nerds und Growth-Marketer aus
          Hannover. Hier gibt's die Version mit Cape. Gleicher Output. Mehr Halftone-Dots.
        </p>
      </div>
    </section>
  );
}

function Roster() {
  return (
    <section className="max-w-7xl mx-auto px-4 md:px-8 py-16 md:py-24 space-y-16 md:space-y-24">
      {TEAM.map((h, i) => (
        <HeroCard key={h.codename} hero={h} index={i} />
      ))}
    </section>
  );
}

function HeroCard({ hero, index }: { hero: Hero; index: number }) {
  const reduced = useReducedMotion();
  const reverse = index % 2 === 1;
  return (
    <motion.article
      initial={reduced ? undefined : { opacity: 0, y: 40 }}
      whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.55, ease: [0.2, 0.8, 0.2, 1] }}
      className="grid md:grid-cols-12 gap-4 md:gap-6"
    >
      {/* Portrait */}
      <div
        className={`md:col-span-5 relative border-4 border-[#0a0a0a] overflow-hidden ${reverse ? "md:order-2" : ""}`}
        style={{
          background: hero.bg,
          boxShadow: "8px 8px 0 0 #0a0a0a",
        }}
      >
        <div className="absolute top-3 left-3 z-10 border-2 border-[#0a0a0a] bg-white px-2 py-1 text-[10px] uppercase tracking-[0.25em] font-bold">
          №{String(index + 1).padStart(2, "0")}
        </div>
        <div className="absolute top-3 right-3 z-10 border-2 border-[#0a0a0a] bg-[#0a0a0a] text-[#ffeb3b] px-2 py-1 text-[10px] uppercase tracking-[0.25em] font-bold">
          KSE·HERO
        </div>
        <img
          src={hero.img}
          alt={`${hero.codename} — ${hero.realName}`}
          loading="lazy"
          width={768}
          height={960}
          className={`w-full h-full object-cover aspect-[4/5] ${hero.bg === "#0a0a0a" ? "" : "mix-blend-multiply"}`}
        />
        {/* Halftone overlay */}
        <div
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(#0a0a0a 1px, transparent 1px)",
            backgroundSize: "6px 6px",
          }}
        />
      </div>

      {/* Dossier */}
      <div className={`md:col-span-7 ${reverse ? "md:order-1" : ""}`}>
        <div
          className="border-4 border-[#0a0a0a] bg-white p-5 md:p-8 h-full flex flex-col"
          style={{ boxShadow: "8px 8px 0 0 #0a0a0a" }}
        >
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] font-bold text-[#0a0a0a]/60">
            <span className="inline-block h-2 w-2 rounded-full" style={{ background: hero.accent }} />
            Codename
          </div>
          <h2
            className="mt-2 font-black tracking-tighter uppercase leading-[0.9] text-4xl md:text-6xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {hero.codename}
          </h2>
          <div className="mt-2 text-sm font-bold text-[#0a0a0a]/70">
            AKA {hero.realName} · <span className="text-[#0a0a0a]">{hero.role}</span>
          </div>

          <p className="mt-5 text-[15px] leading-relaxed">{hero.origin}</p>

          <div className="mt-6 grid sm:grid-cols-2 gap-3">
            <Dossier label="Superkraft" value={hero.power} tone={hero.accent} />
            <Dossier label="Schwäche" value={hero.weakness} tone="#f5f1e8" />
          </div>

          <div className="mt-6 grid grid-cols-3 border-t-2 border-[#0a0a0a]">
            {hero.stats.map((s) => (
              <div key={s.label} className="border-r-2 border-[#0a0a0a] last:border-r-0 py-3 px-2">
                <div
                  className="font-black text-xl md:text-2xl tracking-tighter"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {s.value}
                </div>
                <div className="text-[9px] uppercase tracking-[0.25em] font-bold text-[#0a0a0a]/60 mt-1">
                  {s.label}
                </div>
              </div>
            ))}
          </div>

          <blockquote
            className="mt-6 border-l-4 pl-4 text-lg md:text-xl font-bold italic leading-snug"
            style={{ borderColor: hero.bg === "#0a0a0a" ? hero.accent : hero.bg }}
          >
            {hero.quote}
          </blockquote>
        </div>
      </div>
    </motion.article>
  );
}

function Dossier({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className="border-2 border-[#0a0a0a] p-3" style={{ background: tone }}>
      <div className="text-[9px] uppercase tracking-[0.3em] font-bold text-[#0a0a0a]/70">
        {label}
      </div>
      <div className="mt-1 text-sm font-semibold leading-snug">{value}</div>
    </div>
  );
}

function RecruitCTA() {
  return (
    <section className="border-t-4 border-[#0a0a0a] bg-[#0a0a0a] text-white">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-16 md:py-24 grid md:grid-cols-2 gap-8 items-center">
        <div>
          <div className="inline-flex items-center gap-2 border-2 border-[#ffeb3b] bg-transparent px-3 py-1 text-[10px] uppercase tracking-[0.25em] font-bold text-[#ffeb3b] mb-6">
            Recruiting Signal · Aktiv
          </div>
          <h2
            className="font-black tracking-tighter uppercase leading-[0.9] text-5xl md:text-7xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Freies <span className="text-[#ff5722]">Cape</span>
            <br />
            wartet.
          </h2>
          <p className="mt-6 text-white/70 max-w-md">
            Du baust in Ruhe schneller als andere im Team-Call? Dann schick uns keinen Lebenslauf,
            sondern das coolste Ding, das du je gebaut hast.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row md:justify-end gap-3">
          <a
            href="mailto:marketing@ksegroup.eu?subject=Cape%20anfordern"
            className="inline-flex items-center justify-center border-2 border-[#ffeb3b] bg-[#ffeb3b] text-[#0a0a0a] px-5 py-3 text-xs uppercase tracking-[0.25em] font-bold hover:bg-transparent hover:text-[#ffeb3b] transition-colors"
          >
            Bewirb dich →
          </a>
          <Link
            to="/konfigurator"
            className="inline-flex items-center justify-center border-2 border-white bg-transparent text-white px-5 py-3 text-xs uppercase tracking-[0.25em] font-bold hover:bg-white hover:text-[#0a0a0a] transition-colors"
          >
            Projekt starten
          </Link>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t-4 border-[#0a0a0a] bg-[#0a0a0a] text-white">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-10 grid grid-cols-2 md:grid-cols-4 gap-6 text-[11px] uppercase tracking-[0.2em] font-bold">
        <span>© 2026 KSE Group</span>
        <span>Software · AI · Digital Brands</span>
        <span>Hannover · Deutschland</span>
        <span className="text-[#ffeb3b]">Team · Roster 001</span>
      </div>
      <div className="max-w-7xl mx-auto px-4 md:px-8 pb-8 flex flex-wrap gap-x-6 gap-y-2 text-[11px] uppercase tracking-[0.2em] font-bold text-white/60">
        <Link to="/" className="hover:text-[#ffeb3b] transition-colors">Home</Link>
        <Link to="/leistungen" className="hover:text-[#ffeb3b] transition-colors">Leistungen</Link>
        <Link to="/konfigurator" className="hover:text-[#ffeb3b] transition-colors">Konfigurator</Link>
        <Link to="/impressum" className="hover:text-[#ffeb3b] transition-colors">Impressum</Link>
        <Link to="/datenschutz" className="hover:text-[#ffeb3b] transition-colors">Datenschutz</Link>
      </div>
    </footer>
  );
}