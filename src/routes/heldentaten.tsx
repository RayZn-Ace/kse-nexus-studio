import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

export const Route = createFileRoute("/heldentaten")({
  head: () => ({
    meta: [
      { title: "Heldentaten — Projekte & Kunden der KSE GROUP" },
      {
        name: "description",
        content:
          "Projekte, die wir für Kunden gebaut haben — Software, AI, Websites, Marketing und Branding. Die Heldentaten der KSE GROUP.",
      },
      { property: "og:title", content: "Heldentaten — Projekte & Kunden der KSE GROUP" },
      {
        property: "og:description",
        content: "Echte Projekte, echte Ergebnisse. Das Portfolio der KSE GROUP.",
      },
      { property: "og:type", content: "website" },
    ],
  }),
  component: HeldentatenPage,
});

type Category = "Alle" | "Software" | "AI" | "Web" | "Marketing" | "Branding";

type Deed = {
  client: string;
  category: Exclude<Category, "Alle">;
  title: string;
  heroes: string[];
  result: string;
  resultLabel: string;
  description: string;
  accent: "#ff5722" | "#ffeb3b" | "#0a0a0a";
};

const DEEDS: Deed[] = [
  {
    client: "Kraftwerk Immobilien",
    category: "Software",
    title: "CRM-Plattform für 40+ Makler",
    heroes: ["The Architect", "The Cipher"],
    result: "+34%",
    resultLabel: "Schnellerer Abschluss",
    description:
      "Custom CRM mit Lead-Routing, Terminautomatik und E-Mail-Pipelines. Kein Salesforce, kein Overhead.",
    accent: "#ff5722",
  },
  {
    client: "Urban Bites",
    category: "AI",
    title: "WhatsApp-Bestellbot für Lieferservice",
    heroes: ["The Automator", "The Architect"],
    result: "24/7",
    resultLabel: "Bestellannahme",
    description:
      "AI-Chatbot nimmt Bestellungen entgegen, beantwortet Fragen und gibt Küche-Bons an Slack weiter.",
    accent: "#ffeb3b",
  },
  {
    client: "Modeatelier Lena",
    category: "Web",
    title: "High-End Brand-Website mit Lookbook",
    heroes: ["The Pixel Sorcerer", "The Quill"],
    result: "3.2×",
    resultLabel: "Verweildauer",
    description:
      "Mobile-first Site mit Motion, editorialer Typografie und direkter Showroom-Buchung.",
    accent: "#0a0a0a",
  },
  {
    client: "FitStart Hannover",
    category: "Marketing",
    title: "Meta-Ad-Funnel für Mitgliedergewinnung",
    heroes: ["The Signal", "The Oracle"],
    result: "4.8×",
    resultLabel: "ROAS",
    description:
      "Von Creatives über Retargeting bis zur Landingpage: kompletter Funnel mit Echtzeit-Dashboard.",
    accent: "#ff5722",
  },
  {
    client: "BauTech GmbH",
    category: "Branding",
    title: "Neuer Markenauftritt & Corporate Design",
    heroes: ["The Vector", "The Quill"],
    result: "1 System",
    resultLabel: "Brand-Guidelines",
    description:
      "Logo, Farbwelt, Typografie, Templates und eine Brand-Story, die im B2B funktioniert.",
    accent: "#ffeb3b",
  },
  {
    client: "MediConnect",
    category: "Software",
    title: "Patienten-Portal mit Terminbuchung",
    heroes: ["The Cipher", "The Architect"],
    result: "-60%",
    resultLabel: "Telefonzeit",
    description:
      "DSGVO-konformes Portal mit Authentifizierung, Dokumenten-Upload und Erinnerungs-Automatik.",
    accent: "#0a0a0a",
  },
  {
    client: "EventForward",
    category: "AI",
    title: "AI-Assistent für Anfragen & Angebote",
    heroes: ["The Automator", "The Quill"],
    result: "80%",
    resultLabel: "Anfragen automatisch",
    description:
      "E-Mail- und Formular-Anfragen werden von einem AI-Agenten klassifiziert, beantwortet und angebotsfertig übergeben.",
    accent: "#ffeb3b",
  },
  {
    client: "GreenRoots",
    category: "Marketing",
    title: "TikTok-Launch für nachhaltige Produkte",
    heroes: ["The Signal", "The Pixel Sorcerer"],
    result: "2.1M",
    resultLabel: "Views",
    description:
      "Content-Strategie, Creator-Briefings, Ads und ein Shop-System für den viraler Launch.",
    accent: "#ff5722",
  },
  {
    client: "CodeCraft Studio",
    category: "Web",
    title: "SaaS-Landingpage mit Demo-Scheduler",
    heroes: ["The Pixel Sorcerer", "The Architect"],
    result: "+127%",
    resultLabel: "Demo-Buchungen",
    description:
      "Conversion-optimierte Landingpage mit interaktiver Demo, Preisrechner und Calendly-Integration.",
    accent: "#ffeb3b",
  },
  {
    client: "KSE GROUP",
    category: "Branding",
    title: "Eigenrelaunch inklusive Superhelden-Roster",
    heroes: ["The Vector", "The Pixel Sorcerer", "The Quill"],
    result: "1 Cape",
    resultLabel: "pro Teammitglied",
    description:
      "Eigenmarke neu aufgelegt: Website, Team-Seite, Komik-Asthetik und ein komplett neuer Auftritt.",
    accent: "#0a0a0a",
  },
];

