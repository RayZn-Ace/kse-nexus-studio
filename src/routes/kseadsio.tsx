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
  Plus,
  Trash2,
  RefreshCw,
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
  const [liveMode] = useState<boolean>(true);
  const toggleLiveMode = () => {
    // Live ist der einzige Modus — es gibt keine Simulation mehr.
  };

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
            <button
              onClick={toggleLiveMode}
              title={
                "LIVE: Alle Aktionen werden echt an Meta Ads gesendet."
              }
              className={`flex items-center gap-2 px-3 py-1.5 rounded border transition-colors ${
                liveMode
                  ? "border-red-400/50 bg-red-500/10 text-red-300 hover:bg-red-500/20"
                  : "border-white/15 bg-white/5 text-white/60 hover:bg-white/10"
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  liveMode ? "bg-red-400 animate-pulse" : "bg-white/40"
                }`}
              />
              LIVE MODE
            </button>
            <span className="w-px h-4 bg-white/20" />
            <span className="text-cyan-300">SAFE ON</span>
          </div>
        </header>
        <main className="flex-1 p-8 overflow-y-auto">
          {tab === "dashboard" && <Dashboard />}
          {tab === "command" && <CommandCenter liveMode={liveMode} />}
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
          <div className="text-xs text-emerald-300/70 font-mono">
            LIVE · Meta Graph API v20
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

