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

// Server-side Ollama bridge. Not called from client bundles.
export async function parseCommandViaOllama(
  raw: string,
  ollamaUrl: string,
  model: string,
): Promise<KayIPlan> {
  const system = `Du bist KayI, ein Meta-Ads-Assistent. Extrahiere aus dem folgenden Befehl ein JSON gemäß dem Schema. Antworte NUR mit JSON, keine Erklärung.`;
  const res = await fetch(`${ollamaUrl.replace(/\/$/, "")}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      stream: false,
      format: "json",
      messages: [
        { role: "system", content: system },
        { role: "user", content: raw },
      ],
    }),
  });
  if (!res.ok) throw new Error(`Ollama ${res.status}`);
  const j = (await res.json()) as { message?: { content?: string } };
  const content = j.message?.content ?? "{}";
  const parsed = JSON.parse(content) as Partial<KayIPlan>;
  return { intent: "unknown", requires_approval: true, ...parsed } as KayIPlan;
}