import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Brain,
  PenTool,
  Layers,
  CalendarClock,
  Palette,
  Loader2,
  Play,
  Sparkles,
  Radio,
} from "lucide-react";

export const Route = createFileRoute("/agent-swarm")({
  head: () => ({
    meta: [
      { title: "Agent Swarm Demo — KSE GROUP" },
      {
        name: "description",
        content:
          "Live-Demo: 5 spezialisierte AI-Agents arbeiten parallel an deinem Projekt-Brief. Strategie, Copy, Architektur, Timeline, Design — in Echtzeit.",
      },
      { property: "og:title", content: "Agent Swarm Demo — KSE GROUP" },
      {
        property: "og:description",
        content: "5 AI-Agents. 1 Brief. Live-Orchestrierung im Browser.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AgentSwarmPage,
});

type AgentName = "NOVA" | "VOX" | "SCRIBE" | "ATLAS" | "PIXEL";
type Agent = {
  name: AgentName;
  role: string;
  thinking: string[];
  output: { headline: string; items: string[] };
};
type SwarmResult = {
  projectCode: string;
  brief: string;
  agents: Agent[];
  synthesis: string;
};

const AGENT_META: Record<AgentName, { icon: typeof Brain; color: string; bg: string }> = {
  NOVA: { icon: Brain, color: "#ff5722", bg: "#fff3ef" },
  VOX: { icon: PenTool, color: "#0a0a0a", bg: "#ffeb3b" },
  SCRIBE: { icon: Layers, color: "#2563eb", bg: "#eff6ff" },
  ATLAS: { icon: CalendarClock, color: "#16a34a", bg: "#f0fdf4" },
  PIXEL: { icon: Palette, color: "#a855f7", bg: "#faf5ff" },
};

const EXAMPLE_BRIEFS = [
  "Zahnarztpraxis in Hamburg braucht Website mit Online-Terminbuchung, Team-Vorstellung und modernem Look. Zielgruppe: 30-50, Familien.",
  "Restaurant will Speisekarte online, Tisch-Reservierung per WhatsApp, mehrsprachig. Fokus: italienische Küche, mittleres Preissegment.",
  "B2B-Softwarefirma braucht Landingpage für neues SaaS-Tool: Rechnungs-Automation für Handwerker. Muss Trust vermitteln.",
];

function AgentSwarmPage() {
  const [brief, setBrief] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SwarmResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [phase, setPhase] = useState<"idle" | "dispatching" | "working" | "done">("idle");

  async function run(e: React.FormEvent) {
    e.preventDefault();
    if (!brief.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setPhase("dispatching");
    try {
      // Small delay so the "dispatch" phase is visible
      await new Promise((r) => setTimeout(r, 500));
      setPhase("working");
      const res = await fetch("/api/agent-swarm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brief: brief.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Swarm fehlgeschlagen");
      setResult(data as SwarmResult);
      setPhase("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unbekannter Fehler");
      setPhase("idle");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <header className="border-b-2 border-white/10">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 md:px-8">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-white/70 hover:text-[#ff5722]"
          >
            <ArrowLeft className="h-4 w-4" /> KSE GROUP
          </Link>
          <span className="rounded-full border-2 border-[#ff5722] bg-[#ff5722]/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-[#ff5722]">
            Live Demo
          </span>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 py-12 md:px-8 md:py-16">
        <div className="flex items-center gap-3 text-xs font-mono uppercase tracking-widest text-[#ff5722]">
          <Radio className="h-4 w-4 animate-pulse" />
          <span>AGENT-SWARM · ORCHESTRATOR v0.9</span>
        </div>
        <h1 className="mt-4 font-[Space_Grotesk] text-5xl font-black leading-[0.95] tracking-tight md:text-7xl">
          5 Agents.
          <br />
          1 Brief.
          <span className="block text-[#ff5722]">Live orchestriert.</span>
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-white/60">
          Schreib einen Kunden-Brief. Fünf spezialisierte AI-Agents arbeiten parallel:
          Strategie, Copy, Architektur, Timeline, Design — und liefern konkrete
          Deliverables. So sieht Agent-Orchestrierung in echt aus.
        </p>

        <form onSubmit={run} className="mt-10 space-y-3">
          <textarea
            value={brief}
            onChange={(e) => setBrief(e.target.value)}
            rows={4}
            placeholder="z.B. Zahnarztpraxis braucht Website mit Online-Terminbuchung, Team-Vorstellung, modernem Look…"
            className="w-full resize-none border-2 border-white/20 bg-white/5 p-4 font-mono text-sm outline-none placeholder:text-white/30 focus:border-[#ff5722]"
            disabled={loading}
          />
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="submit"
              disabled={loading || !brief.trim()}
              className="inline-flex items-center gap-2 border-2 border-[#ff5722] bg-[#ff5722] px-6 py-3 text-sm font-black uppercase tracking-widest text-white transition-all hover:bg-transparent disabled:opacity-50"
            >
              {loading ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Swarm läuft</>
              ) : (
                <><Play className="h-4 w-4" /> Swarm starten</>
              )}
            </button>
            {!loading && !result && (
              <div className="flex flex-wrap gap-2">
                {EXAMPLE_BRIEFS.map((b, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setBrief(b)}
                    className="border border-white/20 bg-white/5 px-3 py-1.5 text-[11px] font-mono text-white/60 hover:border-[#ff5722] hover:text-[#ff5722]"
                  >
                    Beispiel {i + 1}
                  </button>
                ))}
              </div>
            )}
          </div>
        </form>

        {error && (
          <div className="mt-6 border-2 border-red-500 bg-red-500/10 p-4 font-mono text-sm text-red-300">
            <strong className="uppercase">Error:</strong> {error}
          </div>
        )}

        <div className="mt-12">
          {phase !== "idle" ? (
            <SwarmView phase={phase} result={result} />
          ) : (
            <div className="grid gap-4 md:grid-cols-5">
              {(Object.keys(AGENT_META) as AgentName[]).map((name) => {
                const meta = AGENT_META[name];
                const Icon = meta.icon;
                return (
                  <div key={name} className="border-2 border-white/20 bg-white/5 p-4">
                    <Icon className="h-5 w-5" style={{ color: meta.color }} />
                    <div className="mt-3 font-black">{name}</div>
                    <div className="mt-1 text-[11px] uppercase tracking-widest text-white/40">
                      {roleFor(name)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {result && (
          <div className="mt-10 flex flex-col items-start justify-between gap-4 border-4 border-[#ff5722] bg-white p-6 text-[#0a0a0a] md:flex-row md:items-center md:p-8">
            <div>
              <div className="text-xs font-mono uppercase tracking-widest text-[#ff5722]">
                Nächster Schritt
              </div>
              <div className="mt-1 font-[Space_Grotesk] text-xl font-black">
                Gefällt dir, wie das Team denkt? Buch ein echtes Projekt.
              </div>
            </div>
            <Link
              to="/konfigurator"
              className="inline-flex items-center gap-2 border-2 border-[#0a0a0a] bg-[#0a0a0a] px-6 py-3 text-sm font-black uppercase tracking-widest text-white hover:bg-[#ff5722]"
            >
              Konfigurator öffnen →
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}

function roleFor(name: AgentName): string {
  switch (name) {
    case "NOVA": return "Strategist";
    case "VOX": return "Copywriter";
    case "SCRIBE": return "Architect";
    case "ATLAS": return "Ops";
    case "PIXEL": return "Designer";
  }
}

function SwarmView({ phase, result }: { phase: "dispatching" | "working" | "done"; result: SwarmResult | null }) {
  const agents: AgentName[] = ["NOVA", "VOX", "SCRIBE", "ATLAS", "PIXEL"];
  return (
    <div className="space-y-4">
      {result && (
        <div className="mb-6 flex flex-wrap items-center gap-3 border-2 border-white/20 bg-white/5 p-4 font-mono text-xs">
          <span className="rounded-sm bg-[#ff5722] px-2 py-1 font-black uppercase tracking-widest">
            {result.projectCode}
          </span>
          <span className="text-white/70">{result.brief}</span>
        </div>
      )}
      <div className="grid gap-4 md:grid-cols-5">
        {agents.map((name, i) => {
          const agent = result?.agents?.find((a) => a.name === name);
          return (
            <AgentCard
              key={name}
              name={name}
              agent={agent}
              phase={phase}
              startDelay={i * 0.25}
            />
          );
        })}
      </div>

      {result?.synthesis && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-6 border-2 border-[#ffeb3b] bg-[#ffeb3b]/10 p-6"
        >
          <div className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[#ffeb3b]">
            <Sparkles className="h-4 w-4" /> Synthese
          </div>
          <p className="text-lg leading-relaxed">{result.synthesis}</p>
        </motion.div>
      )}
    </div>
  );
}

function AgentCard({
  name,
  agent,
  phase,
  startDelay,
}: {
  name: AgentName;
  agent?: Agent;
  phase: "dispatching" | "working" | "done";
  startDelay: number;
}) {
  const meta = AGENT_META[name];
  const Icon = meta.icon;

  // Cycle through thinking fragments while working
  const [thoughtIdx, setThoughtIdx] = useState(0);
  const workingThoughts = useMemo(
    () => [
      "Initialisiere Kontext…",
      "Parse Anfrage…",
      "Baue Zusammenhänge…",
      "Formuliere Output…",
    ],
    [],
  );

  useEffect(() => {
    if (phase !== "working") return;
    const id = setInterval(() => setThoughtIdx((i) => (i + 1) % workingThoughts.length), 900);
    return () => clearInterval(id);
  }, [phase, workingThoughts.length]);

  const isDone = phase === "done" && !!agent;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: startDelay }}
      className="flex flex-col border-2 bg-white/5"
      style={{ borderColor: isDone ? meta.color : "rgba(255,255,255,0.15)" }}
    >
      <div className="flex items-center justify-between border-b-2 p-3" style={{ borderColor: isDone ? meta.color : "rgba(255,255,255,0.15)", background: isDone ? meta.color : "transparent" }}>
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4" style={{ color: isDone ? "#0a0a0a" : meta.color }} />
          <div className="font-black text-sm" style={{ color: isDone ? "#0a0a0a" : "white" }}>{name}</div>
        </div>
        <StatusDot phase={phase} isDone={isDone} />
      </div>

      <div className="p-3">
        <div className="text-[10px] uppercase tracking-widest text-white/40">
          {roleFor(name)}
        </div>

        {!isDone && (
          <div className="mt-3 min-h-[80px] font-mono text-[11px] text-white/50">
            <AnimatePresence mode="wait">
              <motion.div
                key={thoughtIdx}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.3 }}
              >
                › {phase === "dispatching" ? "Warte auf Task…" : workingThoughts[thoughtIdx]}
                <span className="animate-pulse">_</span>
              </motion.div>
            </AnimatePresence>
          </div>
        )}

        {isDone && agent && (
          <div className="mt-3 space-y-3">
            {agent.thinking?.length > 0 && (
              <div className="space-y-1 font-mono text-[10px] text-white/40">
                {agent.thinking.slice(0, 3).map((t, i) => (
                  <div key={i}>› {t}</div>
                ))}
              </div>
            )}
            <div className="border-t border-white/10 pt-3">
              <div className="text-[11px] font-black uppercase tracking-widest" style={{ color: meta.color }}>
                {agent.output.headline}
              </div>
              <ul className="mt-2 space-y-1.5 text-xs text-white/80">
                {agent.output.items.map((it, i) => (
                  <li key={i} className="flex gap-1.5">
                    <span style={{ color: meta.color }}>▸</span>
                    <span>{it}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function StatusDot({ phase, isDone }: { phase: string; isDone: boolean }) {
  if (isDone) return <div className="h-2 w-2 rounded-full bg-[#0a0a0a]" />;
  return (
    <motion.div
      className="h-2 w-2 rounded-full bg-[#ff5722]"
      animate={{ opacity: [0.3, 1, 0.3] }}
      transition={{ duration: 1.2, repeat: Infinity }}
    />
  );
}