import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Loader2,
  Users,
  Eye,
  Mail,
  Zap,
  ArrowUpRight,
  Activity,
  Sparkles,
  Radio,
  TrendingUp,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/")({ component: Dashboard });

type Event = {
  id: string;
  session_id: string;
  event_type: string;
  path: string | null;
  created_at: string;
  meta: Record<string, unknown> | null;
};

type Msg = {
  id: string;
  name: string;
  email: string;
  subject: string | null;
  message: string;
  is_read: boolean;
  is_archived: boolean;
  created_at: string;
};

function Dashboard() {
  const [events, setEvents] = useState<Event[]>([]);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);

  async function load() {
    setLoading(true);
    const since = new Date(Date.now() - 7 * 24 * 3600_000).toISOString();
    const [ev, ms] = await Promise.all([
      supabase
        .from("visitor_events")
        .select("*")
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(3000),
      supabase
        .from("contact_messages")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500),
    ]);
    setEvents((ev.data as Event[]) ?? []);
    setMessages((ms.data as Msg[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const stats = useMemo(() => {
    const t24 = now - 24 * 3600_000;
    const tPrev = now - 48 * 3600_000;
    const t5m = now - 5 * 60_000;

    let liveSessions = new Set<string>();
    let s24 = new Set<string>();
    let sPrev = new Set<string>();
    let pv24 = 0;
    let pvPrev = 0;
    let eggFinds = 0;
    let qbCtas = 0;
    const perPath = new Map<string, number>();
    const perDay = new Map<string, number>();

    for (const e of events) {
      const t = new Date(e.created_at).getTime();
      if (t >= t5m) liveSessions.add(e.session_id);
      if (t >= t24) {
        s24.add(e.session_id);
        if (e.event_type === "pageview") {
          pv24 += 1;
          const p = e.path ?? "/";
          perPath.set(p, (perPath.get(p) ?? 0) + 1);
        }
        if (e.event_type === "egg_found") eggFinds += 1;
        if (e.event_type === "quickbuilder_cta") qbCtas += 1;
      } else if (t >= tPrev) {
        sPrev.add(e.session_id);
        if (e.event_type === "pageview") pvPrev += 1;
      }
      if (e.event_type === "pageview") {
        const d = new Date(e.created_at);
        const key = `${d.getMonth() + 1}/${d.getDate()}`;
        perDay.set(key, (perDay.get(key) ?? 0) + 1);
      }
    }

    const topPaths = [...perPath.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    const spark = last7Days().map((k) => perDay.get(k) ?? 0);

    return {
      live: liveSessions.size,
      sessions24: s24.size,
      sessionsDelta: pctDelta(s24.size, sPrev.size),
      pv24,
      pvDelta: pctDelta(pv24, pvPrev),
      eggFinds,
      qbCtas,
      topPaths,
      spark,
    };
  }, [events, now]);

  const unread = messages.filter((m) => !m.is_read && !m.is_archived).length;
  const latestMsgs = messages.slice(0, 4);
  const latestActivity = events.slice(0, 8);

  return (
    <div className="min-h-screen p-4 sm:p-6 md:p-10">
      {/* Header banner */}
      <div className="mb-6 md:mb-8">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b-2 border-[#0a0a0a] pb-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] mb-2">
              <span className="bg-[#ff5722] text-white px-2 py-0.5">◆ Live</span>
              <span className="text-[#0a0a0a]/50">
                {new Date().toLocaleString("de-DE", {
                  weekday: "long",
                  day: "2-digit",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
            <h1
              className="font-black uppercase tracking-tighter leading-[0.85] text-[clamp(2rem,5vw,3.75rem)]"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Kommandozentrale
            </h1>
            <p className="mt-2 text-sm text-[#0a0a0a]/60 max-w-xl">
              Alles im Blick — Besucher, Nachrichten, Konversionen. Letzte 7 Tage.
            </p>
          </div>
          <button
            onClick={load}
            className="border-2 border-[#0a0a0a] bg-white hover:bg-[#0a0a0a] hover:text-white px-4 py-2 text-xs font-black uppercase tracking-widest transition-colors"
            style={{ boxShadow: "4px 4px 0 0 #0a0a0a" }}
          >
            ↻ Neu laden
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid place-items-center py-24">
          <Loader2 className="w-6 h-6 animate-spin text-[#ff5722]" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* KPI ROW */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Kpi
              icon={<Radio className="w-4 h-4" />}
              label="Jetzt live"
              value={stats.live}
              suffix="Sessions"
              accent
              pulse
            />
            <Kpi
              icon={<Users className="w-4 h-4" />}
              label="Sessions 24h"
              value={stats.sessions24}
              delta={stats.sessionsDelta}
            />
            <Kpi
              icon={<Eye className="w-4 h-4" />}
              label="Pageviews 24h"
              value={stats.pv24}
              delta={stats.pvDelta}
            />
            <Kpi
              icon={<Mail className="w-4 h-4" />}
              label="Ungelesen"
              value={unread}
              suffix={unread === 1 ? "Nachricht" : "Nachrichten"}
              highlight={unread > 0}
            />
          </div>

          {/* MAIN GRID */}
          <div className="grid lg:grid-cols-3 gap-4">
            {/* Traffic sparkline card */}
            <Panel
              className="lg:col-span-2"
              label="01"
              title="Traffic · letzte 7 Tage"
              action={
                <Link
                  to="/admin/journey"
                  className="text-[10px] font-black uppercase tracking-widest bg-[#0a0a0a] text-white px-2.5 py-1 hover:bg-[#ff5722] transition-colors"
                >
                  Journey →
                </Link>
              }
            >
              <Sparkline data={stats.spark} />
              <div className="mt-4 grid grid-cols-3 gap-3 pt-4 border-t border-dashed border-[#0a0a0a]/20">
                <MiniStat
                  icon={<Sparkles className="w-3.5 h-3.5" />}
                  label="Egg-Finds"
                  value={stats.eggFinds}
                />
                <MiniStat
                  icon={<Zap className="w-3.5 h-3.5" />}
                  label="Builder-CTA"
                  value={stats.qbCtas}
                />
                <MiniStat
                  icon={<TrendingUp className="w-3.5 h-3.5" />}
                  label="Events total"
                  value={events.length}
                />
              </div>
            </Panel>

            {/* Top pages */}
            <Panel label="02" title="Top-Seiten">
              {stats.topPaths.length === 0 ? (
                <Empty>Noch keine Views.</Empty>
              ) : (
                <ul className="space-y-2.5">
                  {stats.topPaths.map(([p, c], i) => {
                    const max = stats.topPaths[0][1];
                    return (
                      <li key={p}>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="flex items-center gap-2 truncate">
                            <span className="font-mono text-[10px] text-[#ff5722]">
                              {String(i + 1).padStart(2, "0")}
                            </span>
                            <span className="truncate font-mono">{p}</span>
                          </span>
                          <span className="font-mono tabular-nums text-[#0a0a0a]/60">
                            {c}
                          </span>
                        </div>
                        <div className="h-1.5 bg-[#0a0a0a]/10">
                          <div
                            className="h-full bg-[#0a0a0a]"
                            style={{ width: `${(c / max) * 100}%` }}
                          />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </Panel>

            {/* Latest messages */}
            <Panel
              label="03"
              title="Neueste Nachrichten"
              className="lg:col-span-2"
              action={
                <Link
                  to="/admin/inbox"
                  className="text-[10px] font-black uppercase tracking-widest bg-[#0a0a0a] text-white px-2.5 py-1 hover:bg-[#ff5722] transition-colors"
                >
                  Inbox →
                </Link>
              }
            >
              {latestMsgs.length === 0 ? (
                <Empty>Keine Nachrichten.</Empty>
              ) : (
                <ul className="divide-y-2 divide-dashed divide-[#0a0a0a]/15">
                  {latestMsgs.map((m) => (
                    <li key={m.id} className="py-3 first:pt-0 last:pb-0">
                      <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] gap-3 items-center">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            !m.is_read ? "bg-[#ff5722]" : "bg-[#0a0a0a]/20"
                          }`}
                        />
                        <div className="min-w-0">
                          <div className="flex items-baseline gap-2">
                            <span className="font-black text-sm truncate">
                              {m.name}
                            </span>
                            <span className="text-[10px] font-mono text-[#0a0a0a]/40 truncate">
                              {m.email}
                            </span>
                          </div>
                          <p className="text-xs text-[#0a0a0a]/60 truncate">
                            {m.subject ?? m.message}
                          </p>
                        </div>
                        <span className="font-mono text-[10px] text-[#0a0a0a]/40 whitespace-nowrap">
                          {timeAgo(m.created_at)}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>

            {/* Live activity feed */}
            <Panel label="04" title="Live-Activity">
              {latestActivity.length === 0 ? (
                <Empty>Ruhe im Kanal.</Empty>
              ) : (
                <ol className="space-y-2.5 max-h-[280px] overflow-y-auto pr-1">
                  {latestActivity.map((e) => (
                    <li key={e.id} className="flex items-start gap-2 text-xs">
                      <span className="mt-1 w-1.5 h-1.5 rounded-full bg-[#ff5722] shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-2">
                          <span className="font-black uppercase tracking-wide text-[10px]">
                            {e.event_type}
                          </span>
                          <span className="font-mono text-[9px] text-[#0a0a0a]/40">
                            {timeAgo(e.created_at)}
                          </span>
                        </div>
                        {e.path && (
                          <p className="font-mono text-[10px] text-[#0a0a0a]/50 truncate">
                            {e.path}
                          </p>
                        )}
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </Panel>

            {/* Quick actions */}
            <Panel label="05" title="Quick-Actions" className="lg:col-span-3">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <QuickAction to="/admin/inbox" icon="✉" label="Inbox" desc="Anfragen" />
                <QuickAction to="/admin/journey" icon="◊" label="Journey" desc="Sessions" />
                <QuickAction to="/admin/tutorials" icon="▶" label="Tutorials" desc="Videos" />
                <QuickAction to="/admin/instagram" icon="⌘" label="Instagram" desc="Posts" />
              </div>
            </Panel>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── UI pieces ─── */

function Kpi({
  icon,
  label,
  value,
  suffix,
  delta,
  accent,
  highlight,
  pulse,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  suffix?: string;
  delta?: number | null;
  accent?: boolean;
  highlight?: boolean;
  pulse?: boolean;
}) {
  return (
    <div
      className={`relative border-2 border-[#0a0a0a] p-4 ${
        accent ? "bg-[#ff5722] text-white" : highlight ? "bg-[#0a0a0a] text-white" : "bg-white"
      }`}
      style={{ boxShadow: "4px 4px 0 0 #0a0a0a" }}
    >
      <div className="flex items-center justify-between mb-2">
        <div
          className={`flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest ${
            accent || highlight ? "opacity-80" : "text-[#0a0a0a]/50"
          }`}
        >
          {icon} {label}
        </div>
        {pulse && (
          <span className="relative flex h-2 w-2">
            <span className="absolute inset-0 rounded-full bg-white opacity-70 animate-ping" />
            <span className="relative rounded-full h-2 w-2 bg-white" />
          </span>
        )}
      </div>
      <div
        className="font-black text-4xl leading-none tabular-nums"
        style={{ fontFamily: "var(--font-display)" }}
      >
        {value}
      </div>
      <div className="mt-1 flex items-center justify-between text-[10px] uppercase tracking-widest">
        <span className={accent || highlight ? "opacity-70" : "text-[#0a0a0a]/50"}>
          {suffix ?? " "}
        </span>
        {delta != null && (
          <span
            className={`font-mono font-bold ${
              accent || highlight
                ? "opacity-90"
                : delta >= 0
                  ? "text-[#0a0a0a]"
                  : "text-[#ff5722]"
            }`}
          >
            {delta >= 0 ? "▲" : "▼"} {Math.abs(delta)}%
          </span>
        )}
      </div>
    </div>
  );
}

function Panel({
  label,
  title,
  children,
  className = "",
  action,
}: {
  label: string;
  title: string;
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
}) {
  return (
    <div
      className={`bg-white border-2 border-[#0a0a0a] p-4 md:p-5 ${className}`}
      style={{ boxShadow: "4px 4px 0 0 #0a0a0a" }}
    >
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-dashed border-[#0a0a0a]/25">
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-mono text-[11px] font-bold text-[#ff5722] shrink-0">
            [{label}]
          </span>
          <h3 className="font-black uppercase tracking-widest text-xs truncate">
            {title}
          </h3>
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

function MiniStat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
}) {
  return (
    <div className="text-center">
      <div className="flex items-center justify-center gap-1 text-[9px] font-black uppercase tracking-widest text-[#0a0a0a]/50 mb-1">
        {icon} {label}
      </div>
      <div
        className="font-black text-xl tabular-nums"
        style={{ fontFamily: "var(--font-display)" }}
      >
        {value}
      </div>
    </div>
  );
}

function Sparkline({ data }: { data: number[] }) {
  const max = Math.max(...data, 1);
  const days = last7Labels();
  return (
    <div>
      <div className="flex items-end gap-2 h-32">
        {data.map((v, i) => {
          const h = Math.max(4, (v / max) * 100);
          const isLast = i === data.length - 1;
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
              <div className="flex-1 w-full flex items-end">
                <div
                  className={`w-full transition-all ${
                    isLast ? "bg-[#ff5722]" : "bg-[#0a0a0a]"
                  }`}
                  style={{ height: `${h}%` }}
                  title={`${v} Pageviews`}
                />
              </div>
              <span className="text-[9px] font-mono text-[#0a0a0a]/40">
                {days[i]}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function QuickAction({
  to,
  icon,
  label,
  desc,
}: {
  to: string;
  icon: string;
  label: string;
  desc: string;
}) {
  return (
    <Link
      to={to}
      className="group border-2 border-[#0a0a0a] p-4 hover:bg-[#ff5722] hover:text-white transition-colors flex items-center justify-between"
    >
      <div className="min-w-0">
        <div
          className="text-3xl leading-none mb-1 font-black"
          style={{ fontFamily: "var(--font-display)" }}
          aria-hidden
        >
          {icon}
        </div>
        <div className="font-black uppercase tracking-wide text-sm">{label}</div>
        <div className="text-[10px] opacity-60 uppercase tracking-widest">
          {desc}
        </div>
      </div>
      <ArrowUpRight className="w-4 h-4 opacity-40 group-hover:opacity-100 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-all" />
    </Link>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs text-[#0a0a0a]/50 text-center py-6 font-mono">
      {children}
    </p>
  );
}

/* ─── helpers ─── */

function pctDelta(now: number, prev: number): number | null {
  if (prev === 0) return now === 0 ? 0 : 100;
  return Math.round(((now - prev) / prev) * 100);
}

function last7Days(): string[] {
  const out: string[] = [];
  const d = new Date();
  for (let i = 6; i >= 0; i--) {
    const x = new Date(d);
    x.setDate(d.getDate() - i);
    out.push(`${x.getMonth() + 1}/${x.getDate()}`);
  }
  return out;
}

function last7Labels(): string[] {
  const out: string[] = [];
  const d = new Date();
  for (let i = 6; i >= 0; i--) {
    const x = new Date(d);
    x.setDate(d.getDate() - i);
    out.push(x.toLocaleDateString("de-DE", { weekday: "short" }).slice(0, 2));
  }
  return out;
}

function timeAgo(iso: string): string {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
}