import { createFileRoute } from "@tanstack/react-router";

// ─── Utility: robust CSV parser (handles quoted fields with commas/newlines) ──
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cur += c;
      }
    } else {
      if (c === '"') inQuotes = true;
      else if (c === ",") {
        row.push(cur);
        cur = "";
      } else if (c === "\n") {
        row.push(cur);
        rows.push(row);
        row = [];
        cur = "";
      } else if (c === "\r") {
        // ignore
      } else {
        cur += c;
      }
    }
  }
  if (cur.length > 0 || row.length > 0) {
    row.push(cur);
    rows.push(row);
  }
  return rows.filter((r) => r.some((v) => v.trim().length > 0));
}

function rowsToObjects(rows: string[][]): Array<Record<string, string>> {
  if (!rows.length) return [];
  const headers = rows[0].map((h) => h.trim());
  return rows.slice(1).map((r) => {
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => {
      obj[h || `col_${i}`] = (r[i] ?? "").trim();
    });
    return obj;
  });
}

async function loadConfig() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("shop_config")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data;
}

async function opTio(): Promise<{ orders: Array<Record<string, string>>; source: string }> {
  const cfg = await loadConfig();
  const sheetId = cfg?.tio_sheet_id;
  const gid = cfg?.tio_sheet_gid ?? "0";
  if (!sheetId) throw new Error("Tio Google-Sheet ID fehlt in shop_config");
  const url = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${encodeURIComponent(gid)}`;
  const r = await fetch(url, { redirect: "follow" });
  if (!r.ok) throw new Error(`Google Sheet Fetch fehlgeschlagen: HTTP ${r.status}. Sheet muss öffentlich lesbar sein ("Jeder mit Link").`);
  const csv = await r.text();
  if (csv.trimStart().toLowerCase().startsWith("<!doctype") || csv.trimStart().startsWith("<html")) {
    throw new Error("Google Sheet ist nicht öffentlich. Bitte Freigabe auf 'Jeder mit dem Link → Betrachter' setzen.");
  }
  return { orders: rowsToObjects(parseCsv(csv)), source: url };
}

async function callConfiguredApi(url: string, tokenSecretName?: string) {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (tokenSecretName) {
    const tok = process.env[tokenSecretName];
    if (tok) headers.Authorization = `Bearer ${tok}`;
  }
  const r = await fetch(url, { headers });
  const ct = r.headers.get("content-type") ?? "";
  const raw = await r.text();
  if (!r.ok) throw new Error(`API ${url} HTTP ${r.status}: ${raw.slice(0, 400)}`);
  if (!ct.includes("json")) {
    try {
      return JSON.parse(raw);
    } catch {
      throw new Error(`API ${url} lieferte kein JSON (Content-Type: ${ct}).`);
    }
  }
  return JSON.parse(raw);
}

async function opLovableOrders() {
  const cfg = await loadConfig();
  if (!cfg?.lovable_shop_orders_url) throw new Error("Lovable Shop Orders-URL fehlt. Bitte in Shop-Einstellungen setzen.");
  return callConfiguredApi(cfg.lovable_shop_orders_url, "LOVABLE_SHOP_API_TOKEN");
}

async function opLovableTickets() {
  const cfg = await loadConfig();
  if (!cfg?.lovable_shop_tickets_url) throw new Error("Lovable Shop Tickets-URL fehlt.");
  return callConfiguredApi(cfg.lovable_shop_tickets_url, "LOVABLE_SHOP_API_TOKEN");
}

async function opSupportTickets() {
  const cfg = await loadConfig();
  if (!cfg?.support_tickets_url) throw new Error("Support-Tickets URL fehlt.");
  return callConfiguredApi(cfg.support_tickets_url, "SUPPORT_TICKETS_API_TOKEN");
}

export const Route = createFileRoute("/api/shop")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const url = new URL(request.url);
          const op = url.searchParams.get("op");
          if (op === "tio") return Response.json(await opTio());
          if (op === "lovable_orders") return Response.json({ data: await opLovableOrders() });
          if (op === "lovable_tickets") return Response.json({ data: await opLovableTickets() });
          if (op === "support_tickets") return Response.json({ data: await opSupportTickets() });
          return Response.json({ error: "unknown op" }, { status: 400 });
        } catch (e) {
          return Response.json(
            { error: e instanceof Error ? e.message : String(e) },
            { status: 500 },
          );
        }
      },
    },
  },
});