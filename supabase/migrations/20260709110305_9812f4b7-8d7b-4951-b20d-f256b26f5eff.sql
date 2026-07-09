CREATE TABLE public.kseadsio_ad_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_account_id text NOT NULL UNIQUE,
  label text,
  name text,
  currency text,
  timezone_name text,
  business_id text,
  business_name text,
  access_token_encrypted text,
  verification_status text NOT NULL DEFAULT 'unknown',
  verification_error text,
  last_verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.kseadsio_ad_accounts TO authenticated;
GRANT ALL ON public.kseadsio_ad_accounts TO service_role;

ALTER TABLE public.kseadsio_ad_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage ad accounts"
  ON public.kseadsio_ad_accounts
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER touch_kseadsio_ad_accounts
  BEFORE UPDATE ON public.kseadsio_ad_accounts
  FOR EACH ROW EXECUTE FUNCTION public.touch_mission_config();