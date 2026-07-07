import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Beaker,
  Radio,
  Cpu,
  Zap,
  Lock,
  Eye,
  ArrowLeft,
  Terminal,
  Activity,
  Wifi,
  HardDrive,
  Gauge,
  ChevronRight,
  Send,
  KeyRound,
  Sparkles,
  Bot,
  FileCode,
  Waves,
  BrainCircuit,
} from "lucide-react";
import { LabDemo } from "@/components/lab/LabDemo";

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
  progress: number;
  stack: string[];
  metrics?: { label: string; value: string }[];
  log?: string;
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
    progress: 96,
    stack: ["Gemini 2.5", "Edge Fn", "Streaming", "TanStack"],
    metrics: [
      { label: "Avg. Latency", value: "312ms" },
      { label: "Sessions/24h", value: "184" },
      { label: "Handoff-Rate", value: "18%" },
    ],
    log: "nova ready · 184 sessions today · avg 312ms",
  },
  {
    id: "invoicer",
    code: "BS-01",
    title: "Custom Invoicing Engine",
    status: "LIVE",
    desc: "Rechnungstool für BS Montagen. Kunden, Projekte, Positionen, PDF-Export — 0 € Lizenzkosten.",
    icon: Terminal,
    color: "#ff5722",
    progress: 100,
    stack: ["React", "Supabase", "PDF-Lib", "RLS"],
    metrics: [
      { label: "Rechnungen", value: "247+" },
      { label: "Lizenzkosten", value: "0 €" },
      { label: "Gespart / Jahr", value: "~2.4k €" },
    ],
    log: "invoicer stable · last deploy 3d ago · 0 errors",
  },
  {
    id: "voice",
    code: "VOX-03",
    title: "Voice-Agent Prototype",
    status: "ALPHA",
    desc: "Telefon-AI, die Termine bucht und Rückfragen beantwortet. Latenz <400ms, deutsche Stimme.",
    icon: Cpu,
    color: "#00e5ff",
    progress: 62,
    stack: ["Twilio", "Deepgram", "OpenAI RT", "Cal.com"],
    metrics: [
      { label: "Round-Trip", value: "380ms" },
      { label: "Erfolgsquote", value: "71%" },
      { label: "Test-Calls", value: "42" },
    ],
    log: "vox alpha · tuning barge-in threshold · 71% success",
  },
  {
    id: "reels",
    code: "REEL-11",
    title: "AI Reels Pipeline",
    status: "ALPHA",
    desc: "Von Text-Prompt zu fertigem Instagram-Reel: Video-Gen, Voice-Over, Cut, Musik, Auto-Post.",
    icon: Zap,
    color: "#ffeb3b",
    progress: 48,
    stack: ["Runway", "ElevenLabs", "FFmpeg", "IG Graph"],
    metrics: [
      { label: "Render-Zeit", value: "~4min" },
      { label: "Cost / Reel", value: "0.62 €" },
      { label: "Reels ausgeliefert", value: "31" },
    ],
    log: "reel pipeline queue: 3 · last render 3m 42s",
  },
  {
    id: "shadow",
    code: "SHADOW-α",
    title: "Shadow Analytics",
    status: "PROTOTYPE",
    desc: "Cookieless Session-Replay + AI-Zusammenfassung: was Besucher WIRKLICH suchen, ohne Tracking-Consent.",
    icon: Eye,
    color: "#c084fc",
    progress: 34,
    stack: ["rrweb", "Edge KV", "Gemini", "DuckDB"],
    metrics: [
      { label: "Payload/Session", value: "~14kb" },
      { label: "Consent nötig?", value: "Nein" },
      { label: "Insight-Delay", value: "60s" },
    ],
    log: "shadow prototype · consent-free · 14kb / session",
  },
  {
    id: "forge",
    code: "FORGE-04",
    title: "Brand Forge",
    status: "PROTOTYPE",
    desc: "AI generiert komplette Corporate Designs — Logo-Varianten, Farbsystem, Type-Pairing, Tokens als CSS-Export.",
    icon: Sparkles,
    color: "#f472b6",
    progress: 41,
    stack: ["SDXL", "Gemini", "OKLCH", "Figma API"],
    metrics: [
      { label: "Varianten/Run", value: "24" },
      { label: "Export", value: "CSS · JSON" },
      { label: "Dauer", value: "~90s" },
    ],
    log: "forge idle · last brand run: kompakt-holz.de · 22 assets",
  },
  {
    id: "hive",
    code: "HIVE-09",
    title: "Agent-Swarm Orchestrator",
    status: "ALPHA",
    desc: "Mehrere spezialisierte Agents (Research, Writer, Reviewer, Publisher) koordinieren einen Auftrag end-to-end.",
    icon: BrainCircuit,
    color: "#22d3ee",
    progress: 55,
    stack: ["Gemini 2.5", "LangGraph", "Redis", "Cron"],
    metrics: [
      { label: "Agents", value: "4 aktiv" },
      { label: "Jobs/Tag", value: "18" },
      { label: "Autonomie", value: "82%" },
    ],
    log: "hive · 4 agents · queue empty · last cycle 12min",
  },
  {
    id: "atlas",
    code: "ATLAS-02",
    title: "Local SEO Autopilot",
    status: "ALPHA",
    desc: "Scannt GMB-Profile, Bewertungen & lokale Konkurrenz — schlägt wöchentlich Actions vor und schreibt Replies.",
    icon: Waves,
    color: "#10b981",
    progress: 58,
    stack: ["Places API", "Semrush", "Gemini", "Cron"],
    metrics: [
      { label: "Profile", value: "6" },
      { label: "Auto-Replies", value: "23" },
      { label: "Ø Reaktion", value: "< 2h" },
    ],
    log: "atlas nightly run OK · 2 new reviews handled",
  },
  {
    id: "scribe",
    code: "SCRIBE-06",
    title: "Doc-to-App Compiler",
    status: "PROTOTYPE",
    desc: "Aus einem PDF-Briefing (Formular, Prozess, Formel) wird eine funktionierende Web-App inkl. DB-Schema.",
    icon: FileCode,
    color: "#fb923c",
    progress: 28,
    stack: ["Pdf-Parse", "Gemini", "TanStack", "Supabase"],
    metrics: [
      { label: "Erfolg/Test", value: "6 / 10" },
      { label: "Dauer", value: "~7min" },
      { label: "LoC generiert", value: "~1.4k" },
    ],
    log: "scribe · dogfooding in progress · 6/10 clean",
  },
  {
    id: "vault",
    code: "VAULT-??",
    title: "[REDACTED]",
    status: "CLASSIFIED",
    desc: "Zugriff verweigert. Clearance-Level unzureichend.",
    icon: Lock,
    color: "#545454",
    progress: 0,
    stack: ["███", "██████", "████"],
    log: "vault · access denied · incident logged",
  },
];

