import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Radar, Loader2, Eye } from "lucide-react";

export const Route = createFileRoute("/admin/spy")({ component: Spy });

const SYSTEM = `Du bist ein Competitive-Intelligence-Analyst der KSE Group. Analysiere eine Wettbewerber-Website (URL) — arbeite mit deinem Weltwissen über die Domain / Branche, keine echte Browsersitzung.

Liefere STRIKT dieses Format:

ZIEL: <URL>
BRANCHE / EINORDNUNG: <1 Zeile>

§1 POSITIONIERUNG
<2-3 Sätze>

§2 STÄRKEN (max 5)
- <…>

§3 SCHWÄCHEN (max 5)
- <…>

§4 WO KSE ANGREIFEN KANN
- <Konkrete Angriffspunkte, wo KSE besser / anders sein kann>

§5 EMPFOHLENE TAKTIK
<3-4 Sätze konkrete Handlungsempfehlung>

Deutsch. Direkt. Keine Floskeln. Wenn du die Domain nicht kennst: sag es ehrlich und liefere nur eine generische Branchenanalyse.`;

function Spy() {
  const [url, setUrl] = useState("");
  const [out, setOut] = useState("");
  const [busy, setBusy] = useState(false);

  const run = async () => {
    if (!url.trim() || busy) return;
    setBusy(true); setOut("");
    try {
      const r = await fetch("/api/admin-ai", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ system: SYSTEM, prompt: `Analysiere: ${url}` }) });
      const j = await r.json();
      setOut(j.content || j.error || "—");
    } finally { setBusy(false); }
  };

  return (
    <div className="min-h-screen bg-[#f5f2ea] text-[#0a0a0a]">
      <header className="border-b-2 border-[#0a0a0a] bg-white px-6 py-5 flex items-center gap-3">
        <div className="w-10 h-10 bg-[#0a0a0a] text-white border-2 border-[#0a0a0a] grid place-items-center" style={{ boxShadow: "3px 3px 0 0 #ff5722" }}>
          <Eye className="w-5 h-5" />
        </div>
        <div>
          <div className="text-[9px] font-black uppercase tracking-[0.3em] text-[#ff5722]">/ Spionage</div>
          <h1 className="font-black text-2xl uppercase tracking-tight" style={{ fontFamily: "var(--font-display)" }}>Konkurrenz-Radar</h1>
        </div>
      </header>

      <div className="p-6 grid md:grid-cols-[380px_1fr] gap-6 max-w-6xl">
        <div>
          <div className="text-[9px] font-black uppercase tracking-[0.3em] mb-2">/ Ziel-Domain</div>
          <input value={url} onChange={(e) => setUrl(e.target.value)} onKeyDown={(e) => e.key === "Enter" && run()} placeholder="konkurrent.de" className="w-full border-2 border-[#0a0a0a] bg-white p-3 text-sm font-mono focus:outline-none focus:shadow-[4px_4px_0_0_#ff5722]" />
          <button onClick={run} disabled={busy || !url.trim()} className="mt-3 w-full bg-[#0a0a0a] text-white border-2 border-[#0a0a0a] px-4 py-3 font-black uppercase tracking-widest text-sm hover:bg-[#ff5722] disabled:opacity-40 flex items-center justify-center gap-2" style={{ boxShadow: "4px 4px 0 0 #ff5722" }}>
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Radar className="w-4 h-4" />}
            {busy ? "Scanne…" : "Scan starten"}
          </button>

          <div className="mt-6 relative aspect-square border-2 border-[#0a0a0a] bg-[#0a0a0a] overflow-hidden">
            {/* Radar */}
            <div className="absolute inset-0 grid place-items-center">
              {[1, 2, 3, 4].map((r) => (
                <div key={r} className="absolute border border-emerald-400/30 rounded-full" style={{ width: `${r * 25}%`, height: `${r * 25}%` }} />
              ))}
              <div className="absolute w-full h-px bg-emerald-400/20" />
              <div className="absolute h-full w-px bg-emerald-400/20" />
              <div className={`absolute inset-0 origin-center ${busy ? "animate-spin" : ""}`} style={{ animationDuration: "3s" }}>
                <div className="absolute top-1/2 left-1/2 w-1/2 h-px bg-gradient-to-r from-emerald-400 to-transparent origin-left" />
              </div>
              <div className="w-2 h-2 bg-emerald-400 rounded-full shadow-[0_0_10px_#22c55e] z-10" />
            </div>
            <div className="absolute bottom-2 left-2 text-[9px] font-mono text-emerald-400/60 uppercase tracking-widest">
              {busy ? "SCANNING…" : url ? `LOCK: ${url}` : "STANDBY"}
            </div>
          </div>
        </div>

        <div className="border-2 border-[#0a0a0a] bg-white p-6 min-h-[600px] font-mono text-[13px] leading-relaxed whitespace-pre-wrap" style={{ boxShadow: "5px 5px 0 0 #0a0a0a" }}>
          {out || <span className="text-[#0a0a0a]/30 italic">Radar bereit. Ziel eingeben und scannen.</span>}
        </div>
      </div>
    </div>
  );
}