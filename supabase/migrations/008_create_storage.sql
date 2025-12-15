-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES
  ('avatars', 'avatars', true),
  ('handwriting-samples', 'handwriting-samples', true),
  ('job-attachments', 'job-attachments', false),
  ('message-attachments', 'message-attachments', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for avatars (public)
CREATE POLICY "Anyone can view avatars"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update own avatar"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own avatar"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage policies for handwriting samples (public)
CREATE POLICY "Anyone can view handwriting samples"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'handwriting-samples');

CREATE POLICY "Users can upload own handwriting sample"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'handwriting-samples' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update own handwriting sample"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'handwriting-samples' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own handwriting sample"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'handwriting-samples' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage policies for job attachments (private)
CREATE POLICY "Authenticated users can view job attachments"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'job-attachments' AND auth.role() = 'authenticated');

CREATE POLICY "Users can upload job attachments"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'job-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update own job attachments"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'job-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own job attachments"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'job-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage policies for message attachments (private)
CREATE POLICY "Users can view message attachments they're involved in"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'message-attachments' AND auth.role() = 'authenticated');

CREATE POLICY "Users can upload message attachments"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'message-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own message attachments"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'message-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);
