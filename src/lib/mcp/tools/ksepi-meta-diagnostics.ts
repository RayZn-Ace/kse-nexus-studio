import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import type { ToolContext } from "@lovable.dev/mcp-js";
import { graphGet, pickToken, actId } from "@/lib/kseadsio/metaGraph.server";
import { redacted, requireKseAdmin } from "./ksepi-auth";

export default defineTool({
  name: "ksepi_meta_diagnostics",
  title: "Inspect Meta Ads diagnostics",
  description: "Fetch redacted Meta campaign/adset diagnostics needed to debug copy/create failures.",
  inputSchema: {
    source_campaign_id: z.string().trim().min(3).optional(),
    ad_account_id: z.string().trim().min(3).optional(),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: true },
  handler: async ({ source_campaign_id, ad_account_id }, ctx: ToolContext) => {
    await requireKseAdmin(ctx);
    const token = await pickToken(ad_account_id);
    if (!token) throw new Error("No Meta token configured");

    const diagnostics: Record<string, unknown> = { source_campaign_id, ad_account_id };

    if (ad_account_id) {
      diagnostics.account_campaigns = await graphGet(
        `/${actId(ad_account_id)}/campaigns?fields=id,name,status,objective,daily_budget,lifetime_budget&limit=10`,
        token,
      );
    }

    if (source_campaign_id) {
      diagnostics.campaign = await graphGet(
        `/${source_campaign_id}?fields=id,name,account_id,status,objective,daily_budget,lifetime_budget,buying_type,special_ad_categories`,
        token,
      );
      diagnostics.adsets = await graphGet(
        `/${source_campaign_id}/adsets?fields=id,name,status,targeting,billing_event,optimization_goal,promoted_object,destination_type,bid_strategy,bid_amount,pacing_type,attribution_spec,dsa_beneficiary,dsa_payor,start_time,end_time,daily_budget,lifetime_budget&limit=5`,
        token,
      );
      diagnostics.ads = await graphGet(
        `/${source_campaign_id}/ads?fields=id,name,status,creative{id,name,object_story_spec}&limit=10`,
        token,
      );
    }

    const safe = redacted(diagnostics) as Record<string, unknown>;
    return {
      content: [{ type: "text", text: JSON.stringify(safe, null, 2) }],
      structuredContent: safe,
    };
  },
});