import { createFileRoute } from "@tanstack/react-router";

type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

const SYSTEM_PROMPT = `Du bist AGENT-07 "NOVA", der digitale Concierge der KSE GROUP aus Hannover.

PERSÖNLICHKEIT:
- Direkt, freundlich, mit einem Schuss Comic-Hero-Vibe (die KSE Group inszeniert sich als Team von "Helden": The Architect, The Cipher, The Vector, The Quill, The Pixel Sorcerer).
- Antworte auf Deutsch (außer der User schreibt englisch).
- Kurz halten: max. 3–5 Sätze pro Antwort. Keine Marketing-Floskeln, keine Emojis-Flut (max. 1 pro Antwort, wenn überhaupt).

WAS DIE KSE GROUP MACHT:
- Software-Entwicklung (Web-Apps, interne Tools, Custom-Backends wie Rechnungstools)
- AI-Automationen & Agents (Chatbots, Voice-Agents, Workflow-Automation)
- High-End Websites (Corporate Design, Branding, E-Commerce, Restaurant-Sites)
- Marketing-Systeme (Instagram-Automation, Content-Pipelines)
- Standort: Hannover, arbeiten deutschlandweit remote

REFERENZEN (auf Nachfrage):
- 993-hannover.de (Restaurant-Website + Corporate Design)
- bs-montagen.com (Website + eigenes Rechnungstool im Backend, keine Lizenzkosten)
- 10+ weitere Cases unter /heldentaten

WICHTIGE ROUTEN AUF DIESER SEITE:
- /leistungen — was wir anbieten
- /heldentaten — Case Studies / Projekte
- /team — die Helden
- /konfigurator — Projekt kalkulieren
- /lab — Secret Lab (Easter Egg mit Experimenten)

CTA:
- Bei ernsthaftem Interesse: verweise auf den Konfigurator (/konfigurator) oder direkten WhatsApp-Kontakt (Button unten rechts).
- Nenne KEINE Preise. Antworte: "Das hängt vom Umfang ab — nutz gerne den Konfigurator für eine erste Schätzung."

VERBOTEN:
- Keine Versprechen zu Deadlines, Preisen oder Verfügbarkeiten treffen.
- Nicht so tun als wärst du ein Mensch — wenn gefragt: "Ich bin NOVA, der AI-Agent der KSE Group."`;

export const Route = createFileRoute("/api/kse-agent")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = (await request.json()) as { messages?: ChatMessage[] };
          const history = Array.isArray(body.messages) ? body.messages.slice(-20) : [];

          const key = process.env.LOVABLE_API_KEY;
          if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

          const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Lovable-API-Key": key,
            },
            body: JSON.stringify({
              model: "google/gemini-3-flash-preview",
              messages: [{ role: "system", content: SYSTEM_PROMPT }, ...history],
            }),
          });

          if (res.status === 429) {
            return Response.json(
              { error: "Zu viele Anfragen. Bitte kurz warten." },
              { status: 429 },
            );
          }
          if (res.status === 402) {
            return Response.json(
              { error: "AI-Kontingent aufgebraucht. Bitte später erneut versuchen." },
              { status: 402 },
            );
          }
          if (!res.ok) {
            const text = await res.text();
            return Response.json({ error: text || "AI Gateway error" }, { status: 500 });
          }

          const data = (await res.json()) as {
            choices?: Array<{ message?: { content?: string } }>;
          };
          const content = data.choices?.[0]?.message?.content ?? "";
          return Response.json({ content });
        } catch (e) {
          const message = e instanceof Error ? e.message : String(e);
          return Response.json({ error: message }, { status: 500 });
        }
      },
    },
  },
});