const CATEGORIES: Category[] = ["Alle", "Software", "AI", "Web", "Marketing", "Branding"];

function HeldentatenPage() {
  return (
    <div className="bg-[#f5f1e8] text-[#0a0a0a] min-h-screen">
      <Nav />
      <Hero />
      <DeedWall />
      <RecruitCTA />
      <Footer />
    </div>
  );
}

function Nav() {
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
            to="/team"
            className="hidden sm:inline-flex items-center gap-2 border-2 border-[#0a0a0a] bg-white text-[#0a0a0a] px-4 py-2 text-[11px] uppercase tracking-[0.2em] font-bold hover:bg-[#0a0a0a] hover:text-white transition-colors"
          >
            Team
          </Link>
          <Link
            to="/konfigurator"
            className="inline-flex items-center gap-2 border-2 border-[#0a0a0a] bg-[#0a0a0a] text-white px-4 py-2 text-[11px] uppercase tracking-[0.2em] font-bold hover:bg-[#ff5722] hover:border-[#ff5722] transition-colors"
          >
            Projekt konfigurieren →
          </Link>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="border-b-4 border-[#0a0a0a] bg-[#ff5722] text-white relative overflow-hidden">
      <div className="absolute inset-0 opacity-[0.08] pointer-events-none" style={{
        backgroundImage: "radial-gradient(#0a0a0a 1.2px, transparent 1.2px)",
        backgroundSize: "14px 14px",
      }} />
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-16 md:py-24 relative">
        <div className="inline-flex items-center gap-2 border-2 border-[#0a0a0a] bg-white text-[#0a0a0a] px-3 py-1 text-[10px] uppercase tracking-[0.25em] font-bold mb-6">
          <span className="h-2 w-2 rounded-full bg-[#ff5722] animate-pulse" />
          Issue #002 · Mission Log
        </div>
        <h1
          className="font-black tracking-tighter leading-[0.85] uppercase text-[14vw] md:text-[9vw] lg:text-[128px]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Unsere
          <br />
          <span className="text-[#ffeb3b]">Heldentaten.</span>
        </h1>
        <p className="mt-6 max-w-2xl text-base md:text-lg font-medium text-white/90">
          Echte Projekte für echte Kunden. Was wir gebaut, automatisiert, designed und auf Steroide gebracht haben — in einer übersichtlichen Wand.
        </p>
      </div>
    </section>
  );
}

