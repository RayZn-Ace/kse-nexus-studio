
CREATE TABLE public.booking_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  description text,
  meeting_type text NOT NULL DEFAULT 'video',
  duration_minutes integer NOT NULL DEFAULT 30,
  location text,
  info text,
  color text NOT NULL DEFAULT '#ff5722',
  availability jsonb NOT NULL DEFAULT '{"weekdays":[1,2,3,4,5],"start":"09:00","end":"17:00","slot":30,"lead_hours":12,"days_ahead":21}'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  link_id uuid NOT NULL REFERENCES public.booking_links(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  company text,
  message text,
  starts_at timestamptz NOT NULL,
  duration_minutes integer NOT NULL DEFAULT 30,
  meeting_type text NOT NULL DEFAULT 'video',
  room_url text,
  status text NOT NULL DEFAULT 'confirmed',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX bookings_link_start_idx ON public.bookings(link_id, starts_at);

GRANT SELECT ON public.booking_links TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.booking_links TO authenticated;
GRANT ALL ON public.booking_links TO service_role;

GRANT SELECT, INSERT ON public.bookings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bookings TO authenticated;
GRANT ALL ON public.bookings TO service_role;

ALTER TABLE public.booking_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Active booking links are public"
  ON public.booking_links FOR SELECT
  USING (is_active = true OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage booking links insert"
  ON public.booking_links FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage booking links update"
  ON public.booking_links FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage booking links delete"
  ON public.booking_links FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can create a booking"
  ON public.bookings FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can read bookings"
  ON public.bookings FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update bookings"
  ON public.bookings FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete bookings"
  ON public.bookings FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER booking_links_touch
  BEFORE UPDATE ON public.booking_links
  FOR EACH ROW EXECUTE FUNCTION public.touch_mission_config();
