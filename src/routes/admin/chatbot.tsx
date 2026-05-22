import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Loader2, MessageCircle, MessageSquare, Film, CheckCircle2, XCircle, Clock, Copy, RefreshCw, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/chatbot")({
  head: () => ({ meta: [{ title: "Chatbot — KSE Group" }, { name: "robots", content: "noindex" }] }),
  component: ChatbotAdmin,
});

type MsgRow = {
  id: string;
  type: "dm" | "comment" | "story_reply";
  sender_id: string | null;
  sender_username: string | null;
  incoming_text: string | null;
  outgoing_text: string | null;
  status: "sent" | "failed" | "pending" | "skipped";
  error_message: string | null;
  post_id: string | null;
  created_at: string;
};

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const WEBHOOK_URL = `${SUPABASE_URL}/functions/v1/instagram-webhook`;

function StatCard({ label, value, icon: Icon, tone }: { label: string; value: string | number; icon: any; tone?: string }) {
  return (
    <div className="rounded-xl border border-border bg-card/40 p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
        <Icon className={`w-4 h-4 ${tone ?? "text-muted-foreground"}`} />
      </div>
      <div className="text-2xl font-semibold">{value}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: MsgRow["status"] }) {
  const map: Record<string, { cls: string; icon: any; label: string }> = {
    sent: { cls: "bg-emerald-500/15 text-emerald-400", icon: CheckCircle2, label: "Gesendet" },
    failed: { cls: "bg-red-500/15 text-red-400", icon: XCircle, label: "Fehler" },
    pending: { cls: "bg-yellow-500/15 text-yellow-400", icon: Clock, label: "Pending" },
    skipped: { cls: "bg-muted/40 text-muted-foreground", icon: AlertCircle, label: "Übersprungen" },
  };
  const s = map[status] ?? map.pending;
  const I = s.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs ${s.cls}`}>
      <I className="w-3 h-3" /> {s.label}
    </span>
  );
}

function ChatbotAdmin() {
  const [logs, setLogs] = useState<MsgRow[]>([]);
  const [cfg, setCfg] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [filterType, setFilterType] = useState<"all" | MsgRow["type"]>("all");
  const [filterStatus, setFilterStatus] = useState<"all" | MsgRow["status"]>("all");
  const [selected, setSelected] = useState<MsgRow | null>(null);

  async function loadAll() {
    const [{ data: rows }, { data: cfgRows }] = await Promise.all([
      supabase.from("messages_log").select("*").order("created_at", { ascending: false }).limit(200),
      supabase.from("chatbot_config").select("key,value"),
    ]);
    setLogs((rows as MsgRow[]) ?? []);
    const c: Record<string, any> = {};
    (cfgRows ?? []).forEach((r: any) => { c[r.key] = r.value; });
    setCfg(c);
    setLoading(false);
  }

  useEffect(() => { loadAll(); }, []);

  // Auto-refresh every 30s
  useEffect(() => {
    const t = setInterval(loadAll, 30_000);
    return () => clearInterval(t);
  }, []);

  // Realtime
  useEffect(() => {
    const ch = supabase
      .channel("messages_log_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "messages_log" }, () => loadAll())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const stats = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const weekStart = todayStart - 6 * 86400_000;
    const sent = logs.filter((l) => l.status === "sent");
    return {
      dmsToday: sent.filter((l) => l.type === "dm" && new Date(l.created_at).getTime() >= todayStart).length,
      commentsToday: sent.filter((l) => l.type === "comment" && new Date(l.created_at).getTime() >= todayStart).length,
      storyToday: sent.filter((l) => l.type === "story_reply" && new Date(l.created_at).getTime() >= todayStart).length,
      weekTotal: sent.filter((l) => new Date(l.created_at).getTime() >= weekStart).length,
      todayTotal: sent.filter((l) => new Date(l.created_at).getTime() >= todayStart).length,
    };
  }, [logs]);

  const filtered = useMemo(() => {
    return logs.filter((l) =>
      (filterType === "all" || l.type === filterType) &&
      (filterStatus === "all" || l.status === filterStatus)
    );
  }, [logs, filterType, filterStatus]);

  async function updateCfg(key: string, value: any) {
    setCfg((c) => ({ ...c, [key]: value }));
    const { error } = await supabase.from("chatbot_config")
      .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: "key" });
    if (error) toast.error(`Speichern fehlgeschlagen: ${error.message}`);
  }

  async function saveTextCfg(key: string, value: string) {
    setSaving(true);
    await updateCfg(key, value);
    setSaving(false);
    toast.success("Gespeichert");
  }

  const maxDaily = parseInt(String(cfg.max_daily_responses ?? 500));
  const limitColor = stats.todayTotal >= maxDaily ? "text-red-400" : stats.todayTotal >= maxDaily * 0.8 ? "text-yellow-400" : "text-emerald-400";

  if (loading) {
    return <div className="min-h-screen grid place-items-center"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold">Instagram Chatbot</h1>
          <p className="text-sm text-muted-foreground mt-1">Automatische KI-Antworten auf DMs, Kommentare & Story-Replies</p>
        </div>
        <button onClick={loadAll} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-card/60 border border-border text-sm hover:bg-card">
          <RefreshCw className="w-4 h-4" /> Aktualisieren
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="DMs heute" value={stats.dmsToday} icon={MessageCircle} />
        <StatCard label="Kommentare heute" value={stats.commentsToday} icon={MessageSquare} />
        <StatCard label="Story Replies heute" value={stats.storyToday} icon={Film} />
        <StatCard label="Tages-Limit" value={`${stats.todayTotal}/${maxDaily}`} icon={Clock} tone={limitColor} />
      </div>

      {/* Config Panel */}
      <section className="rounded-2xl border border-border bg-card/30 p-6 space-y-5">
        <h2 className="font-display text-xl font-semibold">Konfiguration</h2>

        <div className="grid md:grid-cols-2 gap-4">
          {[
            { key: "enabled", label: "Chatbot aktiviert (Master-Switch)" },
            { key: "auto_reply_dm", label: "Auto-Reply DMs" },
            { key: "auto_reply_comments", label: "Auto-Reply Kommentare" },
            { key: "auto_reply_story", label: "Auto-Reply Story-Replies" },
          ].map((t) => (
            <label key={t.key} className="flex items-center justify-between gap-4 p-3 rounded-lg bg-background/40 border border-border">
              <span className="text-sm">{t.label}</span>
              <button
                onClick={() => updateCfg(t.key, !(cfg[t.key] === true))}
                className={`relative w-11 h-6 rounded-full transition-colors ${cfg[t.key] === true ? "bg-accent" : "bg-muted"}`}
              >
                <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${cfg[t.key] === true ? "translate-x-5" : "translate-x-0.5"}`} />
              </button>
            </label>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs uppercase tracking-wider text-muted-foreground">Max. Antworten / Tag</label>
            <input
              type="number"
              defaultValue={String(cfg.max_daily_responses ?? 500)}
              onBlur={(e) => saveTextCfg("max_daily_responses", parseInt(e.target.value) || 500)}
              className="mt-1 w-full px-3 py-2 rounded-lg bg-background border border-border text-sm"
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-wider text-muted-foreground">Blacklist-Wörter (Komma-getrennt)</label>
            <input
              type="text"
              defaultValue={String(cfg.blacklist_words ?? "")}
              onBlur={(e) => saveTextCfg("blacklist_words", e.target.value)}
              placeholder="spam, kaufen, link in bio"
              className="mt-1 w-full px-3 py-2 rounded-lg bg-background border border-border text-sm"
            />
          </div>
        </div>

        <div>
          <label className="text-xs uppercase tracking-wider text-muted-foreground">KSE Group Kontext für Claude</label>
          <textarea
            defaultValue={String(cfg.kse_context ?? "")}
            onBlur={(e) => saveTextCfg("kse_context", e.target.value)}
            rows={8}
            className="mt-1 w-full px-3 py-2 rounded-lg bg-background border border-border text-sm font-mono"
          />
          {saving && <p className="text-xs text-muted-foreground mt-1">Speichert…</p>}
        </div>
      </section>

      {/* Setup */}
      <section className="rounded-2xl border border-border bg-card/30 p-6 space-y-3">
        <h2 className="font-display text-xl font-semibold">Setup-Anleitung (Meta Developer Console)</h2>
        <ol className="space-y-3 text-sm">
          <li className="flex gap-3">
            <span className="text-accent font-semibold">1.</span>
            <div className="flex-1">
              <p>Webhook-URL eintragen:</p>
              <div className="flex items-center gap-2 mt-1 p-2 rounded-lg bg-background border border-border font-mono text-xs">
                <code className="flex-1 truncate">{WEBHOOK_URL}</code>
                <button onClick={() => { navigator.clipboard.writeText(WEBHOOK_URL); toast.success("Kopiert"); }} className="p-1 hover:bg-card rounded">
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </li>
          <li className="flex gap-3">
            <span className="text-accent font-semibold">2.</span>
            <p>Verify Token: Wert von <code className="px-1 py-0.5 rounded bg-background border border-border text-xs">WEBHOOK_VERIFY_TOKEN</code> aus den Cloud-Secrets eintragen.</p>
          </li>
          <li className="flex gap-3">
            <span className="text-accent font-semibold">3.</span>
            <p>Subscribed Fields aktivieren: <code className="px-1 py-0.5 rounded bg-background border border-border text-xs">messages, messaging_postbacks, comments, message_reactions</code></p>
          </li>
          <li className="flex gap-3">
            <span className="text-accent font-semibold">4.</span>
            <p>App auf <strong>Live Mode</strong> stellen und Instagram Account verbinden.</p>
          </li>
        </ol>
      </section>

      {/* Live Monitor / Log */}
      <section className="rounded-2xl border border-border bg-card/30 p-6">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <h2 className="font-display text-xl font-semibold">Nachrichten-Log</h2>
          <div className="flex gap-2">
            <select value={filterType} onChange={(e) => setFilterType(e.target.value as any)} className="px-3 py-1.5 rounded-lg bg-background border border-border text-sm">
              <option value="all">Alle Typen</option>
              <option value="dm">DM</option>
              <option value="comment">Kommentar</option>
              <option value="story_reply">Story-Reply</option>
            </select>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as any)} className="px-3 py-1.5 rounded-lg bg-background border border-border text-sm">
              <option value="all">Alle Status</option>
              <option value="sent">Gesendet</option>
              <option value="failed">Fehler</option>
              <option value="skipped">Übersprungen</option>
              <option value="pending">Pending</option>
            </select>
          </div>
        </div>

        {filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-12">Noch keine Nachrichten.</p>
        ) : (
          <div className="overflow-x-auto -mx-2">
            <table className="w-full text-sm">
              <thead className="text-xs uppercase tracking-wider text-muted-foreground">
                <tr className="border-b border-border">
                  <th className="text-left px-2 py-2">Typ</th>
                  <th className="text-left px-2 py-2">Von</th>
                  <th className="text-left px-2 py-2">Eingehend</th>
                  <th className="text-left px-2 py-2">Antwort</th>
                  <th className="text-left px-2 py-2">Status</th>
                  <th className="text-left px-2 py-2">Zeit</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id} onClick={() => setSelected(r)} className="border-b border-border/50 hover:bg-card/60 cursor-pointer">
                    <td className="px-2 py-3"><span className="text-xs px-2 py-0.5 rounded bg-background border border-border">{r.type}</span></td>
                    <td className="px-2 py-3 max-w-[120px] truncate">{r.sender_username ?? r.sender_id ?? "—"}</td>
                    <td className="px-2 py-3 max-w-[260px] truncate text-muted-foreground">{r.incoming_text ?? "—"}</td>
                    <td className="px-2 py-3 max-w-[260px] truncate">{r.outgoing_text ?? "—"}</td>
                    <td className="px-2 py-3"><StatusBadge status={r.status} /></td>
                    <td className="px-2 py-3 text-xs text-muted-foreground whitespace-nowrap">{new Date(r.created_at).toLocaleString("de-DE")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Detail modal */}
      {selected && (
        <div onClick={() => setSelected(null)} className="fixed inset-0 z-50 bg-black/70 grid place-items-center p-6">
          <div onClick={(e) => e.stopPropagation()} className="max-w-2xl w-full rounded-2xl bg-card border border-border p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs px-2 py-0.5 rounded bg-background border border-border">{selected.type}</span>
                <h3 className="font-display text-lg font-semibold mt-2">{selected.sender_username ?? selected.sender_id ?? "Unbekannt"}</h3>
                <p className="text-xs text-muted-foreground">{new Date(selected.created_at).toLocaleString("de-DE")}</p>
              </div>
              <StatusBadge status={selected.status} />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Eingehend</p>
              <div className="p-3 rounded-lg bg-background border border-border text-sm whitespace-pre-wrap">{selected.incoming_text ?? "—"}</div>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Antwort von Claude</p>
              <div className="p-3 rounded-lg bg-background border border-border text-sm whitespace-pre-wrap">{selected.outgoing_text ?? "—"}</div>
            </div>
            {selected.error_message && (
              <div>
                <p className="text-xs uppercase tracking-wider text-red-400 mb-1">Fehler</p>
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-sm text-red-400">{selected.error_message}</div>
              </div>
            )}
            <button onClick={() => setSelected(null)} className="w-full py-2 rounded-lg bg-background border border-border text-sm hover:bg-card">Schließen</button>
          </div>
        </div>
      )}
    </div>
  );
}