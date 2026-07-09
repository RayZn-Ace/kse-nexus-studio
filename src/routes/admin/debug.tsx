import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { Bug, Check, Copy, Download, KeyRound, Loader2, PlugZap, ShieldCheck } from "lucide-react";
import { ksepiExport } from "@/lib/kseadsio/ksepiExport.functions";

export const Route = createFileRoute("/admin/debug")({
  head: () => ({ meta: [{ title: "Debug API — KSE Group" }, { name: "robots", content: "noindex" }] }),
  component: DebugApiPage,
});

function DebugApiPage() {
  const [enabled, setEnabled] = useState(() => sessionStorage.getItem("ksepi-debug-enabled") === "1");
  const [copied, setCopied] = useState<string | null>(null);
  const [exportBusy, setExportBusy] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [lastExportAt, setLastExportAt] = useState<string | null>(null);
  const [campaignId, setCampaignId] = useState("");
  const [adAccountId, setAdAccountId] = useState("");
  const runExport = useServerFn(ksepiExport);
  const origin = typeof window !== "undefined" ? window.location.origin : "https://ksegroup.eu";
  const mcpUrl = `${origin}/mcp`;
  const claudeConfig = useMemo(
    () =>
      JSON.stringify(
        {
          mcpServers: {
            ksepi: {
              type: "http",
              url: mcpUrl,
            },
          },
        },
        null,
        2,
      ),
    [mcpUrl],
  );
  const assistantPrompt = `Verbinde dich mit meinem geschützten KSEPI MCP Server: ${mcpUrl}\nNutze OAuth/Login als KSE Admin. Analysiere zuerst ksepi_overview, dann ksepi_code_bundle, ksepi_database_snapshot und ksepi_meta_diagnostics. Ziel: Finde den Meta Ads Fehler in KSEAdsio, ohne Secrets oder Tokens anzufordern.`;

  function toggle() {
    const next = !enabled;
    setEnabled(next);
    sessionStorage.setItem("ksepi-debug-enabled", next ? "1" : "0");
  }

  async function copy(label: string, value: string) {
    await navigator.clipboard.writeText(value);
    setCopied(label);
    setTimeout(() => setCopied(null), 1600);
  }

  async function downloadExport() {
    setExportBusy(true);
    setExportError(null);
    try {
      const payload = await runExport({
        data: {
          source_campaign_id: campaignId.trim() || undefined,
          ad_account_id: adAccountId.trim() || undefined,
        },
      });
      const stamp = new Date().toISOString().replace(/[:.]/g, "-");
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ksepi-export-${stamp}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setLastExportAt(new Date().toLocaleString());
    } catch (err) {
      setExportError(err instanceof Error ? err.message : String(err));
    } finally {
      setExportBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f5f2ea] p-4 sm:p-6 md:p-10 text-[#0a0a0a]">
      <header className="border-b-2 border-[#0a0a0a] pb-5">
        <div className="inline-flex items-center gap-2 bg-[#ff5722] px-2 py-1 text-[10px] font-black uppercase tracking-[0.3em] text-white">
          <Bug className="h-3.5 w-3.5" /> Debug-Modus
        </div>
        <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-[clamp(2rem,5vw,4rem)] font-black uppercase leading-none tracking-tight">
              KSEPI API
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-[#0a0a0a]/65">
              Geschützte KI-Schnittstelle für Claude, ChatGPT und andere MCP-Clients.
              Zugriff läuft über deinen Admin-Login, nicht über einen kopierbaren Master-Key.
            </p>
          </div>
          <button
            onClick={toggle}
            className={`border-2 border-[#0a0a0a] px-5 py-3 text-xs font-black uppercase tracking-widest transition-colors ${
              enabled ? "bg-[#0a0a0a] text-white" : "bg-white text-[#0a0a0a]"
            }`}
            style={{ boxShadow: "5px 5px 0 0 #0a0a0a" }}
          >
            {enabled ? "Debug aktiv" : "Debug aktivieren"}
          </button>
        </div>
      </header>

      <section className="mt-6 grid gap-4 lg:grid-cols-3">
        <InfoTile icon={<ShieldCheck className="h-5 w-5" />} label="Schutz" value="OAuth + Admin-Rolle" />
        <InfoTile icon={<PlugZap className="h-5 w-5" />} label="Endpoint" value="/mcp" />
        <InfoTile icon={<KeyRound className="h-5 w-5" />} label="Secrets" value="werden redacted" />
      </section>

      {enabled ? (
        <section className="mt-6 grid gap-4 xl:grid-cols-2">
          <div className="border-2 border-[#0a0a0a] bg-white p-5 xl:col-span-2" style={{ boxShadow: "5px 5px 0 0 #ff5722" }}>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-black uppercase">Export für ChatGPT / Claude</h2>
                <p className="mt-1 max-w-xl text-xs text-[#0a0a0a]/65">
                  Läd alle vier KSEPI-Ressourcen (overview, code_bundle, database_snapshot, meta_diagnostics)
                  als ein einziges JSON herunter. Kein OAuth nötig — einfach in den Chat hochladen.
                  Alle Tokens/Secrets werden serverseitig redigiert.
                </p>
              </div>
              <button
                onClick={downloadExport}
                disabled={exportBusy}
                className="inline-flex items-center gap-2 border-2 border-[#0a0a0a] bg-[#ff5722] px-5 py-3 text-xs font-black uppercase tracking-widest text-white transition-transform disabled:opacity-60"
                style={{ boxShadow: "5px 5px 0 0 #0a0a0a" }}
              >
                {exportBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                {exportBusy ? "Exportiere…" : "JSON exportieren"}
              </button>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="text-[10px] font-black uppercase tracking-widest text-[#0a0a0a]/60">
                  Source Campaign ID (optional)
                </span>
                <input
                  value={campaignId}
                  onChange={(e) => setCampaignId(e.target.value)}
                  placeholder="z. B. 120212345678900000"
                  className="mt-1 w-full border-2 border-[#0a0a0a] bg-[#f5f2ea] px-3 py-2 font-mono text-xs"
                />
              </label>
              <label className="block">
                <span className="text-[10px] font-black uppercase tracking-widest text-[#0a0a0a]/60">
                  Ad Account ID (optional)
                </span>
                <input
                  value={adAccountId}
                  onChange={(e) => setAdAccountId(e.target.value)}
                  placeholder="act_1234567890"
                  className="mt-1 w-full border-2 border-[#0a0a0a] bg-[#f5f2ea] px-3 py-2 font-mono text-xs"
                />
              </label>
            </div>
            {exportError && (
              <p className="mt-3 border-2 border-red-600 bg-red-50 p-3 text-xs font-bold text-red-800">
                {exportError}
              </p>
            )}
            {lastExportAt && !exportError && (
              <p className="mt-3 text-[11px] font-bold text-emerald-700">
                Letzter Export: {lastExportAt}
              </p>
            )}
          </div>
          <DebugBlock
            title="MCP Server URL"
            value={mcpUrl}
            copied={copied === "url"}
            onCopy={() => copy("url", mcpUrl)}
          />
          <DebugBlock
            title="Claude / MCP Config"
            value={claudeConfig}
            copied={copied === "config"}
            onCopy={() => copy("config", claudeConfig)}
          />
          <DebugBlock
            title="Prompt für Claude oder ChatGPT"
            value={assistantPrompt}
            copied={copied === "prompt"}
            onCopy={() => copy("prompt", assistantPrompt)}
            className="xl:col-span-2"
          />
          <div className="border-2 border-[#0a0a0a] bg-white p-5 xl:col-span-2">
            <h2 className="text-lg font-black uppercase">Verfügbare KSEPI Tools</h2>
            <ul className="mt-4 grid gap-2 text-sm md:grid-cols-2">
              {[
                "ksepi_overview — Orientierung und Debug-Reihenfolge",
                "ksepi_code_bundle — relevante KSEAdsio-Code-Dateien",
                "ksepi_database_snapshot — redigierte Backend-Snapshots",
                "ksepi_meta_diagnostics — Meta Campaign/Adset Diagnose",
              ].map((item) => (
                <li key={item} className="border border-[#0a0a0a]/20 bg-[#f5f2ea] p-3 font-mono text-xs">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : (
        <section className="mt-6 border-2 border-[#0a0a0a] bg-white p-8 text-center">
          <p className="text-sm font-bold text-[#0a0a0a]/65">
            Aktiviere den Debug-Modus, dann erscheinen Endpoint, Config und Prompt zum Kopieren.
          </p>
        </section>
      )}
    </main>
  );
}

function InfoTile({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="border-2 border-[#0a0a0a] bg-white p-5" style={{ boxShadow: "5px 5px 0 0 #0a0a0a" }}>
      <div className="flex items-center gap-2 text-[#ff5722]">{icon}<span className="text-[10px] font-black uppercase tracking-[0.25em]">{label}</span></div>
      <div className="mt-3 font-black uppercase">{value}</div>
    </div>
  );
}

function DebugBlock({
  title,
  value,
  copied,
  onCopy,
  className = "",
}: {
  title: string;
  value: string;
  copied: boolean;
  onCopy: () => void;
  className?: string;
}) {
  return (
    <div className={`border-2 border-[#0a0a0a] bg-white p-5 ${className}`}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-sm font-black uppercase tracking-widest">{title}</h2>
        <button onClick={onCopy} className="inline-flex items-center gap-2 border-2 border-[#0a0a0a] px-3 py-2 text-[10px] font-black uppercase tracking-widest hover:bg-[#0a0a0a] hover:text-white">
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? "Kopiert" : "Kopieren"}
        </button>
      </div>
      <pre className="max-h-[360px] overflow-auto whitespace-pre-wrap break-words bg-[#0a0a0a] p-4 text-xs leading-6 text-[#ffeb3b]">
        {value}
      </pre>
    </div>
  );
}