const BOOT_LINES = [
  "$ kse-lab --boot --secure",
  "[ok] mounting /dev/ideas",
  "[ok] linking agents.registry (4 online)",
  "[ok] handshake · lovable-cloud · TLS 1.3",
  "[ok] loading experiments.json (10 records)",
  "[warn] 1 record classified — redacting",
  "[ok] transmission channel ready",
  "> welcome, operator.",
];

const CODEX = [
  { k: "01", t: "Ship it before it's ready.", d: "Perfektion ist ein Excuse. Wir shippen v0.1, dann v0.2." },
  { k: "02", t: "Own the stack.", d: "Kein Vendor-Lock. Was wir nicht bauen können, verstehen wir nicht." },
  { k: "03", t: "Automate the boring part.", d: "Wenn wir es zweimal machen, baut jemand ein Skript." },
  { k: "04", t: "Craft beats trends.", d: "Typo, Timing, Spacing. Der Rest ist Dekoration." },
  { k: "05", t: "Every project is R&D.", d: "Jeder Kunde bekommt das, was wir gestern gelernt haben." },
];

const ROADMAP = [
  { q: "Q3 · 2026", t: "NOVA v2 · Multi-Language", state: "in progress" },
  { q: "Q3 · 2026", t: "VOX Public Beta (DE-Only)", state: "in progress" },
  { q: "Q4 · 2026", t: "SHADOW Analytics Rollout", state: "planned" },
  { q: "Q4 · 2026", t: "HIVE Orchestrator · SDK", state: "planned" },
  { q: "Q1 · 2027", t: "SCRIBE Public Alpha", state: "research" },
];

