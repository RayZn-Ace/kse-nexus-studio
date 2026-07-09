import type { MetaCampaign, MetaCreative } from "./types";

export const demoAdAccounts = [
  { id: "act_1029384756", name: "KSE Main", currency: "EUR", timezone: "Europe/Berlin" },
  { id: "act_2938475610", name: "Mallorca Total", currency: "EUR", timezone: "Europe/Berlin" },
];

export const demoCampaigns: MetaCampaign[] = [
  {
    id: "120242692175120534",
    name: "MT — Purchase / DE South",
    status: "ACTIVE",
    objective: "OUTCOME_SALES",
    daily_budget_eur: 75,
    spend_today_eur: 41.22,
    cpm: 6.42,
    ctr: 1.83,
    cpa: 18.4,
    roas: 3.1,
    purchases: 9,
  },
  {
    id: "120242692175120535",
    name: "KSE — Website Traffic",
    status: "PAUSED",
    objective: "OUTCOME_TRAFFIC",
    daily_budget_eur: 30,
    spend_today_eur: 0,
    cpm: 4.9,
    ctr: 2.11,
  },
  {
    id: "120242692175120536",
    name: "MT — Lead / Reels DE",
    status: "ACTIVE",
    objective: "OUTCOME_LEADS",
    daily_budget_eur: 45,
    spend_today_eur: 23.5,
    cpm: 5.6,
    ctr: 1.44,
    cpa: 6.7,
  },
];

export const demoCreatives: MetaCreative[] = [
  {
    id: "ad_001",
    name: "Mallorca — Sunset Reel",
    primary_text: "Erlebe Mallorca wie nie zuvor. Tickets ab 29€.",
    headline: "Mallorca 2026",
    description: "Sichere dir jetzt deinen Platz",
    cta: "BOOK_NOW",
    format: "9:16",
  },
  {
    id: "ad_002",
    name: "Mallorca — Party Story",
    primary_text: "Party. Sonne. Meer. Nur dieses Wochenende.",
    headline: "Ballermann live",
    description: "Ticket sichern",
    cta: "GET_OFFER",
    format: "9:16",
  },
  {
    id: "ad_003",
    name: "KSE — AI Automation",
    primary_text: "AI-Automation für Mittelstand. In 30 Tagen live.",
    headline: "AI, das liefert.",
    description: "Kostenlose Erstberatung",
    cta: "LEARN_MORE",
    format: "1:1",
  },
];

export const demoPixel = { id: "926446183790326", name: "MT Main Pixel" };

export const demoCommand =
  "Dupliziere die Kampagne 120242692175120534 bitte und baue sie um auf Conversion Purchase. Nur eine Adgroup mit Böblingen und ca. 75 km Reichweite, Alter 18–42. Daily Budget 75 €. Story und Reels Platzierung 9:16. Creatives und Texte aus der alten Kampagne übernehmen. Vorher auf Fehler prüfen.";