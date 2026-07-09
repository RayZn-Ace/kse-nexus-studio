CREATE TABLE public.kseadsio_pixels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pixel_id text NOT NULL UNIQUE,
  name text,
  last_fired_time timestamptz,
  verification_status text NOT NULL DEFAULT 'unknown',
  verification_error text,
  last_verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.kseadsio_pixels TO authenticated;
GRANT ALL ON public.kseadsio_pixels TO service_role;

ALTER TABLE public.kseadsio_pixels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage pixels"
  ON public.kseadsio_pixels
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER touch_kseadsio_pixels
  BEFORE UPDATE ON public.kseadsio_pixels
  FOR EACH ROW EXECUTE FUNCTION public.touch_mission_config();