import { createFileRoute } from "@tanstack/react-router";
import { parseCommandLocal, parseCommandViaLovableAI } from "@/lib/kseadsio/kayiParserService";
import { evaluateRisk } from "@/lib/kseadsio/riskEngineService";
import { buildExecutionActions } from "@/lib/kseadsio/metaAdsService";

export const Route = createFileRoute("/api/kayi/parse-command")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = (await request.json()) as {
            command: string;
            safe_mode?: boolean;
            max_campaign_budget?: number;
            known_pixels?: Array<{ pixel_id: string; name?: string | null }>;
            known_landing_pages?: Array<{ url: string; title?: string | null }>;
            known_ad_accounts?: Array<{ ad_account_id: string; name?: string | null }>;
          };
          if (!body.command) return Response.json({ error: "command required" }, { status: 400 });

          let plan = parseCommandLocal(body.command);
          let source: "local" | "cloud" = "local";
          const apiKey = process.env.LOVABLE_API_KEY;
          if (apiKey) {
            try {
              plan = await parseCommandViaLovableAI(body.command, apiKey);
              source = "cloud";
            } catch {
              // Fall back silently to local rule-based parser
            }
          }

          const lower = body.command.toLowerCase();
          const tokenize = (s: string) =>
            s
              .toLowerCase()
              .split(/[^a-zäöüß0-9]+/i)
              .filter((w) => w.length >= 4 && !["pixel", "pixels", "account", "landing", "page"].includes(w));

          // Resolve pixel by name (full match OR any distinctive token)
          if (!plan.pixel_id && body.known_pixels?.length) {
            const match = body.known_pixels.find((p) => {
              if (!p.name) return false;
              const n = p.name.toLowerCase();
              if (lower.includes(n)) return true;
              return tokenize(n).some((tok) => lower.includes(tok));
            });
            if (match) plan.pixel_id = match.pixel_id;
          }
          // Resolve landing page by title tokens if URL not directly in command
          if (!plan.landing_page_url && body.known_landing_pages?.length) {
            const match = body.known_landing_pages.find((lp) => {
              if (!lp.title) return false;
              const t = lp.title.toLowerCase();
              if (lower.includes(t)) return true;
              return tokenize(t).some((tok) => lower.includes(tok));
            });
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