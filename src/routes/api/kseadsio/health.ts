import { createFileRoute } from "@tanstack/react-router";

type CheckResult = {
  id: string;
  label: string;
  kind: "token" | "ad_account" | "pixel" | "landing_page" | "cloud_ai";
  ok: boolean;
  status: "ok" | "warn" | "error" | "skip";
  detail?: string;
  latency_ms?: number;
  meta?: Record<string, unknown>;
};

async function timed<T>(fn: () => Promise<T>): Promise<[T, number]> {
  const t = Date.now();
  const r = await fn();
  return [r, Date.now() - t];
}

async function checkToken(token: string): Promise<CheckResult> {
  if (!token) {
    return { id: "token", kind: "token", label: "System User Token", ok: false, status: "warn", detail: "Kein Token hinterlegt" };
  }
  try {
    const [res, ms] = await timed(() =>
      fetch(`https://graph.facebook.com/v20.0/me?fields=id,name&access_token=${encodeURIComponent(token)}`),
    );
    const j = (await res.json()) as { id?: string; name?: string; error?: { message?: string } };
    if (!res.ok || j.error) {
      return { id: "token", kind: "token", label: "System User Token", ok: false, status: "error", detail: j.error?.message ?? `HTTP ${res.status}`, latency_ms: ms };
    }
    return { id: "token", kind: "token", label: `Token · ${j.name ?? j.id}`, ok: true, status: "ok", latency_ms: ms, meta: { id: j.id, name: j.name } };
  } catch (e) {
    return { id: "token", kind: "token", label: "System User Token", ok: false, status: "error", detail: e instanceof Error ? e.message : String(e) };
  }
}

async function checkAdAccount(row: { id: string; ad_account_id: string; name: string | null; access_token_encrypted: string | null }, fallback: string): Promise<CheckResult> {
  const token = row.access_token_encrypted || fallback;
  const label = row.name ?? row.ad_account_id;
  if (!token) return { id: row.id, kind: "ad_account", label, ok: false, status: "warn", detail: "Kein Token" };
  try {
    const url = `https://graph.facebook.com/v20.0/${row.ad_account_id}?fields=account_status,name,balance,amount_spent,currency&access_token=${encodeURIComponent(token)}`;
    const [res, ms] = await timed(() => fetch(url));
    const j = (await res.json()) as { account_status?: number; name?: string; balance?: string; amount_spent?: string; currency?: string; error?: { message?: string } };
    if (!res.ok || j.error) return { id: row.id, kind: "ad_account", label, ok: false, status: "error", detail: j.error?.message ?? `HTTP ${res.status}`, latency_ms: ms };
    const active = j.account_status === 1;
    return { id: row.id, kind: "ad_account", label, ok: active, status: active ? "ok" : "warn", detail: active ? undefined : `Status ${j.account_status}`, latency_ms: ms, meta: { spent: j.amount_spent, currency: j.currency } };
  } catch (e) {
    return { id: row.id, kind: "ad_account", label, ok: false, status: "error", detail: e instanceof Error ? e.message : String(e) };
  }
}

async function checkPixel(row: { id: string; pixel_id: string; name: string | null }, token: string): Promise<CheckResult> {
  const label = row.name ?? row.pixel_id;
  if (!token) return { id: row.id, kind: "pixel", label, ok: false, status: "warn", detail: "Kein Token" };
  try {
    const url = `https://graph.facebook.com/v20.0/${row.pixel_id}?fields=name,last_fired_time,is_created_by_business&access_token=${encodeURIComponent(token)}`;
    const [res, ms] = await timed(() => fetch(url));
    const j = (await res.json()) as { name?: string; last_fired_time?: string; error?: { message?: string } };
    if (!res.ok || j.error) return { id: row.id, kind: "pixel", label, ok: false, status: "error", detail: j.error?.message ?? `HTTP ${res.status}`, latency_ms: ms };
    const fresh = j.last_fired_time ? Date.now() - new Date(j.last_fired_time).getTime() < 1000 * 60 * 60 * 24 * 30 : false;
    return { id: row.id, kind: "pixel", label, ok: true, status: fresh ? "ok" : "warn", detail: j.last_fired_time ? `zuletzt ${new Date(j.last_fired_time).toLocaleString("de-DE")}` : "nie gefeuert", latency_ms: ms, meta: { last_fired_time: j.last_fired_time } };
  } catch (e) {
    return { id: row.id, kind: "pixel", label, ok: false, status: "error", detail: e instanceof Error ? e.message : String(e) };
  }
}

