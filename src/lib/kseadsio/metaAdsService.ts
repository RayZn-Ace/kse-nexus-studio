import type { ExecutionAction, KayIPlan, MetaCampaign, MetaCreative } from "./types";
import { demoAdAccounts, demoCampaigns, demoCreatives } from "./demoData";

// Mock Meta Marketing API. Real calls plug in later; the shape stays stable.
const MOCK = true;

export async function listAdAccounts() {
  if (MOCK) return demoAdAccounts;
  throw new Error("Meta API not connected");
}

export async function listCampaigns(): Promise<MetaCampaign[]> {
  if (MOCK) return demoCampaigns;
  throw new Error("Meta API not connected");
}

export async function getCampaign(id: string): Promise<MetaCampaign | null> {
  if (MOCK) return demoCampaigns.find((c) => c.id === id) ?? null;
  throw new Error("Meta API not connected");
}

export async function getCampaignCreatives(_campaignId: string): Promise<MetaCreative[]> {
  if (MOCK) return demoCreatives;
  return [];
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

// The gated "actually do it" — currently returns mocked responses.
export async function executeActions(actions: ExecutionAction[]) {
  const results = [] as Array<{ action: ExecutionAction; ok: boolean; response: unknown; error?: string }>;
  for (const a of actions) {
    if (MOCK) {
      results.push({ action: a, ok: true, response: { id: "mock_" + Math.random().toString(36).slice(2, 10), ...a.payload } });
      continue;
    }
    results.push({ action: a, ok: false, response: null, error: "Meta API not connected" });
  }
  return results;
}