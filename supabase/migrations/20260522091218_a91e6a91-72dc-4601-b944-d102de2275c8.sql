
-- messages_log
CREATE TABLE public.messages_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL CHECK (type IN ('dm','comment','story_reply')),
  sender_id text,
  sender_username text,
  incoming_text text,
  outgoing_text text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('sent','failed','pending','skipped')),
  error_message text,
  post_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.messages_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view messages_log"
ON public.messages_log FOR SELECT TO authenticated
USING (has_role(auth.uid(),'admin'::app_role));

CREATE POLICY "Admins can delete messages_log"
ON public.messages_log FOR DELETE TO authenticated
USING (has_role(auth.uid(),'admin'::app_role));

CREATE INDEX idx_messages_log_created_at ON public.messages_log (created_at DESC);
CREATE INDEX idx_messages_log_type ON public.messages_log (type);

-- chatbot_config
CREATE TABLE public.chatbot_config (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.chatbot_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view chatbot_config"
ON public.chatbot_config FOR SELECT TO authenticated
USING (has_role(auth.uid(),'admin'::app_role));

CREATE POLICY "Admins can insert chatbot_config"
ON public.chatbot_config FOR INSERT TO authenticated
WITH CHECK (has_role(auth.uid(),'admin'::app_role));

CREATE POLICY "Admins can update chatbot_config"
ON public.chatbot_config FOR UPDATE TO authenticated
USING (has_role(auth.uid(),'admin'::app_role))
WITH CHECK (has_role(auth.uid(),'admin'::app_role));

-- Defaults
INSERT INTO public.chatbot_config (key, value) VALUES
  ('enabled', 'true'::jsonb),
  ('auto_reply_dm', 'true'::jsonb),
  ('auto_reply_comments', 'true'::jsonb),
  ('auto_reply_story', 'true'::jsonb),
  ('max_daily_responses', '500'::jsonb),
  ('blacklist_words', '""'::jsonb),
  ('kse_context', '"Du bist der KI-Assistent von KSE Group, einer exklusiven Marketing & New Media Agentur.\nDein Stil: professionell, selbstbewusst, kurz und prägnant. Max. 3 Sätze.\nUnsere Slogans: \"Wir bauen keine Marken. Wir bauen Charakter.\" und \"Fange nie an, aufzuhören.\"\nBei Preisanfragen: Verweise auf ein persönliches Gespräch via k.engelmann@ksegroup.eu\nBei allgemeinen Fragen: Beantworte kompetent im Agentur-Stil.\nBei Spam oder unangemessenen Nachrichten: Ignoriere höflich.\nAntworte IMMER auf Deutsch. Niemals Emojis übertreiben, max. 1 pro Antwort."'::jsonb);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages_log;
