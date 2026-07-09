import type { KayIPlan, Placement } from "./types";

// Rule-based fallback parser. Extracts common patterns from German ad commands.
// Later this will be replaced by Ollama, but the shape stays identical.
export function parseCommandLocal(raw: string): KayIPlan {
  const t = raw.toLowerCase();

  const idMatch = raw.match(/\b(\d{12,20})\b/);
  const budgetMatch = raw.match(/(\d{1,4})\s?(?:€|eur|euro)/i);
  const ageMatch = raw.match(/(?:alter|age)\s*(\d{2})\s?[–\-]\s?(\d{2})/i);
  const radiusMatch = raw.match(/(\d{1,3})\s?km/i);
  const cityMatch = raw.match(/(?:in|mit|um)\s+([A-ZÄÖÜ][a-zäöüß\-]{2,})/);
  const urlMatch = raw.match(/https?:\/\/\S+/);
  const pixelMatch = raw.match(/pixel[^0-9]{0,10}(\d{10,20})/i);

  const placements: Placement[] = [];
  if (/story|stories/.test(t)) {
    placements.push("instagram_stories", "facebook_stories");
  }
  if (/reel/.test(t)) {
    placements.push("instagram_reels", "facebook_reels");
  }
  if (/feed/.test(t)) placements.push("facebook_feed", "instagram_feed");

  let intent: KayIPlan["intent"] = "unknown";
  if (/duplizier|dupliziere|dupliciere|copy|kopiere/.test(t)) intent = "duplicate_campaign";
  else if (/pausier|pause|stop/.test(t)) intent = "pause_campaign";
  else if (/analys/.test(t)) intent = "analyze_campaign";
  else if (/adset|adgroup|anzeigengruppe/.test(t)) intent = "create_adset";

  let objective: string | undefined;
  let conversion: string | undefined;
  if (/purchase|verkauf|sale|kauf/.test(t)) {
    objective = "OUTCOME_SALES";
    conversion = "PURCHASE";
  } else if (/lead|kontakt|anfrage/.test(t)) {
    objective = "OUTCOME_LEADS";
    conversion = "LEAD";
  } else if (/traffic|klicks/.test(t)) {
    objective = "OUTCOME_TRAFFIC";
  }

  return {
    intent,
    source_campaign_id: idMatch?.[1],
    objective,
    conversion_event: conversion,
    location: cityMatch?.[1],
    radius_km: radiusMatch ? Number(radiusMatch[1]) : undefined,
    age_min: ageMatch ? Number(ageMatch[1]) : undefined,
    age_max: ageMatch ? Number(ageMatch[2]) : undefined,
    daily_budget_eur: budgetMatch ? Number(budgetMatch[1]) : undefined,
    placements: placements.length ? placements : undefined,
    creative_source: /aus der alten|übernehmen|source/.test(t)
      ? "source_campaign"
      : undefined,
    landing_page_url: urlMatch?.[0],
    pixel_id: pixelMatch?.[1],
    requires_approval: true,
    notes: "Rule-based Fallback-Parser (Ollama nicht verbunden).",
  };
}

// Server-side Lovable AI Gateway bridge. Runs in the Cloud, no local setup.
export async function parseCommandViaLovableAI(
  raw: string,
  apiKey: string,
  model = "google/gemini-3-flash-preview",
): Promise<KayIPlan> {
  const system = `Du bist KayI, ein Meta-Ads-Assistent. Extrahiere aus dem folgenden Befehl ein JSON gemäß diesem Schema:
{
  "intent": "duplicate_campaign" | "analyze_campaign" | "pause_campaign" | "create_adset" | "unknown",
  "source_campaign_id": string?,
  "objective": string?,
  "conversion_event": string?,
  "location": string?,
  "radius_km": number?,
  "age_min": number?,
  "age_max": number?,
  "daily_budget_eur": number?,
  "placements": string[]?,
  "creative_source": "source_campaign" | "manual" | "library" ?,
  "landing_page_url": string?,
  "pixel_id": string?,
  "requires_approval": true,
  "notes": string?
}
Antworte NUR mit gültigem JSON, keine Erklärung, kein Markdown.`;
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Lovable-API-Key": apiKey,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: system },
        { role: "user", content: raw },
      ],
      response_format: { type: "json_object" },
    }),
  });
  if (!res.ok) throw new Error(`Lovable AI ${res.status}`);
  const j = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  const content = j.choices?.[0]?.message?.content ?? "{}";
  const cleaned = content.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  const parsed = JSON.parse(cleaned) as Partial<KayIPlan>;
  return { intent: "unknown", requires_approval: true, ...parsed } as KayIPlan;
}