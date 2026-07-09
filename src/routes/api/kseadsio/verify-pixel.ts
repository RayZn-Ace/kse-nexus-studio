import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/kseadsio/verify-pixel")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = (await request.json()) as {
            pixel_id: string;
            access_token: string;
          };
          if (!body.pixel_id || !body.access_token) {
            return Response.json(
              { ok: false, error: "pixel_id und access_token erforderlich" },
              { status: 400 },
            );
          }
          const url = new URL(
            `https://graph.facebook.com/v20.0/${body.pixel_id}`,
          );
          url.searchParams.set("fields", "name,last_fired_time");
          url.searchParams.set("access_token", body.access_token);

          const res = await fetch(url.toString());
          const json = (await res.json()) as {
            id?: string;
            name?: string;
            last_fired_time?: string;
            error?: { message?: string; code?: number };
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
            pixel: {
              pixel_id: json.id ?? body.pixel_id,
              name: json.name,
              last_fired_time: json.last_fired_time ?? null,
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