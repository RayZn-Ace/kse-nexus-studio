import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Sparkles,
  Activity,
  Terminal,
  Settings as SettingsIcon,
  ScrollText,
  ShieldAlert,
  Loader2,
  Play,
  Pause,
  Zap,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Send,
  Save,
  Database,
  LogOut,
  ArrowLeft,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import {
  listAdAccounts,
  listCampaigns,
  getCampaignCreatives,
  executeActions,
} from "@/lib/kseadsio/metaAdsService";
import { demoCommand } from "@/lib/kseadsio/demoData";
import type {
  KayIPlan,
  RiskFinding,
  ExecutionAction,
  MetaCampaign,
  MetaCreative,
} from "@/lib/kseadsio/types";

export const Route = createFileRoute("/kseadsio")({
  head: () => ({
    meta: [
      { title: "KSEAdsio · KayI Command Center" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: KseAdsioShell,
});

type Tab = "dashboard" | "command" | "creatives" | "logs" | "settings";

// ─────────────────────────────────────────────────────────────
// Boot animation
// ─────────────────────────────────────────────────────────────
function BootScreen({ onDone }: { onDone: () => void }) {
  const lines = useMemo(
    () => [
      "> initializing KSEAdsio kernel...",
      "> loading KayI neural weights...",
      "> handshaking Meta Ads gateway...",
      "> KayI analysiert dein Ads-System...",
      "> ready.",
    ],
    [],
  );
  const [line, setLine] = useState(0);
  useEffect(() => {
    if (line >= lines.length) {
      const t = setTimeout(onDone, 380);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setLine((l) => l + 1), 460);
    return () => clearTimeout(t);
  }, [line, lines, onDone]);

  return (
    <div className="fixed inset-0 z-50 bg-[#05060a] text-cyan-300 grid place-items-center overflow-hidden">
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            "linear-gradient(rgba(56,189,248,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(56,189,248,0.15) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
          animation: "kayi-grid 6s linear infinite",
        }}
      />
      <div className="absolute inset-0 grid place-items-center">
        {[1, 2, 3].map((r) => (
          <div
            key={r}
            className="absolute rounded-full border border-cyan-400/30"
            style={{
              width: `${r * 260}px`,
              height: `${r * 260}px`,
              animation: `kayi-pulse ${2 + r * 0.4}s ease-out infinite`,
            }}
          />
        ))}
      </div>
      <div className="absolute inset-0 overflow-hidden">
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="absolute h-px bg-gradient-to-r from-transparent via-cyan-400 to-transparent"
            style={{
              top: `${(i * 8.3) % 100}%`,
              left: 0,
              width: "100%",
              opacity: 0.4,
              animation: `kayi-stream ${2 + (i % 4)}s linear ${i * 0.15}s infinite`,
            }}
          />
        ))}
      </div>
      <div className="relative z-10 w-[560px] max-w-[92vw]">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 border border-cyan-400/50 grid place-items-center bg-cyan-400/5">
            <Sparkles className="w-6 h-6 text-cyan-300 animate-pulse" />
          </div>
          <div>
            <div className="text-[10px] tracking-[0.4em] text-cyan-500 font-mono">
              KAYI · v0.1
            </div>
            <div className="text-2xl font-black tracking-tight text-white">
              KSEAdsio
            </div>
          </div>
        </div>
        <div className="border border-cyan-400/30 bg-black/60 backdrop-blur p-4 font-mono text-sm min-h-[180px]">
          {lines.slice(0, line + 1).map((l, i) => (
            <div
              key={i}
              className={i === line ? "text-cyan-200" : "text-cyan-500/60"}
            >
              {l}
              {i === line && (
                <span className="inline-block w-2 h-4 ml-1 bg-cyan-300 animate-pulse align-middle" />
              )}
            </div>
          ))}
        </div>
      </div>
      <style>{`
        @keyframes kayi-pulse { 0% { transform: scale(0.6); opacity: 0.7 } 100% { transform: scale(1.4); opacity: 0 } }
        @keyframes kayi-grid { 0% { transform: translate(0,0) } 100% { transform: translate(40px, 40px) } }
        @keyframes kayi-stream { 0% { transform: translateX(-100%) } 100% { transform: translateX(100%) } }
      `}</style>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Shell (own sidebar, own auth check)
// ─────────────────────────────────────────────────────────────
function KseAdsioShell() {
  const { user, isAdmin, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [booted, setBooted] = useState(false);
  const [tab, setTab] = useState<Tab>("dashboard");

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center bg-[#05060a]">
        <Loader2 className="w-6 h-6 animate-spin text-cyan-300" />
      </div>
    );
  }
  if (!user) return null;
  if (!isAdmin) {
    return (
      <div className="min-h-screen grid place-items-center bg-[#05060a] text-white px-6">
        <div className="border border-red-400/40 bg-red-500/5 p-8 max-w-md text-center rounded">
          <div className="text-[10px] font-mono tracking-[0.3em] text-red-300 mb-2">
            ACCESS DENIED
          </div>
          <h1 className="text-2xl font-black mb-2">Kein Admin-Zugriff</h1>
          <p className="text-sm text-white/60">
            {user.email} hat noch keine Admin-Rolle.
          </p>
        </div>
      </div>
    );
  }

  if (!booted) return <BootScreen onDone={() => setBooted(true)} />;

  const nav: Array<{ id: Tab; label: string; icon: typeof Activity; hint: string }> = [
    { id: "dashboard", label: "Dashboard", icon: Activity, hint: "Overview" },
    { id: "command", label: "Command", icon: Terminal, hint: "KayI Terminal" },
    { id: "creatives", label: "Creatives", icon: Zap, hint: "Ads & Texte" },
    { id: "logs", label: "Audit Logs", icon: ScrollText, hint: "History" },
    { id: "settings", label: "Einstellungen", icon: SettingsIcon, hint: "Config" },
  ];

  return (
    <div className="min-h-screen flex bg-[#05060a] text-white relative overflow-hidden">
      {/* ambient glows */}
      <div aria-hidden className="pointer-events-none absolute inset-0 opacity-40">
        <div className="absolute -top-32 -left-32 w-[520px] h-[520px] rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute top-1/3 -right-40 w-[520px] h-[520px] rounded-full bg-violet-500/10 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 w-[420px] h-[420px] rounded-full bg-emerald-500/5 blur-3xl" />
      </div>

      {/* Sidebar */}
      <aside className="w-64 shrink-0 border-r border-white/10 bg-black/40 backdrop-blur-xl relative z-10 flex flex-col h-screen sticky top-0">
        <div className="px-5 py-6 border-b border-white/10">
          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-9 h-9 rounded-md bg-gradient-to-br from-cyan-400/30 to-violet-500/30 border border-cyan-400/40 grid place-items-center">
              <Sparkles className="w-4 h-4 text-cyan-300" />
            </div>
            <div>
              <div className="text-[9px] font-mono tracking-[0.35em] text-cyan-400/70">
                KAYI · v0.1
              </div>
              <div className="text-lg font-black tracking-tight leading-none">
                KSEAdsio
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] font-mono text-white/40 mt-3">
            <span className="relative flex w-1.5 h-1.5">
              <span className="absolute inset-0 rounded-full bg-emerald-400 opacity-70 animate-ping" />
              <span className="relative rounded-full w-1.5 h-1.5 bg-emerald-400" />
            </span>
            KayI online · Bridge idle
          </div>
        </div>

        <div className="px-3 pt-4 pb-2 text-[9px] font-mono tracking-[0.35em] text-white/30">
          / MODULES
        </div>
        <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
          {nav.map((n) => {
            const active = tab === n.id;
            return (
              <button
                key={n.id}
                onClick={() => setTab(n.id)}
                className={`group relative w-full flex items-center gap-3 px-3 py-2.5 rounded text-left transition-all ${
                  active
                    ? "bg-cyan-400/10 border border-cyan-400/40 text-white"
                    : "text-white/60 hover:text-white hover:bg-white/5 border border-transparent"
                }`}
              >
                <n.icon
                  className={`w-4 h-4 shrink-0 ${active ? "text-cyan-300" : "text-white/50 group-hover:text-white"}`}
                />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold uppercase tracking-widest truncate">
                    {n.label}
                  </div>
                  <div className="text-[10px] text-white/40 truncate">
                    {n.hint}
                  </div>
                </div>
                {active && <span className="w-1 h-8 -mr-3 bg-cyan-400 rounded-l" />}
              </button>
            );
          })}
        </nav>

        <div className="p-3 border-t border-white/10 space-y-1">
          <Link
            to="/admin"
            className="flex items-center gap-2 px-3 py-2 rounded text-[11px] font-mono uppercase tracking-widest text-white/50 hover:text-cyan-300 hover:bg-white/5"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Kommandozentrale
          </Link>
          <button
            onClick={() => signOut().then(() => navigate({ to: "/auth" }))}
            className="w-full flex items-center gap-2 px-3 py-2 rounded text-[11px] font-mono uppercase tracking-widest text-white/50 hover:text-red-300 hover:bg-white/5"
          >
            <LogOut className="w-3.5 h-3.5" /> Logout
          </button>
          <div className="px-3 pt-2 text-[10px] font-mono text-white/30 truncate">
            {user.email}
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 min-w-0 relative z-10 flex flex-col">
        <header className="border-b border-white/10 bg-black/20 backdrop-blur px-8 py-5 flex items-center justify-between">
          <div>
            <div className="text-[10px] font-mono tracking-[0.4em] text-cyan-400/70">
              / {nav.find((n) => n.id === tab)?.label.toUpperCase()}
            </div>
            <h1 className="text-2xl font-black tracking-tight">
              {tab === "dashboard" && "Ads Command Overview"}
              {tab === "command" && "KayI Terminal"}
              {tab === "creatives" && "Creative & Text Check"}
              {tab === "logs" && "Audit Trail"}
              {tab === "settings" && "System Configuration"}
            </h1>
          </div>
          <div className="hidden md:flex items-center gap-4 text-xs font-mono text-white/40">
            <span>MOCK MODE</span>
            <span className="w-px h-4 bg-white/20" />
            <span className="text-cyan-300">SAFE ON</span>
          </div>
        </header>
        <main className="flex-1 p-8 overflow-y-auto">
          {tab === "dashboard" && <Dashboard />}
          {tab === "command" && <CommandCenter />}
          {tab === "creatives" && <CreativeCheck />}
          {tab === "logs" && <AuditLogs />}
          {tab === "settings" && <SettingsPanel />}
        </main>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Shared bits
// ─────────────────────────────────────────────────────────────
function GlassCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`relative border border-white/10 bg-white/[0.03] backdrop-blur-xl rounded-lg overflow-hidden ${className}`}
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent" />
      {children}
    </div>
  );
}

