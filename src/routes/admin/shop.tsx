import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ShoppingBag, Loader2, RefreshCw, Save, ExternalLink, Ticket, Search, FileSpreadsheet } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/shop")({
  head: () => ({
    meta: [
      { title: "Shop & Tickets — KSE Group" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ShopPage,
});

type Tab = "tio" | "lovable" | "tickets" | "config";

type ShopConfig = {
  id?: string;
  tio_sheet_id: string | null;
  tio_sheet_gid: string | null;
  lovable_shop_orders_url: string | null;
  lovable_shop_tickets_url: string | null;
  support_tickets_url: string | null;
  notes: string | null;
};

function ShopPage() {
  const [tab, setTab] = useState<Tab>("tio");
  const [cfg, setCfg] = useState<ShopConfig | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await (supabase as any)
        .from("shop_config")
        .select("*")
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      setCfg(
        data ?? {
          tio_sheet_id: null,
          tio_sheet_gid: null,
          lovable_shop_orders_url: null,
          lovable_shop_tickets_url: null,
          support_tickets_url: null,
          notes: null,
        },
      );
    })();
  }, []);

  const tabs: Array<{ id: Tab; label: string; icon: typeof ShoppingBag }> = [
    { id: "tio", label: "Tio (Sheet)", icon: FileSpreadsheet },
    { id: "lovable", label: "Lovable Shop", icon: ShoppingBag },
    { id: "tickets", label: "Tickets", icon: Ticket },
    { id: "config", label: "Einstellungen", icon: RefreshCw },
  ];

  return (
    <main className="min-h-screen bg-[#f5f2ea] p-4 sm:p-6 md:p-10 text-[#0a0a0a]">
      <header className="border-b-2 border-[#0a0a0a] pb-5">
        <div className="inline-flex items-center gap-2 bg-[#ff5722] px-2 py-1 text-[10px] font-black uppercase tracking-[0.3em] text-white">
          <ShoppingBag className="h-3.5 w-3.5" /> Shop-Hub
        </div>
        <h1 className="mt-4 text-[clamp(2rem,5vw,4rem)] font-black uppercase leading-none tracking-tight">
          Bestellungen & Tickets
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-[#0a0a0a]/65">
          Live-Verbindung zu Tio (Google Sheet) und deinem Lovable Shop.
          Support-Tickets in derselben Ansicht.
        </p>
      </header>

      <nav className="mt-6 flex flex-wrap gap-2">
        {tabs.map((t) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`inline-flex items-center gap-2 border-2 border-[#0a0a0a] px-4 py-2 text-xs font-black uppercase tracking-widest transition-colors ${
                active ? "bg-[#0a0a0a] text-white" : "bg-white text-[#0a0a0a] hover:bg-[#0a0a0a] hover:text-white"
              }`}
              style={active ? { boxShadow: "5px 5px 0 0 #ff5722" } : undefined}
            >
              <t.icon className="h-3.5 w-3.5" />
              {t.label}
            </button>
          );
        })}
      </nav>

      <section className="mt-6">
        {tab === "tio" && <TioPanel />}
        {tab === "lovable" && <LovablePanel />}
        {tab === "tickets" && <TicketsPanel />}
        {tab === "config" && cfg && <ConfigPanel cfg={cfg} onSaved={setCfg} />}
      </section>
    </main>
  );
}

