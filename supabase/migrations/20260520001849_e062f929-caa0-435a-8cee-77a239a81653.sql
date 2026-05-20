
-- posts_log
CREATE TABLE public.posts_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL CHECK (type IN ('story','reel','feed')),
  caption text,
  image_url text,
  image_prompt text,
  ig_media_id text,
  status text NOT NULL CHECK (status IN ('success','failed','pending')),
  error_message text,
  triggered_by text NOT NULL DEFAULT 'cron' CHECK (triggered_by IN ('cron','manual')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_posts_log_created_at ON public.posts_log(created_at DESC);
CREATE INDEX idx_posts_log_type_status ON public.posts_log(type, status);

ALTER TABLE public.posts_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view posts_log"
  ON public.posts_log FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete posts_log"
  ON public.posts_log FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- automation_config
CREATE TABLE public.automation_config (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.automation_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view automation_config"
  ON public.automation_config FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can upsert automation_config"
  ON public.automation_config FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update automation_config"
  ON public.automation_config FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Defaults: alles AUS bis manuell aktiviert
INSERT INTO public.automation_config (key, value) VALUES
  ('story_enabled', 'false'::jsonb),
  ('reel_enabled',  'false'::jsonb),
  ('feed_enabled',  'false'::jsonb);

-- Extensions for cron + http
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;