async function checkLandingPage(row: { id: string; url: string; title: string | null }): Promise<CheckResult> {
  const label = row.title ?? row.url;
  try {
    const [res, ms] = await timed(() => fetch(row.url, { method: "GET", redirect: "follow" }));
    return { id: row.id, kind: "landing_page", label, ok: res.ok, status: res.ok ? "ok" : "error", detail: `HTTP ${res.status}`, latency_ms: ms };
  } catch (e) {
    return { id: row.id, kind: "landing_page", label, ok: false, status: "error", detail: e instanceof Error ? e.message : String(e) };
  }
}

async function checkCloudAI(): Promise<CheckResult> {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) {
    return { id: "cloud_ai", kind: "cloud_ai", label: "Lovable AI Gateway", ok: false, status: "error", detail: "LOVABLE_API_KEY nicht gesetzt" };
  }
  try {
    const [res, ms] = await timed(() =>
      fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Lovable-API-Key": key },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [{ role: "user", content: "ping" }],
          max_tokens: 5,
        }),
        signal: AbortSignal.timeout(6000),
      }),
    );
    if (res.status === 429) return { id: "cloud_ai", kind: "cloud_ai", label: "Lovable AI Gateway", ok: false, status: "warn", detail: "Rate limit", latency_ms: ms };
    if (res.status === 402) return { id: "cloud_ai", kind: "cloud_ai", label: "Lovable AI Gateway", ok: false, status: "warn", detail: "Kontingent aufgebraucht", latency_ms: ms };
    return { id: "cloud_ai", kind: "cloud_ai", label: "Lovable AI Gateway (Gemini)", ok: res.ok, status: res.ok ? "ok" : "error", detail: res.ok ? undefined : `HTTP ${res.status}`, latency_ms: ms };
  } catch (e) {
    return { id: "cloud_ai", kind: "cloud_ai", label: "Lovable AI Gateway", ok: false, status: "error", detail: e instanceof Error ? e.message : String(e) };
  }
}

export const Route = createFileRoute("/api/kseadsio/health")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const [{ data: settings }, { data: accounts }, { data: pixels }, { data: pages }, { data: recentCmds }, { data: recentLogs }] = await Promise.all([
            supabaseAdmin.from("kseadsio_settings").select("meta_access_token_encrypted, safe_mode").limit(1).maybeSingle(),
            supabaseAdmin.from("kseadsio_ad_accounts").select("id, ad_account_id, name, access_token_encrypted"),
            supabaseAdmin.from("kseadsio_pixels").select("id, pixel_id, name"),
            supabaseAdmin.from("kseadsio_landing_pages").select("id, url, title"),
            supabaseAdmin.from("kseadsio_commands").select("id, raw_command, status, risk_level, created_at, executed_at").order("created_at", { ascending: false }).limit(6),
            supabaseAdmin.from("kseadsio_execution_logs").select("id, action_type, status, error_message, created_at").order("created_at", { ascending: false }).limit(10),
          ]);

          const token = settings?.meta_access_token_encrypted ?? "";
          const checks = await Promise.all([
            checkToken(token),
            ...(accounts ?? []).map((a) => checkAdAccount(a as any, token)),
            ...(pixels ?? []).map((p) => checkPixel(p as any, token)),
            ...(pages ?? []).map((p) => checkLandingPage(p as any)),
            checkCloudAI(),
          ]);
          const flat = checks.filter(Boolean) as CheckResult[];

          const summary = {
            total: flat.length,
            ok: flat.filter((c) => c.status === "ok").length,
            warn: flat.filter((c) => c.status === "warn").length,
            error: flat.filter((c) => c.status === "error").length,
            safe_mode: !!settings?.safe_mode,
            checked_at: new Date().toISOString(),
          };

          return Response.json({ summary, checks: flat, recent_commands: recentCmds ?? [], recent_logs: recentLogs ?? [] });
        } catch (e) {
          return Response.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
        }
      },
    },
  },
});
