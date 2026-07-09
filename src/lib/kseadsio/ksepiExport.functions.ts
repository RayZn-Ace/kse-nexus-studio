import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import metaRoute from "@/routes/api/kseadsio/meta.ts?raw";
import metaGraph from "@/lib/kseadsio/metaGraph.server.ts?raw";
import metaAdsService from "@/lib/kseadsio/metaAdsService.ts?raw";
import parserService from "@/lib/kseadsio/kayiParserService.ts?raw";
import riskEngine from "@/lib/kseadsio/riskEngineService.ts?raw";
import kseTypes from "@/lib/kseadsio/types.ts?raw";
import kseadsioRoute from "@/routes/kseadsio.tsx?raw";

const codeFiles = {
  "src/routes/api/kseadsio/meta.ts": metaRoute,
  "src/lib/kseadsio/metaGraph.server.ts": metaGraph,
  "src/lib/kseadsio/metaAdsService.ts": metaAdsService,
  "src/lib/kseadsio/kayiParserService.ts": parserService,
  "src/lib/kseadsio/riskEngineService.ts": riskEngine,
  "src/lib/kseadsio/types.ts": kseTypes,
  "src/routes/kseadsio.tsx": kseadsioRoute,
};

const SECRET_KEY_RE = /token|secret|password|authorization|api[_-]?key|encrypted|jwks/i;

type Json = string | number | boolean | null | Json[] | { [key: string]: Json };

function redact(value: unknown): Json {
  if (value === null) return null;
  if (Array.isArray(value)) return value.map(redact);
  if (typeof value === "object") {
    const out: { [key: string]: Json } = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = SECRET_KEY_RE.test(k) ? "[REDACTED]" : redact(v);
    }
    return out;
  }
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return value;
  }
  return String(value);
}

const InputSchema = z
  .object({
    source_campaign_id: z.string().trim().min(3).optional(),
    ad_account_id: z.string().trim().min(3).optional(),
  })
  .default({});

export const ksepiExport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => InputSchema.parse(data ?? {}))
  .handler(async ({ data, context }) => {
    const { supabase, userId, claims } = context;

    const { data: isAdmin, error: adminError } = await supabase.rpc("has_role", {
      _user_id: userId,
      _role: "admin",
    });
    if (adminError) throw new Error(`Admin check failed: ${adminError.message}`);
    if (!isAdmin) throw new Error("Forbidden: KSEPI export requires an admin account");

    const email = typeof claims.email === "string" ? claims.email : undefined;

    // 1) overview
    const overview = {
      server: "KSEPI",
      generated_at: new Date().toISOString(),
      caller: { user_id: userId, email },
      tools: ["ksepi_overview", "ksepi_code_bundle", "ksepi_database_snapshot", "ksepi_meta_diagnostics"],
      safety: [
        "No service-role keys",
        "No raw access tokens",
        "Database output is redacted",
        "Meta responses are redacted for tokens/secrets",
      ],
      instructions:
        "This export replaces an MCP OAuth session. Feed the full JSON to an AI assistant (Claude/ChatGPT) and ask it to analyse the Meta Ads error in KSEAdsio using the code_bundle, database_snapshot and meta_diagnostics sections.",
    };

    // 2) code bundle
    const code_bundle = Object.fromEntries(
      Object.entries(codeFiles).map(([name, source]) => [name, source]),
    );

    // 3) database snapshot
    const [settings, accounts, commands, logs] = await Promise.all([
      supabase
        .from("kseadsio_settings")
        .select(
          "id,meta_business_id,meta_ad_account_id,default_pixel_id,default_landing_page,default_daily_budget_eur,default_age_min,default_age_max,default_placements,safe_mode,max_campaign_budget,max_daily_budget_increase_percent,is_system_user_token,system_user_id,extra_ad_account_ids,extra_pixel_ids,updated_at",
        )
        .limit(3),
      supabase
        .from("kseadsio_ad_accounts")
        .select(
          "id,ad_account_id,label,name,currency,timezone_name,business_id,business_name,verification_status,verification_error,last_verified_at,updated_at",
        )
        .order("updated_at", { ascending: false })
        .limit(20),
      supabase
        .from("kseadsio_commands")
        .select(
          "id,raw_command,parsed_json,status,risk_level,risk_notes,requires_approval,approved_at,executed_at,created_at",
        )
        .order("created_at", { ascending: false })
        .limit(20),
      supabase
        .from("kseadsio_execution_logs")
        .select(
          "id,command_id,action_type,request_payload,response_payload,status,error_message,created_at",
        )
        .order("created_at", { ascending: false })
        .limit(30),
    ]);

    const database_snapshot = redact({
      settings: settings.error ? { error: settings.error.message } : settings.data,
      ad_accounts: accounts.error ? { error: accounts.error.message } : accounts.data,
      recent_commands: commands.error ? { error: commands.error.message } : commands.data,
      recent_execution_logs: logs.error ? { error: logs.error.message } : logs.data,
    });

    // 4) meta diagnostics (best effort — never let it break the export)
    let meta_diagnostics: Json;
    try {
      const { pickToken, graphGet, actId } = await import("@/lib/kseadsio/metaGraph.server");
      const token = await pickToken(data.ad_account_id);
      if (!token) {
        meta_diagnostics = { skipped: "No Meta token configured for this ad account" };
      } else {
        const diagnostics: Record<string, unknown> = {
          source_campaign_id: data.source_campaign_id,
          ad_account_id: data.ad_account_id,
        };
        if (data.ad_account_id) {
          diagnostics.account_campaigns = await graphGet(
            `/${actId(data.ad_account_id)}/campaigns?fields=id,name,status,objective,daily_budget,lifetime_budget&limit=10`,
            token,
          );
        }
        if (data.source_campaign_id) {
          diagnostics.campaign = await graphGet(
            `/${data.source_campaign_id}?fields=id,name,account_id,status,objective,daily_budget,lifetime_budget,buying_type,special_ad_categories`,
            token,
          );
          diagnostics.adsets = await graphGet(
            `/${data.source_campaign_id}/adsets?fields=id,name,status,targeting,billing_event,optimization_goal,promoted_object,destination_type,bid_strategy,bid_amount,pacing_type,attribution_spec,dsa_beneficiary,dsa_payor,start_time,end_time,daily_budget,lifetime_budget&limit=5`,
            token,
          );
          diagnostics.ads = await graphGet(
            `/${data.source_campaign_id}/ads?fields=id,name,status,creative{id,name,object_story_spec}&limit=10`,
            token,
          );
        }
        meta_diagnostics = redact(diagnostics);
      }
    } catch (err) {
      meta_diagnostics = {
        error: err instanceof Error ? err.message : String(err),
      };
    }

    return {
      overview,
      code_bundle,
      database_snapshot,
      meta_diagnostics,
    };
  });