// ─── Tio (Google Sheet) ──────────────────────────────────────
function TioPanel() {
  const [rows, setRows] = useState<Array<Record<string, string>>>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [source, setSource] = useState<string>("");

  const load = async () => {
    setBusy(true);
    setErr(null);
    try {
      const r = await fetch("/api/shop?op=tio");
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? `HTTP ${r.status}`);
      setRows(j.orders ?? []);
      setSource(j.source ?? "");
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const headers = rows[0] ? Object.keys(rows[0]) : [];
  const filtered = useMemo(() => {
    if (!q.trim()) return rows;
    const needle = q.toLowerCase();
    return rows.filter((r) => Object.values(r).some((v) => v.toLowerCase().includes(needle)));
  }, [rows, q]);

  return (
    <div className="border-2 border-[#0a0a0a] bg-white p-5" style={{ boxShadow: "5px 5px 0 0 #0a0a0a" }}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-black uppercase">Tio Bestellungen (Google Sheet)</h2>
          <p className="text-xs text-[#0a0a0a]/60">Live gelesen als CSV. Alle Spalten aus dem Sheet werden gezeigt.</p>
        </div>
        <div className="flex items-center gap-2">
          {source && (
            <a href={source} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 border-2 border-[#0a0a0a] px-3 py-2 text-[10px] font-black uppercase tracking-widest hover:bg-[#0a0a0a] hover:text-white">
              <ExternalLink className="h-3.5 w-3.5" /> Quelle
            </a>
          )}
          <button
            onClick={load}
            disabled={busy}
            className="inline-flex items-center gap-2 border-2 border-[#0a0a0a] bg-[#ff5722] px-4 py-2 text-xs font-black uppercase tracking-widest text-white disabled:opacity-60"
            style={{ boxShadow: "4px 4px 0 0 #0a0a0a" }}
          >
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
            Neu laden
          </button>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-2 border-2 border-[#0a0a0a] bg-[#f5f2ea] px-3 py-2">
        <Search className="h-3.5 w-3.5" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Filtern (Name, Produkt, Datum, alles…)"
          className="w-full bg-transparent text-sm outline-none"
        />
        <span className="text-[10px] font-mono text-[#0a0a0a]/50">{filtered.length}/{rows.length}</span>
      </div>
      {err && <p className="mt-3 border-2 border-red-600 bg-red-50 p-3 text-xs font-bold text-red-800">{err}</p>}
      {rows.length > 0 && (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-[#0a0a0a] text-left text-[10px] font-black uppercase tracking-widest">
                {headers.map((h) => (
                  <th key={h} className="px-2 py-2 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, i) => (
                <tr key={i} className="border-b border-[#0a0a0a]/10 hover:bg-[#f5f2ea]">
                  {headers.map((h) => (
                    <td key={h} className="px-2 py-1.5 align-top text-xs">{r[h]}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {!busy && rows.length === 0 && !err && (
        <p className="mt-4 text-sm text-[#0a0a0a]/60">Keine Zeilen im Sheet.</p>
      )}
    </div>
  );
}

// ─── Lovable Shop (JSON API) ─────────────────────────────────
function LovablePanel() {
  return <ApiFetcher op="lovable_orders" title="Lovable Shop Bestellungen" hint="Konfiguriere die JSON-API-URL in Einstellungen." />;
}

function TicketsPanel() {
  const [source, setSource] = useState<"lovable_tickets" | "support_tickets">("lovable_tickets");
  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button
          onClick={() => setSource("lovable_tickets")}
          className={`border-2 border-[#0a0a0a] px-4 py-2 text-xs font-black uppercase tracking-widest ${source === "lovable_tickets" ? "bg-[#0a0a0a] text-white" : "bg-white"}`}
        >
          Verkaufte Tickets (Shop)
        </button>
        <button
          onClick={() => setSource("support_tickets")}
          className={`border-2 border-[#0a0a0a] px-4 py-2 text-xs font-black uppercase tracking-widest ${source === "support_tickets" ? "bg-[#0a0a0a] text-white" : "bg-white"}`}
        >
          Support-Tickets
        </button>
      </div>
      <ApiFetcher
        key={source}
        op={source}
        title={source === "lovable_tickets" ? "Verkaufte Tickets" : "Support-Tickets"}
        hint="Konfiguriere die passende API-URL in Einstellungen."
      />
    </div>
  );
}

function ApiFetcher({ op, title, hint }: { op: string; title: string; hint: string }) {
  const [data, setData] = useState<unknown>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const load = async () => {
    setBusy(true);
    setErr(null);
    try {
      const r = await fetch(`/api/shop?op=${encodeURIComponent(op)}`);
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? `HTTP ${r.status}`);
      setData(j.data);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [op]);

  const rows = normalizeRows(data);
  const headers = rows[0] ? Object.keys(rows[0]) : [];

  return (
    <div className="border-2 border-[#0a0a0a] bg-white p-5" style={{ boxShadow: "5px 5px 0 0 #0a0a0a" }}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-black uppercase">{title}</h2>
          <p className="text-xs text-[#0a0a0a]/60">{hint}</p>
        </div>
        <button
          onClick={load}
          disabled={busy}
          className="inline-flex items-center gap-2 border-2 border-[#0a0a0a] bg-[#ff5722] px-4 py-2 text-xs font-black uppercase tracking-widest text-white disabled:opacity-60"
          style={{ boxShadow: "4px 4px 0 0 #0a0a0a" }}
        >
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
          Neu laden
        </button>
      </div>
      {err && <p className="mt-3 border-2 border-red-600 bg-red-50 p-3 text-xs font-bold text-red-800">{err}</p>}
      {rows.length > 0 ? (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-[#0a0a0a] text-left text-[10px] font-black uppercase tracking-widest">
                {headers.map((h) => (
                  <th key={h} className="px-2 py-2 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} className="border-b border-[#0a0a0a]/10 hover:bg-[#f5f2ea]">
                  {headers.map((h) => (
                    <td key={h} className="px-2 py-1.5 align-top text-xs">
                      {typeof r[h] === "object" ? JSON.stringify(r[h]) : String(r[h] ?? "")}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : data ? (
        <pre className="mt-4 max-h-[500px] overflow-auto bg-[#0a0a0a] p-4 text-xs text-[#ffeb3b]">{JSON.stringify(data, null, 2)}</pre>
      ) : !busy && !err ? (
        <p className="mt-4 text-sm text-[#0a0a0a]/60">Noch keine Daten. URL in Einstellungen setzen und neu laden.</p>
      ) : null}
    </div>
  );
}

// Turn arbitrary JSON into a table-friendly array of objects.
function normalizeRows(data: unknown): Array<Record<string, unknown>> {
  if (!data) return [];
  if (Array.isArray(data)) return data.filter((x) => x && typeof x === "object") as Array<Record<string, unknown>>;
  if (typeof data === "object") {
    const obj = data as Record<string, unknown>;
    for (const key of ["orders", "data", "items", "results", "records", "tickets"]) {
      if (Array.isArray(obj[key])) return obj[key] as Array<Record<string, unknown>>;
    }
  }
  return [];
}

// ─── Config ──────────────────────────────────────────────────
function ConfigPanel({ cfg, onSaved }: { cfg: ShopConfig; onSaved: (c: ShopConfig) => void }) {
  const [form, setForm] = useState<ShopConfig>(cfg);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const save = async () => {
    setBusy(true);
    setErr(null);
    setSaved(false);
    try {
      const payload = { ...form, updated_at: new Date().toISOString() };
      const q = form.id
        ? (supabase as any).from("shop_config").update(payload).eq("id", form.id).select("*").maybeSingle()
        : (supabase as any).from("shop_config").insert(payload).select("*").maybeSingle();
      const { data, error } = await q;
      if (error) throw error;
      if (data) {
        setForm(data);
        onSaved(data);
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const Row = ({ label, k, placeholder, hint }: { label: string; k: keyof ShopConfig; placeholder?: string; hint?: string }) => (
    <label className="block">
      <span className="text-[10px] font-black uppercase tracking-widest text-[#0a0a0a]/60">{label}</span>
      <input
        value={(form[k] as string) ?? ""}
        onChange={(e) => setForm({ ...form, [k]: e.target.value })}
        placeholder={placeholder}
        className="mt-1 w-full border-2 border-[#0a0a0a] bg-[#f5f2ea] px-3 py-2 font-mono text-xs"
      />
      {hint && <span className="mt-1 block text-[10px] text-[#0a0a0a]/50">{hint}</span>}
    </label>
  );

  return (
    <div className="border-2 border-[#0a0a0a] bg-white p-5" style={{ boxShadow: "5px 5px 0 0 #0a0a0a" }}>
      <h2 className="text-lg font-black uppercase">Shop-Einstellungen</h2>
      <p className="text-xs text-[#0a0a0a]/60">Google Sheet ID + API-URLs. Für private APIs → Bearer-Token in Secrets:
        <code className="ml-1 bg-[#f5f2ea] px-1">LOVABLE_SHOP_API_TOKEN</code>,
        <code className="ml-1 bg-[#f5f2ea] px-1">SUPPORT_TICKETS_API_TOKEN</code>.
      </p>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <Row label="Tio · Google Sheet ID" k="tio_sheet_id" placeholder="1_h_j_fjRvSC…" hint="Aus der Sheet-URL zwischen /d/ und /edit" />
        <Row label="Tio · Sheet GID (Tab)" k="tio_sheet_gid" placeholder="346052357" hint="Aus #gid=… in der URL" />
        <Row label="Lovable Shop · Orders API URL" k="lovable_shop_orders_url" placeholder="https://…/api/orders" hint="Muss JSON zurückgeben" />
        <Row label="Lovable Shop · Tickets API URL" k="lovable_shop_tickets_url" placeholder="https://…/api/tickets" />
        <Row label="Support-Tickets API URL" k="support_tickets_url" placeholder="https://…/api/support" />
      </div>

      {err && <p className="mt-4 border-2 border-red-600 bg-red-50 p-3 text-xs font-bold text-red-800">{err}</p>}

      <div className="mt-5 flex items-center gap-3">
        <button
          onClick={save}
          disabled={busy}
          className="inline-flex items-center gap-2 border-2 border-[#0a0a0a] bg-[#ff5722] px-5 py-3 text-xs font-black uppercase tracking-widest text-white disabled:opacity-60"
          style={{ boxShadow: "5px 5px 0 0 #0a0a0a" }}
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Speichern
        </button>
        {saved && <span className="text-xs font-bold text-emerald-700">Gespeichert ✓</span>}
      </div>
    </div>
  );
}