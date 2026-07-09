import { createFileRoute } from "@tanstack/react-router";
import {
  graphGet,
  graphPost,
  loadTokens,
  pickToken,
  actId,
  extractActionValue,
} from "@/lib/kseadsio/metaGraph.server";
import type { ExecutionAction, MetaCampaign, MetaCreative } from "@/lib/kseadsio/types";

type InsightsRow = {
  spend?: string;
  cpm?: string;
  ctr?: string;
  cost_per_action_type?: Array<{ action_type: string; value: string }>;
  actions?: Array<{ action_type: string; value: string }>;
  purchase_roas?: Array<{ action_type?: string; value: string }>;
};

type GraphCampaign = {
  id: string;
  name: string;
  status: MetaCampaign["status"];
  objective: string;
  daily_budget?: string;
  insights?: { data?: InsightsRow[] };
};

function shapeCampaign(c: GraphCampaign): MetaCampaign {
  const ins = c.insights?.data?.[0];
  const purchases = extractActionValue(ins?.actions, "purchase") || extractActionValue(ins?.actions, "offsite_conversion.fb_pixel_purchase");
  const cpa = ins?.cost_per_action_type?.find((x) => x.action_type === "purchase")?.value;
  const roas = ins?.purchase_roas?.[0]?.value;
  return {
    id: c.id,
    name: c.name,
    status: c.status,
    objective: c.objective ?? "",
    daily_budget_eur: c.daily_budget ? Number(c.daily_budget) / 100 : 0,
    spend_today_eur: Number(ins?.spend ?? 0),
    cpm: ins?.cpm ? Number(ins.cpm) : undefined,
    ctr: ins?.ctr ? Number(ins.ctr) : undefined,
    cpa: cpa ? Number(cpa) : undefined,
    roas: roas ? Number(roas) : undefined,
    purchases: purchases || undefined,
  };
}

async function opListCampaigns(accountId?: string): Promise<MetaCampaign[]> {
  const { systemToken, accounts } = await loadTokens();
  const targets = accountId
    ? [{ ad_account_id: accountId, access_token_encrypted: null as string | null }]
    : accounts;
  const results: MetaCampaign[] = [];
  const fields =
    "id,name,status,objective,daily_budget,insights.date_preset(today){spend,cpm,ctr,cost_per_action_type,actions,purchase_roas}";
  for (const a of targets) {
    const token = a.access_token_encrypted || systemToken;
    if (!token) continue;
    try {
      const j = await graphGet<{ data: GraphCampaign[] }>(
        `/${actId(a.ad_account_id)}/campaigns?fields=${encodeURIComponent(fields)}&limit=100`,
        token,
      );
      for (const c of j.data) results.push(shapeCampaign(c));
    } catch {
      // skip broken accounts silently; health check surfaces token issues
    }
  }
  return results;
}

type GraphAd = {
  id: string;
  name: string;
  creative?: { id: string };
};

type GraphAdsetTemplate = {
  id: string;
  targeting?: Record<string, unknown>;
  billing_event?: string;
  optimization_goal?: string;
  promoted_object?: Record<string, unknown>;
  destination_type?: string;
  bid_strategy?: string;
  start_time?: string;
  end_time?: string;
  daily_budget?: string;
  lifetime_budget?: string;
  bid_amount?: string | number;
  pacing_type?: string[];
  attribution_spec?: unknown;
  dsa_beneficiary?: string;
  dsa_payor?: string;
};

type GraphGeoSearch = {
  key?: string;
  name?: string;
  type?: string;
  country_code?: string;
};

