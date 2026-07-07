import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { FlaskConical, Plus, Trash2, Trophy, Eye, MousePointerClick } from "lucide-react";

export const Route = createFileRoute("/admin/abtest")({ component: ABTest });

type Variant = { label: string; text: string; impressions: number; clicks: number };
type Test = { id: string; name: string; hypothesis: string; variants: [Variant, Variant]; createdAt: string };

const KEY = "kse-ab-tests";

function load(): Test[] { if (typeof window === "undefined") return []; try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; } }
function save(t: Test[]) { localStorage.setItem(KEY, JSON.stringify(t)); }

function ABTest() {
  const [tests, setTests] = useState<Test[]>([]);
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState({ name: "", hypothesis: "", a: "", b: "" });

  useEffect(() => { setTests(load()); }, []);
  const update = (next: Test[]) => { setTests(next); save(next); };

  const add = () => {
    if (!draft.name.trim() || !draft.a.trim() || !draft.b.trim()) return;
    update([{ id: crypto.randomUUID(), name: draft.name, hypothesis: draft.hypothesis, variants: [{ label: "A", text: draft.a, impressions: 0, clicks: 0 }, { label: "B", text: draft.b, impressions: 0, clicks: 0 }], createdAt: new Date().toISOString() }, ...tests]);
    setDraft({ name: "", hypothesis: "", a: "", b: "" }); setCreating(false);
  };

  const bump = (id: string, vi: 0 | 1, field: "impressions" | "clicks", delta: number) => {
    update(tests.map((t) => t.id === id ? { ...t, variants: t.variants.map((v, i) => i === vi ? { ...v, [field]: Math.max(0, v[field] + delta) } : v) as [Variant, Variant] } : t));
  };

  const del = (id: string) => update(tests.filter((t) => t.id !== id));

  return (
    <div className="min-h-screen bg-[#f5f2ea] text-[#0a0a0a]">
      <header className="border-b-2 border-[#0a0a0a] bg-white px-6 py-5 flex items-center gap-3">
        <div className="w-10 h-10 bg-[#ff5722] border-2 border-[#0a0a0a] grid place-items-center" style={{ boxShadow: "3px 3px 0 0 #0a0a0a" }}>
          <FlaskConical className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="text-[9px] font-black uppercase tracking-[0.3em] text-[#ff5722]">/ Feldtaktik</div>
          <h1 className="font-black text-2xl uppercase tracking-tight" style={{ fontFamily: "var(--font-display)" }}>A/B Duelle</h1>
        </div>
        <button onClick={() => setCreating(true)} className="ml-auto border-2 border-[#0a0a0a] bg-[#0a0a0a] text-white px-4 py-2 text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:bg-[#ff5722]" style={{ boxShadow: "3px 3px 0 0 #ff5722" }}>
          <Plus className="w-4 h-4" /> Neues Duell
        </button>
      </header>

      <div className="p-6 max-w-5xl">
        {creating && (
          <div className="border-2 border-[#0a0a0a] bg-white p-5 mb-6" style={{ boxShadow: "5px 5px 0 0 #ff5722" }}>
            <div className="text-[9px] font-black uppercase tracking-[0.3em] text-[#ff5722] mb-3">/ Neues Duell definieren</div>
            <input placeholder="Test-Name (z.B. Hero-Headline Q2)" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} className="w-full border-2 border-[#0a0a0a] bg-white p-2 text-sm font-bold mb-2" />
            <input placeholder="Hypothese (optional)" value={draft.hypothesis} onChange={(e) => setDraft({ ...draft, hypothesis: e.target.value })} className="w-full border-2 border-[#0a0a0a] bg-white p-2 text-sm mb-2" />
            <div className="grid grid-cols-2 gap-2">
              <textarea placeholder="Variante A" value={draft.a} onChange={(e) => setDraft({ ...draft, a: e.target.value })} className="border-2 border-[#0a0a0a] bg-white p-2 text-sm h-24 resize-none" />
              <textarea placeholder="Variante B" value={draft.b} onChange={(e) => setDraft({ ...draft, b: e.target.value })} className="border-2 border-[#0a0a0a] bg-white p-2 text-sm h-24 resize-none" />
            </div>
            <div className="mt-3 flex gap-2">
              <button onClick={add} className="bg-[#0a0a0a] text-white px-4 py-2 text-xs font-black uppercase tracking-widest hover:bg-[#ff5722]">Starten</button>
              <button onClick={() => setCreating(false)} className="px-4 py-2 text-xs font-black uppercase tracking-widest hover:text-[#ff5722]">Abbrechen</button>
            </div>
          </div>
        )}

        {tests.length === 0 && !creating && (
          <div className="border-2 border-dashed border-[#0a0a0a]/30 p-12 text-center">
            <FlaskConical className="w-8 h-8 mx-auto text-[#0a0a0a]/30 mb-2" />
            <div className="text-[10px] font-black uppercase tracking-widest text-[#0a0a0a]/50">Kein Test aktiv. Starte dein erstes Duell.</div>
          </div>
        )}

        <div className="space-y-4">
          {tests.map((t) => {
            const [a, b] = t.variants;
            const rateA = a.impressions ? (a.clicks / a.impressions) * 100 : 0;
            const rateB = b.impressions ? (b.clicks / b.impressions) * 100 : 0;
            const winner = a.impressions > 5 && b.impressions > 5 ? (rateA > rateB ? "A" : rateB > rateA ? "B" : null) : null;
            return (
              <div key={t.id} className="border-2 border-[#0a0a0a] bg-white" style={{ boxShadow: "5px 5px 0 0 #0a0a0a" }}>
                <div className="border-b-2 border-[#0a0a0a] p-4 flex items-start justify-between gap-3">
                  <div>
                    <div className="font-black text-lg uppercase" style={{ fontFamily: "var(--font-display)" }}>{t.name}</div>
                    {t.hypothesis && <div className="text-xs text-[#0a0a0a]/60 mt-0.5">{t.hypothesis}</div>}
                  </div>
                  <button onClick={() => del(t.id)} className="p-2 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                </div>
                <div className="grid grid-cols-2">
                  {[a, b].map((v, i) => {
                    const rate = v.impressions ? (v.clicks / v.impressions) * 100 : 0;
                    const isWinner = winner === v.label;
                    return (
                      <div key={i} className={`p-5 ${i === 0 ? "border-r-2 border-[#0a0a0a]" : ""} relative ${isWinner ? "bg-[#ff5722]/10" : ""}`}>
                        {isWinner && <div className="absolute top-3 right-3 flex items-center gap-1 bg-[#ff5722] text-white px-2 py-0.5 text-[9px] font-black uppercase tracking-widest"><Trophy className="w-3 h-3" /> Sieger</div>}
                        <div className="text-[9px] font-black uppercase tracking-[0.3em] text-[#ff5722]">/ Variante {v.label}</div>
                        <div className="mt-2 text-sm font-bold whitespace-pre-wrap min-h-[3rem]">{v.text}</div>
                        <div className="mt-4 grid grid-cols-2 gap-3">
                          <div>
                            <div className="text-[9px] font-black uppercase tracking-widest text-[#0a0a0a]/50 flex items-center gap-1"><Eye className="w-3 h-3" /> Impressions</div>
                            <div className="flex items-center gap-1 mt-1">
                              <button onClick={() => bump(t.id, i as 0 | 1, "impressions", -1)} className="w-6 h-6 border border-[#0a0a0a] hover:bg-[#0a0a0a] hover:text-white">-</button>
                              <div className="font-black text-lg tabular-nums w-12 text-center">{v.impressions}</div>
                              <button onClick={() => bump(t.id, i as 0 | 1, "impressions", 1)} className="w-6 h-6 border border-[#0a0a0a] hover:bg-[#0a0a0a] hover:text-white">+</button>
                            </div>
                          </div>
                          <div>
                            <div className="text-[9px] font-black uppercase tracking-widest text-[#0a0a0a]/50 flex items-center gap-1"><MousePointerClick className="w-3 h-3" /> Clicks</div>
                            <div className="flex items-center gap-1 mt-1">
                              <button onClick={() => bump(t.id, i as 0 | 1, "clicks", -1)} className="w-6 h-6 border border-[#0a0a0a] hover:bg-[#0a0a0a] hover:text-white">-</button>
                              <div className="font-black text-lg tabular-nums w-12 text-center">{v.clicks}</div>
                              <button onClick={() => bump(t.id, i as 0 | 1, "clicks", 1)} className="w-6 h-6 border border-[#0a0a0a] hover:bg-[#0a0a0a] hover:text-white">+</button>
                            </div>
                          </div>
                        </div>
                        <div className="mt-3">
                          <div className="text-[9px] font-black uppercase tracking-widest text-[#0a0a0a]/50">CTR</div>
                          <div className="font-black text-2xl tabular-nums" style={{ fontFamily: "var(--font-display)" }}>{rate.toFixed(1)}%</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}