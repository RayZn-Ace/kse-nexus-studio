import { createFileRoute } from "@tanstack/react-router";

type Body = {
  services?: string[];
  timeline?: string | null;
  budget?: string | null;
  description?: string;
  industry?: string;
};

const SYSTEM = `Du bist der PILOT-GENERATOR der KSE GROUP.

Deine Aufgabe: Aus einer Kundenanfrage generierst du eine konkrete, greifbare Projekt-Vorschau (ein "Pilotprojekt"), damit sich der Kunde sofort vorstellen kann, was er bekommt.

STIL:
- Deutsch, direkt, konkret. Keine Marketing-Floskeln, keine Emojis.
- Namen für das Pilotprojekt: prägnant, 1-3 Wörter, gerne mit Codename-Vibe (z.B. "PROJEKT NORDLICHT", "ATLAS-01", "REVIER").
- Tagline: max. 8 Wörter, glasklar.
- Features & Deliverables: konkrete, technisch nachvollziehbare Bausteine — NICHT "modernes Design" oder "hohe Qualität".

GIB AUSSCHLIESSLICH VALIDES JSON ZURÜCK (kein Markdown, kein Text davor/danach), Format:
{
  "projectName": "string",
  "codename": "string (kurz, techy)",
  "tagline": "string",
  "summary": "string (2-3 Sätze)",
  "targetUser": "string (wer nutzt es)",
  "keyFeatures": [{"title": "string", "detail": "string (1 Satz)"}],
  "techStack": ["string"],
  "screens": [{"name": "string", "purpose": "string (1 Satz)", "elements": ["string"]}],
  "milestones": [{"week": "string (z.B. Woche 1-2)", "title": "string", "output": "string"}],
  "differentiators": ["string (was macht das besonders)"],
  "risks": ["string (offene Fragen / Klärungsbedarf)"]
}

Genau 4-6 keyFeatures, 3-4 screens, 4-5 milestones, 3 differentiators, 2-3 risks, 4-6 techStack items.`;

export const Route = createFileRoute("/api/pilot-generator")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = (await request.json()) as Body;
          const key = process.env.LOVABLE_API_KEY;
          if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

          const userPrompt = [
            `Gewünschte Leistungen: ${(body.services ?? []).join(", ") || "unklar"}`,
            `Timeline: ${body.timeline ?? "unklar"}`,
            `Budget-Rahmen: ${body.budget ?? "unklar"}`,
            body.industry ? `Branche: ${body.industry}` : "",
            "",
            "Beschreibung / Vision des Kunden:",
            body.description?.trim() || "(keine Beschreibung — generiere einen plausiblen Piloten basierend auf den Leistungen)",
          ]
            .filter(Boolean)
            .join("\n");

          const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Lovable-API-Key": key,
            },
            body: JSON.stringify({
              model: "google/gemini-3-flash-preview",
              messages: [
                { role: "system", content: SYSTEM },
                { role: "user", content: userPrompt },
              ],
              response_format: { type: "json_object" },
            }),
          });

          if (!res.ok) {
            const text = await res.text();
            return new Response(`Gateway error: ${text}`, { status: res.status });
          }

          const data = (await res.json()) as {
            choices?: { message?: { content?: string } }[];
          };
          const content = data.choices?.[0]?.message?.content ?? "{}";

          let parsed: unknown;
          try {
            parsed = JSON.parse(content);
          } catch {
            const match = content.match(/\{[\s\S]*\}/);
            parsed = match ? JSON.parse(match[0]) : {};
          }

          return new Response(JSON.stringify(parsed), {
            headers: { "Content-Type": "application/json" },
          });
        } catch (err) {
          const msg = err instanceof Error ? err.message : "Unknown error";
          return new Response(`Error: ${msg}`, { status: 500 });
        }
      },
    },
  },
});