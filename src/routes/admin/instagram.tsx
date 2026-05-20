import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Loader2, Play, RefreshCw, CheckCircle2, XCircle, Image as ImageIcon, Film, Newspaper, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/instagram")({
  head: () => ({ meta: [{ title: "Instagram Automation — KSE Group" }, { name: "robots", content: "noindex" }] }),
  component: InstagramAdmin,
});

type PostType = "story" | "reel" | "feed";
type LogRow = {
  id: string;
  type: PostType;
  caption: string | null;
  image_url: string | null;
  video_url: string | null;
  ig_media_id: string | null;
  status: "success" | "failed" | "pending";
  error_message: string | null;
  triggered_by: "cron" | "manual";
  created_at: string;
};

function StatCard({ label, value, icon: Icon }: { label: string; value: number | string; icon: any }) {
  return (
    <div className="rounded-xl border border-border bg-card/40 p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
        <Icon className="w-4 h-4 text-muted-foreground" />
      </div>
      <div className="text-2xl font-semibold">{value}</div>
    </div>
  );
}

function InstagramAdmin() {
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [config, setConfig] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<PostType | "all" | null>(null);
  const [filterType, setFilterType] = useState<"all" | PostType>("all");
  const [filterStatus, setFilterStatus] = useState<"all" | "success" | "failed">("all");

  async function loadAll() {
    const [{ data: logRows }, { data: cfgRows }] = await Promise.all([
      supabase.from("posts_log").select("*").order("created_at", { ascending: false }).limit(200),
      supabase.from("automation_config").select("key,value"),
    ]);
    setLogs((logRows as LogRow[]) ?? []);
    const cfg: Record<string, boolean> = {};
    (cfgRows ?? []).forEach((r: any) => {
      cfg[r.key] = r.value === true;
    });
    setConfig(cfg);
    setLoading(false);
  }

  useEffect(() => {
    loadAll();
  }, []);

  // Auto-refresh every 10s while there are pending jobs
  const hasPending = useMemo(() => logs.some((l) => l.status === "pending"), [logs]);
  useEffect(() => {
    if (!hasPending) return;
    const t = setInterval(loadAll, 10_000);
    return () => clearInterval(t);
  }, [hasPending]);

  const stats = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const weekStart = todayStart - 6 * 86400_000;
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    const ok = logs.filter((l) => l.status === "success");
    return {
      storiesToday: ok.filter((l) => l.type === "story" && new Date(l.created_at).getTime() >= todayStart).length,
      reelsWeek: ok.filter((l) => l.type === "reel" && new Date(l.created_at).getTime() >= weekStart).length,
      feedMonth: ok.filter((l) => l.type === "feed" && new Date(l.created_at).getTime() >= monthStart).length,
      total: ok.length,
      failed: logs.filter((l) => l.status === "failed").length,
    };
  }, [logs]);

  const filtered = useMemo(
    () =>
      logs.filter(
        (l) =>
          (filterType === "all" || l.type === filterType) &&
          (filterStatus === "all" || l.status === filterStatus),
      ),
    [logs, filterType, filterStatus],
  );

  async function toggleConfig(key: string, val: boolean) {
    setConfig((c) => ({ ...c, [key]: val }));
    const { error } = await supabase
      .from("automation_config")
      .upsert({ key, value: val, updated_at: new Date().toISOString() }, { onConflict: "key" });
    if (error) {
      console.error(error);
      alert("Speichern fehlgeschlagen: " + error.message);
      loadAll();
    }
  }

  async function trigger(type: PostType | "all") {
    setBusy(type);
    const types: PostType[] = type === "all" ? ["story", "reel", "feed"] : [type];
    try {
      for (const t of types) {
        try {
          const { data, error } = await supabase.functions.invoke("instagram-post", {
            body: { type: t, triggered_by: "manual" },
          });
          if (error || (data as any)?.ok === false) {
            const msg = (data as any)?.error || error?.message || "Unbekannter Fehler";
            console.error(`${t} failed to queue`, error, data);
            toast.error(`${t}: Start fehlgeschlagen — ${msg}`, { duration: 10000 });
          } else {
            toast.success(`${t} läuft im Hintergrund — Tab kann geschlossen werden`);
          }
        } catch (e: any) {
          console.error(`${t} threw`, e);
          toast.error(`${t}: ${e?.message ?? e}`, { duration: 10000 });
        }
        await loadAll();
      }
    } finally {
      setBusy(null);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold">Instagram Automation</h1>
          <p className="text-sm text-muted-foreground">@kse.group — Stories, Reels & Feed</p>
        </div>
        <button
          onClick={loadAll}
          className="text-xs flex items-center gap-2 px-3 py-2 rounded-lg border border-border hover:bg-card/60"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </header>

      {/* Stats */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Stories heute" value={stats.storiesToday} icon={ImageIcon} />
        <StatCard label="Reels (7 Tage)" value={stats.reelsWeek} icon={Film} />
        <StatCard label="Feed (Monat)" value={stats.feedMonth} icon={Newspaper} />
        <StatCard label="Total erfolgreich" value={stats.total} icon={CheckCircle2} />
      </section>

      {/* Config + Manual */}
      <section className="grid md:grid-cols-2 gap-4">
        <div className="rounded-xl border border-border bg-card/30 p-5">
          <h2 className="font-semibold mb-3 text-sm uppercase tracking-wider">Automation</h2>
          <div className="space-y-2">
            {(["story", "reel", "feed"] as const).map((t) => (
              <label key={t} className="flex items-center justify-between py-2 cursor-pointer">
                <span className="text-sm capitalize">{t}</span>
                <input
                  type="checkbox"
                  className="h-5 w-9 appearance-none rounded-full bg-muted relative cursor-pointer transition-colors checked:bg-accent before:absolute before:top-0.5 before:left-0.5 before:h-4 before:w-4 before:rounded-full before:bg-white before:transition-transform checked:before:translate-x-4"
                  checked={!!config[`${t}_enabled`]}
                  onChange={(e) => toggleConfig(`${t}_enabled`, e.target.checked)}
                />
              </label>
            ))}
          </div>
          <p className="text-[11px] text-muted-foreground mt-3">
            Stories: 09/14/19 Uhr · Reel: 12 Uhr · Feed: alle 2 Tage 10 Uhr (Berliner Zeit)
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card/30 p-5">
          <h2 className="font-semibold mb-3 text-sm uppercase tracking-wider">Manuell posten</h2>
          <div className="grid grid-cols-2 gap-2">
            {(["story", "reel", "feed"] as const).map((t) => (
              <button
                key={t}
                disabled={!!busy}
                onClick={() => trigger(t)}
                className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-accent/15 text-accent hover:bg-accent/25 disabled:opacity-50 text-sm capitalize"
              >
                {busy === t ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                {t}
              </button>
            ))}
            <button
              disabled={!!busy}
              onClick={() => trigger("all")}
              className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-foreground text-background hover:opacity-90 disabled:opacity-50 text-sm"
            >
              {busy === "all" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
              Run all
            </button>
          </div>
          <p className="text-[11px] text-muted-foreground mt-3">
            Triggert sofort, ignoriert den Automation-Toggle.
          </p>
        </div>
      </section>

      {/* Logs */}
      <section className="rounded-xl border border-border bg-card/30 p-5">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <h2 className="font-semibold text-sm uppercase tracking-wider">Posts Log</h2>
          <div className="flex gap-2 text-xs">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="bg-background border border-border rounded-md px-2 py-1"
            >
              <option value="all">Alle Typen</option>
              <option value="story">Story</option>
              <option value="reel">Reel</option>
              <option value="feed">Feed</option>
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="bg-background border border-border rounded-md px-2 py-1"
            >
              <option value="all">Alle Status</option>
              <option value="success">Erfolg</option>
              <option value="failed">Fehler</option>
            </select>
          </div>
        </div>

        {filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">Noch keine Posts.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-muted-foreground border-b border-border">
                <tr>
                  <th className="py-2 pr-3">Status</th>
                  <th className="py-2 pr-3">Typ</th>
                  <th className="py-2 pr-3">Media</th>
                  <th className="py-2 pr-3">Caption / Fehler</th>
                  <th className="py-2 pr-3">Quelle</th>
                  <th className="py-2 pr-3 whitespace-nowrap">Zeit</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((l) => (
                  <tr key={l.id} className="border-b border-border/40 align-top">
                    <td className="py-2 pr-3">
                      {l.status === "success" ? (
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                      ) : l.status === "pending" ? (
                        <Clock className="w-4 h-4 text-yellow-500 animate-pulse" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-500" />
                      )}
                    </td>
                    <td className="py-2 pr-3 capitalize">{l.type}</td>
                    <td className="py-2 pr-3">
                      {l.video_url ? (
                        <a
                          href={l.video_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-accent hover:underline"
                          title="Video ansehen"
                        >
                          <Play className="w-3.5 h-3.5" /> Video
                        </a>
                      ) : l.image_url ? (
                        <a
                          href={l.image_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"
                          title="Bild ansehen"
                        >
                          <ImageIcon className="w-3.5 h-3.5" /> Bild
                        </a>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="py-2 pr-3 max-w-md">
                      <div className="line-clamp-2">
                        {l.status === "failed" ? (
                          <span className="text-red-400">{l.error_message ?? "Unknown error"}</span>
                        ) : l.status === "pending" ? (
                          <span className="text-yellow-500">läuft… (Video-Generierung kann mehrere Min dauern)</span>
                        ) : (
                          l.caption ?? "—"
                        )}
                      </div>
                    </td>
                    <td className="py-2 pr-3 text-xs text-muted-foreground capitalize">{l.triggered_by}</td>
                    <td className="py-2 pr-3 text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(l.created_at).toLocaleString("de-DE")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}