import { createFileRoute } from "@tanstack/react-router";

type Body = { brief?: string };

const SYSTEM = `Du bist der ORCHESTRATOR eines Agent-Swarms bei der KSE GROUP.

Du bekommst einen Kunden-Brief. Simuliere, wie 5 spezialisierte AI-Agents parallel daran arbeiten. Jeder Agent hat eine Persönlichkeit und liefert konkrete, technische Ergebnisse — keine Marketing-Sprache.

DIE AGENTS:
- NOVA (Strategist): zerlegt den Brief in Kernziele & Zielgruppen. Denkt in Business-Impact.
- VOX (Copywriter): schreibt Tagline, Hero-Copy, CTA-Optionen. Deutsch, prägnant.
- SCRIBE (Architect): definiert Seitenstruktur, Komponenten, Datenmodell. Technisch.
- ATLAS (Ops): plant Timeline, Milestones, Risiken. Realistisch.
- PIXEL (Designer): schlägt Farbpalette, Typo, visuelle Richtung vor. Konkret mit Hex-Codes.

GIB AUSSCHLIESSLICH VALIDES JSON ZURÜCK (kein Markdown), Format:
{
  "projectCode": "string (z.B. SWARM-2409)",
  "brief": "string (1-Satz-Zusammenfassung des Kundenwunschs)",
  "agents": [
    {
      "name": "NOVA" | "VOX" | "SCRIBE" | "ATLAS" | "PIXEL",
      "role": "string",
      "thinking": ["string (3-5 kurze Gedanken-Fragmente, wie ein innerer Monolog — max. 8 Wörter pro Fragment)"],
      "output": {
        "headline": "string (Titel des Deliverables)",
        "items": ["string (3-5 konkrete Punkte)"]
      }
    }
  ],
  "synthesis": "string (2-3 Sätze — der finale Vorschlag, wie das Team weitermacht)"
}

Genau 5 agents, in Reihenfolge NOVA, VOX, SCRIBE, ATLAS, PIXEL.`;

export const Route = createFileRoute("/api/agent-swarm")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = (await request.json()) as Body;
          const brief = (body.brief ?? "").trim();
          if (!brief) return Response.json({ error: "Brief fehlt" }, { status: 400 });

          const key = process.env.LOVABLE_API_KEY;
          if (!key) return Response.json({ error: "Missing LOVABLE_API_KEY" }, { status: 500 });

          const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: { "Content-Type": "application/json", "Lovable-API-Key": key },
            body: JSON.stringify({
              model: "google/gemini-3-flash-preview",
              messages: [
                { role: "system", content: SYSTEM },
                { role: "user", content: `Kunden-Brief:\n${brief}` },
              ],
              response_format: { type: "json_object" },
            }),
          });

          if (res.status === 429) return Response.json({ error: "Zu viele Anfragen." }, { status: 429 });
          if (res.status === 402) return Response.json({ error: "AI-Kontingent aufgebraucht." }, { status: 402 });
          if (!res.ok) {
            const t = await res.text();
            return Response.json({ error: `Gateway: ${t}` }, { status: 500 });
          }

          const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
          const content = data.choices?.[0]?.message?.content ?? "{}";
          let parsed: unknown = {};
          try { parsed = JSON.parse(content); } catch {
            const m = content.match(/\{[\s\S]*\}/);
            parsed = m ? JSON.parse(m[0]) : {};
          }
          return Response.json(parsed);
        } catch (err) {
          const msg = err instanceof Error ? err.message : "Unknown error";
          return Response.json({ error: msg }, { status: 500 });
        }
      },
    },
  },
});