CREATE TABLE public.shop_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tio_sheet_id TEXT,
  tio_sheet_gid TEXT DEFAULT '0',
  lovable_shop_orders_url TEXT,
  lovable_shop_tickets_url TEXT,
  support_tickets_url TEXT,
  notes TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.shop_config TO authenticated;
GRANT ALL ON public.shop_config TO service_role;

ALTER TABLE public.shop_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins read shop_config" ON public.shop_config FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admins insert shop_config" ON public.shop_config FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admins update shop_config" ON public.shop_config FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admins delete shop_config" ON public.shop_config FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.shop_config (tio_sheet_id, tio_sheet_gid)
VALUES ('1_h_j_fjRvSCalS4AFNbPxqOuVWJrQnUna-JV55SARU8', '346052357');