const STATUS_COLOR: Record<Experiment["status"], string> = {
  LIVE: "bg-[#10b981] text-black",
  ALPHA: "bg-[#ffeb3b] text-black",
  PROTOTYPE: "bg-[#ff5722] text-white",
  CLASSIFIED: "bg-[#0a0a0a] text-[#ff5722]",
};

function useTicker() {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const i = setInterval(() => setTick((t) => t + 1), 1200);
    return () => clearInterval(i);
  }, []);
  return tick;
}

function Lab() {
  const [time, setTime] = useState("");
  const [active, setActive] = useState<Experiment | null>(null);
  const [tab, setTab] = useState<"dossier" | "test">("dossier");
  const [bootDone, setBootDone] = useState(false);
  const [bootIdx, setBootIdx] = useState(0);
  const [vaultInput, setVaultInput] = useState("");
  const [vaultShake, setVaultShake] = useState(false);
  const [vaultUnlocked, setVaultUnlocked] = useState(false);
  const [query, setQuery] = useState("");
  const tick = useTicker();

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

  // reset modal tab when experiment changes
  useEffect(() => {
    setTab("dossier");
  }, [active?.id]);

  useEffect(() => {
    if (bootIdx >= BOOT_LINES.length) {
      const t = setTimeout(() => setBootDone(true), 350);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setBootIdx((i) => i + 1), 180);
    return () => clearTimeout(t);
  }, [bootIdx]);

  const stats = useMemo(() => {
    const seed = tick;
    const j = (base: number, amp: number) =>
      Math.round(base + Math.sin(seed * 0.7) * amp + Math.cos(seed * 1.3) * (amp / 2));
    return {
      cpu: Math.max(4, Math.min(96, j(32, 14))),
      mem: Math.max(20, Math.min(88, j(54, 8))),
      net: Math.max(1, Math.min(240, j(80, 40))),
      agents: 4,
    };
  }, [tick]);

  const filtered = query
    ? EXPERIMENTS.filter(
        (e) =>
          e.title.toLowerCase().includes(query.toLowerCase()) ||
          e.code.toLowerCase().includes(query.toLowerCase()) ||
          e.desc.toLowerCase().includes(query.toLowerCase()),
      )
    : EXPERIMENTS;

  const tryVault = () => {
    if (vaultInput.trim().toLowerCase() === "kse//lovable") {
      setVaultUnlocked(true);
    } else {
      setVaultShake(true);
      setTimeout(() => setVaultShake(false), 500);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans">
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.06]"
        style={{
          backgroundImage:
            "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />
      <div
        className="fixed inset-0 pointer-events-none z-[1] mix-blend-overlay opacity-[0.08]"
        style={{
          backgroundImage: "repeating-linear-gradient(0deg, #fff 0 1px, transparent 1px 3px)",
        }}
      />

      <AnimatePresence>
        {!bootDone && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="fixed inset-0 z-50 bg-[#0a0a0a] flex items-center justify-center px-6"
          >
            <div className="w-full max-w-xl font-mono text-sm space-y-1">
              {BOOT_LINES.slice(0, bootIdx).map((l, i) => {
                const isOk = l.startsWith("[ok]");
                const isWarn = l.startsWith("[warn]");
                const isPrompt = l.startsWith(">");
                return (
                  <div
                    key={i}
                    className={
                      isOk
                        ? "text-[#10b981]"
                        : isWarn
                          ? "text-[#ffeb3b]"
                          : isPrompt
                            ? "text-[#ff5722]"
                            : "text-white/70"
                    }
                  >
                    {l}
                  </div>
                );
              })}
              <div className="text-[#ffeb3b]">
                <span className="inline-block animate-pulse">▊</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative z-10 border-b-2 border-white/20 bg-[#0a0a0a]">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-3 flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-1.5 hover:text-[#ffeb3b] transition-colors">
              <ArrowLeft className="w-3.5 h-3.5" /> EXIT
            </Link>
            <span className="hidden md:inline text-white/40">SECURE CHANNEL · TLS 1.3</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden md:inline text-white/40">
              OP: guest_{("0000" + (tick % 9999)).slice(-4)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-[#10b981] animate-pulse" />
              CONNECTED
            </span>
            <span className="text-white/60">{time}</span>
          </div>
        </div>
      </div>

      <header className="relative z-10 max-w-7xl mx-auto px-4 md:px-8 pt-10 md:pt-16 pb-8">
        <div className="flex items-center gap-3 mb-4 font-mono text-xs">
          <Beaker className="w-4 h-4 text-[#ffeb3b]" />
          <span className="text-[#ffeb3b]">CLASSIFIED · INTERNAL R&D</span>
          <span className="text-white/30">//</span>
          <span className="text-white/60">KSE.LAB.v0.7.3</span>
        </div>
        <div className="grid md:grid-cols-[1.4fr_1fr] gap-8 items-end">
          <div>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="font-display font-black uppercase tracking-tighter text-6xl md:text-8xl leading-[0.82]"
            >
              The <span className="text-[#ffeb3b]">Lab</span>
              <span className="text-[#ff5722]">.</span>
            </motion.h1>
            <p className="mt-6 max-w-2xl text-white/70 text-base md:text-lg leading-relaxed">
              Willkommen im Maschinenraum der KSE Group. Hier leben Prototypen, verworfene Ideen und
              Systeme, die noch nicht auf der Preisliste stehen. Manches läuft schon live, anderes ist —
              sagen wir mal — noch nicht bereit für die Öffentlichkeit.
            </p>
          </div>

          <div className="border-2 border-white/20 bg-black/60 p-4 font-mono text-xs">
            <div className="flex items-center justify-between mb-3 text-white/60">
              <span className="inline-flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-[#10b981]" /> SYSTEM · LIVE
              </span>
              <span>uptime 41d</span>
            </div>
            <StatBar icon={Gauge} label="CPU" value={stats.cpu} unit="%" color="#ffeb3b" />
            <StatBar icon={HardDrive} label="MEM" value={stats.mem} unit="%" color="#ff5722" />
            <StatBar icon={Wifi} label="NET" value={stats.net} unit="mb/s" color="#10b981" max={240} />
            <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between text-white/60">
              <span>agents online</span>
              <span className="text-white">{stats.agents}</span>
            </div>
          </div>
        </div>
      </header>

      <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-8 mb-6">
        <div className="border-2 border-white/20 bg-black/40 flex items-center gap-3 px-4 py-2 font-mono text-xs">
          <ChevronRight className="w-3.5 h-3.5 text-[#ffeb3b]" />
          <span className="text-white/40">query</span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="grep experiments · try 'ai' or 'voice'"
            className="flex-1 bg-transparent outline-none placeholder:text-white/30 text-white"
          />
          <span className="text-white/40">
            {filtered.length}/{EXPERIMENTS.length}
          </span>
        </div>
      </div>

      <main className="relative z-10 max-w-7xl mx-auto px-4 md:px-8 pb-24">
        <div className="grid gap-4 md:gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((exp, i) => {
            const Icon = exp.icon;
            const isClassified = exp.status === "CLASSIFIED";
            return (
              <motion.article
                key={exp.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: bootDone ? i * 0.04 : 0 }}
                onClick={() => {
                  if (isClassified) return;
                  setActive(exp);
                  setTab("test");
                }}
                className={`relative border-2 border-white/20 bg-black/40 backdrop-blur-sm p-6 hover:border-white/70 hover:bg-black/60 transition-all group cursor-pointer ${
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
                    className="grid place-items-center h-10 w-10 border-2 border-white/40 group-hover:border-white transition-colors"
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
                <h3 className="relative font-display font-black text-xl uppercase tracking-tight leading-tight group-hover:text-[#ffeb3b] transition-colors">
                  {exp.title}
                </h3>
                <p className="relative mt-3 text-sm text-white/70 leading-relaxed">{exp.desc}</p>

                {!isClassified && (
                  <>
                    <div className="relative mt-5">
                      <div className="flex items-center justify-between font-mono text-[10px] text-white/50 mb-1.5">
                        <span>PROGRESS</span>
                        <span className="text-white/80">{exp.progress}%</span>
                      </div>
                      <div className="h-1.5 bg-white/10 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${exp.progress}%` }}
                          transition={{ duration: 1.2, ease: "easeOut", delay: 0.2 }}
                          className="h-full"
                          style={{ background: exp.color }}
                        />
                      </div>
                    </div>
                    <div className="relative mt-4 flex flex-wrap gap-1.5">
                      {exp.stack.slice(0, 4).map((s) => (
                        <span
                          key={s}
                          className="text-[10px] font-mono px-1.5 py-0.5 border border-white/20 text-white/60"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                    <div className="relative mt-4 inline-flex items-center gap-1 text-[10px] font-mono text-white/40 group-hover:text-[#ffeb3b] transition-colors">
                      TESTMODUS ÖFFNEN <ChevronRight className="w-3 h-3" />
                    </div>
                  </>
                )}
              </motion.article>
            );
          })}
        </div>

        <section className="mt-16 grid gap-6 lg:grid-cols-[1.2fr_1fr]">
          <div className="border-2 border-white/20 bg-black/40 p-5">
            <div className="flex items-center justify-between mb-4 font-mono text-xs">
              <span className="inline-flex items-center gap-2 text-[#ffeb3b]">
                <Activity className="w-3.5 h-3.5" /> LIVE FEED · /var/log/kse
              </span>
              <span className="text-white/40">tail -f</span>
            </div>
            <div className="font-mono text-xs space-y-1.5">
              {EXPERIMENTS.filter((e) => e.log).map((e) => (
                <div key={e.id} className="flex gap-3">
                  <span className="text-white/40 shrink-0">
                    {String((tick + e.id.length) % 24).padStart(2, "0")}:
                    {String((tick * 7 + e.id.length * 3) % 60).padStart(2, "0")}
                  </span>
                  <span className="shrink-0 font-bold" style={{ color: e.color }}>
                    [{e.code}]
                  </span>
                  <span className="text-white/70">{e.log}</span>
                </div>
              ))}
              <div className="flex gap-2 text-[#10b981]">
                <span>&gt;</span>
                <span className="inline-block animate-pulse">▊</span>
              </div>
            </div>
          </div>

          <div className="border-2 border-white/20 bg-black/40 p-5">
            <div className="flex items-center justify-between mb-4 font-mono text-xs">
              <span className="inline-flex items-center gap-2 text-[#ff5722]">
                <Bot className="w-3.5 h-3.5" /> ROADMAP · TRANSMISSION
              </span>
              <span className="text-white/40">unclassified</span>
            </div>
            <ul className="space-y-3">
              {ROADMAP.map((r) => (
                <li key={r.t} className="flex items-start gap-3 border-l-2 border-white/20 pl-3">
                  <div className="flex-1">
                    <div className="font-mono text-[10px] text-white/40">{r.q}</div>
                    <div className="text-sm text-white font-medium">{r.t}</div>
                  </div>
                  <span
                    className={`text-[9px] font-mono px-1.5 py-0.5 tracking-wider ${
                      r.state === "in progress"
                        ? "bg-[#ffeb3b] text-black"
                        : r.state === "planned"
                          ? "bg-white/10 text-white/70"
                          : "bg-[#ff5722] text-white"
                    }`}
                  >
                    {r.state.toUpperCase()}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="mt-16">
          <div className="flex items-center gap-3 mb-6 font-mono text-xs">
            <Sparkles className="w-4 h-4 text-[#ffeb3b]" />
            <span className="text-[#ffeb3b]">THE CODEX · HOW WE BUILD</span>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            {CODEX.map((c) => (
              <div
                key={c.k}
                className="border-2 border-white/20 bg-black/40 p-5 hover:border-[#ffeb3b] transition-colors"
              >
                <div className="font-mono text-xs text-[#ff5722]">§{c.k}</div>
                <div className="mt-2 font-display font-black text-lg uppercase leading-tight">
                  {c.t}
                </div>
                <div className="mt-2 text-xs text-white/60 leading-relaxed">{c.d}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-16">
          <motion.div
            animate={vaultShake ? { x: [0, -8, 8, -6, 6, 0] } : {}}
            transition={{ duration: 0.4 }}
            className="relative border-2 border-[#ff5722] bg-black/60 p-6 md:p-8 overflow-hidden"
          >
            <div
              className="absolute inset-0 pointer-events-none opacity-20"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(45deg, transparent 0 12px, #ff5722 12px 14px)",
              }}
            />
            <div className="relative grid md:grid-cols-[1fr_auto] gap-6 items-center">
              <div>
                <div className="font-mono text-xs text-[#ff5722] mb-2 inline-flex items-center gap-2">
                  <Lock className="w-3.5 h-3.5" /> VAULT-?? · CLEARANCE REQUIRED
                </div>
                <h3 className="font-display font-black text-3xl md:text-4xl uppercase leading-tight">
                  {vaultUnlocked ? "Access granted." : "Restricted area."}
                </h3>
                <p className="mt-2 text-sm text-white/60 max-w-md">
                  {vaultUnlocked
                    ? "Nice. Du hast den Hint gefunden — schreib uns kurz, wir zeigen dir das echte Zeug."
                    : "Nur für interne Ops. Wenn du das Passwort nicht kennst, ist das schon die Antwort."}
                </p>
              </div>
              {!vaultUnlocked ? (
                <div className="flex items-center gap-2 font-mono">
                  <div className="flex items-center gap-2 border-2 border-white/30 bg-black px-3 py-2">
                    <KeyRound className="w-4 h-4 text-[#ffeb3b]" />
                    <input
                      type="password"
                      value={vaultInput}
                      onChange={(e) => setVaultInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && tryVault()}
                      placeholder="password"
                      className="bg-transparent outline-none text-sm w-48 placeholder:text-white/30"
                    />
                  </div>
                  <button
                    onClick={tryVault}
                    className="border-2 border-[#ffeb3b] bg-[#ffeb3b] text-black px-4 py-2 text-xs font-bold uppercase tracking-wider hover:bg-transparent hover:text-[#ffeb3b] transition-colors inline-flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" /> Submit
                  </button>
                </div>
              ) : (
                <a
                  href="mailto:hallo@ksegroup.eu?subject=Vault%20unlocked"
                  className="border-2 border-[#10b981] bg-[#10b981] text-black px-4 py-2 text-xs font-bold uppercase tracking-wider hover:bg-transparent hover:text-[#10b981] transition-colors inline-flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" /> Kontakt aufnehmen
                </a>
              )}
            </div>
          </motion.div>
        </section>

        <div className="mt-16 border-t-2 border-white/20 pt-6 font-mono text-xs text-white/40 space-y-1">
          <div>&gt; TRANSMISSION_END</div>
          <div>&gt; If you found this page, you're either curious or one of us. Both is fine.</div>
          <div>&gt; Contact: hallo@ksegroup.eu · Signal: on request</div>
        </div>
      </main>

      <AnimatePresence>
        {active && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setActive(null)}
            className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.98 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-3xl max-h-[92vh] overflow-y-auto border-2 border-white/30 bg-[#0a0a0a] p-6 md:p-8 relative"
            >
              <div className="absolute -top-3 left-4 bg-[#0a0a0a] px-2 font-mono text-[10px] text-[#ffeb3b] tracking-widest">
                {tab === "test" ? "TESTMODUS" : "DOSSIER"} · {active.code}
              </div>
              <button
                onClick={() => setActive(null)}
                className="absolute top-3 right-3 text-white/50 hover:text-white text-xs font-mono"
              >
                [ESC]
              </button>
              <div className="flex items-start gap-4">
                <div
                  className="grid place-items-center h-14 w-14 border-2 border-white/40 shrink-0"
                  style={{ background: active.color, color: "#0a0a0a" }}
                >
                  <active.icon className="w-7 h-7" strokeWidth={2.5} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 tracking-wider ${STATUS_COLOR[active.status]}`}
                    >
                      {active.status}
                    </span>
                    <span className="font-mono text-[10px] text-white/40">
                      {active.progress}% complete
                    </span>
                  </div>
                  <h3 className="font-display font-black text-2xl md:text-3xl uppercase leading-tight">
                    {active.title}
                  </h3>
                </div>
              </div>

              {/* Tabs */}
              <div className="mt-5 flex gap-0 border-b-2 border-white/20 font-mono text-xs">
                <button
                  onClick={() => setTab("test")}
                  className={`px-4 py-2 border-b-2 -mb-0.5 uppercase tracking-wider transition-colors ${
                    tab === "test"
                      ? "border-[#ffeb3b] text-[#ffeb3b]"
                      : "border-transparent text-white/50 hover:text-white"
                  }`}
                >
                  ▶ Testmodus
                </button>
                <button
                  onClick={() => setTab("dossier")}
                  className={`px-4 py-2 border-b-2 -mb-0.5 uppercase tracking-wider transition-colors ${
                    tab === "dossier"
                      ? "border-[#ff5722] text-[#ff5722]"
                      : "border-transparent text-white/50 hover:text-white"
                  }`}
                >
                  Dossier
                </button>
              </div>

              {tab === "test" && (
                <div className="mt-5">
                  <p className="text-xs text-white/50 mb-3 font-mono">
                    ▸ Sandbox — spiel damit rum. Kein Login, keine echten Daten, kein Risiko.
                  </p>
                  <LabDemo id={active.id} />
                </div>
              )}

              {tab === "dossier" && (
                <div className="mt-5">
                  <p className="text-sm text-white/70 leading-relaxed">{active.desc}</p>

                  {active.metrics && (
                    <div className="mt-5 grid grid-cols-3 border-2 border-white/20">
                      {active.metrics.map((m, i) => (
                        <div
                          key={m.label}
                          className={`p-3 ${i < active.metrics!.length - 1 ? "border-r-2 border-white/20" : ""}`}
                        >
                          <div className="font-mono text-[10px] text-white/40 uppercase">{m.label}</div>
                          <div className="mt-1 font-display font-black text-lg text-[#ffeb3b]">
                            {m.value}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="mt-5">
                    <div className="font-mono text-[10px] text-white/40 mb-2 uppercase">Stack</div>
                    <div className="flex flex-wrap gap-1.5">
                      {active.stack.map((s) => (
                        <span
                          key={s}
                          className="text-xs font-mono px-2 py-1 border border-white/30 text-white/80"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>

                  {active.log && (
                    <div className="mt-5 border-2 border-white/20 bg-black p-3 font-mono text-xs text-[#10b981]">
                      <span className="text-white/40">$ tail -1 {active.id}.log</span>
                      <div className="mt-1">{active.log}</div>
                    </div>
                  )}

                  <div className="mt-5 flex items-center justify-between font-mono text-[10px] text-white/40">
                    <span>classification · internal</span>
                    <span>last update · {tick % 60}s ago</span>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatBar({
  icon: Icon,
  label,
  value,
  unit,
  color,
  max = 100,
}: {
  icon: typeof Beaker;
  label: string;
  value: number;
  unit: string;
  color: string;
  max?: number;
}) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div className="mb-2 last:mb-0">
      <div className="flex items-center justify-between mb-1 text-white/60">
        <span className="inline-flex items-center gap-1.5">
          <Icon className="w-3 h-3" /> {label}
        </span>
        <span className="text-white">
          {value}
          <span className="text-white/40 ml-0.5">{unit}</span>
        </span>
      </div>
      <div className="h-1 bg-white/10 overflow-hidden">
        <motion.div
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="h-full"
          style={{ background: color }}
        />
      </div>
    </div>
  );
}