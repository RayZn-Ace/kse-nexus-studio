import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Users,
  Eye,
  Activity,
  RefreshCw,
  ChevronRight,
  MousePointerClick,
  Rocket,
  Sparkles,
  ArrowRight,
} from "lucide-react";

export const Route = createFileRoute("/admin/journey")({
  component: JourneyPage,
});

// ---------- deterministic synth data (frontend only) ----------

type SynthEvent = {
  id: string;
  type: "pageview" | "click" | "scroll" | "form_start" | "form_submit" | "cta" | "chat" | "exit";
  path: string;
  ts: number; // ms offset
  meta?: string;
};
type SynthSession = {
  id: string;
  source: string;
  device: "Desktop" | "Mobile" | "Tablet";
  country: string;
  startedAt: number;
  events: SynthEvent[];
  converted: boolean;
};

const PATHS = ["/", "/leistungen", "/portfolio", "/preise", "/kontakt", "/about", "/blog"];
const SOURCES = ["Direkt", "Google", "Instagram", "LinkedIn", "Referral", "TikTok"];
const COUNTRIES = ["DE", "AT", "CH", "NL", "FR"];
const DEVICES: SynthSession["device"][] = ["Desktop", "Mobile", "Tablet"];
const CTA_LABELS = ["Angebot anfragen", "Portfolio ansehen", "Preisrechner", "Kontakt"];

function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function generateSessions(seed: number, count: number): SynthSession[] {
  const rand = mulberry32(seed);
  const pick = <T,>(arr: T[]) => arr[Math.floor(rand() * arr.length)];
  const now = Date.now();
  const sessions: SynthSession[] = [];
  for (let i = 0; i < count; i++) {
    const startOffset = Math.floor(rand() * 24 * 3600_000);
    const startedAt = now - startOffset;
    const len = 2 + Math.floor(rand() * 8);
    const events: SynthEvent[] = [];
    let ts = 0;
    let path = "/";
    events.push({ id: `${i}-0`, type: "pageview", path, ts });
    for (let j = 1; j < len; j++) {
      ts += 3000 + Math.floor(rand() * 45_000);
      const roll = rand();
      if (roll < 0.35) {
        path = pick(PATHS);
        events.push({ id: `${i}-${j}`, type: "pageview", path, ts });
      } else if (roll < 0.55) {
        events.push({ id: `${i}-${j}`, type: "scroll", path, ts, meta: `${Math.floor(rand() * 100)}%` });
      } else if (roll < 0.75) {
        events.push({ id: `${i}-${j}`, type: "click", path, ts, meta: pick(CTA_LABELS) });
      } else if (roll < 0.85) {
        events.push({ id: `${i}-${j}`, type: "cta", path, ts, meta: pick(CTA_LABELS) });
      } else if (roll < 0.92) {
        events.push({ id: `${i}-${j}`, type: "form_start", path: "/kontakt", ts });
      } else if (roll < 0.97) {
        events.push({ id: `${i}-${j}`, type: "chat", path, ts });
      } else {
        events.push({ id: `${i}-${j}`, type: "form_submit", path: "/kontakt", ts });
      }
    }
    const converted = events.some((e) => e.type === "form_submit");
    if (!converted && rand() < 0.6)
      events.push({ id: `${i}-exit`, type: "exit", path, ts: ts + 5000 });
    sessions.push({
      id: `s_${(seed + i).toString(36)}${Math.floor(rand() * 9999).toString(36)}`,
      source: pick(SOURCES),
      device: pick(DEVICES),
      country: pick(COUNTRIES),
      startedAt,
      events,
      converted,
    });
  }
  return sessions.sort((a, b) => b.startedAt - a.startedAt);
}

// ---------- page ----------

