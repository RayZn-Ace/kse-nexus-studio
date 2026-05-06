
-- 1. Roles enum + user_roles table
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer to check roles without RLS recursion
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage roles"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 2. Contact messages
CREATE TABLE public.contact_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL CHECK (char_length(name) BETWEEN 1 AND 120),
  email TEXT NOT NULL CHECK (char_length(email) BETWEEN 3 AND 255),
  subject TEXT CHECK (char_length(subject) <= 200),
  message TEXT NOT NULL CHECK (char_length(message) BETWEEN 1 AND 5000),
  is_read BOOLEAN NOT NULL DEFAULT false,
  is_archived BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit a message"
  ON public.contact_messages FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can view messages"
  ON public.contact_messages FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update messages"
  ON public.contact_messages FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete messages"
  ON public.contact_messages FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_contact_messages_created_at ON public.contact_messages (created_at DESC);

-- 3. Tutorials
CREATE TABLE public.tutorials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL CHECK (char_length(title) BETWEEN 1 AND 200),
  description TEXT CHECK (char_length(description) <= 2000),
  video_path TEXT NOT NULL,
  thumbnail_path TEXT,
  duration_seconds INTEGER,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.tutorials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view tutorials"
  ON public.tutorials FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert tutorials"
  ON public.tutorials FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update tutorials"
  ON public.tutorials FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete tutorials"
  ON public.tutorials FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_tutorials_created_at ON public.tutorials (created_at DESC);

-- 4. Storage buckets
INSERT INTO storage.buckets (id, name, public)
VALUES
  ('tutorials', 'tutorials', false),
  ('tutorial-thumbnails', 'tutorial-thumbnails', false);

-- Storage policies (tutorials bucket)
CREATE POLICY "Authenticated can read tutorial videos"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'tutorials');

CREATE POLICY "Admins can upload tutorial videos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'tutorials' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update tutorial videos"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'tutorials' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete tutorial videos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'tutorials' AND public.has_role(auth.uid(), 'admin'));

-- thumbnails
CREATE POLICY "Authenticated can read tutorial thumbs"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'tutorial-thumbnails');

CREATE POLICY "Admins can upload tutorial thumbs"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'tutorial-thumbnails' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update tutorial thumbs"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'tutorial-thumbnails' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete tutorial thumbs"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'tutorial-thumbnails' AND public.has_role(auth.uid(), 'admin'));
