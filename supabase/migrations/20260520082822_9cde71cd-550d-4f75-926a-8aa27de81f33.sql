
INSERT INTO storage.buckets (id, name, public) VALUES ('instagram', 'instagram', true)
ON CONFLICT (id) DO UPDATE SET public = true;

CREATE POLICY "Public read instagram"
ON storage.objects FOR SELECT
USING (bucket_id = 'instagram');
