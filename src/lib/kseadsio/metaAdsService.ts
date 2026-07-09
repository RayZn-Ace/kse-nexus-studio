import type { ExecutionAction, KayIPlan, MetaCampaign, MetaCreative } from "./types";
import { supabase } from "@/integrations/supabase/client";

// Client-side thin fetchers → hit the server route which talks to Meta Graph API.
// No mocks anywhere; every call is real.

export async function listAdAccounts() {
  const { data, error } = await (supabase as any)
    .from("kseadsio_ad_accounts")
    .select("ad_account_id, name, currency, timezone_name")
    .order("name", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []).map((a: any) => ({
    id: a.ad_account_id,
    name: a.name ?? a.ad_account_id,
    currency: a.currency ?? "EUR",
    timezone: a.timezone_name ?? "Europe/Berlin",
  }));
}

export async function listCampaigns(adAccountId?: string): Promise<MetaCampaign[]> {
  const url = new URL("/api/kseadsio/meta", window.location.origin);
  url.searchParams.set("op", "campaigns");
  if (adAccountId) url.searchParams.set("ad_account_id", adAccountId);
  const r = await fetch(url.toString());
  const j = await r.json();
  if (!r.ok) throw new Error(j.error ?? `HTTP ${r.status}`);
  return j.data as MetaCampaign[];
}

export async function getCampaign(id: string): Promise<MetaCampaign | null> {
  const all = await listCampaigns();
  return all.find((c) => c.id === id) ?? null;
}

export async function getCampaignCreatives(campaignId: string): Promise<MetaCreative[]> {
  const url = new URL("/api/kseadsio/meta", window.location.origin);
  url.searchParams.set("op", "creatives");
  url.searchParams.set("campaign_id", campaignId);
  const r = await fetch(url.toString());
  const j = await r.json();
  if (!r.ok) throw new Error(j.error ?? `HTTP ${r.status}`);
  return j.data as MetaCreative[];
}

// Turns a KayI plan into the ordered list of Meta API actions we WOULD execute.
// Nothing is sent unless the admin approves.
export function buildExecutionActions(plan: KayIPlan, safeMode: boolean): ExecutionAction[] {
  const actions: ExecutionAction[] = [];
  if (plan.intent !== "duplicate_campaign") {
    if (plan.intent === "analyze_campaign" && plan.source_campaign_id) {
      actions.push({ type: "get_insights", description: "Insights für Quell-Kampagne laden", payload: { campaign_id: plan.source_campaign_id } });
    }
    if (plan.intent === "pause_campaign" && plan.source_campaign_id) {
      actions.push({ type: "update_campaign_status", description: "Kampagne pausieren", payload: { campaign_id: plan.source_campaign_id, status: "PAUSED" } });
    }
    return actions;
  }

  actions.push({
    type: "duplicate_campaign",
    description: `Quell-Kampagne ${plan.source_campaign_id} duplizieren`,
    payload: {
      source_campaign_id: plan.source_campaign_id,
      objective: plan.objective,
      status: safeMode ? "PAUSED" : "ACTIVE",
    },
  });
  actions.push({
    type: "create_adset",
    description: `Adset in ${plan.location ?? "?"} (${plan.radius_km ?? "?"} km), Alter ${plan.age_min}-${plan.age_max}`,
    payload: {
      targeting: {
        geo_locations: { custom_locations: [{ name: plan.location, radius: plan.radius_km, distance_unit: "kilometer" }] },
        age_min: plan.age_min,
        age_max: plan.age_max,
        publisher_platforms: ["instagram", "facebook"],
        placements: plan.placements,
      },
      daily_budget: plan.daily_budget_eur ? plan.daily_budget_eur * 100 : undefined,
      billing_event: "IMPRESSIONS",
      optimization_goal: plan.conversion_event === "PURCHASE" ? "OFFSITE_CONVERSIONS" : "LINK_CLICKS",
      promoted_object: plan.pixel_id
        ? { pixel_id: plan.pixel_id, custom_event_type: plan.conversion_event }
        : undefined,
      status: safeMode ? "PAUSED" : "ACTIVE",
    },
  });
  actions.push({
    type: "copy_ads",
    description: `Creatives aus Quell-Kampagne übernehmen`,
    payload: { source_campaign_id: plan.source_campaign_id, creative_source: plan.creative_source ?? "source_campaign" },
  });
  if (plan.landing_page_url) {
    actions.push({ type: "set_landing_page", description: `Landingpage setzen`, payload: { url: plan.landing_page_url } });
  }
  return actions;
}

// Real execution — every action hits Meta Graph API server-side.
// The `_live` flag is kept for signature compatibility with existing callers,
// but ignored: nothing simulates anymore.
export async function executeActions(
  actions: ExecutionAction[],
  _live = true,
  sourceCampaignId?: string,
) {
  const r = await fetch("/api/kseadsio/meta", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ op: "execute", actions, source_campaign_id: sourceCampaignId }),
  });
  const j = await r.json();
  if (!r.ok) {
    // Global failure → mark every action as errored so the UI can show it.
    const msg = j.error ?? `HTTP ${r.status}`;
    return actions.map((a) => ({ action: a, ok: false, response: null, error: msg }));
  }
  return j.data as Array<{ action: ExecutionAction; ok: boolean; response: unknown; error?: string }>;
}

// Silence unused-import warning while keeping the KayIPlan type available.
export type { KayIPlan };