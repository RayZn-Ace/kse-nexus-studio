CREATE TABLE public.mission_config (
  token TEXT PRIMARY KEY,
  client_name TEXT,
  scope TEXT,
  contact TEXT,
  launch_date DATE,
  milestones JSONB NOT NULL DEFAULT '[]'::jsonb,
  updates JSONB NOT NULL DEFAULT '[]'::jsonb,
  files JSONB NOT NULL DEFAULT '[]'::jsonb,
  notes TEXT,
  rating INT,
  rating_comment TEXT,
  rated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.mission_config TO anon;
GRANT UPDATE (rating, rating_comment, rated_at) ON public.mission_config TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mission_config TO authenticated;
GRANT ALL ON public.mission_config TO service_role;

ALTER TABLE public.mission_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon read mission config" ON public.mission_config
  FOR SELECT TO anon USING (true);

CREATE POLICY "anon rate mission" ON public.mission_config
  FOR UPDATE TO anon USING (true) WITH CHECK (true);

CREATE POLICY "admin manage mission config" ON public.mission_config
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "auth read mission config" ON public.mission_config
  FOR SELECT TO authenticated USING (true);

CREATE OR REPLACE FUNCTION public.touch_mission_config()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER mission_config_touch
  BEFORE UPDATE ON public.mission_config
  FOR EACH ROW EXECUTE FUNCTION public.touch_mission_config();