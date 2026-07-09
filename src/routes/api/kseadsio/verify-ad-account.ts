import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/kseadsio/verify-ad-account")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = (await request.json()) as {
            ad_account_id: string;
            access_token: string;
          };
          if (!body.ad_account_id || !body.access_token) {
            return Response.json(
              { ok: false, error: "ad_account_id und access_token erforderlich" },
              { status: 400 },
            );
          }
          const id = body.ad_account_id.startsWith("act_")
            ? body.ad_account_id
            : `act_${body.ad_account_id}`;

          const url = new URL(`https://graph.facebook.com/v20.0/${id}`);
          url.searchParams.set(
            "fields",
            "name,account_status,currency,timezone_name,business",
          );
          url.searchParams.set("access_token", body.access_token);

          const res = await fetch(url.toString());
          const json = (await res.json()) as {
            id?: string;
            name?: string;
            account_status?: number;
            currency?: string;
            timezone_name?: string;
            business?: { id?: string; name?: string };
            error?: { message?: string; code?: number; type?: string };
          };

          if (!res.ok || json.error) {
            return Response.json({
              ok: false,
              error:
                json.error?.message ??
                `Meta API ${res.status}: ${res.statusText}`,
              code: json.error?.code,
            });
          }

          return Response.json({
            ok: true,
            account: {
              ad_account_id: id,
              name: json.name,
              account_status: json.account_status,
              currency: json.currency,
              timezone_name: json.timezone_name,
              business_id: json.business?.id,
              business_name: json.business?.name,
            },
          });
        } catch (e) {
          return Response.json(
            { ok: false, error: e instanceof Error ? e.message : String(e) },
            { status: 500 },
          );
        }
      },
    },
  },
});