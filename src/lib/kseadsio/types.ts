export type Placement =
  | "instagram_stories"
  | "facebook_stories"
  | "instagram_reels"
  | "facebook_reels"
  | "facebook_feed"
  | "instagram_feed";

export interface KayIPlan {
  intent:
    | "duplicate_campaign"
    | "analyze_campaign"
    | "pause_campaign"
    | "create_adset"
    | "unknown";
  source_campaign_id?: string;
  objective?: string;
  conversion_event?: string;
  location?: string;
  radius_km?: number;
  age_min?: number;
  age_max?: number;
  daily_budget_eur?: number;
  placements?: Placement[];
  creative_source?: "source_campaign" | "manual" | "library";
  landing_page_url?: string;
  pixel_id?: string;
  requires_approval: boolean;
  notes?: string;
}

export interface RiskFinding {
  level: "info" | "warn" | "block";
  code: string;
  message: string;
}

export interface MetaCampaign {
  id: string;
  name: string;
  status: "ACTIVE" | "PAUSED" | "ARCHIVED";
  objective: string;
  daily_budget_eur: number;
  spend_today_eur: number;
  cpm?: number;
  ctr?: number;
  cpa?: number;
  roas?: number;
  purchases?: number;
}

export interface MetaCreative {
  id: string;
  name: string;
  primary_text: string;
  headline: string;
  description: string;
  cta: string;
  format: "9:16" | "1:1" | "4:5";
  preview_url?: string;
}

export interface ExecutionAction {
  type: string;
  description: string;
  payload: Record<string, unknown>;
}