function JourneyPage() {
  const [seed, setSeed] = useState(1337);
  const sessions = useMemo(() => generateSessions(seed, 42), [seed]);
  const [selected, setSelected] = useState<string | null>(null);

  const stats = useMemo(() => {
    const perPath = new Map<string, number>();
    const perSource = new Map<string, number>();
    const perDevice = new Map<string, number>();
    let pageviews = 0;
    let totalEvents = 0;
    let converted = 0;
    const funnel = { landed: 0, engaged: 0, cta: 0, form: 0, submitted: 0 };
    for (const s of sessions) {
      perSource.set(s.source, (perSource.get(s.source) ?? 0) + 1);
      perDevice.set(s.device, (perDevice.get(s.device) ?? 0) + 1);
      if (s.converted) converted++;
      funnel.landed++;
      if (s.events.length > 2) funnel.engaged++;
      if (s.events.some((e) => e.type === "cta" || e.type === "click")) funnel.cta++;
      if (s.events.some((e) => e.type === "form_start")) funnel.form++;
      if (s.converted) funnel.submitted++;
      for (const e of s.events) {
        totalEvents++;
        if (e.type === "pageview") {
          pageviews++;
          perPath.set(e.path, (perPath.get(e.path) ?? 0) + 1);
        }
      }
    }
    return {
      pageviews,
      totalEvents,
      converted,
      convRate: sessions.length ? (converted / sessions.length) * 100 : 0,
      topPaths: [...perPath.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6),
      sources: [...perSource.entries()].sort((a, b) => b[1] - a[1]),
      devices: [...perDevice.entries()].sort((a, b) => b[1] - a[1]),
      funnel,
    };
  }, [sessions]);

  const active = sessions.find((s) => s.id === selected) ?? sessions[0];

  return (
    <div className="p-6 md:p-10 bg-[#f5f2ea] min-h-screen text-[#0a0a0a]">
      {/* header */}
      <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="inline-block bg-[#0a0a0a] text-[#ff5722] px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.3em] mb-2">
            ◆ Simulation / Frontend
          </div>
          <h1
            className="font-black text-4xl md:text-5xl uppercase tracking-tighter leading-[0.9]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Customer <span className="text-[#ff5722]">Journey</span>
          </h1>
          <p className="text-xs font-bold uppercase tracking-widest text-[#0a0a0a]/60 mt-2">
            Storyboard synthetischer Besucher — kein Backend, alles im Browser.
          </p>
        </div>
        <button
          onClick={() => setSeed((s) => s + 1)}
          className="flex items-center gap-2 bg-[#ff5722] text-white px-4 py-2.5 border-2 border-[#0a0a0a] text-xs font-black uppercase tracking-widest hover:-translate-y-0.5 transition-transform"
          style={{ boxShadow: "4px 4px 0 0 #0a0a0a" }}
        >
          <RefreshCw className="w-3.5 h-3.5" /> Neue Simulation
        </button>
      </header>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        <KPI icon={<Users className="w-4 h-4" />} label="Sessions" value={sessions.length} />
        <KPI icon={<Eye className="w-4 h-4" />} label="Pageviews" value={stats.pageviews} />
        <KPI icon={<MousePointerClick className="w-4 h-4" />} label="Events" value={stats.totalEvents} />
        <KPI icon={<Rocket className="w-4 h-4" />} label="Conversions" value={stats.converted} accent />
        <KPI icon={<Sparkles className="w-4 h-4" />} label="Conv-Rate" value={`${stats.convRate.toFixed(1)}%`} accent />
      </div>

      {/* Funnel */}
      <Card title="Der Held tritt in Erscheinung — Funnel">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          {(
            [
              ["Landet", stats.funnel.landed, "01"],
              ["Erkundet", stats.funnel.engaged, "02"],
              ["Reagiert", stats.funnel.cta, "03"],
              ["Formular", stats.funnel.form, "04"],
              ["Konversion", stats.funnel.submitted, "05"],
            ] as const
          ).map(([label, val, num], i, arr) => {
            const max = arr[0][1] || 1;
            const pct = (val / max) * 100;
            const last = i === arr.length - 1;
            return (
              <div
                key={label}
                className={`relative border-2 border-[#0a0a0a] p-3 ${last ? "bg-[#ff5722] text-white" : "bg-white"}`}
                style={{ boxShadow: "4px 4px 0 0 #0a0a0a" }}
              >
                <div className={`text-[10px] font-mono ${last ? "text-white/70" : "text-[#0a0a0a]/50"}`}>#{num}</div>
                <div className="text-[10px] font-black uppercase tracking-widest">{label}</div>
                <div
                  className="font-black text-3xl tabular-nums mt-1"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {val}
                </div>
                <div className={`h-1 mt-2 ${last ? "bg-white/30" : "bg-[#0a0a0a]/10"}`}>
                  <div
                    className={`h-full ${last ? "bg-white" : "bg-[#ff5722]"}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* mid grid */}
      <div className="grid lg:grid-cols-3 gap-4 mt-4">
        <Card title="Herkunft">
          <BarList items={stats.sources} />
        </Card>
        <Card title="Gerät">
          <BarList items={stats.devices} />
        </Card>
        <Card title="Top-Seiten">
          <BarList items={stats.topPaths} />
        </Card>
      </div>

      {/* Sessions + timeline */}
      <div className="grid md:grid-cols-[380px_1fr] gap-4 mt-4">
        <div className="border-2 border-[#0a0a0a] bg-white" style={{ boxShadow: "4px 4px 0 0 #0a0a0a" }}>
          <div className="px-3 py-2 border-b-2 border-[#0a0a0a] bg-[#0a0a0a] text-white text-[10px] font-black uppercase tracking-[0.25em] flex items-center justify-between">
            <span>Sessions ({sessions.length})</span>
            <span className="text-[#ff5722]">LIVE-SIM</span>
          </div>
          <ul className="max-h-[600px] overflow-y-auto">
            {sessions.map((s) => {
              const isActive = (active?.id ?? "") === s.id;
              return (
                <li key={s.id} className="border-b border-[#0a0a0a]/10 last:border-b-0">
                  <button
                    onClick={() => setSelected(s.id)}
                    className={`w-full text-left px-3 py-2.5 transition-colors ${
                      isActive ? "bg-[#ff5722]/10" : "hover:bg-[#f5f2ea]"
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono truncate max-w-[160px]">{s.id}</span>
                      {s.converted && (
                        <span className="bg-[#ff5722] text-white px-1.5 py-0.5 text-[9px] font-black uppercase tracking-widest">
                          Win
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-[#0a0a0a]/60 mt-1">
                      <span>
                        {s.source} · {s.device} · {s.country}
                      </span>
                      <ChevronRight className="w-3 h-3" />
                    </div>
                    <div className="text-[10px] font-mono text-[#0a0a0a]/40 mt-0.5">
                      {s.events.length} events · {new Date(s.startedAt).toLocaleTimeString("de-DE")}
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        <div
          className="border-2 border-[#0a0a0a] bg-white p-5 min-w-0"
          style={{ boxShadow: "4px 4px 0 0 #0a0a0a" }}
        >
          {!active ? (
            <p className="text-sm text-center py-10 text-[#0a0a0a]/50">
              Session wählen, um die Journey zu sehen.
            </p>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-4 pb-3 border-b-2 border-[#0a0a0a]">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#0a0a0a]/50">
                    Story
                  </p>
                  <h3
                    className="font-black text-2xl uppercase tracking-tight"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    {active.source} <ArrowRight className="inline w-5 h-5 text-[#ff5722]" /> {active.converted ? "Konversion" : "Absprung"}
                  </h3>
                </div>
                <div className="text-right text-[10px] font-mono text-[#0a0a0a]/50">
                  {active.id}
                  <br />
                  {new Date(active.startedAt).toLocaleString("de-DE")}
                </div>
              </div>
              <ol className="relative border-l-2 border-[#0a0a0a] ml-2 space-y-4">
                {active.events.map((e, i) => (
                  <li key={e.id} className="pl-5 relative">
                    <span className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-[#ff5722] border-2 border-[#0a0a0a] grid place-items-center text-[8px] font-black text-white">
                      {i + 1}
                    </span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-[10px] font-black uppercase tracking-widest bg-[#0a0a0a] text-white px-1.5 py-0.5">
                        {e.type}
                      </span>
                      <span className="font-mono text-xs">{e.path}</span>
                      {e.meta && (
                        <span className="text-[11px] text-[#0a0a0a]/70">— {e.meta}</span>
                      )}
                    </div>
                    <div className="text-[10px] font-mono text-[#0a0a0a]/40 mt-0.5">
                      +{Math.round(e.ts / 1000)}s
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function KPI({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  accent?: boolean;
}) {
  return (
    <div
      className={`border-2 border-[#0a0a0a] p-3 ${accent ? "bg-[#0a0a0a] text-white" : "bg-white"}`}
      style={{ boxShadow: "4px 4px 0 0 #0a0a0a" }}
    >
      <div className={`flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest ${accent ? "text-[#ff5722]" : "text-[#0a0a0a]/60"}`}>
        {icon} {label}
      </div>
      <div
        className="font-black text-3xl tabular-nums mt-1"
        style={{ fontFamily: "var(--font-display)" }}
      >
        {value}
      </div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      className="border-2 border-[#0a0a0a] bg-white p-4 mt-4 first:mt-0"
      style={{ boxShadow: "4px 4px 0 0 #0a0a0a" }}
    >
      <div className="text-[10px] font-black uppercase tracking-[0.3em] text-[#0a0a0a]/50 mb-3">
        ◆ {title}
      </div>
      {children}
    </div>
  );
}

function BarList({ items }: { items: [string, number][] }) {
  const max = Math.max(...items.map((i) => i[1]), 1);
  return (
    <ul className="space-y-2">
      {items.map(([label, count]) => (
        <li key={label}>
          <div className="flex items-center justify-between text-xs font-bold mb-1">
            <span className="truncate max-w-[200px] uppercase tracking-widest">{label}</span>
            <span className="tabular-nums text-[#0a0a0a]/60 font-mono">{count}</span>
          </div>
          <div className="h-2 bg-[#0a0a0a]/10 border border-[#0a0a0a]">
            <div className="h-full bg-[#ff5722]" style={{ width: `${(count / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}