function Kpi({
  label,
  value,
  sub,
  tone = "cyan",
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: "cyan" | "violet" | "emerald" | "orange";
}) {
  const c = {
    cyan: "text-cyan-300",
    violet: "text-violet-300",
    emerald: "text-emerald-300",
    orange: "text-orange-300",
  }[tone];
  return (
    <GlassCard className="p-5">
      <div className="text-[10px] uppercase tracking-[0.25em] text-white/40 font-mono">
        {label}
      </div>
      <div className={`text-3xl font-black tracking-tight mt-2 ${c}`}>
        {value}
      </div>
      {sub && <div className="text-xs text-white/50 mt-1">{sub}</div>}
    </GlassCard>
  );
}

function RiskBadge({ level }: { level: string }) {
  const map: Record<string, string> = {
    low: "bg-emerald-400/10 text-emerald-300 border-emerald-400/30",
    medium: "bg-orange-400/10 text-orange-300 border-orange-400/30",
    high: "bg-red-400/10 text-red-300 border-red-400/30",
    block: "bg-red-500/20 text-red-200 border-red-500/50",
  };
  return (
    <span
      className={`text-[10px] uppercase tracking-widest px-2 py-1 rounded border font-bold ${map[level] ?? map.medium}`}
    >
      Risk · {level}
    </span>
  );
}

