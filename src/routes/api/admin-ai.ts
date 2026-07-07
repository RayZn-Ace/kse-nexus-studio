import { createFileRoute } from "@tanstack/react-router";

type Body = { system?: string; prompt?: string; model?: string };

export const Route = createFileRoute("/api/admin-ai")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = (await request.json()) as Body;
          const key = process.env.LOVABLE_API_KEY;
          if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });
          if (!body.prompt) return Response.json({ error: "prompt required" }, { status: 400 });

          const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: { "Content-Type": "application/json", "Lovable-API-Key": key },
            body: JSON.stringify({
              model: body.model || "google/gemini-3-flash-preview",
              messages: [
                { role: "system", content: body.system || "Du bist ein hilfsbereiter Marketing- und Business-Assistent für die KSE Group (Software, AI, Websites, Marketing). Antworte auf Deutsch, direkt, mit klarem Tonfall im Comic-Hero-Stil." },
                { role: "user", content: body.prompt },
              ],
            }),
          });

          if (res.status === 429) return Response.json({ error: "Rate limit — kurz warten." }, { status: 429 });
          if (res.status === 402) return Response.json({ error: "AI-Kontingent aufgebraucht." }, { status: 402 });
          if (!res.ok) return Response.json({ error: await res.text() }, { status: 500 });

          const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
          return Response.json({ content: data.choices?.[0]?.message?.content ?? "" });
        } catch (e) {
          return Response.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
        }
      },
    },
  },
});