function CommandCenter({ liveMode = false }: { liveMode?: boolean }) {
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
      const [{ data: pixelsData }, { data: lpData }, { data: aaData }] = await Promise.all([
        (supabase as any).from("kseadsio_pixels").select("pixel_id, name"),
        (supabase as any).from("kseadsio_landing_pages").select("url, title"),
        (supabase as any).from("kseadsio_ad_accounts").select("ad_account_id, name"),
      ]);
      const r = await fetch("/api/kayi/parse-command", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          command: cmd,
          safe_mode: s?.safe_mode ?? true,
          max_campaign_budget: s?.max_campaign_budget ?? 500,
          known_pixels: pixelsData ?? [],
          known_landing_pages: lpData ?? [],
          known_ad_accounts: aaData ?? [],
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
    if (
      !confirm(
        "LIVE: Aktionen werden echt an Meta Ads gesendet. Wirklich ausführen?",
      )
    )
      return;
    setExecuting(true);
    try {
      const res = await executeActions(
        result.actions,
        true,
        result.plan.source_campaign_id,
      );
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
                <div
                  className={`text-[10px] font-mono uppercase tracking-[0.3em] mb-3 ${
                  "text-red-300"
                  }`}
                >
                  / Ausführung (Live)
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
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => {
    (async () => {
      try {
        const camps = await listCampaigns();
        const first = camps[0];
        if (!first) {
          setErr("Keine Kampagnen gefunden.");
          return;
        }
        const creatives = await getCampaignCreatives(first.id);
        setItems(creatives);
      } catch (e) {
        setErr(e instanceof Error ? e.message : String(e));
      }
    })();
  }, []);

  if (err) {
    return (
      <GlassCard className="p-8 text-sm text-red-300">
        Fehler beim Laden der Creatives: {err}
      </GlassCard>
    );
  }
  if (items.length === 0) {
    return (
      <GlassCard className="p-8 text-sm text-white/50">
        Lade Creatives aus Meta …
      </GlassCard>
    );
  }

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
      <div className="xl:col-span-2">
        <HealthPanel />
      </div>
      <GlassCard className="p-5 space-y-3">
        <SectionTitle icon={Database}>Meta Business</SectionTitle>
        <Field
          label="Meta Business ID"
          v={s.meta_business_id}
          onChange={(v) => set("meta_business_id", v)}
          hint="Business Manager → Einstellungen → Unternehmensinfo. Die numerische ID oben unter dem Firmennamen."
          placeholder="z.B. 1029384756123456"
        />
        <Field
          label="System User Access Token"
          v={s.meta_access_token_encrypted}
          onChange={(v) => set("meta_access_token_encrypted", v)}
          type="password"
          hint="Business Settings → Users → System Users → deinen System User wählen → 'Generate Token'. Scopes: ads_management, ads_read, business_management, pages_read_engagement. Long-Lived / Never Expires empfohlen."
          placeholder="EAAG… (langer System-User-Token)"
        />
        <Field
          label="System User ID (optional)"
          v={s.system_user_id}
          onChange={(v) => set("system_user_id", v)}
          hint="Business Settings → Users → System Users → in der URL oder Detailansicht sichtbar. Für Audit-Logs."
          placeholder="123456789012345"
        />
      </GlassCard>

      <div className="xl:col-span-2">
        <AdAccountsPanel systemToken={s.meta_access_token_encrypted ?? ""} />
      </div>

      <div className="xl:col-span-2">
        <PixelsPanel systemToken={s.meta_access_token_encrypted ?? ""} />
      </div>

      <div className="xl:col-span-2">
        <LandingPagesPanel />
      </div>

      <GlassCard className="p-5 space-y-3">
        <SectionTitle icon={Sparkles}>KayI · Cloudflare Workers AI</SectionTitle>
        <div className="text-xs text-white/70 space-y-2">
          <p>
            KayI läuft über <span className="text-cyan-300">Cloudflare Workers AI</span> (Llama 3.1) direkt auf Cloudflares Edge.
            Account ID und API Token sind serverseitig als Secrets hinterlegt.
          </p>
          <p className="text-white/40 text-[11px]">
            Fällt Cloudflare aus, greift automatisch der regelbasierte Fallback-Parser.
          </p>
        </div>
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
          <span
            className="text-sm cursor-help"
            title="Wenn aktiv, werden alle neu erstellten oder duplizierten Kampagnen zunächst als PAUSED angelegt. Du musst sie im Meta Ads Manager (oder im Approval-Schritt) manuell aktivieren."
          >
            Safe Mode aktiv (neue Kampagnen immer PAUSED)
          </span>
        </label>
        <Field
          label="Max Budget pro Kampagne (€)"
          type="number"
          v={s.max_campaign_budget}
          onChange={(v) => set("max_campaign_budget", Number(v))}
          hint="Harte Obergrenze. Befehle mit höherem Tagesbudget werden von der Risk Engine blockiert."
        />
        <Field
          label="Max Budget-Erhöhung pro Tag (%)"
          type="number"
          v={s.max_daily_budget_increase_percent}
          onChange={(v) => set("max_daily_budget_increase_percent", Number(v))}
          hint="Schutz gegen versehentliche Budget-Explosion. Erhöhungen über diesem Prozentsatz brauchen extra Bestätigung."
        />
      </GlassCard>

      <GlassCard className="p-5 space-y-3">
        <SectionTitle icon={SettingsIcon}>Defaults</SectionTitle>
        <Field
          label="Default Daily Budget (€)"
          type="number"
          v={s.default_daily_budget_eur}
          onChange={(v) => set("default_daily_budget_eur", Number(v))}
          hint="Wird verwendet, wenn im KayI-Befehl kein Budget angegeben ist."
        />
        <div className="grid grid-cols-2 gap-3">
          <Field
            label="Alter min"
            type="number"
            v={s.default_age_min}
            onChange={(v) => set("default_age_min", Number(v))}
            hint="Standard Mindestalter der Zielgruppe (Meta erlaubt min. 18)."
          />
          <Field
            label="Alter max"
            type="number"
            v={s.default_age_max}
            onChange={(v) => set("default_age_max", Number(v))}
            hint="Standard Maximalalter der Zielgruppe (Meta max. 65+)."
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

type AdAccountRow = {
  id: string;
  ad_account_id: string;
  label: string | null;
  name: string | null;
  currency: string | null;
  timezone_name: string | null;
  business_name: string | null;
  verification_status: string;
  verification_error: string | null;
  last_verified_at: string | null;
};

// ─────────────────────────────────────────────────────────────
// Health / Live-Verbindungscheck
// ─────────────────────────────────────────────────────────────
type HealthCheck = {
  id: string;
  label: string;
  kind: "token" | "ad_account" | "pixel" | "landing_page" | "cloud_ai";
  ok: boolean;
  status: "ok" | "warn" | "error" | "skip";
  detail?: string;
  latency_ms?: number;
};
type HealthResponse = {
  summary: { total: number; ok: number; warn: number; error: number; safe_mode: boolean; checked_at: string };
  checks: HealthCheck[];
  recent_commands: Array<{ id: string; raw_command: string; status: string; risk_level: string | null; created_at: string; executed_at: string | null }>;
  recent_logs: Array<{ id: string; action_type: string; status: string; error_message: string | null; created_at: string }>;
};

function HealthPanel() {
  const [data, setData] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [auto, setAuto] = useState(true);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancel = false;
    const run = async () => {
      setLoading(true);
      setErr(null);
      try {
        const res = await fetch("/api/kseadsio/health");
        const j = (await res.json()) as HealthResponse & { error?: string };
        if (cancel) return;
        if (j.error) setErr(j.error);
        else setData(j);
      } catch (e) {
        if (!cancel) setErr(e instanceof Error ? e.message : String(e));
      } finally {
        if (!cancel) setLoading(false);
      }
    };
    run();
    return () => {
      cancel = true;
    };
  }, [tick]);

  useEffect(() => {
    if (!auto) return;
    const t = setInterval(() => setTick((n) => n + 1), 8000);
    return () => clearInterval(t);
  }, [auto]);

  const dot = (s: HealthCheck["status"]) =>
    s === "ok" ? "bg-emerald-400" : s === "warn" ? "bg-amber-400" : s === "error" ? "bg-rose-500" : "bg-white/30";
  const kindLabel: Record<HealthCheck["kind"], string> = {
    token: "Token",
    ad_account: "Ad Account",
    pixel: "Pixel",
    landing_page: "Landing Page",
    cloud_ai: "Cloud AI",
  };
  const grouped = useMemo(() => {
    const g: Record<string, HealthCheck[]> = { token: [], ad_account: [], pixel: [], landing_page: [], cloud_ai: [] };
    (data?.checks ?? []).forEach((c) => g[c.kind]?.push(c));
    return g;
  }, [data]);

  return (
    <GlassCard className="p-5 space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <SectionTitle icon={Activity}>Verbindungs-Check · Live</SectionTitle>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-white/60">
            <input type="checkbox" checked={auto} onChange={(e) => setAuto(e.target.checked)} className="w-3.5 h-3.5 accent-cyan-400" />
            Auto-Refresh (8s)
          </label>
          <button
            type="button"
            onClick={() => setTick((n) => n + 1)}
            className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 border border-white/20 hover:border-cyan-400 hover:text-cyan-300 transition-colors"
            disabled={loading}
          >
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
            Jetzt prüfen
          </button>
        </div>
      </div>

      {err && <div className="text-xs text-rose-400 border border-rose-500/40 bg-rose-500/10 px-3 py-2">{err}</div>}

      {data && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            <div className="border border-white/10 px-3 py-2">
              <div className="text-[10px] uppercase tracking-wider text-white/50">Gesamt</div>
              <div className="text-lg font-mono">{data.summary.total}</div>
            </div>
            <div className="border border-emerald-500/30 bg-emerald-500/5 px-3 py-2">
              <div className="text-[10px] uppercase tracking-wider text-emerald-300/80">OK</div>
              <div className="text-lg font-mono text-emerald-300">{data.summary.ok}</div>
            </div>
            <div className="border border-amber-500/30 bg-amber-500/5 px-3 py-2">
              <div className="text-[10px] uppercase tracking-wider text-amber-300/80">Warn</div>
              <div className="text-lg font-mono text-amber-300">{data.summary.warn}</div>
            </div>
            <div className="border border-rose-500/30 bg-rose-500/5 px-3 py-2">
              <div className="text-[10px] uppercase tracking-wider text-rose-300/80">Fehler</div>
              <div className="text-lg font-mono text-rose-300">{data.summary.error}</div>
            </div>
            <div className="border border-white/10 px-3 py-2">
              <div className="text-[10px] uppercase tracking-wider text-white/50">Safe Mode</div>
              <div className={`text-sm font-mono ${data.summary.safe_mode ? "text-emerald-300" : "text-amber-300"}`}>
                {data.summary.safe_mode ? "AN" : "AUS"}
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-3">
              {(["token", "ad_account", "pixel", "landing_page", "cloud_ai"] as const).map((k) =>
                grouped[k].length === 0 ? null : (
                  <div key={k}>
                    <div className="text-[10px] uppercase tracking-wider text-white/40 mb-1">{kindLabel[k]}</div>
                    <div className="space-y-1">
                      {grouped[k].map((c) => (
                        <div key={c.id} className="flex items-center gap-2 border border-white/10 px-2.5 py-1.5 text-xs">
                          <span className={`h-2 w-2 rounded-full ${dot(c.status)} ${c.status === "ok" ? "animate-pulse" : ""}`} />
                          <span className="flex-1 truncate">{c.label}</span>
                          {c.detail && <span className="text-white/50 text-[11px] truncate max-w-[45%]">{c.detail}</span>}
                          {c.latency_ms != null && <span className="font-mono text-white/40 text-[10px]">{c.latency_ms}ms</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                ),
              )}
            </div>

            <div className="space-y-3">
              <div>
                <div className="text-[10px] uppercase tracking-wider text-white/40 mb-1 flex items-center gap-2">
                  <Zap className="h-3 w-3" /> Aktuelle Befehle
                </div>
                {data.recent_commands.length === 0 ? (
                  <div className="text-[11px] text-white/40 border border-white/10 px-2.5 py-2">Noch keine Befehle.</div>
                ) : (
                  <div className="space-y-1">
                    {data.recent_commands.map((c) => (
                      <div key={c.id} className="border border-white/10 px-2.5 py-1.5 text-[11px]">
                        <div className="flex items-center gap-2">
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              c.status === "executed"
                                ? "bg-emerald-400"
                                : c.status === "failed"
                                  ? "bg-rose-500"
                                  : c.status === "pending"
                                    ? "bg-amber-400 animate-pulse"
                                    : "bg-white/30"
                            }`}
                          />
                          <span className="uppercase tracking-wider text-[9px] text-white/50">{c.status}</span>
                          {c.risk_level && <span className="text-[9px] text-white/40">· {c.risk_level}</span>}
                          <span className="ml-auto text-white/40 text-[10px] font-mono">
                            {new Date(c.created_at).toLocaleTimeString("de-DE")}
                          </span>
                        </div>
                        <div className="truncate text-white/70 mt-0.5">{c.raw_command}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <div className="text-[10px] uppercase tracking-wider text-white/40 mb-1 flex items-center gap-2">
                  <ScrollText className="h-3 w-3" /> Live Execution Log
                </div>
                {data.recent_logs.length === 0 ? (
                  <div className="text-[11px] text-white/40 border border-white/10 px-2.5 py-2">Kein Log-Eintrag.</div>
                ) : (
                  <div className="space-y-1 max-h-64 overflow-y-auto">
                    {data.recent_logs.map((l) => (
                      <div key={l.id} className="flex items-center gap-2 border border-white/10 px-2.5 py-1.5 text-[11px]">
                        <span className={`h-1.5 w-1.5 rounded-full ${l.status === "success" ? "bg-emerald-400" : l.status === "error" ? "bg-rose-500" : "bg-amber-400"}`} />
                        <span className="font-mono">{l.action_type}</span>
                        {l.error_message && <span className="text-rose-300/70 truncate">{l.error_message}</span>}
                        <span className="ml-auto text-white/40 text-[10px] font-mono">
                          {new Date(l.created_at).toLocaleTimeString("de-DE")}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="text-[10px] text-white/40 font-mono">
            Letzter Check: {new Date(data.summary.checked_at).toLocaleString("de-DE")}
          </div>
        </>
      )}

      {!data && !err && (
        <div className="text-xs text-white/40 flex items-center gap-2">
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Verbindungen werden geprüft…
        </div>
      )}
    </GlassCard>
  );
}

function AdAccountsPanel({ systemToken }: { systemToken: string }) {
  const [rows, setRows] = useState<AdAccountRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [adId, setAdId] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [addErr, setAddErr] = useState<string | null>(null);

  const reload = async () => {
    setLoading(true);
    const { data } = await (supabase as any)
      .from("kseadsio_ad_accounts")
      .select("*")
      .order("created_at", { ascending: true });
    setRows((data ?? []) as AdAccountRow[]);
    setLoading(false);
  };

  useEffect(() => {
    void reload();
  }, []);

  const verify = async (row: {
    ad_account_id: string;
    id?: string;
  }): Promise<{ ok: boolean; error?: string; account?: any }> => {
    if (!systemToken) {
      return { ok: false, error: "System User Access Token oben fehlt." };
    }
    try {
      const res = await fetch("/api/kseadsio/verify-ad-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ad_account_id: row.ad_account_id,
          access_token: systemToken,
        }),
      });
      return (await res.json()) as any;
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : String(e) };
    }
  };

  const addAccount = async () => {
    setAddErr(null);
    if (!adId.trim()) return;
    const id = adId.trim().startsWith("act_") ? adId.trim() : `act_${adId.trim()}`;
    setBusy("add");
    const v = await verify({ ad_account_id: id });
    const payload: any = {
      ad_account_id: id,
      verification_status: v.ok ? "verified" : "error",
      verification_error: v.ok ? null : v.error ?? "Unbekannter Fehler",
      last_verified_at: new Date().toISOString(),
    };
    if (v.ok && v.account) {
      payload.name = v.account.name;
      payload.currency = v.account.currency;
      payload.timezone_name = v.account.timezone_name;
      payload.business_id = v.account.business_id;
      payload.business_name = v.account.business_name;
    }
    const { error } = await (supabase as any)
      .from("kseadsio_ad_accounts")
      .upsert(payload, { onConflict: "ad_account_id" });
    setBusy(null);
    if (error) {
      setAddErr(error.message);
      return;
    }
    setAdId("");
    void reload();
  };

  const revalidate = async (row: AdAccountRow) => {
    setBusy(row.id);
    const v = await verify(row);
    const patch: any = {
      verification_status: v.ok ? "verified" : "error",
      verification_error: v.ok ? null : v.error ?? "Unbekannter Fehler",
      last_verified_at: new Date().toISOString(),
    };
    if (v.ok && v.account) {
      patch.name = v.account.name;
      patch.currency = v.account.currency;
      patch.timezone_name = v.account.timezone_name;
      patch.business_id = v.account.business_id;
      patch.business_name = v.account.business_name;
    }
    await (supabase as any)
      .from("kseadsio_ad_accounts")
      .update(patch)
      .eq("id", row.id);
    setBusy(null);
    void reload();
  };

  const remove = async (row: AdAccountRow) => {
    if (!confirm(`Werbekonto ${row.name ?? row.ad_account_id} entfernen?`)) return;
    setBusy(row.id);
    await (supabase as any)
      .from("kseadsio_ad_accounts")
      .delete()
      .eq("id", row.id);
    setBusy(null);
    void reload();
  };

  return (
    <GlassCard className="p-5 space-y-4">
      <SectionTitle icon={Database}>
        Meta Ad Accounts &middot; Verbindungen
      </SectionTitle>

      {/* Add form */}
      <div className="grid md:grid-cols-[1fr_auto] gap-2 items-end">
        <label className="block">
          <span className="block text-[10px] uppercase tracking-widest text-white/40 font-mono mb-1">
            Ad Account ID
          </span>
          <input
            value={adId}
            onChange={(e) => setAdId(e.target.value)}
            placeholder="act_1234567890"
            className="w-full bg-black/40 border border-white/10 focus:border-cyan-400/60 rounded px-3 py-2 text-sm text-white outline-none font-mono"
          />
        </label>
        <button
          onClick={addAccount}
          disabled={busy === "add" || !adId.trim() || !systemToken}
          className="flex items-center gap-2 bg-cyan-400 text-black font-black uppercase tracking-widest text-xs px-4 py-2 rounded hover:bg-cyan-300 disabled:opacity-40 h-[38px]"
        >
          {busy === "add" ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Plus className="w-4 h-4" />
          )}
          Verbinden
        </button>
      </div>
      {!systemToken && (
        <p className="text-[11px] text-amber-300/80">
          Bitte zuerst den System User Access Token oben eintragen und speichern.
        </p>
      )}
      {addErr && (
        <p className="text-[11px] text-red-300">{addErr}</p>
      )}

      {/* List */}
      <div className="mt-3 border-t border-white/10 pt-3">
        {loading ? (
          <div className="text-white/40 text-sm">Lade…</div>
        ) : rows.length === 0 ? (
          <div className="text-white/40 text-sm font-mono">
            Noch keine Werbekonten verbunden.
          </div>
        ) : (
          <div className="space-y-2">
            {rows.map((r) => {
              const ok = r.verification_status === "verified";
              return (
                <div
                  key={r.id}
                  className="flex items-center gap-3 border border-white/10 hover:border-white/20 rounded px-3 py-2.5 bg-black/30"
                >
                  <span
                    className={`inline-flex items-center justify-center w-6 h-6 rounded-full shrink-0 ${
                      ok
                        ? "bg-emerald-400/15 text-emerald-300"
                        : "bg-red-400/15 text-red-300"
                    }`}
                    title={
                      ok
                        ? `Verifiziert${r.last_verified_at ? " · " + new Date(r.last_verified_at).toLocaleString("de-DE") : ""}`
                        : (r.verification_error ?? "Nicht verifiziert")
                    }
                  >
                    {ok ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      <XCircle className="w-4 h-4" />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-white truncate">
                        {r.name ?? r.ad_account_id}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-white/50 font-mono mt-0.5 flex-wrap">
                      <span>{r.ad_account_id}</span>
                      {r.currency && <span>· {r.currency}</span>}
                      {r.timezone_name && <span>· {r.timezone_name}</span>}
                      {r.business_name && (
                        <span className="text-cyan-300/80">
                          · {r.business_name}
                        </span>
                      )}
                    </div>
                    {!ok && r.verification_error && (
                      <div className="text-[11px] text-red-300/90 mt-1">
                        {r.verification_error}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => revalidate(r)}
                    disabled={busy === r.id || !systemToken}
                    className="p-2 rounded hover:bg-white/10 text-white/70 hover:text-cyan-300 disabled:opacity-30"
                    title="Erneut verifizieren"
                  >
                    {busy === r.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    onClick={() => remove(r)}
                    className="p-2 rounded hover:bg-red-500/20 text-white/60 hover:text-red-300"
                    title="Entfernen"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </GlassCard>
  );
}

type PixelRow = {
  id: string;
  pixel_id: string;
  name: string | null;
  last_fired_time: string | null;
  verification_status: string;
  verification_error: string | null;
  last_verified_at: string | null;
};

function PixelsPanel({ systemToken }: { systemToken: string }) {
  const [rows, setRows] = useState<PixelRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [pxId, setPxId] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [addErr, setAddErr] = useState<string | null>(null);

  const reload = async () => {
    setLoading(true);
    const { data } = await (supabase as any)
      .from("kseadsio_pixels")
      .select("*")
      .order("created_at", { ascending: true });
    setRows((data ?? []) as PixelRow[]);
    setLoading(false);
  };

  useEffect(() => {
    void reload();
  }, []);

  const verify = async (row: {
    pixel_id: string;
  }): Promise<{ ok: boolean; error?: string; pixel?: any }> => {
    if (!systemToken) {
      return { ok: false, error: "System User Access Token oben fehlt." };
    }
    try {
      const res = await fetch("/api/kseadsio/verify-pixel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pixel_id: row.pixel_id,
          access_token: systemToken,
        }),
      });
      return (await res.json()) as any;
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : String(e) };
    }
  };

  const addPixel = async () => {
    setAddErr(null);
    if (!pxId.trim()) return;
    const id = pxId.trim();
    setBusy("add");
    const v = await verify({ pixel_id: id });
    const payload: any = {
      pixel_id: id,
      verification_status: v.ok ? "verified" : "error",
      verification_error: v.ok ? null : v.error ?? "Unbekannter Fehler",
      last_verified_at: new Date().toISOString(),
    };
    if (v.ok && v.pixel) {
      payload.name = v.pixel.name;
      payload.last_fired_time = v.pixel.last_fired_time;
    }
    const { error } = await (supabase as any)
      .from("kseadsio_pixels")
      .upsert(payload, { onConflict: "pixel_id" });
    setBusy(null);
    if (error) {
      setAddErr(error.message);
      return;
    }
    setPxId("");
    void reload();
  };

  const revalidate = async (row: PixelRow) => {
    setBusy(row.id);
    const v = await verify(row);
    const patch: any = {
      verification_status: v.ok ? "verified" : "error",
      verification_error: v.ok ? null : v.error ?? "Unbekannter Fehler",
      last_verified_at: new Date().toISOString(),
    };
    if (v.ok && v.pixel) {
      patch.name = v.pixel.name;
      patch.last_fired_time = v.pixel.last_fired_time;
    }
    await (supabase as any)
      .from("kseadsio_pixels")
      .update(patch)
      .eq("id", row.id);
    setBusy(null);
    void reload();
  };

  const remove = async (row: PixelRow) => {
    if (!confirm(`Pixel ${row.name ?? row.pixel_id} entfernen?`)) return;
    setBusy(row.id);
    await (supabase as any).from("kseadsio_pixels").delete().eq("id", row.id);
    setBusy(null);
    void reload();
  };

  return (
    <GlassCard className="p-5 space-y-4">
      <SectionTitle icon={Database}>Meta Pixel · Verbindungen</SectionTitle>

      <div className="grid md:grid-cols-[1fr_auto] gap-2 items-end">
        <label className="block">
          <span className="block text-[10px] uppercase tracking-widest text-white/40 font-mono mb-1">
            Pixel / Dataset ID
          </span>
          <input
            value={pxId}
            onChange={(e) => setPxId(e.target.value)}
            placeholder="926446183790326"
            className="w-full bg-black/40 border border-white/10 focus:border-cyan-400/60 rounded px-3 py-2 text-sm text-white outline-none font-mono"
          />
        </label>
        <button
          onClick={addPixel}
          disabled={busy === "add" || !pxId.trim() || !systemToken}
          className="flex items-center gap-2 bg-cyan-400 text-black font-black uppercase tracking-widest text-xs px-4 py-2 rounded hover:bg-cyan-300 disabled:opacity-40 h-[38px]"
        >
          {busy === "add" ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Plus className="w-4 h-4" />
          )}
          Verbinden
        </button>
      </div>
      {!systemToken && (
        <p className="text-[11px] text-amber-300/80">
          Bitte zuerst den System User Access Token oben eintragen und speichern.
        </p>
      )}
      {addErr && <p className="text-[11px] text-red-300">{addErr}</p>}

      <div className="mt-3 border-t border-white/10 pt-3">
        {loading ? (
          <div className="text-white/40 text-sm">Lade…</div>
        ) : rows.length === 0 ? (
          <div className="text-white/40 text-sm font-mono">
            Noch keine Pixel verbunden.
          </div>
        ) : (
          <div className="space-y-2">
            {rows.map((r) => {
              const ok = r.verification_status === "verified";
              return (
                <div
                  key={r.id}
                  className="flex items-center gap-3 border border-white/10 hover:border-white/20 rounded px-3 py-2.5 bg-black/30"
                >
                  <span
                    className={`inline-flex items-center justify-center w-6 h-6 rounded-full shrink-0 ${
                      ok
                        ? "bg-emerald-400/15 text-emerald-300"
                        : "bg-red-400/15 text-red-300"
                    }`}
                    title={
                      ok
                        ? `Verifiziert${r.last_verified_at ? " · " + new Date(r.last_verified_at).toLocaleString("de-DE") : ""}`
                        : (r.verification_error ?? "Nicht verifiziert")
                    }
                  >
                    {ok ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      <XCircle className="w-4 h-4" />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-white truncate">
                      {r.name ?? r.pixel_id}
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-white/50 font-mono mt-0.5 flex-wrap">
                      <span>{r.pixel_id}</span>
                      {r.last_fired_time && (
                        <span className="text-emerald-300/70">
                          · zuletzt gefeuert{" "}
                          {new Date(r.last_fired_time).toLocaleString("de-DE")}
                        </span>
                      )}
                    </div>
                    {!ok && r.verification_error && (
                      <div className="text-[11px] text-red-300/90 mt-1">
                        {r.verification_error}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => revalidate(r)}
                    disabled={busy === r.id || !systemToken}
                    className="p-2 rounded hover:bg-white/10 text-white/70 hover:text-cyan-300 disabled:opacity-30"
                    title="Erneut verifizieren"
                  >
                    {busy === r.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    onClick={() => remove(r)}
                    className="p-2 rounded hover:bg-red-500/20 text-white/60 hover:text-red-300"
                    title="Entfernen"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </GlassCard>
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
          <span className="relative inline-flex group/hint">
            <span
              tabIndex={0}
              aria-label={hint}
              className="inline-flex items-center justify-center w-4 h-4 rounded-full border border-white/25 text-white/60 hover:text-cyan-300 hover:border-cyan-300/70 focus:text-cyan-300 focus:border-cyan-300/70 outline-none cursor-help text-[10px] normal-case tracking-normal font-sans leading-none"
            >
              ?
            </span>
            <span
              role="tooltip"
              className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 z-50 w-72 rounded-md border border-cyan-400/30 bg-black/95 backdrop-blur px-3 py-2 text-[11px] font-sans normal-case tracking-normal leading-snug text-white/90 shadow-xl opacity-0 translate-x-1 transition-all duration-150 group-hover/hint:opacity-100 group-hover/hint:translate-x-0 group-focus-within/hint:opacity-100 group-focus-within/hint:translate-x-0"
            >
              {hint}
            </span>
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
type LandingPageRow = {
  id: string;
  url: string;
  title: string | null;
  description: string | null;
  favicon_url: string | null;
  final_url: string | null;
  status_code: number | null;
  verification_status: string;
  verification_error: string | null;
  last_verified_at: string | null;
};

function LandingPagesPanel() {
  const [rows, setRows] = useState<LandingPageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [addErr, setAddErr] = useState<string | null>(null);

  const reload = async () => {
    setLoading(true);
    const { data } = await (supabase as any)
      .from("kseadsio_landing_pages")
      .select("*")
      .order("created_at", { ascending: true });
    setRows((data ?? []) as LandingPageRow[]);
    setLoading(false);
  };

  useEffect(() => {
    void reload();
  }, []);

  const verify = async (u: string): Promise<{ ok: boolean; error?: string; page?: any }> => {
    try {
      const res = await fetch("/api/kseadsio/verify-landing-page", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: u }),
      });
      return (await res.json()) as any;
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : String(e) };
    }
  };

  const addPage = async () => {
    setAddErr(null);
    if (!url.trim()) return;
    setBusy("add");
    const v = await verify(url.trim());
    const normalized = v.page?.final_url ?? (url.trim().startsWith("http") ? url.trim() : "https://" + url.trim());
    const payload: any = {
      url: normalized,
      verification_status: v.ok ? "verified" : "error",
      verification_error: v.ok ? null : v.error ?? "Unbekannter Fehler",
      last_verified_at: new Date().toISOString(),
    };
    if (v.page) {
      payload.title = v.page.title ?? null;
      payload.description = v.page.description ?? null;
      payload.favicon_url = v.page.favicon_url ?? null;
      payload.final_url = v.page.final_url ?? null;
      payload.status_code = v.page.status_code ?? null;
    }
    const { error } = await (supabase as any)
      .from("kseadsio_landing_pages")
      .upsert(payload, { onConflict: "url" });
    setBusy(null);
    if (error) {
      setAddErr(error.message);
      return;
    }
    setUrl("");
    void reload();
  };

  const revalidate = async (row: LandingPageRow) => {
    setBusy(row.id);
    const v = await verify(row.url);
    const patch: any = {
      verification_status: v.ok ? "verified" : "error",
      verification_error: v.ok ? null : v.error ?? "Unbekannter Fehler",
      last_verified_at: new Date().toISOString(),
    };
    if (v.page) {
      patch.title = v.page.title ?? null;
      patch.description = v.page.description ?? null;
      patch.favicon_url = v.page.favicon_url ?? null;
      patch.final_url = v.page.final_url ?? null;
      patch.status_code = v.page.status_code ?? null;
    }
    await (supabase as any)
      .from("kseadsio_landing_pages")
      .update(patch)
      .eq("id", row.id);
    setBusy(null);
    void reload();
  };

  const remove = async (row: LandingPageRow) => {
    if (!confirm(`Landing Page ${row.title ?? row.url} entfernen?`)) return;
    setBusy(row.id);
    await (supabase as any).from("kseadsio_landing_pages").delete().eq("id", row.id);
    setBusy(null);
    void reload();
  };

  return (
    <GlassCard className="p-5 space-y-4">
      <SectionTitle icon={Database}>Landing Pages · Verbindungen</SectionTitle>

      <div className="grid md:grid-cols-[1fr_auto] gap-2 items-end">
        <label className="block">
          <span className="block text-[10px] uppercase tracking-widest text-white/40 font-mono mb-1">
            Landing Page URL
          </span>
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void addPage();
            }}
            placeholder="https://ksegroup.eu/angebot"
            className="w-full bg-black/40 border border-white/10 focus:border-cyan-400/60 rounded px-3 py-2 text-sm text-white outline-none font-mono"
          />
        </label>
        <button
          onClick={addPage}
          disabled={busy === "add" || !url.trim()}
          className="flex items-center gap-2 bg-cyan-400 text-black font-black uppercase tracking-widest text-xs px-4 py-2 rounded hover:bg-cyan-300 disabled:opacity-40 h-[38px]"
        >
          {busy === "add" ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Plus className="w-4 h-4" />
          )}
          Verbinden
        </button>
      </div>
      {addErr && <p className="text-[11px] text-red-300">{addErr}</p>}

      <div className="mt-3 border-t border-white/10 pt-3">
        {loading ? (
          <div className="text-white/40 text-sm">Lade…</div>
        ) : rows.length === 0 ? (
          <div className="text-white/40 text-sm font-mono">
            Noch keine Landing Pages verbunden. Ads verlinken jeweils individuell — es gibt keine feste Haupt-Landing-Page.
          </div>
        ) : (
          <div className="space-y-2">
            {rows.map((r) => {
              const ok = r.verification_status === "verified";
              let host = r.url;
              try {
                host = new URL(r.url).host;
              } catch {}
              return (
                <div
                  key={r.id}
                  className="flex items-center gap-3 border border-white/10 hover:border-white/20 rounded px-3 py-2.5 bg-black/30"
                >
                  <span
                    className={`inline-flex items-center justify-center w-6 h-6 rounded-full shrink-0 ${
                      ok
                        ? "bg-emerald-400/15 text-emerald-300"
                        : "bg-red-400/15 text-red-300"
                    }`}
                    title={
                      ok
                        ? `Verifiziert${r.last_verified_at ? " · " + new Date(r.last_verified_at).toLocaleString("de-DE") : ""}`
                        : (r.verification_error ?? "Nicht verifiziert")
                    }
                  >
                    {ok ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      <XCircle className="w-4 h-4" />
                    )}
                  </span>
                  {r.favicon_url ? (
                    <img
                      src={r.favicon_url}
                      alt=""
                      className="w-5 h-5 rounded-sm shrink-0 bg-white/5"
                      onError={(e) => ((e.currentTarget.style.display = "none"))}
                    />
                  ) : null}
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-white truncate">
                      {r.title ?? host}
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-white/50 font-mono mt-0.5 flex-wrap">
                      <a
                        href={r.final_url ?? r.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-cyan-300 truncate max-w-[420px]"
                      >
                        {r.final_url ?? r.url}
                      </a>
                      {typeof r.status_code === "number" && (
                        <span className={r.status_code < 400 ? "text-emerald-300/70" : "text-red-300/70"}>
                          · HTTP {r.status_code}
                        </span>
                      )}
                    </div>
                    {r.description && (
                      <div className="text-[11px] text-white/50 mt-1 line-clamp-2">
                        {r.description}
                      </div>
                    )}
                    {!ok && r.verification_error && (
                      <div className="text-[11px] text-red-300/90 mt-1">
                        {r.verification_error}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => revalidate(r)}
                    disabled={busy === r.id}
                    className="p-2 rounded hover:bg-white/10 text-white/70 hover:text-cyan-300 disabled:opacity-30"
                    title="Erneut verifizieren"
                  >
                    {busy === r.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    onClick={() => remove(r)}
                    className="p-2 rounded hover:bg-red-500/20 text-white/60 hover:text-red-300"
                    title="Entfernen"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </GlassCard>
  );
}
