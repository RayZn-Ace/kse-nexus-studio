import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Quote, Star, ArrowRight, Filter } from "lucide-react";

export const Route = createFileRoute("/hall-of-fame")({
  head: () => ({
    meta: [
      { title: "Hall of Fame — Kundenstimmen | KSE Group" },
      {
        name: "description",
        content: "Echte Missionen, echte Helden. Was Kunden über KSE Group sagen — Web, AI, Marketing & Branding aus Hannover.",
      },
      { property: "og:title", content: "KSE Hall of Fame — Kundenstimmen" },
      { property: "og:description", content: "Verified Heroes. Was unsere Kunden über die Zusammenarbeit sagen." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HallOfFame,
});

type Testimonial = {
  id: string;
  name: string;
  role: string;
  company: string;
  initials: string;
  quote: string;
  category: "web" | "ai" | "marketing" | "branding";
  metric?: { label: string; value: string };
  rating: number;
  verified: boolean;
  hue: string;
};

const DATA: Testimonial[] = [
  {
    id: "t1",
    name: "Julia Brenner",
    role: "Gründerin",
    company: "Brenner Interior",
    initials: "JB",
    quote:
      "KSE hat unsere alte Website nicht überarbeitet — sie haben ein neues Verkaufswerkzeug gebaut. 3× mehr Anfragen in 6 Wochen. Ohne Bullshit.",
    category: "web",
    metric: { label: "Anfragen", value: "+312%" },
    rating: 5,
    verified: true,
    hue: "#ff5722",
  },
  {
    id: "t2",
    name: "Marek Schulz",
    role: "CTO",
    company: "Northline Logistics",
    initials: "MS",
    quote:
      "Die AI-Automation bearbeitet jetzt 80% unserer eingehenden Frachtanfragen selbstständig. Was früher ein Team-Tag war, sind heute 12 Minuten.",
    category: "ai",
    metric: { label: "Zeit gespart / Woche", value: "34h" },
    rating: 5,
    verified: true,
    hue: "#7c3aed",
  },
  {
    id: "t3",
    name: "Sarah Kohl",
    role: "Head of Growth",
    company: "Peakform",
    initials: "SK",
    quote:
      "Wir hatten drei Agenturen vor KSE. Keine hat verstanden, dass Marketing = System, nicht Kampagne. KSE schon. Cost-per-Lead −58%.",
    category: "marketing",
    metric: { label: "Cost-per-Lead", value: "−58%" },
    rating: 5,
    verified: true,
    hue: "#0ea5e9",
  },
  {
    id: "t4",
    name: "Daniel Roth",
    role: "CEO",
    company: "Roth & Söhne",
    initials: "DR",
    quote:
      "Nach 34 Jahren im Handwerk haben wir mit KSE ein Rebranding gewagt. Ergebnis: 20% mehr Bewerbungen, doppelt so viele Premium-Aufträge.",
    category: "branding",
    metric: { label: "Premium-Aufträge", value: "+112%" },
    rating: 5,
    verified: true,
    hue: "#16a34a",
  },
  {
    id: "t5",
    name: "Lea Fischer",
    role: "Marketing Lead",
    company: "Volt Studio",
    initials: "LF",
    quote:
      "Ein Team, ein Ansprechpartner, alles aus einer Hand. Kein Ping-Pong zwischen Freelancern mehr. Endlich.",
    category: "web",
    rating: 5,
    verified: true,
    hue: "#facc15",
  },
  {
    id: "t6",
    name: "Tim Vogel",
    role: "Founder",
    company: "Kettl & Co.",
    initials: "TV",
    quote:
      "Die Konfigurator-App hat unseren Verkaufsprozess halbiert. Kunden lieben es, wir auch. Payback nach 5 Wochen.",
    category: "ai",
    metric: { label: "Sales-Zyklus", value: "−52%" },
    rating: 5,
    verified: true,
    hue: "#ff5722",
  },
  {
    id: "t7",
    name: "Elena Perez",
    role: "COO",
    company: "Studio Nord",
    initials: "EP",
    quote:
      "Wir wollten ‚irgendwas mit AI'. KSE hat gefragt: ‚Was kostet dich am meisten Zeit?' — und das gelöst. Ehrlicher Beratungsansatz.",
    category: "ai",
    rating: 5,
    verified: true,
    hue: "#0ea5e9",
  },
  {
    id: "t8",
    name: "Ben Kruse",
    role: "Gründer",
    company: "Kruse Manufaktur",
    initials: "BK",
    quote:
      "Unsere Marke sah nach Ikea aus. Jetzt sieht sie nach uns aus. Kunden erkennen uns wieder — im echten Sinne.",
    category: "branding",
    metric: { label: "Wiedererkennung", value: "8.7/10" },
    rating: 5,
    verified: true,
    hue: "#7c3aed",
  },
  {
    id: "t9",
    name: "Anna Weiss",
    role: "Inhaberin",
    company: "Weiss Praxis",
    initials: "AW",
    quote:
      "Termin-Buchung, Erinnerungen, Follow-ups — alles automatisiert. Ich bin Ärztin, kein Sekretariat. Danke KSE.",
    category: "ai",
    metric: { label: "No-Show-Rate", value: "−71%" },
    rating: 5,
    verified: true,
    hue: "#16a34a",
  },
];

const FILTERS = [
  { id: "alle", label: "Alle" },
  { id: "web", label: "Web" },
  { id: "ai", label: "AI" },
  { id: "marketing", label: "Marketing" },
  { id: "branding", label: "Branding" },
] as const;

function HallOfFame() {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["id"]>("alle");
  const items = useMemo(
    () => (filter === "alle" ? DATA : DATA.filter((t) => t.category === filter)),
    [filter],
  );
  const avg =
    DATA.reduce((s, t) => s + t.rating, 0) / DATA.length;

  return (
    <main className="min-h-screen bg-[#f5f2ea] text-[#0a0a0a]">
      {/* HERO */}
      <section className="relative border-b-2 border-[#0a0a0a] overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage:
              "repeating-linear-gradient(45deg, #0a0a0a 0 2px, transparent 2px 12px)",
          }}
        />
        <div className="relative max-w-6xl mx-auto px-6 md:px-10 py-20 md:py-28">
          <Link
            to="/"
            className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-[0.3em] text-[#0a0a0a]/60 hover:text-[#ff5722] mb-6"
          >
            ← Zurück zur Basis
          </Link>
          <div className="inline-block bg-[#0a0a0a] text-[#ff5722] px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.3em] mb-4">
            ◆ Verified Heroes
          </div>
          <h1
            className="font-black text-6xl md:text-8xl uppercase tracking-tighter leading-[0.85] max-w-4xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Hall of
            <br />
            <span className="text-[#ff5722]">Fame</span>
          </h1>
          <p className="mt-6 text-lg md:text-xl font-medium max-w-2xl text-[#0a0a0a]/80">
            Echte Missionen. Echte Ergebnisse. Kein Marketing-Sprech —
            nur was Kunden über die Zusammenarbeit mit KSE sagen.
          </p>

          {/* trust bar */}
          <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-3 max-w-3xl">
            {[
              { k: "Missionen", v: `${DATA.length}+` },
              { k: "Ø Bewertung", v: `${avg.toFixed(1)}/5` },
              { k: "Verified", v: "100%" },
              { k: "Aus Hannover", v: "seit '19" },
            ].map((s) => (
              <div
                key={s.k}
                className="border-2 border-[#0a0a0a] bg-white p-3"
                style={{ boxShadow: "4px 4px 0 0 #0a0a0a" }}
              >
                <div className="text-[10px] font-black uppercase tracking-widest text-[#0a0a0a]/50">
                  {s.k}
                </div>
                <div
                  className="font-black text-2xl tabular-nums"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {s.v}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FILTER */}
      <section className="border-b-2 border-[#0a0a0a] bg-white sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 md:px-10 py-4 flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.3em] text-[#0a0a0a]/50 mr-2">
            <Filter className="w-3 h-3" /> Filter
          </div>
          {FILTERS.map((f) => {
            const active = filter === f.id;
            return (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`px-3 py-1.5 border-2 border-[#0a0a0a] text-[10px] font-black uppercase tracking-widest transition-all ${
                  active ? "bg-[#0a0a0a] text-white -translate-y-0.5" : "bg-white hover:-translate-y-0.5"
                }`}
                style={{ boxShadow: active ? "3px 3px 0 0 #ff5722" : "3px 3px 0 0 #0a0a0a" }}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      </section>

      {/* GRID */}
      <section className="max-w-6xl mx-auto px-6 md:px-10 py-12 md:py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((t, i) => (
            <TestimonialCard key={t.id} t={t} tilt={i % 3} />
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="border-t-2 border-[#0a0a0a] bg-[#0a0a0a] text-white">
        <div className="max-w-6xl mx-auto px-6 md:px-10 py-16 md:py-20 text-center">
          <div className="inline-block bg-[#ff5722] text-white px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.3em] mb-4">
            ◆ Nächste Mission
          </div>
          <h2
            className="font-black text-4xl md:text-6xl uppercase tracking-tighter leading-[0.9]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Werde der nächste
            <br />
            <span className="text-[#ff5722]">Verified Hero.</span>
          </h2>
          <p className="mt-4 text-white/70 max-w-xl mx-auto">
            30 Minuten. Kostenlos. Danach weißt du, ob wir dein Problem lösen können.
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 mt-8 bg-[#ff5722] text-white px-6 py-3.5 border-2 border-white text-sm font-black uppercase tracking-widest hover:-translate-y-1 transition-transform"
            style={{ boxShadow: "6px 6px 0 0 #ffffff" }}
          >
            Mission starten <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </main>
  );
}

function TestimonialCard({ t, tilt }: { t: Testimonial; tilt: number }) {
  const rot = ["-rotate-1", "rotate-0", "rotate-1"][tilt] ?? "rotate-0";
  return (
    <article
      className={`relative border-2 border-[#0a0a0a] bg-white p-5 flex flex-col group hover:-translate-y-1 hover:rotate-0 transition-transform ${rot}`}
      style={{ boxShadow: "6px 6px 0 0 #0a0a0a" }}
    >
      {/* verified badge */}
      {t.verified && (
        <div
          className="absolute -top-3 -right-3 bg-[#0a0a0a] text-[#ff5722] px-2 py-1 text-[9px] font-black uppercase tracking-[0.25em] border-2 border-[#ff5722] rotate-3"
          style={{ boxShadow: "3px 3px 0 0 #ff5722" }}
        >
          ✓ Verified
        </div>
      )}

      <Quote className="w-6 h-6 text-[#ff5722] mb-3 shrink-0" />

      <blockquote className="text-[15px] leading-snug font-medium text-[#0a0a0a] flex-1">
        „{t.quote}"
      </blockquote>

      {t.metric && (
        <div
          className="mt-4 border-2 border-[#0a0a0a] p-2.5 flex items-center justify-between"
          style={{ background: `${t.hue}20` }}
        >
          <span className="text-[10px] font-black uppercase tracking-widest text-[#0a0a0a]/70">
            {t.metric.label}
          </span>
          <span
            className="font-black text-xl tabular-nums"
            style={{ fontFamily: "var(--font-display)", color: t.hue }}
          >
            {t.metric.value}
          </span>
        </div>
      )}

      <div className="mt-4 pt-4 border-t-2 border-dashed border-[#0a0a0a]/20 flex items-center gap-3">
        <div
          className="w-11 h-11 rounded-full border-2 border-[#0a0a0a] grid place-items-center font-black text-sm shrink-0"
          style={{ background: t.hue, color: "#fff" }}
        >
          {t.initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-black text-sm truncate">{t.name}</div>
          <div className="text-[11px] text-[#0a0a0a]/60 truncate">
            {t.role} · {t.company}
          </div>
        </div>
        <div className="flex gap-0.5">
          {Array.from({ length: t.rating }).map((_, i) => (
            <Star key={i} className="w-3 h-3 fill-[#ff5722] text-[#ff5722]" />
          ))}
        </div>
      </div>
    </article>
  );
}