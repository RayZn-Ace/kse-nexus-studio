import { createFileRoute } from "@tanstack/react-router";

type Body = { url?: string };

const SYSTEM = `Du bist der WEBSITE-AUDITOR der KSE GROUP.

Aufgabe: Du bekommst rohen HTML-Text einer Website plus Metadaten und lieferst einen knackigen, ehrlichen Audit auf Deutsch — im Stil einer Tech-Agentur, die weiß, was sie tut. Kein Marketing-Bullshit, keine leeren Phrasen.

STIL:
- Direkt, konkret, mit Meinung.
- Wo etwas gut ist: kurz benennen. Wo etwas schlecht ist: klar sagen, warum.
- Keine Emojis. Keine "Sehr geehrte Damen und Herren"-Sprache.

GIB AUSSCHLIESSLICH VALIDES JSON ZURÜCK (kein Markdown, kein Text davor/danach) in genau diesem Format:
{
  "overallScore": number (0-100, ehrlich, nicht geschönt),
  "verdict": "string (1 Satz, das Fazit)",
  "scores": {
    "design": number (0-100),
    "performance": number (0-100),
    "ux": number (0-100),
    "seo": number (0-100),
    "aiPotential": number (0-100)
  },
  "strengths": ["string", "string", "string"] (2-4 Punkte),
  "issues": [
    {"severity": "high" | "medium" | "low", "title": "string", "detail": "string (1-2 Sätze)"}
  ] (3-6 Punkte),
  "quickWins": [
    {"title": "string", "impact": "string (Warum lohnt sich das)", "effort": "low" | "medium" | "high"}
  ] (3-5 Punkte),
  "aiOpportunities": [
    {"title": "string", "detail": "string (Wo könnte KSE mit AI konkret nachhelfen)"}
  ] (2-3 Punkte)
}

Sei brutal ehrlich bei den Scores. Eine 08/15-Seite ist keine 85. Eine solide Seite mit klaren Schwächen ist eine 62.`;

function stripHtml(html: string, maxChars = 12000): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxChars);
}

function extractMeta(html: string) {
  const pick = (re: RegExp) => html.match(re)?.[1]?.trim() ?? "";
  const title = pick(/<title>([^<]*)<\/title>/i);
  const description = pick(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i);
  const ogTitle = pick(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']*)["']/i);
  const ogImage = pick(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']*)["']/i);
  const viewport = pick(/<meta[^>]+name=["']viewport["'][^>]+content=["']([^"']*)["']/i);
  const h1Count = (html.match(/<h1\b/gi) ?? []).length;
  const imgCount = (html.match(/<img\b/gi) ?? []).length;
  const imgAltMissing = (html.match(/<img\b(?![^>]*\balt=)[^>]*>/gi) ?? []).length;
  const scriptCount = (html.match(/<script\b/gi) ?? []).length;
  const hasSchemaOrg = /application\/ld\+json/i.test(html);
  return { title, description, ogTitle, ogImage, viewport, h1Count, imgCount, imgAltMissing, scriptCount, hasSchemaOrg };
}

export const Route = createFileRoute("/api/website-audit")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = (await request.json()) as Body;
          let raw = (body.url ?? "").trim();
          if (!raw) return Response.json({ error: "URL fehlt" }, { status: 400 });
          if (!/^https?:\/\//i.test(raw)) raw = "https://" + raw;

          let target: URL;
          try {
            target = new URL(raw);
          } catch {
            return Response.json({ error: "Ungültige URL" }, { status: 400 });
          }

          const key = process.env.LOVABLE_API_KEY;
          if (!key) return Response.json({ error: "Missing LOVABLE_API_KEY" }, { status: 500 });

          const t0 = Date.now();
          let html = "";
          let status = 0;
          let contentType = "";
          let bytes = 0;
          try {
            const res = await fetch(target.toString(), {
              headers: {
                "User-Agent": "Mozilla/5.0 (compatible; KSE-Auditor/1.0; +https://ksegroup.eu)",
                Accept: "text/html,application/xhtml+xml",
              },
              signal: AbortSignal.timeout(12000),
            });
            status = res.status;
            contentType = res.headers.get("content-type") ?? "";
            html = await res.text();
            bytes = new Blob([html]).size;
          } catch (e) {
            const msg = e instanceof Error ? e.message : "Fetch fehlgeschlagen";
            return Response.json({ error: `Konnte die Seite nicht laden: ${msg}` }, { status: 400 });
          }
          const loadMs = Date.now() - t0;

          const meta = extractMeta(html);
          const text = stripHtml(html);

          const userPrompt = [
            `URL: ${target.toString()}`,
            `HTTP-Status: ${status}`,
            `Content-Type: ${contentType}`,
            `Ladezeit (Fetch): ${loadMs}ms`,
            `HTML-Größe: ${(bytes / 1024).toFixed(1)} KB`,
            `Title: ${meta.title || "(fehlt)"}`,
            `Meta-Description: ${meta.description || "(fehlt)"}`,
            `OG-Title: ${meta.ogTitle || "(fehlt)"}`,
            `OG-Image: ${meta.ogImage ? "vorhanden" : "(fehlt)"}`,
            `Viewport-Meta: ${meta.viewport || "(fehlt)"}`,
            `Anzahl <h1>: ${meta.h1Count}`,
            `Anzahl <img>: ${meta.imgCount} (davon ohne alt: ${meta.imgAltMissing})`,
            `Anzahl <script>: ${meta.scriptCount}`,
            `Schema.org (JSON-LD): ${meta.hasSchemaOrg ? "ja" : "nein"}`,
            "",
            "Sichtbarer Text-Auszug (max. 12k Zeichen):",
            text || "(kein Text extrahierbar)",
          ].join("\n");

          const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: { "Content-Type": "application/json", "Lovable-API-Key": key },
            body: JSON.stringify({
              model: "google/gemini-3-flash-preview",
              messages: [
                { role: "system", content: SYSTEM },
                { role: "user", content: userPrompt },
              ],
              response_format: { type: "json_object" },
            }),
          });

          if (aiRes.status === 429) return Response.json({ error: "Zu viele Anfragen. Bitte kurz warten." }, { status: 429 });
          if (aiRes.status === 402) return Response.json({ error: "AI-Kontingent aufgebraucht." }, { status: 402 });
          if (!aiRes.ok) {
            const txt = await aiRes.text();
            return Response.json({ error: `Gateway: ${txt}` }, { status: 500 });
          }

          const data = (await aiRes.json()) as { choices?: { message?: { content?: string } }[] };
          const content = data.choices?.[0]?.message?.content ?? "{}";
          let audit: unknown = {};
          try { audit = JSON.parse(content); } catch {
            const m = content.match(/\{[\s\S]*\}/);
            audit = m ? JSON.parse(m[0]) : {};
          }

          return Response.json({
            url: target.toString(),
            fetchedAt: new Date().toISOString(),
            technical: {
              status,
              loadMs,
              sizeKb: Number((bytes / 1024).toFixed(1)),
              contentType,
              meta,
            },
            audit,
          });
        } catch (err) {
          const msg = err instanceof Error ? err.message : "Unknown error";
          return Response.json({ error: msg }, { status: 500 });
        }
      },
    },
  },
});