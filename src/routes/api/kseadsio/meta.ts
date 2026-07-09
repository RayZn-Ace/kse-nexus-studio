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
      const src = await graphGet<{ account_id: string; name: string }>(
        `/${sourceId}?fields=account_id,name`,
        ctx.token,
      );
      ctx.ad_account_id = actId(src.account_id);
      ctx.source_campaign_id = sourceId;
      const copy = await graphPost<{ copied_campaign_id: string; ad_object_ids?: unknown }>(
        `/${sourceId}/copies`,
        ctx.token,
        {
          deep_copy: true,
          status_option: p.status === "ACTIVE" ? "ACTIVE" : "PAUSED",
          rename_options: JSON.stringify({ rename_suffix: " · KayI Copy" }),
        },
      );
      ctx.new_campaign_id = copy.copied_campaign_id;
      return { new_campaign_id: copy.copied_campaign_id, ad_account_id: ctx.ad_account_id };
    }

    case "create_adset": {
      // deep_copy already produced adsets on the new campaign. We UPDATE the
      // first copied adset's targeting/budget with what KayI planned, instead
      // of creating a brand-new one (which fails without geo lat/lng, budget
      // mode matching campaign, etc.).
      if (!ctx.new_campaign_id) throw new Error("Kein neues Kampagnen-ID Kontext (duplicate_campaign zuerst)");
      const adsets = await graphGet<{ data: Array<{ id: string; targeting?: Record<string, unknown> }> }>(
        `/${ctx.new_campaign_id}/adsets?fields=id,targeting&limit=25`,
        ctx.token,
      );
      const first = adsets.data[0];
      if (!first) throw new Error("Kein Adset in kopierter Kampagne gefunden");
      ctx.new_adset_id = first.id;

      const planned = (p.targeting ?? {}) as Record<string, unknown>;
      const baseTargeting = (first.targeting ?? {}) as Record<string, unknown>;
      const merged: Record<string, unknown> = { ...baseTargeting };
      // Only merge fields Meta reliably accepts without extra lookups.
      if (typeof planned.age_min === "number") merged.age_min = planned.age_min;
      if (typeof planned.age_max === "number") merged.age_max = planned.age_max;
      if (Array.isArray(planned.publisher_platforms))
        merged.publisher_platforms = planned.publisher_platforms;
      // Skip custom_locations without lat/lng (Meta rejects with Invalid parameter).
      const geo = (planned.geo_locations ?? {}) as { custom_locations?: Array<Record<string, unknown>> };
      if (geo.custom_locations?.length) {
        const valid = geo.custom_locations.filter(
          (l) => typeof l.latitude === "number" && typeof l.longitude === "number",
        );
        if (valid.length) {
          merged.geo_locations = { ...(baseTargeting.geo_locations as object ?? {}), custom_locations: valid };
        }
      }

      const body: Record<string, unknown> = { targeting: merged };
      if (p.daily_budget) body.daily_budget = p.daily_budget;
      await graphPost(`/${first.id}`, ctx.token, body);
      return { updated_adset_id: first.id };
    }

    case "copy_ads": {
      // deep_copy already brought over ads + creatives. Just report them.
      if (!ctx.new_campaign_id) throw new Error("Kein neues Kampagnen Kontext");
      const ads = await graphGet<{ data: GraphAd[] }>(
        `/${ctx.new_campaign_id}/ads?fields=id,name&limit=50`,
        ctx.token,
      );
      return { copied_ad_ids: ads.data.map((a) => a.id) };
    }

    case "set_landing_page": {
      const url = p.url as string;
      if (!url) throw new Error("landing_page_url fehlt");
      if (!ctx.new_campaign_id || !ctx.ad_account_id)
        throw new Error("Kampagne/Account Kontext fehlt");
      const ads = await graphGet<{ data: Array<GraphAd & { creative: { id: string } }> }>(
        `/${ctx.new_campaign_id}/ads?fields=id,name,creative{id}&limit=50`,
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
  const results: Array<{ action: ExecutionAction; ok: boolean; response: unknown; error?: string }> = [];
  for (const a of actions) {
    try {
      const response = await runAction(a, ctx);
      results.push({ action: a, ok: true, response });
    } catch (e) {
      results.push({ action: a, ok: false, response: null, error: e instanceof Error ? e.message : String(e) });
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