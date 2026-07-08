CREATE TABLE public.portal_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token text NOT NULL,
  from_role text NOT NULL CHECK (from_role IN ('client','kse')),
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  delivered_at timestamptz,
  read_at timestamptz
);
CREATE INDEX portal_messages_token_created_idx ON public.portal_messages(token, created_at);

GRANT SELECT, INSERT, UPDATE ON public.portal_messages TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.portal_messages TO authenticated;
GRANT ALL ON public.portal_messages TO service_role;

ALTER TABLE public.portal_messages ENABLE ROW LEVEL SECURITY;

-- Anonymous (customer via mission token) — token itself is the secret
CREATE POLICY "anon read portal messages"
  ON public.portal_messages FOR SELECT TO anon USING (true);
CREATE POLICY "anon insert client messages"
  ON public.portal_messages FOR INSERT TO anon WITH CHECK (from_role = 'client');
CREATE POLICY "anon mark kse messages read"
  ON public.portal_messages FOR UPDATE TO anon
  USING (from_role = 'kse') WITH CHECK (from_role = 'kse');

-- Authenticated admins
CREATE POLICY "admin read portal messages"
  ON public.portal_messages FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin insert kse messages"
  ON public.portal_messages FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') AND from_role = 'kse');
CREATE POLICY "admin update portal messages"
  ON public.portal_messages FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

ALTER TABLE public.portal_messages REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.portal_messages;