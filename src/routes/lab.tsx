import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Beaker, Radio, Cpu, Zap, Lock, Eye, ArrowLeft, Terminal } from "lucide-react";

export const Route = createFileRoute("/lab")({
  head: () => ({
    meta: [
      { title: "KSE Lab — Classified" },
      { name: "description", content: "Secret Lab der KSE Group. Prototypen, Experimente, Werkstatt." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: Lab,
});

type Experiment = {
  id: string;
  code: string;
  title: string;
  status: "LIVE" | "ALPHA" | "PROTOTYPE" | "CLASSIFIED";
  desc: string;
  icon: typeof Beaker;
  color: string;
};

const EXPERIMENTS: Experiment[] = [
  {
    id: "nova",
    code: "AGENT-07",
    title: "NOVA — Website Concierge",
    status: "LIVE",
    desc: "AI-Agent, der Besucher auf jeder Seite beantwortet, qualifiziert und weiterleitet. Läuft rechts unten auf dieser Website.",
    icon: Radio,
    color: "#ffeb3b",
  },
  {
    id: "invoicer",
    code: "BS-01",
    title: "Custom Invoicing Engine",
    status: "LIVE",
    desc: "Rechnungstool für BS Montagen. Kunden, Projekte, Positionen, PDF-Export — 0 € Lizenzkosten.",
    icon: Terminal,
    color: "#ff5722",
  },
  {
    id: "voice",
    code: "VOX-03",
    title: "Voice-Agent Prototype",
    status: "ALPHA",
    desc: "Telefon-AI, die Termine bucht und Rückfragen beantwortet. Latenz <400ms, deutsche Stimme.",
    icon: Cpu,
    color: "#00e5ff",
  },
  {
    id: "reels",
    code: "REEL-11",
    title: "AI Reels Pipeline",
    status: "ALPHA",
    desc: "Von Text-Prompt zu fertigem Instagram-Reel: Video-Gen, Voice-Over, Cut, Musik, Auto-Post.",
    icon: Zap,
    color: "#ffeb3b",
  },
  {
    id: "shadow",
    code: "SHADOW-α",
    title: "Shadow Analytics",
    status: "PROTOTYPE",
    desc: "Cookieless Session-Replay + AI-Zusammenfassung: was Besucher WIRKLICH suchen, ohne Tracking-Consent.",
    icon: Eye,
    color: "#c084fc",
  },
  {
    id: "vault",
    code: "VAULT-??",
    title: "[REDACTED]",
    status: "CLASSIFIED",
    desc: "Zugriff verweigert. Clearance-Level unzureichend.",
    icon: Lock,
    color: "#545454",
  },
];

const STATUS_COLOR: Record<Experiment["status"], string> = {
  LIVE: "bg-[#10b981] text-black",
  ALPHA: "bg-[#ffeb3b] text-black",
  PROTOTYPE: "bg-[#ff5722] text-white",
  CLASSIFIED: "bg-[#0a0a0a] text-[#ff5722]",
};

function Lab() {
  const [time, setTime] = useState("");
  useEffect(() => {
    const t = () =>
      setTime(
        new Date().toLocaleTimeString("de-DE", { hour12: false }) +
          " · " +
          new Date().toLocaleDateString("de-DE"),
      );
    t();
    const i = setInterval(t, 1000);
    return () => clearInterval(i);
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans">
      {/* Scanlines / grid background */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.06]"
        style={{
          backgroundImage:
            "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      {/* Top bar */}
      <div className="relative z-10 border-b-2 border-white/20 bg-[#0a0a0a]">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-3 flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-1.5 hover:text-[#ffeb3b] transition-colors">
              <ArrowLeft className="w-3.5 h-3.5" /> EXIT
            </Link>
            <span className="hidden md:inline text-white/40">SECURE CHANNEL · TLS 1.3</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-[#10b981] animate-pulse" />
              CONNECTED
            </span>
            <span className="text-white/60">{time}</span>
          </div>
        </div>
      </div>

      {/* Header */}
      <header className="relative z-10 max-w-7xl mx-auto px-4 md:px-8 pt-10 md:pt-16 pb-8">
        <div className="flex items-center gap-3 mb-4 font-mono text-xs">
          <Beaker className="w-4 h-4 text-[#ffeb3b]" />
          <span className="text-[#ffeb3b]">CLASSIFIED · INTERNAL R&D</span>
          <span className="text-white/30">//</span>
          <span className="text-white/60">KSE.LAB.v0.7.3</span>
        </div>
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-display font-black uppercase tracking-tighter text-5xl md:text-7xl leading-[0.85]"
        >
          The <span className="text-[#ffeb3b]">Lab</span>
        </motion.h1>
        <p className="mt-6 max-w-2xl text-white/70 text-base md:text-lg leading-relaxed">
          Willkommen im Maschinenraum der KSE Group. Hier leben Prototypen, verworfene Ideen und
          Systeme, die noch nicht auf der Preisliste stehen. Manches läuft schon live, anderes ist —
          sagen wir mal — noch nicht bereit für die Öffentlichkeit.
        </p>
      </header>

      {/* Grid */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 md:px-8 pb-24">
        <div className="grid gap-4 md:gap-6 md:grid-cols-2 lg:grid-cols-3">
          {EXPERIMENTS.map((exp, i) => {
            const Icon = exp.icon;
            const isClassified = exp.status === "CLASSIFIED";
            return (
              <motion.article
                key={exp.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`relative border-2 border-white/20 bg-black/40 backdrop-blur-sm p-6 hover:border-white/60 transition-colors group ${
                  isClassified ? "overflow-hidden" : ""
                }`}
              >
                {isClassified && (
                  <div
                    className="absolute inset-0 pointer-events-none opacity-40"
                    style={{
                      backgroundImage:
                        "repeating-linear-gradient(45deg, transparent 0 8px, #ff5722 8px 10px)",
                    }}
                  />
                )}
                <div className="relative flex items-start justify-between mb-4">
                  <div
                    className="grid place-items-center h-10 w-10 border-2 border-white/40"
                    style={{ background: exp.color, color: "#0a0a0a" }}
                  >
                    <Icon className="w-5 h-5" strokeWidth={2.5} />
                  </div>
                  <span
                    className={`text-[10px] font-mono font-bold px-2 py-1 tracking-wider ${STATUS_COLOR[exp.status]}`}
                  >
                    {exp.status}
                  </span>
                </div>
                <div className="relative font-mono text-[10px] text-white/50 tracking-wider mb-1">
                  {exp.code}
                </div>
                <h3 className="relative font-display font-black text-xl uppercase tracking-tight leading-tight">
                  {exp.title}
                </h3>
                <p className="relative mt-3 text-sm text-white/70 leading-relaxed">{exp.desc}</p>
              </motion.article>
            );
          })}
        </div>

        {/* Footer transmission */}
        <div className="mt-16 border-t-2 border-white/20 pt-6 font-mono text-xs text-white/40 space-y-1">
          <div>&gt; TRANSMISSION_END</div>
          <div>&gt; If you found this page, you're either curious or one of us. Both is fine.</div>
          <div>&gt; Contact: hallo@ksegroup.eu · Signal: on request</div>
        </div>
      </main>
    </div>
  );
}