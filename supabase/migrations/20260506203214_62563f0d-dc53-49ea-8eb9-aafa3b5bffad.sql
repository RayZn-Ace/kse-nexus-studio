
-- Tighten has_role exposure
REVOKE EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) TO authenticated;

-- Replace permissive insert policy with validated one
DROP POLICY IF EXISTS "Anyone can submit a message" ON public.contact_messages;

CREATE POLICY "Anyone can submit a valid message"
  ON public.contact_messages FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    char_length(trim(name)) BETWEEN 1 AND 120
    AND char_length(trim(email)) BETWEEN 3 AND 255
    AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
    AND char_length(trim(message)) BETWEEN 1 AND 5000
    AND is_read = false
    AND is_archived = false
  );
