
-- Settings
CREATE TABLE public.kseadsio_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  meta_business_id TEXT,
  meta_ad_account_id TEXT,
  meta_access_token_encrypted TEXT,
  default_pixel_id TEXT,
  default_landing_page TEXT,
  default_daily_budget_eur NUMERIC DEFAULT 50,
  default_age_min INT DEFAULT 18,
  default_age_max INT DEFAULT 65,
  default_placements JSONB DEFAULT '["instagram_stories","facebook_stories","instagram_reels","facebook_reels"]'::jsonb,
  ollama_api_url TEXT DEFAULT 'http://localhost:11434',
  ollama_model TEXT DEFAULT 'llama3',
  safe_mode BOOLEAN NOT NULL DEFAULT true,
  max_campaign_budget NUMERIC DEFAULT 500,
  max_daily_budget_increase_percent NUMERIC DEFAULT 25,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.kseadsio_commands (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  raw_command TEXT NOT NULL,
  parsed_json JSONB,
  status TEXT NOT NULL DEFAULT 'pending',
  risk_level TEXT DEFAULT 'unknown',
  risk_notes JSONB,
  requires_approval BOOLEAN NOT NULL DEFAULT true,
  approved_at TIMESTAMPTZ,
  executed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.kseadsio_execution_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  command_id UUID REFERENCES public.kseadsio_commands(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  request_payload JSONB,
  response_payload JSONB,
  status TEXT NOT NULL DEFAULT 'ok',
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.kseadsio_campaign_snapshots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  meta_campaign_id TEXT NOT NULL,
  snapshot_json JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.kseadsio_creative_checks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  command_id UUID REFERENCES public.kseadsio_commands(id) ON DELETE CASCADE,
  creative_id TEXT,
  text_content TEXT,
  warnings JSONB,
  status TEXT DEFAULT 'ok',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- GRANTS (admin-only reads/writes via RLS; still need base grants for authenticated)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.kseadsio_settings TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.kseadsio_commands TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.kseadsio_execution_logs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.kseadsio_campaign_snapshots TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.kseadsio_creative_checks TO authenticated;
GRANT ALL ON public.kseadsio_settings TO service_role;
GRANT ALL ON public.kseadsio_commands TO service_role;
GRANT ALL ON public.kseadsio_execution_logs TO service_role;
GRANT ALL ON public.kseadsio_campaign_snapshots TO service_role;
GRANT ALL ON public.kseadsio_creative_checks TO service_role;

-- RLS
ALTER TABLE public.kseadsio_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kseadsio_commands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kseadsio_execution_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kseadsio_campaign_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kseadsio_creative_checks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin all settings" ON public.kseadsio_settings FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin all commands" ON public.kseadsio_commands FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin all logs" ON public.kseadsio_execution_logs FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin all snapshots" ON public.kseadsio_campaign_snapshots FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin all creative checks" ON public.kseadsio_creative_checks FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER kseadsio_settings_touch BEFORE UPDATE ON public.kseadsio_settings FOR EACH ROW EXECUTE FUNCTION public.touch_mission_config();

-- Seed one settings row
INSERT INTO public.kseadsio_settings (default_pixel_id, default_landing_page) VALUES ('926446183790326', 'https://mallorca-total.de/#ditix-tickets');
