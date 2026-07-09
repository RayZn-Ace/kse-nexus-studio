ALTER TABLE public.kseadsio_settings
  ADD COLUMN IF NOT EXISTS is_system_user_token boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS system_user_id text,
  ADD COLUMN IF NOT EXISTS extra_ad_account_ids text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS extra_pixel_ids text[] NOT NULL DEFAULT '{}';