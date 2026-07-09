// Server-only Meta Graph API v20 helpers. NEVER import from client code.
const GRAPH = "https://graph.facebook.com/v20.0";

type GraphErr = {
  message?: string;
  type?: string;
  code?: number;
  error_subcode?: number;
  error_data?: unknown;
  error_user_title?: string;
  error_user_msg?: string;
  fbtrace_id?: string;
};

async function graph<T>(
  path: string,
  token: string,
  init?: { method?: "GET" | "POST"; body?: Record<string, unknown> },
): Promise<T> {
  const method = init?.method ?? "GET";
  const url = new URL(`${GRAPH}${path.startsWith("/") ? path : `/${path}`}`);
  let body: string | undefined;
  if (method === "GET") {
    url.searchParams.set("access_token", token);
  } else {
    body = JSON.stringify({ ...(init?.body ?? {}), access_token: token });
  }
  const res = await fetch(url.toString(), {
    method,
    headers: method === "POST" ? { "Content-Type": "application/json" } : undefined,
    body,
  });
  const json = (await res.json()) as { error?: GraphErr } & Record<string, unknown>;
  if (!res.ok || json.error) {
    const err = json.error;
    const parts = [err?.message ?? `Graph HTTP ${res.status}`];
    if (err?.error_user_title) parts.push(`title=${err.error_user_title}`);
    if (err?.error_user_msg) parts.push(`hint=${err.error_user_msg}`);
    if (err?.type) parts.push(`type=${err.type}`);
    if (err?.code) parts.push(`code=${err.code}`);
    if (err?.error_subcode) parts.push(`subcode=${err.error_subcode}`);
    if (err?.error_data) parts.push(`data=${JSON.stringify(err.error_data)}`);
    throw new Error(parts.join(" · "));
  }
  return json as unknown as T;
}

export const graphGet = <T>(path: string, token: string) => graph<T>(path, token);
export const graphPost = <T>(path: string, token: string, body: Record<string, unknown>) =>
  graph<T>(path, token, { method: "POST", body });

export async function loadTokens() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const [{ data: settings }, { data: accounts }] = await Promise.all([
    supabaseAdmin.from("kseadsio_settings").select("meta_access_token_encrypted").limit(1).maybeSingle(),
    supabaseAdmin.from("kseadsio_ad_accounts").select("ad_account_id, access_token_encrypted, name"),
  ]);
  return {
    systemToken: settings?.meta_access_token_encrypted ?? "",
    accounts: (accounts ?? []) as Array<{ ad_account_id: string; access_token_encrypted: string | null; name: string | null }>,
  };
}

export async function pickToken(accountId?: string) {
  const { systemToken, accounts } = await loadTokens();
  if (accountId) {
    const hit = accounts.find((a) => a.ad_account_id === accountId || a.ad_account_id === `act_${accountId}`);
    if (hit?.access_token_encrypted) return hit.access_token_encrypted;
  }
  return systemToken;
}

// Normalize "act_123" ↔ "123" — Graph accepts act_ prefix for account paths.
export function actId(id: string): string {
  return id.startsWith("act_") ? id : `act_${id}`;
}

// Number-of-purchases extractor from insights.actions array.
export function extractActionValue(
  actions: Array<{ action_type: string; value: string }> | undefined,
  type: string,
): number {
  if (!actions) return 0;
  const hit = actions.find((a) => a.action_type === type);
  return hit ? Number(hit.value) : 0;
}