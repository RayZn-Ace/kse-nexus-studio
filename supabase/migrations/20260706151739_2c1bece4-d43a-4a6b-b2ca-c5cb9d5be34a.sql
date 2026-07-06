
ALTER TABLE public.contact_messages
  ADD COLUMN IF NOT EXISTS company text,
  ADD COLUMN IF NOT EXISTS services text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS budget_range text,
  ADD COLUMN IF NOT EXISTS timeline text,
  ADD COLUMN IF NOT EXISTS source text DEFAULT 'contact_form';
