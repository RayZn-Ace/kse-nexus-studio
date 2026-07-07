import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Radar,
  Zap,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Sparkles,
  Loader2,
  Search,
  Gauge,
  Palette,
  MousePointer2,
  Bot,
} from "lucide-react";
import { HiddenSpidey } from "@/components/site/EasterEggHunt";

export const Route = createFileRoute("/audit")({
  head: () => ({
    meta: [
      { title: "AI Website-Audit — KSE GROUP" },
      {
        name: "description",
        content:
          "Kostenloser AI-Audit deiner Website. Ehrliche Bewertung von Design, Performance, UX, SEO und KI-Potenzial in unter 30 Sekunden.",
      },
      { property: "og:title", content: "AI Website-Audit — KSE GROUP" },
      {
        property: "og:description",
        content: "URL rein, Audit raus. Ehrlich, konkret, ohne Marketing-Bullshit.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuditPage,
});

type Audit = {
  overallScore: number;
  verdict: string;
  scores: { design: number; performance: number; ux: number; seo: number; aiPotential: number };
  strengths: string[];
  issues: { severity: "high" | "medium" | "low"; title: string; detail: string }[];
  quickWins: { title: string; impact: string; effort: "low" | "medium" | "high" }[];
  aiOpportunities: { title: string; detail: string }[];
};

type Result = {
  url: string;
  fetchedAt: string;
  technical: {
    status: number;
    loadMs: number;
    sizeKb: number;
    contentType: string;
    meta: Record<string, unknown>;
  };
  audit: Audit;
};

function AuditPage() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);

  async function run(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/website-audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Audit fehlgeschlagen");
      setResult(data as Result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unbekannter Fehler");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f5f2ea] text-[#0a0a0a]">
      <header className="border-b-2 border-[#0a0a0a] bg-white">
        <div className="fixed right-2 top-24 z-40">
          <HiddenSpidey id="audit-cta" size={20} />
        </div>
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 md:px-8">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wide hover:text-[#ff5722]"
          >
            <ArrowLeft className="h-4 w-4" /> KSE GROUP
          </Link>
          <span className="rounded-full border-2 border-[#0a0a0a] bg-[#ffeb3b] px-3 py-1 text-[10px] font-black uppercase tracking-widest">
            Free Tool
          </span>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 py-12 md:px-8 md:py-20">
        <div className="flex items-center gap-3 text-xs font-mono uppercase tracking-widest text-[#ff5722]">
          <Radar className="h-4 w-4 animate-pulse" />
          <span>AI-AUDIT · v1.0</span>
        </div>
        <h1 className="mt-4 font-[Space_Grotesk] text-5xl font-black leading-[0.95] tracking-tight md:text-7xl">
          Wie gut ist
          <br />
          deine Website
          <span className="text-[#ff5722]"> wirklich?</span>
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-[#0a0a0a]/70">
          URL rein, Audit raus. Unser AI schaut sich deine Seite an und liefert eine
          ehrliche Bewertung — Design, Performance, UX, SEO und KI-Potenzial. Ohne
          Marketing-Bullshit, in unter 30 Sekunden.
        </p>

        <form
          onSubmit={run}
          className="mt-10 flex flex-col gap-3 border-4 border-[#0a0a0a] bg-white p-3 shadow-[8px_8px_0_#ff5722] md:flex-row md:items-stretch"
        >
          <div className="flex flex-1 items-center gap-3 border-2 border-[#0a0a0a] bg-[#f5f2ea] px-4">
            <Search className="h-5 w-5 text-[#ff5722]" />
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="deine-website.de"
              className="w-full bg-transparent py-4 text-lg font-mono outline-none placeholder:text-[#0a0a0a]/40"
              disabled={loading}
              autoComplete="off"
              spellCheck={false}
            />
          </div>
          <button
            type="submit"
            disabled={loading || !url.trim()}
            className="group inline-flex items-center justify-center gap-2 border-2 border-[#0a0a0a] bg-[#ff5722] px-6 py-4 font-black uppercase tracking-widest text-white transition-all hover:bg-[#0a0a0a] disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" /> Scanne
              </>
            ) : (
              <>
                <Zap className="h-5 w-5" /> Audit starten
              </>
            )}
          </button>
        </form>

        {error && (
          <div className="mt-6 border-2 border-red-600 bg-red-50 p-4 font-mono text-sm text-red-900">
            <strong className="uppercase">Error:</strong> {error}
          </div>
        )}

        <AnimatePresence mode="wait">
          {loading && !result && <LoadingState key="loading" />}
          {result && <ResultView key="result" result={result} />}
        </AnimatePresence>

        {!loading && !result && !error && (
          <div className="mt-12 grid gap-4 md:grid-cols-3">
            {[
              { icon: Gauge, title: "Technischer Check", text: "Ladezeit, HTML-Größe, Meta-Tags, alt-Attribute." },
              { icon: Sparkles, title: "AI-Bewertung", text: "5 Scores + ehrliches Verdict — nicht geschönt." },
              { icon: TrendingUp, title: "Quick Wins", text: "Konkrete Sofort-Maßnahmen mit Aufwand." },
            ].map((f) => (
              <div key={f.title} className="border-2 border-[#0a0a0a] bg-white p-6">
                <f.icon className="h-6 w-6 text-[#ff5722]" />
                <h3 className="mt-3 font-black uppercase tracking-wide">{f.title}</h3>
                <p className="mt-1 text-sm text-[#0a0a0a]/70">{f.text}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function LoadingState() {
  const steps = [
    "Verbinde mit Ziel-Server",
    "Lade HTML & Assets",
    "Extrahiere Meta-Daten",
    "Analysiere Struktur & SEO",
    "AI-Bewertung wird generiert",
  ];
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="mt-8 border-4 border-[#0a0a0a] bg-[#0a0a0a] p-8 font-mono text-sm text-[#ffeb3b]"
    >
      <div className="mb-4 flex items-center gap-2 text-[#ff5722]">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="uppercase tracking-widest">Audit läuft…</span>
      </div>
      {steps.map((s, i) => (
        <motion.div
          key={s}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.6 }}
          className="py-1"
        >
          <span className="text-[#0a0a0a] bg-[#ffeb3b] px-1 mr-2">{String(i + 1).padStart(2, "0")}</span>
          {s}<span className="animate-pulse">_</span>
        </motion.div>
      ))}
    </motion.div>
  );
}

function ScoreRing({ value, label, size = 100 }: { value: number; label: string; size?: number }) {
  const v = Math.max(0, Math.min(100, value ?? 0));
  const stroke = 8;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const color = v >= 80 ? "#22c55e" : v >= 60 ? "#ff5722" : v >= 40 ? "#f59e0b" : "#dc2626";
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={r} strokeWidth={stroke} stroke="#e5e5e5" fill="none" />
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            strokeWidth={stroke}
            stroke={color}
            fill="none"
            strokeLinecap="round"
            initial={{ strokeDasharray: `0 ${c}` }}
            animate={{ strokeDasharray: `${(v / 100) * c} ${c}` }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center font-[Space_Grotesk] text-2xl font-black">
          {v}
        </div>
      </div>
      <div className="text-[10px] font-black uppercase tracking-widest text-[#0a0a0a]/70">{label}</div>
    </div>
  );
}

function ResultView({ result }: { result: Result }) {
  const a = result.audit ?? ({} as Audit);
  const scoreIcons: Record<string, typeof Palette> = {
    design: Palette,
    performance: Gauge,
    ux: MousePointer2,
    seo: Search,
    aiPotential: Bot,
  };
  const severityColor = { high: "#dc2626", medium: "#f59e0b", low: "#0a0a0a" } as const;
  const effortLabel = { low: "Klein", medium: "Mittel", high: "Groß" } as const;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="mt-10 space-y-6"
    >
      {/* Verdict */}
      <div className="border-4 border-[#0a0a0a] bg-[#0a0a0a] p-6 md:p-10 text-white shadow-[8px_8px_0_#ff5722]">
        <div className="grid gap-8 md:grid-cols-[auto_1fr] md:items-center">
          <ScoreRing value={a.overallScore ?? 0} label="Overall" size={140} />
          <div>
            <div className="text-xs font-mono uppercase tracking-widest text-[#ffeb3b]">
              {result.url}
            </div>
            <div className="mt-3 font-[Space_Grotesk] text-2xl font-black leading-tight md:text-4xl">
              {a.verdict ?? "Bewertung nicht verfügbar."}
            </div>
            <div className="mt-4 flex flex-wrap gap-3 text-xs font-mono text-white/60">
              <span>Status {result.technical.status}</span>
              <span>·</span>
              <span>{result.technical.loadMs} ms</span>
              <span>·</span>
              <span>{result.technical.sizeKb} KB</span>
            </div>
          </div>
        </div>
      </div>

      {/* Score breakdown */}
      {a.scores && (
        <div className="border-2 border-[#0a0a0a] bg-white p-6 md:p-8">
          <h2 className="mb-6 text-xs font-black uppercase tracking-widest text-[#0a0a0a]/60">
            Score-Breakdown
          </h2>
          <div className="grid grid-cols-2 gap-6 md:grid-cols-5">
            {(Object.keys(a.scores) as (keyof typeof a.scores)[]).map((k) => {
              const Icon = scoreIcons[k] ?? Sparkles;
              const label = k === "aiPotential" ? "AI-Potenzial" : k.toUpperCase();
              return (
                <div key={k} className="flex flex-col items-center gap-2">
                  <ScoreRing value={a.scores[k]} label={label} />
                  <Icon className="h-4 w-4 text-[#ff5722]" />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Grid: Strengths + Issues */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="border-2 border-[#0a0a0a] bg-white p-6">
          <div className="mb-4 flex items-center gap-2 text-xs font-black uppercase tracking-widest">
            <CheckCircle2 className="h-4 w-4 text-green-600" /> Stärken
          </div>
          <ul className="space-y-3">
            {(a.strengths ?? []).map((s, i) => (
              <li key={i} className="flex gap-2 text-sm">
                <span className="text-green-600">✓</span>
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="border-2 border-[#0a0a0a] bg-white p-6">
          <div className="mb-4 flex items-center gap-2 text-xs font-black uppercase tracking-widest">
            <AlertTriangle className="h-4 w-4 text-red-600" /> Probleme
          </div>
          <ul className="space-y-4">
            {(a.issues ?? []).map((issue, i) => (
              <li key={i} className="border-l-4 pl-3" style={{ borderColor: severityColor[issue.severity] ?? "#0a0a0a" }}>
                <div className="flex items-center gap-2">
                  <span
                    className="rounded-sm px-1.5 py-0.5 text-[9px] font-black uppercase tracking-widest text-white"
                    style={{ background: severityColor[issue.severity] ?? "#0a0a0a" }}
                  >
                    {issue.severity}
                  </span>
                  <strong className="text-sm">{issue.title}</strong>
                </div>
                <p className="mt-1 text-sm text-[#0a0a0a]/70">{issue.detail}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Quick Wins */}
      {a.quickWins && a.quickWins.length > 0 && (
        <div className="border-2 border-[#0a0a0a] bg-[#ffeb3b] p-6 md:p-8">
          <div className="mb-6 flex items-center gap-2 text-xs font-black uppercase tracking-widest">
            <TrendingUp className="h-4 w-4" /> Quick Wins
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {a.quickWins.map((q, i) => (
              <div key={i} className="border-2 border-[#0a0a0a] bg-white p-4">
                <div className="text-[10px] font-black uppercase tracking-widest text-[#ff5722]">
                  Aufwand: {effortLabel[q.effort] ?? q.effort}
                </div>
                <h3 className="mt-2 font-black">{q.title}</h3>
                <p className="mt-2 text-sm text-[#0a0a0a]/70">{q.impact}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Opportunities */}
      {a.aiOpportunities && a.aiOpportunities.length > 0 && (
        <div className="border-2 border-[#0a0a0a] bg-white p-6 md:p-8">
          <div className="mb-6 flex items-center gap-2 text-xs font-black uppercase tracking-widest">
            <Bot className="h-4 w-4 text-[#ff5722]" /> Wo KSE mit AI helfen kann
          </div>
          <div className="space-y-4">
            {a.aiOpportunities.map((o, i) => (
              <div key={i} className="border-l-4 border-[#ff5722] pl-4">
                <strong className="text-sm">{o.title}</strong>
                <p className="mt-1 text-sm text-[#0a0a0a]/70">{o.detail}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CTA */}
      <div className="flex flex-col items-start justify-between gap-4 border-4 border-[#0a0a0a] bg-white p-6 md:flex-row md:items-center md:p-8">
        <div>
          <div className="text-xs font-mono uppercase tracking-widest text-[#ff5722]">Nächster Schritt</div>
          <div className="mt-1 font-[Space_Grotesk] text-xl font-black">
            Lass uns die Quick Wins gemeinsam umsetzen.
          </div>
        </div>
        <Link
          to="/konfigurator"
          className="inline-flex items-center gap-2 border-2 border-[#0a0a0a] bg-[#ff5722] px-6 py-3 text-sm font-black uppercase tracking-widest text-white hover:bg-[#0a0a0a]"
        >
          Projekt starten →
        </Link>
      </div>
    </motion.div>
  );
}