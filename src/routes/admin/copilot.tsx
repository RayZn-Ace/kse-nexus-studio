import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Wand2, Loader2, Copy, Check } from "lucide-react";

export const Route = createFileRoute("/admin/copilot")({ component: Copilot });

const PRESETS = [
  { id: "offer", label: "Angebots-Draft", system: "Du bist ein B2B Angebots-Texter für die KSE Group. Formuliere ein professionelles, freundliches Angebot mit klarer Struktur: Betreff, Anrede, Kurzverständnis, Umfang, Preisrahmen (falls angegeben), nächste Schritte. Kein Marketing-Blabla.", placeholder: "z.B. Kunde: Bäckerei Müller. Braucht neue Website + Online-Shop. Budget ca. 5-8k. Timeline 6 Wochen." },
  { id: "ig", label: "Instagram-Caption", system: "Du bist ein Social-Media-Texter im Comic-Hero-Stil der KSE Group. Schreibe eine Instagram-Caption (max 150 Wörter), 3-5 Hashtags am Ende. Ton: direkt, cool, mit Punch.", placeholder: "Thema des Posts, z.B. 'neuer Case Study Launch für Restaurant 993'" },
  { id: "cold", label: "Cold Email", system: "Du bist ein B2B Sales-Texter. Schreibe eine kurze (max 100 Wörter), persönliche Cold Email. Kein Corporate-Blabla, direkte Value-Prop, klarer CTA.", placeholder: "Zielkunde, Branche, was du anbietest, warum passt es" },
  { id: "case", label: "Case Study Intro", system: "Du bist ein Case-Study-Autor für KSE Group. Schreibe eine packende 3-Absatz-Intro: Ausgangslage / Herausforderung / KSE-Lösung. Konkret, mit Zahlen wenn möglich.", placeholder: "Kunde + Projekt-Kontext, z.B. 'BS Montagen, Rechnungstool ersetzt Sage'" },
  { id: "wa", label: "WhatsApp-Antwort", system: "Du bist der WhatsApp-Assistent der KSE Group. Antworte kurz (2-4 Sätze), locker aber professionell, mit klarem nächsten Schritt. Kein Emoji-Overload.", placeholder: "Was der Kunde geschrieben hat + Kontext" },
  { id: "hero", label: "Hero-Headline", system: "Du bist Copywriter im Marvel/DC Comic-Ton. Liefere 5 Hero-Headline-Varianten (max 8 Worte), knackig, mutig, bildstark. Nummeriert.", placeholder: "Thema der Seite / Landing Page" },
] as const;

function Copilot() {
  const [presetId, setPresetId] = useState<(typeof PRESETS)[number]["id"]>("offer");
  const [prompt, setPrompt] = useState("");
  const [out, setOut] = useState("");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const preset = PRESETS.find((p) => p.id === presetId)!;

  const run = async () => {
    if (!prompt.trim() || busy) return;
    setBusy(true); setOut("");
    try {
      const r = await fetch("/api/admin-ai", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ system: preset.system, prompt }) });
      const j = await r.json();
      setOut(j.content || j.error || "—");
    } catch (e) { setOut(e instanceof Error ? e.message : String(e)); }
    finally { setBusy(false); }
  };

  return (
    <div className="min-h-screen bg-[#f5f2ea] text-[#0a0a0a]">
      <header className="border-b-2 border-[#0a0a0a] bg-white px-6 py-5 flex items-center gap-3">
        <div className="w-10 h-10 bg-[#0a0a0a] text-white border-2 border-[#0a0a0a] grid place-items-center" style={{ boxShadow: "3px 3px 0 0 #ff5722" }}>
          <Wand2 className="w-5 h-5" />
        </div>
        <div>
          <div className="text-[9px] font-black uppercase tracking-[0.3em] text-[#ff5722]">/ Taktik-Generator</div>
          <h1 className="font-black text-2xl uppercase tracking-tight" style={{ fontFamily: "var(--font-display)" }}>KSE Copilot</h1>
        </div>
      </header>

      <div className="p-6 grid md:grid-cols-2 gap-6 max-w-6xl">
        <div>
          <div className="text-[9px] font-black uppercase tracking-[0.3em] mb-2">/ Modus wählen</div>
          <div className="grid grid-cols-2 gap-2 mb-4">
            {PRESETS.map((p) => (
              <button key={p.id} onClick={() => setPresetId(p.id)} className={`border-2 border-[#0a0a0a] p-3 text-left text-xs font-black uppercase tracking-wide transition-all ${presetId === p.id ? "bg-[#ff5722] text-white" : "bg-white hover:bg-[#f5f2ea]"}`} style={{ boxShadow: presetId === p.id ? "3px 3px 0 0 #0a0a0a" : "none" }}>
                {p.label}
              </button>
            ))}
          </div>
          <div className="text-[9px] font-black uppercase tracking-[0.3em] mb-2">/ Input</div>
          <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder={preset.placeholder} className="w-full h-48 border-2 border-[#0a0a0a] bg-white p-3 text-sm font-mono focus:outline-none focus:shadow-[4px_4px_0_0_#ff5722] resize-none" />
          <button onClick={run} disabled={busy || !prompt.trim()} className="mt-3 w-full bg-[#0a0a0a] text-white border-2 border-[#0a0a0a] px-4 py-3 font-black uppercase tracking-widest text-sm hover:bg-[#ff5722] disabled:opacity-40 flex items-center justify-center gap-2" style={{ boxShadow: "4px 4px 0 0 #ff5722" }}>
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
            {busy ? "Generiere…" : "Generieren"}
          </button>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="text-[9px] font-black uppercase tracking-[0.3em]">/ Output</div>
            {out && (
              <button onClick={() => { navigator.clipboard.writeText(out); setCopied(true); setTimeout(() => setCopied(false), 1500); }} className="text-[10px] font-black uppercase tracking-widest flex items-center gap-1 hover:text-[#ff5722]">
                {copied ? <><Check className="w-3 h-3" /> Kopiert</> : <><Copy className="w-3 h-3" /> Kopieren</>}
              </button>
            )}
          </div>
          <div className="border-2 border-[#0a0a0a] bg-white p-4 min-h-[400px] whitespace-pre-wrap text-sm leading-relaxed" style={{ boxShadow: "4px 4px 0 0 #0a0a0a" }}>
            {out || <span className="text-[#0a0a0a]/30 italic">Warte auf Auftrag, Chief.</span>}
          </div>
        </div>
      </div>
    </div>
  );
}