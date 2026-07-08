import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Rocket, Plus, Star, ExternalLink, Copy, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/missions")({
  head: () => ({ meta: [{ title: "Missionen — KSE Kommandozentrale" }, { name: "robots", content: "noindex" }] }),
  component: MissionsLayout,
});

type Row = {
  token: string;
  client_name: string | null;
  scope: string | null;
  contact: string | null;
  launch_date: string | null;
  rating: number | null;
  updated_at: string;
};

function MissionsLayout() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const isDetail = /^\/admin\/missions\/.+/.test(path);
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [newToken, setNewToken] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from("mission_config")
      .select("token, client_name, scope, contact, launch_date, rating, updated_at")
      .order("updated_at", { ascending: false });
    setRows((data || []) as Row[]);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function createMission() {
    const t = newToken.trim() || crypto.randomUUID().slice(0, 8);
    const { error } = await supabase.from("mission_config").insert({
      token: t, client_name: "Neuer Kunde", scope: "Scope definieren", contact: "",
      milestones: DEFAULT_MILESTONES, updates: [], files: [],
    });
    if (error) { alert("Konnte Mission nicht anlegen: " + error.message); return; }
    setNewToken("");
    await load();
  }

  function copyLink(token: string) {
    const url = `${window.location.origin}/mission/${token}`;
    navigator.clipboard.writeText(url);
    setCopied(token);
    setTimeout(() => setCopied(null), 1500);
  }

  return (
    <div className="h-screen flex min-h-0">
      <aside className="w-96 shrink-0 border-r-2 border-[#0a0a0a] bg-white flex flex-col">
        <div className="p-4 border-b-2 border-[#0a0a0a]">
          <div className="flex items-center gap-2 mb-3">
            <Rocket className="w-4 h-4 text-[#ff5722]" />
            <div className="font-black uppercase tracking-tight text-sm">Missionen</div>
          </div>
          <div className="flex gap-2">
            <input
              value={newToken}
              onChange={(e) => setNewToken(e.target.value.replace(/[^a-z0-9-]/gi, ""))}
              placeholder="Token (optional)"
              className="flex-1 border-2 border-[#0a0a0a] px-2 py-1.5 text-xs bg-[#f5f2ea] focus:outline-none focus:bg-white"
            />
            <button onClick={createMission} className="px-2 py-1.5 border-2 border-[#0a0a0a] bg-[#0a0a0a] text-white text-[10px] font-black uppercase tracking-widest hover:bg-[#ff5722] flex items-center gap-1">
              <Plus className="w-3 h-3" /> Neu
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loading && <div className="p-6 text-xs text-[#0a0a0a]/50 font-black uppercase tracking-widest">Lade…</div>}
          {!loading && rows.length === 0 && (
            <div className="p-6 text-xs text-[#0a0a0a]/50">Noch keine Missionen. Leg eine mit „Neu" an.</div>
          )}
          {rows.map((r) => {
            const active = path === `/admin/missions/${r.token}`;
            return (
              <Link
                key={r.token}
                to="/admin/missions/$token"
                params={{ token: r.token }}
                className={`block border-b-2 border-[#0a0a0a]/10 p-3 hover:bg-[#f5f2ea] ${active ? "bg-[#fff7f2] border-l-4 border-l-[#ff5722]" : ""}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="font-black uppercase tracking-tight text-sm truncate">{r.client_name || "—"}</div>
                    <div className="text-[10px] text-[#0a0a0a]/60 truncate">{r.scope || "Kein Scope"}</div>
                    <div className="text-[9px] font-mono text-[#0a0a0a]/40 mt-1 truncate">#{r.token}</div>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    {r.rating ? (
                      <div className="flex items-center gap-0.5 text-[#ff5722]">
                        <Star className="w-3 h-3 fill-current" />
                        <span className="text-[10px] font-black">{r.rating}</span>
                      </div>
                    ) : null}
                    <button
                      onClick={(e) => { e.preventDefault(); copyLink(r.token); }}
                      className="p-1 border border-[#0a0a0a]/20 hover:border-[#0a0a0a]"
                      title="Portal-Link kopieren"
                    >
                      {copied === r.token ? <Check className="w-3 h-3 text-[#10b981]" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </aside>

      <section className="flex-1 min-w-0 bg-[#f5f2ea] overflow-y-auto">
        {isDetail ? <Outlet /> : (
          <div className="h-full grid place-items-center p-8">
            <div className="text-center max-w-md">
              <div className="inline-block bg-[#ff5722] text-white px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.3em] mb-3">◆ Missions-Kontrolle</div>
              <h1 className="font-black uppercase tracking-tighter text-4xl mb-3" style={{ fontFamily: "var(--font-display)" }}>Wähle eine Mission</h1>
              <p className="text-sm text-[#0a0a0a]/70">Roadmap, Meilensteine, Updates, Feedback-Sterne — alles pro Kunde konfigurierbar. Der Portal-Link ist der Zugangs-Token.</p>
              <a href="/mission/demo" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 mt-4 px-3 py-2 border-2 border-[#0a0a0a] bg-white text-[10px] font-black uppercase tracking-widest hover:bg-[#0a0a0a] hover:text-white">
                <ExternalLink className="w-3 h-3" /> Demo-Portal öffnen
              </a>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

export const DEFAULT_MILESTONES = [
  { key: "discovery", label: "Discovery-Call", desc: "Ziele, Zielgruppe, Scope definiert", status: "done" },
  { key: "concept", label: "Konzept & Wireframes", desc: "Struktur, Copy & Flows abgestimmt", status: "done" },
  { key: "design", label: "Design-Sprint", desc: "Visual Language, Screens, Prototyp", status: "active" },
  { key: "build", label: "Umsetzung", desc: "Development, Integrationen, Content", status: "todo" },
  { key: "qa", label: "QA & Testing", desc: "Performance, SEO, Accessibility", status: "todo" },
  { key: "launch", label: "Launch", desc: "Go-Live, Monitoring, Handover", status: "todo" },
];