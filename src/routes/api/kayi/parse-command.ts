import { createFileRoute } from "@tanstack/react-router";
import { parseCommandLocal, parseCommandViaOllama } from "@/lib/kseadsio/kayiParserService";
import { evaluateRisk } from "@/lib/kseadsio/riskEngineService";
import { buildExecutionActions } from "@/lib/kseadsio/metaAdsService";

export const Route = createFileRoute("/api/kayi/parse-command")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = (await request.json()) as {
            command: string;
            ollama_url?: string;
            ollama_model?: string;
            safe_mode?: boolean;
            max_campaign_budget?: number;
            known_pixels?: Array<{ pixel_id: string; name?: string | null }>;
            known_landing_pages?: Array<{ url: string; title?: string | null }>;
            known_ad_accounts?: Array<{ ad_account_id: string; name?: string | null }>;
          };
          if (!body.command) return Response.json({ error: "command required" }, { status: 400 });

          let plan = parseCommandLocal(body.command);
          let source: "local" | "ollama" = "local";
          if (body.ollama_url && body.ollama_model) {
            try {
              plan = await parseCommandViaOllama(body.command, body.ollama_url, body.ollama_model);
              source = "ollama";
            } catch {
              // Fall back silently to local parser
            }
          }

          // Resolve pixel by name from connected pixels if not detected as ID
          if (!plan.pixel_id && body.known_pixels?.length) {
            const lower = body.command.toLowerCase();
            const match = body.known_pixels.find(
              (p) => p.name && lower.includes(p.name.toLowerCase()),
            );
            if (match) plan.pixel_id = match.pixel_id;
          }
          // Resolve landing page by title if URL not directly in command
          if (!plan.landing_page_url && body.known_landing_pages?.length) {
            const lower = body.command.toLowerCase();
            const match = body.known_landing_pages.find(
              (lp) => lp.title && lower.includes(lp.title.toLowerCase()),
            );
            if (match) plan.landing_page_url = match.url;
          }

          const risk = evaluateRisk(plan, {
            max_campaign_budget: body.max_campaign_budget ?? 500,
            safe_mode: body.safe_mode ?? true,
          });
          const actions = buildExecutionActions(plan, body.safe_mode ?? true);

          return Response.json({ plan, risk, actions, source });
        } catch (e) {
          return Response.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
        }
      },
    },
  },
});