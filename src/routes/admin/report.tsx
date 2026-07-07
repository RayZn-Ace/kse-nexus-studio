import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { FileText, Loader2, Stamp, Printer } from "lucide-react";

export const Route = createFileRoute("/admin/report")({ component: Report });

const SYSTEM = `Du bist ein "Klassifizierter Analyst" für die KSE Group. Erstelle einen internen Website-Audit-Bericht im Geheimdienst-Stil.
Struktur STRIKT:

DOSSIER-Nr: <8-stellige Nummer>
ZIELOBJEKT: <URL>
KLASSIFIZIERUNG: STRENG VERTRAULICH

§1 LAGE
<3-4 Sätze Ausgangslage / erster Eindruck>

§2 SCHWACHSTELLEN
- <Punkt>
- <Punkt>
- <Punkt>

§3 CHANCEN
- <Punkt>
- <Punkt>

§4 EMPFEHLUNG
<3-5 Sätze, konkret, mit Priorität HOCH/MITTEL/NIEDRIG>

§5 EINSATZ-VORSCHLAG KSE
<Was KSE liefern würde: Umfang, geschätzter Zeitrahmen>

—— ENDE DOSSIER ——

Antworte auf Deutsch. Kein Marketing-Blabla. Konkret, direkt.`;

function Report() {
  const [url, setUrl] = useState("");
  const [ctx, setCtx] = useState("");
  const [out, setOut] = useState("");
  const [busy, setBusy] = useState(false);

  const run = async () => {
    if (!url.trim() || busy) return;
    setBusy(true); setOut("");
    const prompt = `Zielobjekt: ${url}\nZusätzlicher Kontext: ${ctx || "keiner"}\n\nErstelle den Bericht.`;
    try {
      const r = await fetch("/api/admin-ai", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ system: SYSTEM, prompt }) });
      const j = await r.json();
      setOut(j.content || j.error || "—");
    } finally { setBusy(false); }
  };

  return (
    <div className="min-h-screen bg-[#f5f2ea] text-[#0a0a0a]">
      <header className="border-b-2 border-[#0a0a0a] bg-white px-6 py-5 flex items-center gap-3 print:hidden">
        <div className="w-10 h-10 bg-[#0a0a0a] text-white border-2 border-[#0a0a0a] grid place-items-center" style={{ boxShadow: "3px 3px 0 0 #ff5722" }}>
          <FileText className="w-5 h-5" />
        </div>
        <div>
          <div className="text-[9px] font-black uppercase tracking-[0.3em] text-[#ff5722]">/ Dossier-Generator</div>
          <h1 className="font-black text-2xl uppercase tracking-tight" style={{ fontFamily: "var(--font-display)" }}>Audit-Bericht</h1>
        </div>
      </header>

      <div className="p-6 grid md:grid-cols-[380px_1fr] gap-6 max-w-6xl">
        <div className="print:hidden">
          <div className="text-[9px] font-black uppercase tracking-[0.3em] mb-2">/ URL Zielobjekt</div>
          <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" className="w-full border-2 border-[#0a0a0a] bg-white p-3 text-sm font-mono focus:outline-none focus:shadow-[4px_4px_0_0_#ff5722]" />
          <div className="text-[9px] font-black uppercase tracking-[0.3em] mb-2 mt-4">/ Kontext (optional)</div>
          <textarea value={ctx} onChange={(e) => setCtx(e.target.value)} placeholder="Branche, Zielgruppe, bekannte Probleme…" className="w-full h-32 border-2 border-[#0a0a0a] bg-white p-3 text-sm font-mono resize-none focus:outline-none focus:shadow-[4px_4px_0_0_#ff5722]" />
          <button onClick={run} disabled={busy || !url.trim()} className="mt-3 w-full bg-[#0a0a0a] text-white border-2 border-[#0a0a0a] px-4 py-3 font-black uppercase tracking-widest text-sm hover:bg-[#ff5722] disabled:opacity-40 flex items-center justify-center gap-2" style={{ boxShadow: "4px 4px 0 0 #ff5722" }}>
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Stamp className="w-4 h-4" />}
            {busy ? "Klassifiziere…" : "Dossier anfordern"}
          </button>
          {out && (
            <button onClick={() => window.print()} className="mt-2 w-full border-2 border-[#0a0a0a] px-4 py-3 font-black uppercase tracking-widest text-sm hover:bg-[#0a0a0a] hover:text-white flex items-center justify-center gap-2">
              <Printer className="w-4 h-4" /> Drucken / PDF
            </button>
          )}
        </div>

        <div className="relative">
          <div className="border-2 border-[#0a0a0a] bg-[#fdfcf7] p-8 min-h-[600px] font-mono text-[13px] leading-relaxed whitespace-pre-wrap relative overflow-hidden" style={{ boxShadow: "6px 6px 0 0 #0a0a0a", backgroundImage: "repeating-linear-gradient(45deg, transparent 0 20px, rgba(0,0,0,0.02) 20px 21px)" }}>
            {out ? (
              <>
                <div className="absolute top-6 right-6 rotate-12 border-4 border-red-600 text-red-600 px-4 py-2 font-black text-2xl tracking-widest opacity-80 pointer-events-none" style={{ fontFamily: "var(--font-display)" }}>EINGESTUFT</div>
                {out}
              </>
            ) : (
              <div className="text-[#0a0a0a]/30 italic">Kein Dossier geladen. URL eingeben und Bericht anfordern.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}