CREATE TABLE public.kseadsio_landing_pages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  url text NOT NULL UNIQUE,
  title text,
  description text,
  favicon_url text,
  final_url text,
  status_code integer,
  verification_status text NOT NULL DEFAULT 'pending',
  verification_error text,
  last_verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.kseadsio_landing_pages TO authenticated;
GRANT ALL ON public.kseadsio_landing_pages TO service_role;

ALTER TABLE public.kseadsio_landing_pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage landing pages"
  ON public.kseadsio_landing_pages
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_kseadsio_landing_pages_updated_at
  BEFORE UPDATE ON public.kseadsio_landing_pages
  FOR EACH ROW EXECUTE FUNCTION public.touch_mission_config();