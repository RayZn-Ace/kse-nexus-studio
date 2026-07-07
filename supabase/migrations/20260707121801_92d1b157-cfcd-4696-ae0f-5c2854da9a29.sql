
CREATE TABLE public.visitor_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  event_type text NOT NULL,
  path text,
  referrer text,
  user_agent text,
  meta jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX visitor_events_created_at_idx ON public.visitor_events (created_at DESC);
CREATE INDEX visitor_events_session_idx ON public.visitor_events (session_id, created_at);

GRANT INSERT ON public.visitor_events TO anon, authenticated;
GRANT SELECT ON public.visitor_events TO authenticated;
GRANT ALL ON public.visitor_events TO service_role;

ALTER TABLE public.visitor_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone can insert visitor events"
  ON public.visitor_events FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "admins can read visitor events"
  ON public.visitor_events FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
