CREATE TABLE public.tutorial_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tutorial_id uuid NOT NULL REFERENCES public.tutorials(id) ON DELETE CASCADE,
  token text NOT NULL UNIQUE,
  created_by uuid,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_tutorial_shares_token ON public.tutorial_shares(token);
CREATE INDEX idx_tutorial_shares_tutorial ON public.tutorial_shares(tutorial_id);

ALTER TABLE public.tutorial_shares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view shares"
  ON public.tutorial_shares FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can create shares"
  ON public.tutorial_shares FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete shares"
  ON public.tutorial_shares FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));