function PlanRow({
  k,
  v,
  mono,
}: {
  k: string;
  v?: string | number | null;
  mono?: boolean;
}) {
  return (
    <>
      <dt className="text-[10px] uppercase tracking-widest text-white/40 font-mono">
        {k}
      </dt>
      <dd className={mono ? "font-mono text-cyan-200" : "text-white/90"}>
        {v ?? <span className="text-white/30">—</span>}
      </dd>
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// Dashboard
// ─────────────────────────────────────────────────────────────
function Dashboard() {
  const [accounts, setAccounts] = useState<Awaited<ReturnType<typeof listAdAccounts>>>([]);
  const [campaigns, setCampaigns] = useState<MetaCampaign[]>([]);
  const [lastActions, setLastActions] = useState<
    Array<{ created_at: string; action_type: string; status: string }>
  >([]);

  useEffect(() => {
    listAdAccounts().then(setAccounts);
    listCampaigns().then(setCampaigns);
    (async () => {
      const { data } = await (supabase as any)
        .from("kseadsio_execution_logs")
        .select("created_at, action_type, status")
        .order("created_at", { ascending: false })
        .limit(5);
      setLastActions(data ?? []);
    })();
  }, []);

  const active = campaigns.filter((c) => c.status === "ACTIVE");
  const spendToday = campaigns.reduce((s, c) => s + c.spend_today_eur, 0);
  const purchases = campaigns.reduce((s, c) => s + (c.purchases ?? 0), 0);
  const avgCpa = active.length
    ? active.reduce((s, c) => s + (c.cpa ?? 0), 0) / active.length
    : 0;
  const avgCtr = active.length
    ? active.reduce((s, c) => s + (c.ctr ?? 0), 0) / active.length
    : 0;
  const roasCount = active.filter((c) => c.roas).length;
  const avgRoas =
    roasCount > 0
      ? active.filter((c) => c.roas).reduce((s, c) => s + (c.roas ?? 0), 0) /
        roasCount
      : 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        <Kpi label="Ad Accounts" value={String(accounts.length)} />
        <Kpi
          label="Kampagnen"
          value={String(campaigns.length)}
          sub={`${active.length} aktiv`}
        />
        <Kpi label="Spend heute" value={`${spendToday.toFixed(2)}€`} tone="violet" />
        <Kpi label="Purchases" value={String(purchases)} tone="emerald" />
        <Kpi label="Ø CPA" value={`${avgCpa.toFixed(2)}€`} tone="orange" />
        <Kpi
          label="Ø CTR / ROAS"
          value={`${avgCtr.toFixed(2)}%`}
          sub={`ROAS ${avgRoas.toFixed(2)}`}
        />
      </div>

      <GlassCard>
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-[0.3em] text-white/40">
              / Kampagnen
            </div>
            <h2 className="text-lg font-black">Aktive Übersicht</h2>
          </div>
          <div className="text-xs text-white/40 font-mono">
            Mock-Daten · Meta API nicht verbunden
          </div>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[10px] uppercase tracking-widest text-white/40 border-b border-white/5">
              <th className="px-5 py-3">Name</th>
              <th className="py-3">Status</th>
              <th className="py-3">Objective</th>
              <th className="py-3 text-right">Budget</th>
              <th className="py-3 text-right">Spend</th>
              <th className="py-3 text-right">CTR</th>
              <th className="py-3 text-right">CPA</th>
              <th className="py-3 text-right pr-5">ROAS</th>
            </tr>
          </thead>
          <tbody>
            {campaigns.map((c) => (
              <tr key={c.id} className="border-b border-white/5 hover:bg-white/5">
                <td className="px-5 py-3">
                  <div className="font-semibold">{c.name}</div>
                  <div className="text-[10px] font-mono text-white/40">{c.id}</div>
                </td>
                <td>
                  <span
                    className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded ${c.status === "ACTIVE" ? "bg-emerald-400/10 text-emerald-300" : "bg-white/5 text-white/50"}`}
                  >
                    {c.status === "ACTIVE" ? (
                      <Play className="w-3 h-3" />
                    ) : (
                      <Pause className="w-3 h-3" />
                    )}
                    {c.status}
                  </span>
                </td>
                <td className="text-white/70 text-xs">{c.objective}</td>
                <td className="text-right tabular-nums">{c.daily_budget_eur}€</td>
                <td className="text-right tabular-nums text-violet-300">
                  {c.spend_today_eur.toFixed(2)}€
                </td>
                <td className="text-right tabular-nums">{c.ctr?.toFixed(2)}%</td>
                <td className="text-right tabular-nums">
                  {c.cpa ? `${c.cpa.toFixed(2)}€` : "—"}
                </td>
                <td className="text-right tabular-nums pr-5">
                  {c.roas ? c.roas.toFixed(2) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </GlassCard>

      <div className="grid md:grid-cols-2 gap-6">
        <GlassCard className="p-5">
          <div className="text-[10px] font-mono uppercase tracking-[0.3em] text-white/40 mb-3">
            / Letzte KayI-Aktionen
          </div>
          {lastActions.length === 0 && (
            <div className="text-sm text-white/40">
              Noch keine Aktionen protokolliert.
            </div>
          )}
          <ul className="space-y-2">
            {lastActions.map((a, i) => (
              <li
                key={i}
                className="flex items-center justify-between text-sm border-b border-white/5 pb-2 last:border-0"
              >
                <span className="font-mono text-white/80">{a.action_type}</span>
                <span className="text-xs text-white/40">
                  {new Date(a.created_at).toLocaleString("de-DE")}
                </span>
              </li>
            ))}
          </ul>
        </GlassCard>
        <GlassCard className="p-5">
          <div className="text-[10px] font-mono uppercase tracking-[0.3em] text-orange-300 mb-3">
            / Warnungen
          </div>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2 text-white/70">
              <AlertTriangle className="w-4 h-4 text-orange-300 mt-0.5 shrink-0" />{" "}
              Kampagne „MT — Purchase / DE South" liegt heute unter Ziel-ROAS.
            </li>
            <li className="flex items-start gap-2 text-white/70">
              <AlertTriangle className="w-4 h-4 text-orange-300 mt-0.5 shrink-0" />{" "}
              Meta Access Token noch nicht hinterlegt — nur Mock-Modus aktiv.
            </li>
          </ul>
        </GlassCard>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Command Center
// ─────────────────────────────────────────────────────────────
type ParseResult = {
  plan: KayIPlan;
  risk: { level: string; findings: RiskFinding[] };
  actions: ExecutionAction[];
  source: string;
};

function CommandCenter() {
  const [cmd, setCmd] = useState(demoCommand);
  const [result, setResult] = useState<ParseResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [executed, setExecuted] = useState<
    Array<{ action: ExecutionAction; ok: boolean; response: unknown; error?: string }>
    | null
  >(null);
  const [commandId, setCommandId] = useState<string | null>(null);

  const analyze = async () => {
    if (!cmd.trim() || busy) return;
    setBusy(true);
    setResult(null);
    setExecuted(null);
    setCommandId(null);
    try {
      const { data: s } = await (supabase as any)
        .from("kseadsio_settings")
        .select("safe_mode, max_campaign_budget")
        .limit(1)
        .maybeSingle();
      const r = await fetch("/api/kayi/parse-command", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          command: cmd,
          safe_mode: s?.safe_mode ?? true,
          max_campaign_budget: s?.max_campaign_budget ?? 500,
        }),
      });
      const j = (await r.json()) as ParseResult | { error: string };
      if ("error" in j) throw new Error(j.error);
      setResult(j);
      const { data: inserted } = await (supabase as any)
        .from("kseadsio_commands")
        .insert({
          raw_command: cmd,
          parsed_json: j.plan,
          status: "planned",
          risk_level: j.risk.level,
          risk_notes: j.risk.findings,
          requires_approval: true,
        })
        .select("id")
        .single();
      if (inserted?.id) setCommandId(inserted.id);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Fehler beim Parsen");
    } finally {
      setBusy(false);
    }
  };

  const approveAndExecute = async () => {
    if (!result || executing) return;
    if (result.risk.level === "block") {
      alert("Ausführung blockiert — bitte Risiken beheben.");
      return;
    }
    if (!confirm("Wirklich freigeben und (im Mock-Modus) ausführen?")) return;
    setExecuting(true);
    try {
      const res = await executeActions(result.actions);
      setExecuted(res);
      if (commandId) {
        await (supabase as any)
          .from("kseadsio_commands")
          .update({
            status: "executed",
            approved_at: new Date().toISOString(),
            executed_at: new Date().toISOString(),
          })
          .eq("id", commandId);
        await (supabase as any).from("kseadsio_execution_logs").insert(
          res.map((r) => ({
            command_id: commandId,
            action_type: r.action.type,
            request_payload: r.action.payload,
            response_payload: r.response,
            status: r.ok ? "ok" : "error",
            error_message: r.error ?? null,
          })),
        );
      }
    } finally {
      setExecuting(false);
    }
  };

  const cancel = () => {
    setResult(null);
    setExecuted(null);
    setCommandId(null);
  };

  return (
    <div className="grid xl:grid-cols-[520px_1fr] gap-6">
      <GlassCard className="p-5 h-fit xl:sticky xl:top-6">
        <div className="flex items-center gap-2 mb-3">
          <Terminal className="w-4 h-4 text-cyan-300" />
          <div className="text-[10px] font-mono uppercase tracking-[0.3em] text-white/40">
            / KayI Terminal
          </div>
        </div>
        <div className="border border-cyan-400/20 bg-black/50 rounded p-3 font-mono text-sm">
          <div className="flex items-center gap-2 text-cyan-400/70 text-[10px] mb-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            KayI ready · Local parser
          </div>
          <textarea
            value={cmd}
            onChange={(e) => setCmd(e.target.value)}
            rows={12}
            className="w-full bg-transparent outline-none text-cyan-100 resize-none placeholder:text-cyan-500/40"
            placeholder="> Befehl an KayI…"
          />
        </div>
        <div className="flex gap-2 mt-3">
          <button
            onClick={analyze}
            disabled={busy}
            className="flex-1 flex items-center justify-center gap-2 bg-cyan-400 text-black font-black uppercase tracking-widest text-xs py-3 rounded hover:bg-cyan-300 disabled:opacity-40"
          >
            {busy ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            {busy ? "KayI denkt…" : "An KayI senden"}
          </button>
          <button
            onClick={cancel}
            className="px-4 border border-white/10 text-xs font-bold uppercase tracking-widest hover:bg-white/5 rounded"
          >
            Reset
          </button>
        </div>
        <p className="text-[11px] text-white/40 mt-3">
          Nichts wird live geschaltet. KayI erstellt nur einen Plan — Ausführung nur nach manueller Freigabe.
        </p>
      </GlassCard>

      <div className="space-y-4 min-w-0">
        {!result && (
          <GlassCard className="p-12 text-center text-white/40 text-sm">
            Kein Plan geladen. Sende einen Befehl links an KayI.
          </GlassCard>
        )}

        {result && (
          <>
            <GlassCard className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-[0.3em] text-white/40">
                    / Execution Preview
                  </div>
                  <h3 className="text-lg font-black">
                    Plan von KayI ({result.source})
                  </h3>
                </div>
                <RiskBadge level={result.risk.level} />
              </div>
              <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                <PlanRow k="Intent" v={result.plan.intent} />
                <PlanRow k="Quell-Kampagne" v={result.plan.source_campaign_id} mono />
                <PlanRow k="Objective" v={result.plan.objective} />
                <PlanRow k="Conversion" v={result.plan.conversion_event} />
                <PlanRow k="Standort" v={result.plan.location} />
                <PlanRow
                  k="Radius"
                  v={result.plan.radius_km ? `${result.plan.radius_km} km` : undefined}
                />
                <PlanRow
                  k="Alter"
                  v={
                    result.plan.age_min && result.plan.age_max
                      ? `${result.plan.age_min}–${result.plan.age_max}`
                      : undefined
                  }
                />
                <PlanRow
                  k="Budget/Tag"
                  v={
                    result.plan.daily_budget_eur
                      ? `${result.plan.daily_budget_eur}€`
                      : undefined
                  }
                />
                <PlanRow k="Placements" v={result.plan.placements?.join(", ")} />
                <PlanRow k="Pixel" v={result.plan.pixel_id} mono />
                <PlanRow k="Landingpage" v={result.plan.landing_page_url} />
                <PlanRow k="Creatives" v={result.plan.creative_source} />
              </dl>
            </GlassCard>

            <GlassCard className="p-5">
              <div className="text-[10px] font-mono uppercase tracking-[0.3em] text-orange-300 mb-3 flex items-center gap-2">
                <ShieldAlert className="w-3.5 h-3.5" /> Risk Engine
              </div>
              {result.risk.findings.length === 0 ? (
                <div className="text-sm text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" /> Keine Risiken erkannt.
                </div>
              ) : (
                <ul className="space-y-1.5">
                  {result.risk.findings.map((f, i) => (
                    <li
                      key={i}
                      className={`text-sm flex items-start gap-2 ${f.level === "block" ? "text-red-300" : f.level === "warn" ? "text-orange-300" : "text-white/60"}`}
                    >
                      {f.level === "block" ? (
                        <XCircle className="w-4 h-4 mt-0.5" />
                      ) : f.level === "warn" ? (
                        <AlertTriangle className="w-4 h-4 mt-0.5" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4 mt-0.5" />
                      )}
                      <span>
                        <span className="font-mono text-[10px] uppercase tracking-widest mr-2 text-white/40">
                          {f.code}
                        </span>
                        {f.message}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </GlassCard>

            <GlassCard className="p-5">
              <div className="text-[10px] font-mono uppercase tracking-[0.3em] text-white/40 mb-3">
                / Meta API Aktionen
              </div>
              <ol className="space-y-2">
                {result.actions.map((a, i) => (
                  <li key={i} className="border border-white/10 rounded p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-mono px-2 py-0.5 bg-cyan-400/10 text-cyan-300 rounded">
                        {a.type}
                      </span>
                      <span className="text-sm text-white/80">
                        {a.description}
                      </span>
                    </div>
                    <pre className="text-[11px] font-mono text-white/50 overflow-x-auto">
                      {JSON.stringify(a.payload, null, 2)}
                    </pre>
                  </li>
                ))}
              </ol>
            </GlassCard>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={approveAndExecute}
                disabled={executing || result.risk.level === "block"}
                className="flex-1 min-w-[220px] flex items-center justify-center gap-2 bg-emerald-400 text-black font-black uppercase tracking-widest text-xs py-3 rounded hover:bg-emerald-300 disabled:opacity-30"
              >
                {executing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                Freigeben & ausführen
              </button>
              <button className="px-4 py-3 border border-white/10 text-xs font-bold uppercase tracking-widest hover:bg-white/5 rounded">
                Plan bearbeiten
              </button>
              <button className="px-4 py-3 border border-white/10 text-xs font-bold uppercase tracking-widest hover:bg-white/5 rounded">
                Nur analysieren
              </button>
              <button
                onClick={cancel}
                className="px-4 py-3 border border-red-400/30 text-red-300 text-xs font-bold uppercase tracking-widest hover:bg-red-400/10 rounded"
              >
                Abbrechen
              </button>
            </div>

            {executed && (
              <GlassCard className="p-5">
                <div className="text-[10px] font-mono uppercase tracking-[0.3em] text-emerald-300 mb-3">
                  / Ausführung (Mock)
                </div>
                <ul className="space-y-2">
                  {executed.map((r, i) => (
                    <li
                      key={i}
                      className="text-sm flex items-start gap-2 border-b border-white/5 pb-2 last:border-0"
                    >
                      {r.ok ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-300 mt-0.5" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-300 mt-0.5" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="font-mono text-xs text-white/70">
                          {r.action.type}
                        </div>
                        <pre className="text-[10px] text-white/40 overflow-x-auto">
                          {JSON.stringify(r.response, null, 2)}
                        </pre>
                      </div>
                    </li>
                  ))}
                </ul>
              </GlassCard>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Creative Check
// ─────────────────────────────────────────────────────────────
function CreativeCheck() {
  const [items, setItems] = useState<MetaCreative[]>([]);
  useEffect(() => {
    getCampaignCreatives("120242692175120534").then(setItems);
  }, []);

  return (
    <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
      {items.map((c) => {
        const warnings: string[] = [];
        if (c.primary_text.length > 125)
          warnings.push("Primary Text > 125 Zeichen — evtl. abgeschnitten");
        if (!/€|ab\s?\d/.test(c.primary_text))
          warnings.push("Kein Preis-Signal im Text");
        if (c.format !== "9:16")
          warnings.push("Format ≠ 9:16 — für Story/Reels ungeeignet");
        return (
          <GlassCard key={c.id} className="p-5">
            <div className="text-[10px] font-mono uppercase tracking-widest text-white/40 mb-2">
              {c.id}
            </div>
            <h3 className="text-lg font-black mb-3">{c.name}</h3>
            <div className="aspect-[9/16] bg-gradient-to-br from-cyan-500/20 to-violet-500/20 border border-white/10 rounded mb-3 grid place-items-center text-white/40 text-xs">
              Preview {c.format}
            </div>
            <dl className="text-sm space-y-1 mb-3">
              <div>
                <dt className="text-[10px] uppercase tracking-widest text-white/40">
                  Primary
                </dt>
                <dd>{c.primary_text}</dd>
              </div>
              <div>
                <dt className="text-[10px] uppercase tracking-widest text-white/40">
                  Headline
                </dt>
                <dd className="font-semibold">{c.headline}</dd>
              </div>
              <div>
                <dt className="text-[10px] uppercase tracking-widest text-white/40">
                  CTA
                </dt>
                <dd className="font-mono text-cyan-300">{c.cta}</dd>
              </div>
            </dl>
            {warnings.length > 0 && (
              <ul className="space-y-1 border-t border-white/5 pt-3">
                {warnings.map((w, i) => (
                  <li
                    key={i}
                    className="text-xs text-orange-300 flex items-start gap-1.5"
                  >
                    <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                    {w}
                  </li>
                ))}
              </ul>
            )}
          </GlassCard>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Audit Logs
// ─────────────────────────────────────────────────────────────
function AuditLogs() {
  const [commands, setCommands] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  useEffect(() => {
    (async () => {
      const { data: c } = await (supabase as any)
        .from("kseadsio_commands")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      const { data: l } = await (supabase as any)
        .from("kseadsio_execution_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      setCommands(c ?? []);
      setLogs(l ?? []);
    })();
  }, []);
  return (
    <div className="space-y-6">
      <GlassCard>
        <div className="px-5 py-4 border-b border-white/10">
          <h2 className="text-lg font-black">Commands</h2>
        </div>
        {commands.length === 0 && (
          <div className="p-5 text-white/40 text-sm">Noch keine Commands.</div>
        )}
        <ul className="divide-y divide-white/5">
          {commands.map((c) => (
            <li key={c.id} className="p-5">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <RiskBadge level={c.risk_level ?? "unknown"} />
                  <span className="text-[10px] font-mono uppercase tracking-widest text-white/40">
                    {c.status}
                  </span>
                </div>
                <span className="text-xs text-white/40">
                  {new Date(c.created_at).toLocaleString("de-DE")}
                </span>
              </div>
              <div className="text-sm text-white/80 line-clamp-2">
                {c.raw_command}
              </div>
            </li>
          ))}
        </ul>
      </GlassCard>
      <GlassCard>
        <div className="px-5 py-4 border-b border-white/10">
          <h2 className="text-lg font-black">Execution Logs</h2>
        </div>
        <table className="w-full text-sm">
          <thead className="text-left text-[10px] uppercase tracking-widest text-white/40">
            <tr>
              <th className="px-5 py-3">Zeit</th>
              <th>Action</th>
              <th>Status</th>
              <th className="pr-5">Fehler</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((l) => (
              <tr key={l.id} className="border-t border-white/5">
                <td className="px-5 py-2 text-white/60 font-mono text-xs">
                  {new Date(l.created_at).toLocaleString("de-DE")}
                </td>
                <td className="font-mono text-cyan-200 text-xs">
                  {l.action_type}
                </td>
                <td>
                  {l.status === "ok" ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-300" />
                  )}
                </td>
                <td className="pr-5 text-red-300 text-xs">
                  {l.error_message ?? ""}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </GlassCard>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Settings
// ─────────────────────────────────────────────────────────────
function SettingsPanel() {
  const [s, setS] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    (async () => {
      const { data } = await (supabase as any)
        .from("kseadsio_settings")
        .select("*")
        .limit(1)
        .maybeSingle();
      setS(data ?? {});
    })();
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      if (s?.id) {
        await (supabase as any).from("kseadsio_settings").update(s).eq("id", s.id);
      } else {
        const { data } = await (supabase as any)
          .from("kseadsio_settings")
          .insert(s)
          .select()
          .single();
        setS(data);
      }
    } finally {
      setSaving(false);
    }
  };

  if (!s) return <div className="text-white/40 text-sm">Lade…</div>;
  const set = (k: string, v: any) => setS({ ...s, [k]: v });

  return (
    <div className="grid xl:grid-cols-2 gap-6 max-w-6xl">
      <GlassCard className="p-5 space-y-3">
        <SectionTitle icon={Database}>Meta Business</SectionTitle>
        <Field
          label="Meta Business ID"
          v={s.meta_business_id}
          onChange={(v) => set("meta_business_id", v)}
        />
        <Field
          label="Meta Ad Account ID"
          v={s.meta_ad_account_id}
          onChange={(v) => set("meta_ad_account_id", v)}
          placeholder="act_1234567890"
        />
        <Field
          label="Meta Access Token"
          v={s.meta_access_token_encrypted}
          onChange={(v) => set("meta_access_token_encrypted", v)}
          type="password"
        />
        <Field
          label="Pixel / Dataset ID"
          v={s.default_pixel_id}
          onChange={(v) => set("default_pixel_id", v)}
        />
        <Field
          label="Default Landingpage"
          v={s.default_landing_page}
          onChange={(v) => set("default_landing_page", v)}
        />
      </GlassCard>

      <GlassCard className="p-5 space-y-3">
        <SectionTitle icon={Sparkles}>KayI · Local AI (Ollama)</SectionTitle>
        <Field
          label="Ollama API URL"
          v={s.ollama_api_url}
          onChange={(v) => set("ollama_api_url", v)}
          placeholder="http://localhost:11434"
        />
        <Field
          label="Modell"
          v={s.ollama_model}
          onChange={(v) => set("ollama_model", v)}
          placeholder="llama3, qwen2, mistral…"
        />
        <p className="text-[11px] text-white/40">
          Wenn nicht erreichbar, nutzt KayI automatisch den regelbasierten Parser.
        </p>
      </GlassCard>

      <GlassCard className="p-5 space-y-3">
        <SectionTitle icon={ShieldAlert}>Sicherheit</SectionTitle>
        <label className="flex items-center gap-3 py-2">
          <input
            type="checkbox"
            checked={!!s.safe_mode}
            onChange={(e) => set("safe_mode", e.target.checked)}
            className="w-4 h-4 accent-cyan-400"
          />
          <span className="text-sm">
            Safe Mode aktiv (neue Kampagnen immer PAUSED)
          </span>
        </label>
        <Field
          label="Max Budget pro Kampagne (€)"
          type="number"
          v={s.max_campaign_budget}
          onChange={(v) => set("max_campaign_budget", Number(v))}
        />
        <Field
          label="Max Budget-Erhöhung pro Tag (%)"
          type="number"
          v={s.max_daily_budget_increase_percent}
          onChange={(v) => set("max_daily_budget_increase_percent", Number(v))}
        />
      </GlassCard>

      <GlassCard className="p-5 space-y-3">
        <SectionTitle icon={SettingsIcon}>Defaults</SectionTitle>
        <Field
          label="Default Daily Budget (€)"
          type="number"
          v={s.default_daily_budget_eur}
          onChange={(v) => set("default_daily_budget_eur", Number(v))}
        />
        <div className="grid grid-cols-2 gap-3">
          <Field
            label="Alter min"
            type="number"
            v={s.default_age_min}
            onChange={(v) => set("default_age_min", Number(v))}
          />
          <Field
            label="Alter max"
            type="number"
            v={s.default_age_max}
            onChange={(v) => set("default_age_max", Number(v))}
          />
        </div>
      </GlassCard>

      <div className="xl:col-span-2">
        <button
          onClick={save}
          disabled={saving}
          className="flex items-center gap-2 bg-cyan-400 text-black font-black uppercase tracking-widest text-xs px-6 py-3 rounded hover:bg-cyan-300 disabled:opacity-40"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}{" "}
          Speichern
        </button>
      </div>
    </div>
  );
}

function SectionTitle({
  children,
  icon: Icon,
}: {
  children: React.ReactNode;
  icon: typeof Sparkles;
}) {
  return (
    <div className="flex items-center gap-2 mb-2 pb-2 border-b border-white/10">
      <Icon className="w-4 h-4 text-cyan-300" />
      <div className="text-[10px] font-mono uppercase tracking-[0.3em] text-white/60">
        {children}
      </div>
    </div>
  );
}

function Field({
  label,
  v,
  onChange,
  type = "text",
  placeholder,
  hint,
  multiline,
}: {
  label: string;
  v: any;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  hint?: string;
  multiline?: boolean;
}) {
  return (
    <label className="block">
      <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-white/40 font-mono mb-1">
        {label}
        {hint && (
          <span
            title={hint}
            className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full border border-white/20 text-white/50 hover:text-cyan-300 hover:border-cyan-300/60 cursor-help text-[9px] normal-case tracking-normal"
            aria-label={hint}
          >
            ?
          </span>
        )}
      </span>
      {multiline ? (
        <textarea
          value={v ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={3}
          className="w-full bg-black/40 border border-white/10 focus:border-cyan-400/60 rounded px-3 py-2 text-sm text-white outline-none font-mono resize-y"
        />
      ) : (
        <input
          type={type}
          value={v ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-black/40 border border-white/10 focus:border-cyan-400/60 rounded px-3 py-2 text-sm text-white outline-none font-mono"
        />
      )}
    </label>
  );
}