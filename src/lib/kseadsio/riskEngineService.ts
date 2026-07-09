import type { KayIPlan, RiskFinding } from "./types";

const KNOWN_CITIES = [
  "böblingen", "stuttgart", "münchen", "berlin", "hamburg", "hannover",
  "köln", "frankfurt", "leipzig", "dresden", "düsseldorf", "bremen",
  "nürnberg", "essen", "dortmund",
];

export function evaluateRisk(
  plan: KayIPlan,
  opts: { max_campaign_budget: number; safe_mode: boolean },
): { level: "low" | "medium" | "high" | "block"; findings: RiskFinding[] } {
  const findings: RiskFinding[] = [];

  if (!plan.source_campaign_id && plan.intent === "duplicate_campaign") {
    findings.push({ level: "block", code: "MISSING_CAMPAIGN_ID", message: "Keine Quell-Kampagnen-ID erkannt." });
  }
  if (!plan.pixel_id) {
    findings.push({ level: "warn", code: "MISSING_PIXEL", message: "Kein Pixel angegeben — Default wird genutzt." });
  }
  if (!plan.landing_page_url) {
    findings.push({ level: "warn", code: "MISSING_URL", message: "Keine Landingpage angegeben." });
  }
  if (plan.daily_budget_eur && plan.daily_budget_eur > opts.max_campaign_budget) {
    findings.push({ level: "block", code: "BUDGET_OVER_MAX", message: `Budget ${plan.daily_budget_eur}€ übersteigt Max ${opts.max_campaign_budget}€.` });
  }
  if (plan.age_min && plan.age_max && plan.age_min >= plan.age_max) {
    findings.push({ level: "block", code: "AGE_INVALID", message: "Alter-Untergrenze ≥ Obergrenze." });
  }
  if (plan.location) {
    const known = KNOWN_CITIES.includes(plan.location.toLowerCase());
    if (!known) findings.push({ level: "warn", code: "CITY_UNKNOWN", message: `Ort „${plan.location}" nicht in bekannter Liste. Rechtschreibung prüfen.` });
  } else if (plan.intent === "duplicate_campaign" || plan.intent === "create_adset") {
    findings.push({ level: "warn", code: "MISSING_LOCATION", message: "Kein Standort erkannt." });
  }
  if (plan.objective === "OUTCOME_SALES" && plan.conversion_event !== "PURCHASE") {
    findings.push({ level: "warn", code: "MISSING_CONVERSION", message: "Sales-Ziel ohne Purchase-Event." });
  }
  const wants916 = plan.placements?.some((p) => /story|reel/.test(p));
  if (wants916) {
    findings.push({ level: "info", code: "FORMAT_916", message: "Story/Reels: 9:16-Creatives werden verwendet." });
  }
  if (opts.safe_mode) {
    findings.push({ level: "info", code: "SAFE_MODE", message: "Safe Mode aktiv — Kampagne wird als PAUSED erstellt." });
  }

  const hasBlock = findings.some((f) => f.level === "block");
  const warnCount = findings.filter((f) => f.level === "warn").length;
  const level = hasBlock
    ? ("block" as const)
    : warnCount >= 3
      ? ("high" as const)
      : warnCount >= 1
        ? ("medium" as const)
        : ("low" as const);
  return { level, findings };
}