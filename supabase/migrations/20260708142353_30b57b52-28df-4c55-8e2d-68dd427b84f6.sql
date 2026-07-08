GRANT SELECT, INSERT, UPDATE ON public.portal_messages TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.portal_messages TO authenticated;
GRANT ALL ON public.portal_messages TO service_role;

CREATE POLICY "admin insert client messages" ON public.portal_messages
  FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));