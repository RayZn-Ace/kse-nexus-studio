import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import type { ToolContext } from "@lovable.dev/mcp-js";
import { redacted, requireKseAdmin } from "./ksepi-auth";

const publicTables = [
  "automation_config",
  "chatbot_config",
  "contact_messages",
  "kseadsio_ad_accounts",
  "kseadsio_campaign_snapshots",
  "kseadsio_commands",
  "kseadsio_creative_checks",
  "kseadsio_execution_logs",
  "kseadsio_landing_pages",
  "kseadsio_pixels",
  "kseadsio_settings",
  "messages_log",
  "mission_config",
  "portal_messages",
  "posts_log",
  "tutorial_shares",
  "tutorials",
  "user_roles",
  "visitor_events",
];

export default defineTool({
  name: "ksepi_database_snapshot",
  title: "Read redacted backend snapshot",
  description: "Return schema awareness and redacted recent rows relevant to KSEAdsio debugging through admin RLS.",
  inputSchema: {
    include_recent_rows: z.boolean().default(true),
    limit: z.number().int().min(1).max(50).default(15),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: true },
  handler: async ({ include_recent_rows, limit }, ctx: ToolContext) => {
    const { supabase, userId, email } = await requireKseAdmin(ctx);
    const snapshot: Record<string, unknown> = {
      caller: { user_id: userId, email },
      public_tables: publicTables,
      note: "Rows are fetched through authenticated admin policies and recursively redacted for tokens/secrets/keys.",
    };

    if (include_recent_rows) {
      const [settings, accounts, commands, logs] = await Promise.all([
        supabase
          .from("kseadsio_settings")
          .select("id,meta_business_id,meta_ad_account_id,default_pixel_id,default_landing_page,default_daily_budget_eur,default_age_min,default_age_max,default_placements,safe_mode,max_campaign_budget,max_daily_budget_increase_percent,is_system_user_token,system_user_id,extra_ad_account_ids,extra_pixel_ids,updated_at")
          .limit(3),
        supabase
          .from("kseadsio_ad_accounts")
          .select("id,ad_account_id,label,name,currency,timezone_name,business_id,business_name,verification_status,verification_error,last_verified_at,updated_at")
          .order("updated_at", { ascending: false })
          .limit(limit),
        supabase
          .from("kseadsio_commands")
          .select("id,raw_command,parsed_json,status,risk_level,risk_notes,requires_approval,approved_at,executed_at,created_at")
          .order("created_at", { ascending: false })
          .limit(limit),
        supabase
          .from("kseadsio_execution_logs")
          .select("id,command_id,action_type,request_payload,response_payload,status,error_message,created_at")
          .order("created_at", { ascending: false })
          .limit(limit),
      ]);
      snapshot.kseadsio = redacted({
        settings: settings.error ? { error: settings.error.message } : settings.data,
        ad_accounts: accounts.error ? { error: accounts.error.message } : accounts.data,
        recent_commands: commands.error ? { error: commands.error.message } : commands.data,
        recent_execution_logs: logs.error ? { error: logs.error.message } : logs.data,
      });
    }

    return {
      content: [{ type: "text", text: JSON.stringify(snapshot, null, 2) }],
      structuredContent: snapshot,
    };
  },
});