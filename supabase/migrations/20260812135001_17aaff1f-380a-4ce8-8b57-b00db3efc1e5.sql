ALTER TABLE public.booking_links
  ADD COLUMN IF NOT EXISTS mode text NOT NULL DEFAULT 'recurring',
  ADD COLUMN IF NOT EXISTS fixed_slots jsonb NOT NULL DEFAULT '[]'::jsonb;

CREATE TABLE IF NOT EXISTS public.email_senders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  role text,
  email text NOT NULL,
  phone text,
  avatar_url text,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.email_senders TO authenticated;
GRANT ALL ON public.email_senders TO service_role;

ALTER TABLE public.email_senders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read senders" ON public.email_senders
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert senders" ON public.email_senders
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update senders" ON public.email_senders
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated can delete senders" ON public.email_senders
  FOR DELETE TO authenticated USING (true);

CREATE TRIGGER email_senders_touch BEFORE UPDATE ON public.email_senders
  FOR EACH ROW EXECUTE FUNCTION public.touch_mission_config();

INSERT INTO public.email_senders (name, role, email, phone, is_default)
SELECT 'Kay Engelmann', 'Geschäftsführer · KSE GROUP', 'k.engelmann@ksegroup.eu', '+49 157 57971457', true
WHERE NOT EXISTS (SELECT 1 FROM public.email_senders);