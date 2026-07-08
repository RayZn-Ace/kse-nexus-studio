import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Save, Plus, Trash2, ExternalLink, Star, GripVertical, CheckCircle2, Clock, Circle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { DEFAULT_MILESTONES } from "./missions";

export const Route = createFileRoute("/admin/missions/$token")({
  head: ({ params }) => ({ meta: [{ title: `Mission ${params.token} — KSE` }, { name: "robots", content: "noindex" }] }),
  component: MissionDetail,
});

type Milestone = { key: string; label: string; desc: string; status: "done" | "active" | "todo" };
type Update = { day: number; text: string };
type FileItem = { name: string; size: string; type: string };

type Config = {
  token: string;
  client_name: string | null;
  scope: string | null;
  contact: string | null;
  launch_date: string | null;
  milestones: Milestone[];
  updates: Update[];
  files: FileItem[];
  notes: string | null;
  rating: number | null;
  rating_comment: string | null;
  rated_at: string | null;
};

function MissionDetail() {
  const { token } = Route.useParams();
  const [cfg, setCfg] = useState<Config | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await supabase.from("mission_config").select("*").eq("token", token).maybeSingle();
      if (data) {
        setCfg({
          ...(data as unknown as Config),
          milestones: (data.milestones as unknown as Milestone[]) ?? [],
          updates: (data.updates as unknown as Update[]) ?? [],
          files: (data.files as unknown as FileItem[]) ?? [],
        });
      } else {
        setCfg({
          token, client_name: "", scope: "", contact: "", launch_date: null,
          milestones: DEFAULT_MILESTONES as Milestone[], updates: [], files: [],
          notes: "", rating: null, rating_comment: null, rated_at: null,
        });
      }
      setLoading(false);
    })();
  }, [token]);

  async function save() {
    if (!cfg) return;
    setSaving(true);
    const payload = {
      token,
      client_name: cfg.client_name, scope: cfg.scope, contact: cfg.contact,
      launch_date: cfg.launch_date, milestones: cfg.milestones,
      updates: cfg.updates, files: cfg.files, notes: cfg.notes,
    };
    const { error } = await supabase.from("mission_config").upsert(payload, { onConflict: "token" });
    setSaving(false);
    if (error) { alert("Speichern fehlgeschlagen: " + error.message); return; }
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  async function del() {
    if (!confirm("Mission wirklich löschen?")) return;
    await supabase.from("mission_config").delete().eq("token", token);
    window.location.href = "/admin/missions";
  }

  if (loading || !cfg) return <div className="p-8 text-xs font-black uppercase tracking-widest text-[#0a0a0a]/50">Lade…</div>;

  const set = <K extends keyof Config>(k: K, v: Config[K]) => setCfg({ ...cfg, [k]: v });

  return (
    <div className="max-w-4xl mx-auto p-6 md:p-8">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <Link to="/admin/missions" className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest hover:text-[#ff5722]">
          <ArrowLeft className="w-3 h-3" /> Alle Missionen
        </Link>
        <div className="flex items-center gap-2">
          <a href={`/mission/${token}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 px-3 py-2 border-2 border-[#0a0a0a] bg-white text-[10px] font-black uppercase tracking-widest hover:bg-[#0a0a0a] hover:text-white">
            <ExternalLink className="w-3 h-3" /> Portal ansehen
          </a>
          <button onClick={del} className="px-3 py-2 border-2 border-[#0a0a0a] bg-white text-[10px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white flex items-center gap-1.5">
            <Trash2 className="w-3 h-3" /> Löschen
          </button>
          <button onClick={save} disabled={saving} className="px-3 py-2 border-2 border-[#0a0a0a] bg-[#ff5722] text-white text-[10px] font-black uppercase tracking-widest hover:bg-[#0a0a0a] disabled:opacity-50 flex items-center gap-1.5">
            <Save className="w-3 h-3" /> {saved ? "Gespeichert ✓" : saving ? "Speichere…" : "Speichern"}
          </button>
        </div>
      </div>

      <div className="mb-2 text-[10px] font-mono text-[#0a0a0a]/40">#{token}</div>
      <h1 className="font-black uppercase tracking-tighter text-4xl md:text-5xl mb-6" style={{ fontFamily: "var(--font-display)" }}>
        {cfg.client_name || "Namenlose Mission"}
      </h1>

      {/* Kundeninfos */}
      <Section title="/ Kunde">
        <div className="grid md:grid-cols-2 gap-3">
          <Field label="Kundenname" value={cfg.client_name || ""} onChange={(v) => set("client_name", v)} />
          <Field label="Ansprechpartner" value={cfg.contact || ""} onChange={(v) => set("contact", v)} />
          <Field label="Scope" value={cfg.scope || ""} onChange={(v) => set("scope", v)} />
          <Field label="Launch-Datum" type="date" value={cfg.launch_date || ""} onChange={(v) => set("launch_date", v || null)} />
        </div>
      </Section>

      {/* Meilensteine */}
      <Section title="/ Roadmap · Meilensteine">
        <div className="space-y-2">
          {cfg.milestones.map((m, i) => (
            <div key={i} className="flex items-start gap-2 border-2 border-[#0a0a0a] bg-white p-3">
              <GripVertical className="w-4 h-4 text-[#0a0a0a]/30 mt-2" />
              <div className="flex-1 grid md:grid-cols-[1fr_2fr_auto] gap-2">
                <input value={m.label} onChange={(e) => updateM(cfg, setCfg, i, { label: e.target.value })} placeholder="Titel" className="border-2 border-[#0a0a0a] px-2 py-1.5 text-sm bg-[#f5f2ea] focus:outline-none focus:bg-white font-black" />
                <input value={m.desc} onChange={(e) => updateM(cfg, setCfg, i, { desc: e.target.value })} placeholder="Beschreibung" className="border-2 border-[#0a0a0a] px-2 py-1.5 text-sm bg-[#f5f2ea] focus:outline-none focus:bg-white" />
                <select value={m.status} onChange={(e) => updateM(cfg, setCfg, i, { status: e.target.value as Milestone["status"] })} className="border-2 border-[#0a0a0a] px-2 py-1.5 text-xs bg-white font-black uppercase">
                  <option value="todo">Ausstehend</option>
                  <option value="active">In Arbeit</option>
                  <option value="done">Erledigt</option>
                </select>
              </div>
              <div className="shrink-0 w-8 h-8 border-2 border-[#0a0a0a] grid place-items-center bg-[#f5f2ea]">
                {m.status === "done" ? <CheckCircle2 className="w-4 h-4 text-[#10b981]" /> : m.status === "active" ? <Clock className="w-4 h-4 text-[#ff5722]" /> : <Circle className="w-4 h-4 text-[#0a0a0a]/30" />}
              </div>
              <button onClick={() => removeAt(cfg, setCfg, "milestones", i)} className="p-1.5 border-2 border-transparent hover:border-[#0a0a0a] hover:bg-red-500 hover:text-white">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
          <button onClick={() => set("milestones", [...cfg.milestones, { key: `m${Date.now()}`, label: "Neuer Meilenstein", desc: "", status: "todo" }])} className="w-full border-2 border-dashed border-[#0a0a0a] p-2 text-[10px] font-black uppercase tracking-widest hover:bg-[#0a0a0a] hover:text-white flex items-center justify-center gap-1.5">
            <Plus className="w-3 h-3" /> Meilenstein
          </button>
        </div>
      </Section>

      {/* Updates */}
      <Section title="/ Updates · Timeline">
        <div className="space-y-2">
          {cfg.updates.map((u, i) => (
            <div key={i} className="flex items-start gap-2 border-2 border-[#0a0a0a] bg-white p-3">
              <input type="number" value={u.day} onChange={(e) => updateArr(cfg, setCfg, "updates", i, { day: parseInt(e.target.value) || 0 })} placeholder="Tag" className="w-16 border-2 border-[#0a0a0a] px-2 py-1.5 text-sm bg-[#f5f2ea] font-black text-[#ff5722] focus:outline-none focus:bg-white" />
              <input value={u.text} onChange={(e) => updateArr(cfg, setCfg, "updates", i, { text: e.target.value })} placeholder="Update-Text" className="flex-1 border-2 border-[#0a0a0a] px-2 py-1.5 text-sm bg-[#f5f2ea] focus:outline-none focus:bg-white" />
              <button onClick={() => removeAt(cfg, setCfg, "updates", i)} className="p-1.5 border-2 border-transparent hover:border-[#0a0a0a] hover:bg-red-500 hover:text-white">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
          <button onClick={() => set("updates", [{ day: 1, text: "" }, ...cfg.updates])} className="w-full border-2 border-dashed border-[#0a0a0a] p-2 text-[10px] font-black uppercase tracking-widest hover:bg-[#0a0a0a] hover:text-white flex items-center justify-center gap-1.5">
            <Plus className="w-3 h-3" /> Update
          </button>
        </div>
      </Section>

      {/* Dokumente */}
      <Section title="/ Dokumente">
        <div className="space-y-2">
          {cfg.files.map((f, i) => (
            <div key={i} className="flex items-start gap-2 border-2 border-[#0a0a0a] bg-white p-3">
              <input value={f.type} onChange={(e) => updateArr(cfg, setCfg, "files", i, { type: e.target.value })} placeholder="Typ" className="w-16 border-2 border-[#0a0a0a] px-2 py-1.5 text-xs bg-[#f5f2ea] font-black uppercase focus:outline-none focus:bg-white" />
              <input value={f.name} onChange={(e) => updateArr(cfg, setCfg, "files", i, { name: e.target.value })} placeholder="Dateiname" className="flex-1 border-2 border-[#0a0a0a] px-2 py-1.5 text-sm bg-[#f5f2ea] focus:outline-none focus:bg-white" />
              <input value={f.size} onChange={(e) => updateArr(cfg, setCfg, "files", i, { size: e.target.value })} placeholder="Größe" className="w-24 border-2 border-[#0a0a0a] px-2 py-1.5 text-xs bg-[#f5f2ea] focus:outline-none focus:bg-white" />
              <button onClick={() => removeAt(cfg, setCfg, "files", i)} className="p-1.5 border-2 border-transparent hover:border-[#0a0a0a] hover:bg-red-500 hover:text-white">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
          <button onClick={() => set("files", [...cfg.files, { name: "", size: "", type: "PDF" }])} className="w-full border-2 border-dashed border-[#0a0a0a] p-2 text-[10px] font-black uppercase tracking-widest hover:bg-[#0a0a0a] hover:text-white flex items-center justify-center gap-1.5">
            <Plus className="w-3 h-3" /> Dokument
          </button>
        </div>
      </Section>

      {/* Interne Notizen */}
      <Section title="/ Interne Notizen (nicht sichtbar für Kunde)">
        <textarea value={cfg.notes || ""} onChange={(e) => set("notes", e.target.value)} rows={4} placeholder="Interne Gedanken, Erinnerungen, Warnungen…" className="w-full border-2 border-[#0a0a0a] bg-white p-3 text-sm focus:outline-none focus:bg-[#fff7f2]" />
      </Section>

      {/* Kunden-Feedback */}
      <Section title="/ Kunden-Feedback · Sterne">
        <div className="border-2 border-[#0a0a0a] bg-white p-5">
          {cfg.rating ? (
            <>
              <div className="flex items-center gap-2 mb-3">
                {[1,2,3,4,5].map((n) => (
                  <Star key={n} className={`w-6 h-6 ${n <= (cfg.rating || 0) ? "fill-[#ff5722] text-[#ff5722]" : "text-[#0a0a0a]/20"}`} />
                ))}
                <span className="text-2xl font-black tabular-nums ml-2" style={{ fontFamily: "var(--font-display)" }}>{cfg.rating}/5</span>
              </div>
              {cfg.rating_comment && (
                <blockquote className="border-l-4 border-[#ff5722] pl-3 text-sm text-[#0a0a0a]/80 italic">
                  „{cfg.rating_comment}"
                </blockquote>
              )}
              {cfg.rated_at && (
                <div className="text-[10px] font-black uppercase tracking-widest text-[#0a0a0a]/50 mt-3">
                  Abgegeben am {new Date(cfg.rated_at).toLocaleDateString("de-DE", { day: "2-digit", month: "short", year: "numeric" })}
                </div>
              )}
            </>
          ) : (
            <div className="text-sm text-[#0a0a0a]/50">Noch keine Bewertung abgegeben.</div>
          )}
        </div>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-6">
      <h2 className="text-[10px] font-black uppercase tracking-[0.3em] mb-3">{title}</h2>
      {children}
    </section>
  );
}

function Field({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <label className="block">
      <div className="text-[9px] font-black uppercase tracking-widest text-[#0a0a0a]/60 mb-1">{label}</div>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} className="w-full border-2 border-[#0a0a0a] bg-white px-3 py-2 text-sm focus:outline-none focus:bg-[#fff7f2]" />
    </label>
  );
}

function updateM(cfg: Config, setCfg: (c: Config) => void, i: number, patch: Partial<Milestone>) {
  setCfg({ ...cfg, milestones: cfg.milestones.map((m, j) => j === i ? { ...m, ...patch } : m) });
}
function updateArr<K extends "updates" | "files">(cfg: Config, setCfg: (c: Config) => void, key: K, i: number, patch: Partial<Config[K][number]>) {
  const arr = cfg[key].map((x, j) => j === i ? { ...x, ...patch } : x) as Config[K];
  setCfg({ ...cfg, [key]: arr });
}
function removeAt(cfg: Config, setCfg: (c: Config) => void, key: "milestones" | "updates" | "files", i: number) {
  setCfg({ ...cfg, [key]: cfg[key].filter((_, j) => j !== i) } as Config);
}