type GraphCreative = {
  id: string;
  name?: string;
  object_story_spec?: {
    link_data?: {
      message?: string;
      name?: string;
      description?: string;
      call_to_action?: { type?: string };
      link?: string;
    };
    video_data?: {
      message?: string;
      title?: string;
      call_to_action?: { type?: string; value?: { link?: string } };
    };
  };
  thumbnail_url?: string;
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function asNumber(value: unknown): number | undefined {
  const n = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
  return Number.isFinite(n) ? n : undefined;
}

function futureIso(value: unknown): string | undefined {
  if (typeof value !== "string" || !value.trim()) return undefined;
  const time = Date.parse(value);
  return Number.isFinite(time) && time > Date.now() + 60_000 ? new Date(time).toISOString() : undefined;
}

function defaultFutureEndIso(): string {
  return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
}

function sanitizeAdsetCreateBody(body: Record<string, unknown>): Record<string, unknown> {
  const clean = { ...body };
  // Meta rejects copied/internal schedule aliases on native adset creation.
  delete clean.time_start;
  delete clean.time_stop;
  if (!futureIso(clean.start_time)) delete clean.start_time;
  if (!futureIso(clean.end_time)) delete clean.end_time;
  return clean;
}

// Meta subcode 2446063 "Set ad scheduling" is triggered by any dayparting /
// scheduling field on a daily-budget adset that should run continuously.
// Strip them defensively when the caller asked for "always run".
function stripScheduling(body: Record<string, unknown>): Record<string, unknown> {
  const clean = { ...body };
  delete clean.ad_schedule;
  delete clean.adset_schedule;
  delete clean.time_start;
  delete clean.time_stop;
  delete clean.start_time;
  delete clean.end_time;
  if (Array.isArray(clean.pacing_type)) {
    const filtered = (clean.pacing_type as unknown[]).filter(
      (x) => typeof x === "string" && !/day_?parting/i.test(x),
    );
    if (filtered.length) clean.pacing_type = filtered;
    else delete clean.pacing_type;
  }
  return clean;
}

// Try to find which connected ad account owns a given campaign.
async function resolveAdAccountForCampaign(
  campaignId: string,
  systemToken: string,
  accounts: Array<{ ad_account_id: string; access_token_encrypted: string | null }>,
): Promise<string | null> {
  for (const a of accounts) {
    const token = a.access_token_encrypted || systemToken;
    if (!token) continue;
    try {
      const j = await graphGet<{ data: Array<{ id: string }> }>(
        `/${actId(a.ad_account_id)}/campaigns?fields=id&limit=500`,
        token,
      );
      if (j.data?.some((c) => c.id === campaignId)) return actId(a.ad_account_id);
    } catch {
      /* skip inaccessible account */
    }
  }
  return null;
}

function cleanGeoLocations(value: unknown): Record<string, unknown> | null {
  const geo = { ...asRecord(value) };
  if (Array.isArray(geo.custom_locations)) {
    const valid = geo.custom_locations
      .map((raw) => {
        const loc = asRecord(raw);
        const latitude = asNumber(loc.latitude);
        const longitude = asNumber(loc.longitude);
        if (latitude === undefined || longitude === undefined) return null;
        return { ...loc, latitude, longitude };
      })
      .filter(Boolean);
    if (valid.length) geo.custom_locations = valid;
    else delete geo.custom_locations;
  }
  const meaningfulKeys = ["countries", "cities", "regions", "zips", "geo_markets", "custom_locations"];
  return meaningfulKeys.some((key) => Array.isArray(geo[key]) && (geo[key] as unknown[]).length > 0) ? geo : null;
}

async function resolveCityGeo(
  token: string,
  name: string | undefined,
  radius: number | undefined,
  distanceUnit: string | undefined,
): Promise<Record<string, unknown> | null> {
  const q = name?.trim();
  if (!q) return null;
  const search = await graphGet<{ data: GraphGeoSearch[] }>(
    `/search?type=adgeolocation&location_types=${encodeURIComponent(JSON.stringify(["city"]))}&q=${encodeURIComponent(q)}&country_code=DE&limit=10`,
    token,
  );
  const hit = search.data.find((x) => x.key && x.type?.toLowerCase() === "city") ?? search.data.find((x) => x.key);
  if (!hit?.key) return null;
  return {
    cities: [
      {
        key: hit.key,
        radius: radius ?? 25,
        distance_unit: distanceUnit === "mile" ? "mile" : "kilometer",
      },
    ],
  };
}

async function buildTargeting(
  token: string,
  templateTargeting: Record<string, unknown> | undefined,
  plannedTargeting: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const merged: Record<string, unknown> = { ...(templateTargeting ?? {}) };
  if (typeof plannedTargeting.age_min === "number") merged.age_min = plannedTargeting.age_min;
  if (typeof plannedTargeting.age_max === "number") merged.age_max = plannedTargeting.age_max;
  if (Array.isArray(plannedTargeting.publisher_platforms)) merged.publisher_platforms = plannedTargeting.publisher_platforms;

  if (Array.isArray(plannedTargeting.placements)) {
    const placements = new Set(plannedTargeting.placements.filter((x): x is string => typeof x === "string"));
    const facebookPositions: string[] = [];
    const instagramPositions: string[] = [];
    if (placements.has("facebook_stories")) facebookPositions.push("story");
    if (placements.has("facebook_reels")) facebookPositions.push("facebook_reels");
    if (placements.has("facebook_feed")) facebookPositions.push("feed");
    if (placements.has("instagram_stories")) instagramPositions.push("story");
    if (placements.has("instagram_reels")) instagramPositions.push("reels");
    if (placements.has("instagram_feed")) instagramPositions.push("stream");
    if (facebookPositions.length) merged.facebook_positions = facebookPositions;
    if (instagramPositions.length) merged.instagram_positions = instagramPositions;
  }

  const plannedGeo = asRecord(plannedTargeting.geo_locations);
  const customLocations = Array.isArray(plannedGeo.custom_locations)
    ? plannedGeo.custom_locations.map(asRecord)
    : [];
  const directGeo = cleanGeoLocations(plannedGeo);
  if (directGeo) {
    merged.geo_locations = directGeo;
  } else if (customLocations.length) {
    const first = customLocations[0];
    const radius = asNumber(first.radius);
    const resolved = await resolveCityGeo(
      token,
      typeof first.name === "string" ? first.name : undefined,
      radius,
      typeof first.distance_unit === "string" ? first.distance_unit : undefined,
    );
    merged.geo_locations = resolved ?? cleanGeoLocations(merged.geo_locations) ?? { countries: ["DE"] };
  } else {
    merged.geo_locations = cleanGeoLocations(merged.geo_locations) ?? { countries: ["DE"] };
  }

  return merged;
}

async function opListCreatives(campaignId: string): Promise<MetaCreative[]> {
  const token = await pickToken();
  const ads = await graphGet<{ data: GraphAd[] }>(
    `/${campaignId}/ads?fields=id,name,creative{id}&limit=50`,
    token,
  );
  const out: MetaCreative[] = [];
  for (const ad of ads.data) {
    if (!ad.creative?.id) continue;
    try {
      const c = await graphGet<GraphCreative>(
        `/${ad.creative.id}?fields=id,name,object_story_spec,thumbnail_url`,
        token,
      );
      const link = c.object_story_spec?.link_data;
      const video = c.object_story_spec?.video_data;
      out.push({
        id: c.id,
        name: c.name ?? ad.name,
        primary_text: link?.message ?? video?.message ?? "",
        headline: link?.name ?? video?.title ?? "",
        description: link?.description ?? "",
        cta: link?.call_to_action?.type ?? video?.call_to_action?.type ?? "LEARN_MORE",
        format: "9:16",
        preview_url: c.thumbnail_url,
      });
    } catch {
      /* skip */
    }
  }
  return out;
}

// ─────────────────────────────────────────────────────────────
// Execution
// ─────────────────────────────────────────────────────────────
type ExecCtx = {
  source_campaign_id?: string;
  ad_account_id?: string;
  new_campaign_id?: string;
  new_adset_id?: string;
  token: string;
};

async function runAction(action: ExecutionAction, ctx: ExecCtx): Promise<unknown> {
  const p = action.payload as Record<string, unknown>;
  switch (action.type) {
    case "duplicate_campaign": {
      const sourceId = (p.source_campaign_id as string) ?? ctx.source_campaign_id;
      if (!sourceId) throw new Error("source_campaign_id fehlt");
      // NOTE: Meta rejects `account_id` on the Campaign node (#100 nonexisting
      // field). Fetch only id/name and resolve the ad account from our own
      // connected accounts (payload → plan → search).
      await graphGet<{ id: string; name: string }>(
        `/${sourceId}?fields=id,name`,
        ctx.token,
      );
      ctx.source_campaign_id = sourceId;

      let adAccountId =
        (p.ad_account_id as string | undefined) ??
        ctx.ad_account_id ??
        undefined;
      if (!adAccountId) {
        const { systemToken, accounts } = await loadTokens();
        if (accounts.length === 1) {
          adAccountId = actId(accounts[0].ad_account_id);
        } else {
          const found = await resolveAdAccountForCampaign(sourceId, systemToken, accounts);
          if (found) adAccountId = found;
        }
      }
      if (!adAccountId) throw new Error("Ad Account konnte nicht ermittelt werden (kein verbundenes Konto enthält diese Kampagne)");
      ctx.ad_account_id = actId(adAccountId);
      const copy = await graphPost<{ copied_campaign_id: string; ad_object_ids?: unknown }>(
        `/${sourceId}/copies`,
        ctx.token,
        {
          deep_copy: false,
          status_option: p.status === "ACTIVE" ? "ACTIVE" : "PAUSED",
          rename_options: JSON.stringify({ rename_suffix: " · KayI Copy" }),
        },
      );
      ctx.new_campaign_id = copy.copied_campaign_id;
      return { new_campaign_id: copy.copied_campaign_id, ad_account_id: ctx.ad_account_id };
    }

    case "create_adset": {
      // Create a fresh adset under the copied campaign. Templates come from
      // the source campaign's first adset so promoted_object, page, pixel and
      // the campaign's budget mode are respected. KayI's planned fields
      // (age, geo, placements) are merged on top; invalid custom_locations
      // without lat/lng are dropped and replaced with countries=["DE"].
      if (!ctx.new_campaign_id) throw new Error("Kein neues Kampagnen-ID Kontext (duplicate_campaign zuerst)");
      if (!ctx.ad_account_id) throw new Error("Ad Account Kontext fehlt");
      const sourceId = ctx.source_campaign_id;
      if (!sourceId) throw new Error("source_campaign_id fehlt");

      // Fetch budget mode + a template adset for defaults. Prefer template
      // optimization/promoted_object over KayI guesses, because Meta rejects
      // incompatible combinations with a generic "Invalid parameter".
      const [newCamp, sourceCamp] = await Promise.all([
        graphGet<{ daily_budget?: string; lifetime_budget?: string }>(
          `/${ctx.new_campaign_id}?fields=daily_budget,lifetime_budget`,
          ctx.token,
        ),
        graphGet<{ daily_budget?: string; lifetime_budget?: string }>(
          `/${sourceId}?fields=daily_budget,lifetime_budget`,
          ctx.token,
        ),
      ]);
      const cboEnabled = Boolean(
        newCamp.daily_budget ||
          newCamp.lifetime_budget ||
          sourceCamp.daily_budget ||
          sourceCamp.lifetime_budget,
      );

      const tmplRes = await graphGet<{
        data: GraphAdsetTemplate[];
      }>(
        `/${sourceId}/adsets?fields=targeting,billing_event,optimization_goal,promoted_object,destination_type,bid_strategy,bid_amount,pacing_type,attribution_spec,dsa_beneficiary,dsa_payor,start_time,end_time,daily_budget,lifetime_budget&limit=1`,
        ctx.token,
      );
      const tmpl = tmplRes.data[0];

      const planned = (p.targeting ?? {}) as Record<string, unknown>;
      const targeting = await buildTargeting(ctx.token, tmpl?.targeting, planned);

      // Try /copies first — it inherits promoted_object, pixel, page etc.
      // Meta rejects some adsets with subcode 1870189 ("cannot be copied"),
      // e.g. when the source uses dynamic creative or an unsupported
      // optimization. Fall back to a native /adsets create in that case.
      if (tmpl?.id) {
        try {
          const copy = await graphPost<{ copied_adset_id?: string; adset_id?: string; id?: string }>(
            `/${tmpl.id}/copies`,
            ctx.token,
            {
              campaign_id: ctx.new_campaign_id,
              status_option: p.status === "ACTIVE" ? "ACTIVE" : "PAUSED",
              rename_options: JSON.stringify({ rename_suffix: " · KayI Adset" }),
            },
          );
          const newAdsetId = copy.copied_adset_id ?? copy.adset_id ?? copy.id;
          if (!newAdsetId) throw new Error("Meta hat keine neue Adset-ID zurückgegeben");
          await graphPost(`/${newAdsetId}`, ctx.token, {
            targeting,
            status: p.status ?? "PAUSED",
          });
          ctx.new_adset_id = newAdsetId;
          return { new_adset_id: newAdsetId, copied_from_adset_id: tmpl.id };
        } catch (copyErr) {
          const msg = copyErr instanceof Error ? copyErr.message : String(copyErr);
          if (!/1870189|cannot be copied|Invalid parameter/i.test(msg)) throw copyErr;
          // fall through to native creation using tmpl as defaults
        }
      }

      const body: Record<string, unknown> = {
        name: `KayI Adset · ${new Date().toISOString().slice(0, 16)}`,
        campaign_id: ctx.new_campaign_id,
        billing_event: tmpl?.billing_event ?? p.billing_event ?? "IMPRESSIONS",
        optimization_goal: tmpl?.optimization_goal ?? p.optimization_goal ?? "LINK_CLICKS",
        targeting,
        status: p.status ?? "PAUSED",
      };
      const promoted = tmpl?.promoted_object ?? (p.promoted_object as Record<string, unknown> | undefined);
      if (promoted) body.promoted_object = promoted;
      if (tmpl?.destination_type) body.destination_type = tmpl.destination_type;
      if (tmpl?.bid_strategy) body.bid_strategy = tmpl.bid_strategy;
      if (tmpl?.bid_amount !== undefined) body.bid_amount = asNumber(tmpl.bid_amount);
      if (Array.isArray(tmpl?.pacing_type) && tmpl!.pacing_type!.length) body.pacing_type = tmpl!.pacing_type;
      if (tmpl?.attribution_spec) body.attribution_spec = tmpl.attribution_spec;
      // EU DSA: required in EEA. Copy from template when present.
      if (tmpl?.dsa_beneficiary) body.dsa_beneficiary = tmpl.dsa_beneficiary;
      if (tmpl?.dsa_payor) body.dsa_payor = tmpl.dsa_payor;
      // Budget mode: user daily_budget in plan overrides template lifetime_budget.
      const plannedDaily = asNumber(p.daily_budget);
      const alwaysRun = p.always_run !== false; // default true for KayI plans
      const startTime = futureIso(p.start_time) ?? futureIso(tmpl?.start_time);
      const endTime = futureIso(p.end_time) ?? futureIso(p.time_stop) ?? futureIso(tmpl?.end_time);
      const needsEndTime = Boolean(newCamp.lifetime_budget || sourceCamp.lifetime_budget);

      if (!cboEnabled) {
        const lifetimeBudget = plannedDaily ? undefined : asNumber(p.lifetime_budget) ?? asNumber(tmpl?.lifetime_budget);
        if (plannedDaily) {
          body.daily_budget = plannedDaily;
        } else if (lifetimeBudget) {
          body.lifetime_budget = lifetimeBudget;
        } else {
          body.daily_budget = asNumber(tmpl?.daily_budget) ?? 500;
        }
      }

      // Scheduling: only attach start/end when it makes sense. If the user
      // wants "always run" with a daily_budget, drop every scheduling field —
      // Meta returns subcode 2446063 "Set ad scheduling" otherwise.
      const hasLifetime = Boolean(body.lifetime_budget);
      if (!alwaysRun || hasLifetime) {
        if (startTime) body.start_time = startTime;
        if (endTime) body.end_time = endTime;
        else if (needsEndTime || hasLifetime) body.end_time = defaultFutureEndIso();
      }

      let outgoing = sanitizeAdsetCreateBody(body);
      if (alwaysRun && !hasLifetime) outgoing = stripScheduling(outgoing);

      const r = await graphPost<{ id: string }>(`/${ctx.ad_account_id}/adsets`, ctx.token, outgoing);
      ctx.new_adset_id = r.id;
      return { new_adset_id: r.id, fallback: "native_create" };
    }

    case "copy_ads": {
      if (!ctx.new_adset_id) throw new Error("Kein neues Adset Kontext (create_adset zuerst)");
      const sourceId = (p.source_campaign_id as string) ?? ctx.source_campaign_id;
      if (!sourceId) throw new Error("source_campaign_id fehlt");
      const ads = await graphGet<{ data: GraphAd[] }>(
        `/${sourceId}/ads?fields=id,name&limit=25`,
        ctx.token,
      );
      const copies: string[] = [];
      for (const ad of ads.data) {
        try {
          const r = await graphPost<{ copied_ad_id?: string; ad_id?: string; id?: string }>(
            `/${ad.id}/copies`,
            ctx.token,
            { adset_id: ctx.new_adset_id, status_option: "PAUSED" },
          );
          const nid = r.copied_ad_id ?? r.ad_id ?? r.id;
          if (nid) copies.push(nid);
        } catch {
          /* skip ads that can't be copied */
        }
      }
      return { copied_ad_ids: copies };
    }

    case "set_landing_page": {
      const url = p.url as string;
      if (!url) throw new Error("landing_page_url fehlt");
      if (!ctx.new_adset_id || !ctx.ad_account_id)
        throw new Error("Adset/Account Kontext fehlt");
      const ads = await graphGet<{ data: Array<GraphAd & { creative: { id: string } }> }>(
        `/${ctx.new_adset_id}/ads?fields=id,name,creative{id}&limit=25`,
        ctx.token,
      );
      const updated: string[] = [];
      for (const ad of ads.data) {
        if (!ad.creative?.id) continue;
        const c = await graphGet<GraphCreative>(
          `/${ad.creative.id}?fields=id,name,object_story_spec`,
          ctx.token,
        );
        const spec = c.object_story_spec;
        if (!spec) continue;
        const newSpec = JSON.parse(JSON.stringify(spec)) as GraphCreative["object_story_spec"];
        if (newSpec?.link_data) newSpec.link_data.link = url;
        if (newSpec?.video_data?.call_to_action?.value) newSpec.video_data.call_to_action.value.link = url;
        const nc = await graphPost<{ id: string }>(`/${ctx.ad_account_id}/adcreatives`, ctx.token, {
          name: `${c.name ?? "creative"} · KayI URL`,
          object_story_spec: newSpec,
        });
        await graphPost(`/${ad.id}`, ctx.token, { creative: { creative_id: nc.id } });
        updated.push(ad.id);
      }
      return { updated_ad_ids: updated };
    }

    case "update_campaign_status": {
      const id = (p.campaign_id as string) ?? ctx.source_campaign_id;
      if (!id) throw new Error("campaign_id fehlt");
      await graphPost(`/${id}`, ctx.token, { status: p.status ?? "PAUSED" });
      return { campaign_id: id, status: p.status };
    }

    case "get_insights": {
      const id = (p.campaign_id as string) ?? ctx.source_campaign_id;
      if (!id) throw new Error("campaign_id fehlt");
      const j = await graphGet(
        `/${id}/insights?date_preset=last_7d&fields=spend,cpm,ctr,cost_per_action_type,actions,purchase_roas`,
        ctx.token,
      );
      return j;
    }

    default:
      throw new Error(`Unbekannter Aktionstyp: ${action.type}`);
  }
}

async function opExecute(actions: ExecutionAction[], sourceCampaignId?: string) {
  const token = await pickToken();
  if (!token) throw new Error("Kein Meta Access Token in den Einstellungen hinterlegt.");
  const ctx: ExecCtx = { token, source_campaign_id: sourceCampaignId };
  const results: Array<{ action: ExecutionAction; ok: boolean; response: unknown; error?: string; skipped?: boolean }> = [];
  const dependsOnAdset = new Set(["copy_ads", "set_landing_page"]);
  let adsetFailed = false;
  for (const a of actions) {
    if (dependsOnAdset.has(a.type) && (adsetFailed || !ctx.new_adset_id)) {
      results.push({
        action: a,
        ok: false,
        response: null,
        skipped: true,
        error: "skipped: create_adset war nicht erfolgreich",
      });
      continue;
    }
    try {
      const response = await runAction(a, ctx);
      results.push({ action: a, ok: true, response });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      results.push({ action: a, ok: false, response: null, error: msg });
      if (a.type === "create_adset") adsetFailed = true;
    }
  }
  return results;
}

export const Route = createFileRoute("/api/kseadsio/meta")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const url = new URL(request.url);
          const op = url.searchParams.get("op");
          if (op === "campaigns") {
            const acc = url.searchParams.get("ad_account_id") ?? undefined;
            return Response.json({ data: await opListCampaigns(acc) });
          }
          if (op === "creatives") {
            const cid = url.searchParams.get("campaign_id");
            if (!cid) return Response.json({ error: "campaign_id fehlt" }, { status: 400 });
            return Response.json({ data: await opListCreatives(cid) });
          }
          return Response.json({ error: "unknown op" }, { status: 400 });
        } catch (e) {
          return Response.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
        }
      },
      POST: async ({ request }) => {
        try {
          const body = (await request.json()) as {
            op: string;
            actions?: ExecutionAction[];
            source_campaign_id?: string;
          };
          if (body.op === "execute") {
            if (!body.actions) return Response.json({ error: "actions fehlen" }, { status: 400 });
            return Response.json({ data: await opExecute(body.actions, body.source_campaign_id) });
          }
          return Response.json({ error: "unknown op" }, { status: 400 });
        } catch (e) {
          return Response.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
        }
      },
    },
  },
});