import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Loader2,
  Users,
  Eye,
  Activity,
  RefreshCw,
  ChevronRight,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/journey")({
  component: JourneyPage,
});

type Event = {
  id: string;
  session_id: string;
  event_type: string;
  path: string | null;
  referrer: string | null;
  user_agent: string | null;
  meta: Record<string, unknown> | null;
  created_at: string;
};

const RANGES = [
  { id: "24h", label: "24h", ms: 24 * 3600_000 },
  { id: "7d", label: "7 Tage", ms: 7 * 24 * 3600_000 },
  { id: "30d", label: "30 Tage", ms: 30 * 24 * 3600_000 },
] as const;

function JourneyPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<(typeof RANGES)[number]["id"]>("24h");
  const [selected, setSelected] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const since = new Date(
      Date.now() - RANGES.find((r) => r.id === range)!.ms,
    ).toISOString();
    const { data, error } = await supabase
      .from("visitor_events")
      .select("*")
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(2000);
    if (error) toast.error(error.message);
    else setEvents((data as Event[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
     
  }, [range]);

  const stats = useMemo(() => {
    const sessions = new Set<string>();
    const pageviews: Event[] = [];
    const perPath = new Map<string, number>();
    const perEvent = new Map<string, number>();
    for (const e of events) {
      sessions.add(e.session_id);
      perEvent.set(e.event_type, (perEvent.get(e.event_type) ?? 0) + 1);
      if (e.event_type === "pageview") {
        pageviews.push(e);
        const p = e.path ?? "/";
        perPath.set(p, (perPath.get(p) ?? 0) + 1);
      }
    }
    return {
      sessions: sessions.size,
      pageviews: pageviews.length,
      total: events.length,
      topPaths: [...perPath.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8),
      topEvents: [...perEvent.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8),
    };
  }, [events]);

  const sessions = useMemo(() => {
    const m = new Map<string, Event[]>();
    for (const e of events) {
      if (!m.has(e.session_id)) m.set(e.session_id, []);
      m.get(e.session_id)!.push(e);
    }
    return [...m.entries()]
      .map(([id, evs]) => ({
        id,
        events: evs.slice().reverse(),
        first: evs[evs.length - 1]?.created_at,
        last: evs[0]?.created_at,
        count: evs.length,
      }))
      .sort((a, b) => (b.last ?? "").localeCompare(a.last ?? ""));
  }, [events]);

  const active = sessions.find((s) => s.id === selected) ?? null;

  return (
    <div className="p-6 md:p-8 max-w-[1400px]">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold">Customer Journey</h1>
          <p className="text-sm text-muted-foreground">
            Live-Tracking anonymer Besucher-Events
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-xs glass rounded-full p-1">
            {RANGES.map((r) => (
              <button
                key={r.id}
                onClick={() => setRange(r.id)}
                className={`px-3 py-1.5 rounded-full transition-colors ${
                  range === r.id
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
          <button
            onClick={load}
            className="p-2 rounded-full hover:bg-card/60 text-muted-foreground hover:text-foreground"
            aria-label="Neu laden"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </header>

      {loading ? (
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      ) : (
        <>
          {/* KPI cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <KPI icon={<Users className="w-4 h-4" />} label="Unique Sessions" value={stats.sessions} />
            <KPI icon={<Eye className="w-4 h-4" />} label="Pageviews" value={stats.pageviews} />
            <KPI icon={<Activity className="w-4 h-4" />} label="Events gesamt" value={stats.total} />
            <KPI
              icon={<Activity className="w-4 h-4" />}
              label="Ø Events/Session"
              value={stats.sessions ? (stats.total / stats.sessions).toFixed(1) : "0"}
            />
          </div>

          <div className="grid lg:grid-cols-2 gap-4 mb-6">
            <Panel title="Top-Seiten">
              {stats.topPaths.length === 0 ? (
                <Empty>Keine Pageviews im Zeitraum.</Empty>
              ) : (
                <BarList items={stats.topPaths} />
              )}
            </Panel>
            <Panel title="Top-Events">
              {stats.topEvents.length === 0 ? (
                <Empty>Keine Events.</Empty>
              ) : (
                <BarList items={stats.topEvents} />
              )}
            </Panel>
          </div>

          <div className="grid md:grid-cols-[380px_1fr] gap-4 min-h-[50vh]">
            <div className="glass rounded-2xl overflow-hidden">
              <div className="px-4 py-3 border-b border-border text-xs uppercase tracking-widest text-muted-foreground">
                Sessions ({sessions.length})
              </div>
              <ul className="divide-y divide-border max-h-[70vh] overflow-y-auto">
                {sessions.map((s) => (
                  <li key={s.id}>
                    <button
                      onClick={() => setSelected(s.id)}
                      className={`w-full text-left p-3 hover:bg-card/40 transition-colors ${
                        selected === s.id ? "bg-card/60" : ""
                      }`}
                    >
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-mono text-xs truncate max-w-[180px]">
                          {s.id}
                        </span>
                        <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-muted-foreground mt-1">
                        <span>{s.count} Events</span>
                        <span>{new Date(s.last ?? "").toLocaleString("de-DE")}</span>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div className="glass rounded-2xl p-4 md:p-5 min-w-0">
              {!active ? (
                <Empty>Session links wählen, um die Journey zu sehen.</Empty>
              ) : (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-widest">
                        Session
                      </p>
                      <h3 className="font-mono text-sm">{active.id}</h3>
                    </div>
                    <div className="text-right text-[11px] text-muted-foreground">
                      {active.count} Events ·{" "}
                      {new Date(active.first ?? "").toLocaleString("de-DE")}
                    </div>
                  </div>
                  <ol className="relative border-l border-border ml-2 space-y-3">
                    {active.events.map((e) => (
                      <li key={e.id} className="pl-4 relative">
                        <span className="absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full bg-accent" />
                        <div className="text-sm">
                          <span className="font-medium">{e.event_type}</span>
                          {e.path && (
                            <span className="text-muted-foreground"> · {e.path}</span>
                          )}
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          {new Date(e.created_at).toLocaleTimeString("de-DE")}
                          {e.meta && Object.keys(e.meta).length > 0 && (
                            <span className="ml-2 font-mono text-[10px] text-muted-foreground/80">
                              {JSON.stringify(e.meta)}
                            </span>
                          )}
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function KPI({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
}) {
  return (
    <div className="glass rounded-2xl p-4">
      <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground mb-2">
        {icon} {label}
      </div>
      <div className="font-display text-2xl font-bold tabular-nums">{value}</div>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="glass rounded-2xl p-4">
      <div className="text-xs uppercase tracking-widest text-muted-foreground mb-3">
        {title}
      </div>
      {children}
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-sm text-muted-foreground text-center py-6">{children}</p>
  );
}

function BarList({ items }: { items: [string, number][] }) {
  const max = Math.max(...items.map((i) => i[1]), 1);
  return (
    <ul className="space-y-2">
      {items.map(([label, count]) => (
        <li key={label}>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="truncate max-w-[240px]">{label}</span>
            <span className="tabular-nums text-muted-foreground">{count}</span>
          </div>
          <div className="h-1.5 bg-card/60 rounded-full overflow-hidden">
            <div
              className="h-full bg-accent"
              style={{ width: `${(count / max) * 100}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}