function DeedWall() {
  const [filter, setFilter] = useState<Category>("Alle");
  const reduced = useReducedMotion();
  const filtered = filter === "Alle" ? DEEDS : DEEDS.filter((d) => d.category === filter);

  return (
    <section className="max-w-7xl mx-auto px-4 md:px-8 py-16 md:py-24">
      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-12">
        {CATEGORIES.map((c) => {
          const active = filter === c;
          return (
            <button
              key={c}
              onClick={() => setFilter(c)}
              className={`border-2 border-[#0a0a0a] px-4 py-2 text-[11px] uppercase tracking-[0.2em] font-bold transition-colors ${
                active
                  ? "bg-[#0a0a0a] text-white"
                  : "bg-white text-[#0a0a0a] hover:bg-[#0a0a0a] hover:text-white"
              }`}
            >
              {c}
            </button>
          );
        })}
      </div>

      {/* Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((deed, i) => (
          <motion.article
            key={deed.title}
            initial={reduced ? undefined : { opacity: 0, y: 30 }}
            whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.45, delay: i * 0.05, ease: [0.2, 0.8, 0.2, 1] }}
            className="group/deed border-4 border-[#0a0a0a] bg-white transition-[transform,box-shadow] duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] hover:-translate-y-1 hover:-translate-x-1 hover:[box-shadow:14px_14px_0_0_#0a0a0a] flex flex-col"
            style={{ boxShadow: "8px 8px 0 0 #0a0a0a" }}
          >
            {/* Top bar */}
            <div className="flex items-center justify-between border-b-2 border-[#0a0a0a] p-3">
              <span className="text-[10px] uppercase tracking-[0.25em] font-bold text-[#0a0a0a]/60">
                {deed.client}
              </span>
              <span
                className="border-2 border-[#0a0a0a] px-2 py-0.5 text-[9px] uppercase tracking-[0.25em] font-bold"
                style={{ background: deed.accent, color: deed.accent === "#ffeb3b" ? "#0a0a0a" : "#ffffff" }}
              >
                {deed.category}
              </span>
            </div>

            {/* Content */}
            <div className="p-5 md:p-6 flex flex-col flex-1">
              <h2
                className="font-black tracking-tighter uppercase leading-[0.95] text-2xl md:text-3xl"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {deed.title}
              </h2>

              <p className="mt-3 text-sm leading-relaxed text-[#0a0a0a]/80 flex-1">
                {deed.description}
              </p>

              {/* Heroes */}
              <div className="mt-5 flex flex-wrap gap-2">
                {deed.heroes.map((h) => (
                  <span
                    key={h}
                    className="inline-flex items-center border-2 border-[#0a0a0a] bg-[#f5f1e8] px-2 py-1 text-[10px] uppercase tracking-[0.2em] font-bold"
                  >
                    {h}
                  </span>
                ))}
              </div>

              {/* Result */}
              <div className="mt-6 border-t-2 border-[#0a0a0a] pt-4">
                <div
                  className="font-black text-3xl md:text-4xl tracking-tighter"
                  style={{ fontFamily: "var(--font-display)", color: deed.accent === "#0a0a0a" ? "#ff5722" : deed.accent }}
                >
                  {deed.result}
                </div>
                <div className="text-[10px] uppercase tracking-[0.25em] font-bold text-[#0a0a0a]/60 mt-1">
                  {deed.resultLabel}
                </div>
              </div>
            </div>
          </motion.article>
        ))}
      </div>
    </section>
  );
}

function RecruitCTA() {
  return (
    <section className="border-t-4 border-[#0a0a0a] bg-[#0a0a0a] text-white">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-16 md:py-24 grid md:grid-cols-2 gap-8 items-center">
        <div>
          <div className="inline-flex items-center gap-2 border-2 border-[#ffeb3b] bg-transparent px-3 py-1 text-[10px] uppercase tracking-[0.25em] font-bold text-[#ffeb3b] mb-6">
            Neue Mission · Gesucht
          </div>
          <h2
            className="font-black tracking-tighter uppercase leading-[0.9] text-5xl md:text-7xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Dein Projekt als
            <br />
            <span className="text-[#ff5722]">nächste Tat.</span>
          </h2>
          <p className="mt-6 text-white/70 max-w-md">
            Wir nehmen nur Missionen an, bei denen wir wirklich was bewegen können. Erzähl uns, was du bauen willst.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row md:justify-end gap-3">
          <Link
            to="/konfigurator"
            className="inline-flex items-center justify-center border-2 border-[#ffeb3b] bg-[#ffeb3b] text-[#0a0a0a] px-5 py-3 text-xs uppercase tracking-[0.25em] font-bold hover:bg-transparent hover:text-[#ffeb3b] transition-colors"
          >
            Projekt konfigurieren →
          </Link>
          <Link
            to="/team"
            className="inline-flex items-center justify-center border-2 border-white bg-transparent text-white px-5 py-3 text-xs uppercase tracking-[0.25em] font-bold hover:bg-white hover:text-[#0a0a0a] transition-colors"
          >
            Das Team
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
        <span className="text-[#ffeb3b]">Heldentaten · Log 002</span>
      </div>
      <div className="max-w-7xl mx-auto px-4 md:px-8 pb-8 flex flex-wrap gap-x-6 gap-y-2 text-[11px] uppercase tracking-[0.2em] font-bold text-white/60">
        <Link to="/" className="hover:text-[#ffeb3b] transition-colors">Home</Link>
        <Link to="/team" className="hover:text-[#ffeb3b] transition-colors">Team</Link>
        <Link to="/leistungen" className="hover:text-[#ffeb3b] transition-colors">Leistungen</Link>
        <Link to="/konfigurator" className="hover:text-[#ffeb3b] transition-colors">Konfigurator</Link>
        <Link to="/impressum" className="hover:text-[#ffeb3b] transition-colors">Impressum</Link>
        <Link to="/datenschutz" className="hover:text-[#ffeb3b] transition-colors">Datenschutz</Link>
      </div>
    </footer>
  );
}
