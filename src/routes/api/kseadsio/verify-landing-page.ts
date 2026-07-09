import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/kseadsio/verify-landing-page")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = (await request.json()) as { url?: string };
          let raw = (body.url ?? "").trim();
          if (!raw) {
            return Response.json({ ok: false, error: "URL fehlt." }, { status: 400 });
          }
          if (!/^https?:\/\//i.test(raw)) raw = "https://" + raw;
          let parsed: URL;
          try {
            parsed = new URL(raw);
          } catch {
            return Response.json({ ok: false, error: "Ungültige URL." }, { status: 400 });
          }

          const ac = new AbortController();
          const timer = setTimeout(() => ac.abort(), 10000);
          let res: Response;
          try {
            res = await fetch(parsed.toString(), {
              method: "GET",
              redirect: "follow",
              signal: ac.signal,
              headers: {
                "User-Agent":
                  "Mozilla/5.0 (compatible; KSEAdsioBot/1.0; +https://ksegroup.eu)",
                Accept: "text/html,application/xhtml+xml",
              },
            });
          } catch (e) {
            clearTimeout(timer);
            return Response.json({
              ok: false,
              error: "Nicht erreichbar: " + (e instanceof Error ? e.message : String(e)),
            });
          }
          clearTimeout(timer);

          const finalUrl = res.url || parsed.toString();
          const status = res.status;
          if (!res.ok) {
            return Response.json({
              ok: false,
              error: `HTTP ${status}`,
              page: { final_url: finalUrl, status_code: status },
            });
          }

          const html = (await res.text()).slice(0, 200000);
          const pick = (re: RegExp) => {
            const m = html.match(re);
            return m ? m[1].trim().replace(/\s+/g, " ") : null;
          };
          const decode = (s: string | null) =>
            s
              ? s
                  .replace(/&amp;/g, "&")
                  .replace(/&lt;/g, "<")
                  .replace(/&gt;/g, ">")
                  .replace(/&quot;/g, '"')
                  .replace(/&#39;/g, "'")
              : s;

          const ogTitle = pick(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i);
          const title = ogTitle ?? pick(/<title[^>]*>([^<]+)<\/title>/i);
          const description =
            pick(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i) ??
            pick(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i);

          const origin = new URL(finalUrl).origin;
          const iconHref = pick(
            /<link[^>]+rel=["'](?:shortcut icon|icon)["'][^>]+href=["']([^"']+)["']/i,
          );
          let favicon: string | null = null;
          if (iconHref) {
            try {
              favicon = new URL(iconHref, finalUrl).toString();
            } catch {
              favicon = null;
            }
          }
          if (!favicon) favicon = origin + "/favicon.ico";

          return Response.json({
            ok: true,
            page: {
              title: decode(title),
              description: decode(description),
              favicon_url: favicon,
              final_url: finalUrl,
              status_code: status,
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