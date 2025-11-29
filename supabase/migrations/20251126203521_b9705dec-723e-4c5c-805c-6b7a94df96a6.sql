-- Create storage buckets for job attachments and handwriting samples
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('job-attachments', 'job-attachments', false),
  ('handwriting-samples', 'handwriting-samples', true)
ON CONFLICT (id) DO NOTHING;

-- Basic RLS policies for job-attachments bucket - all authenticated users
CREATE POLICY "Authenticated users can manage job attachments"
ON storage.objects
FOR ALL
TO authenticated
USING (bucket_id = 'job-attachments')
WITH CHECK (bucket_id = 'job-attachments');

-- Basic RLS policies for handwriting-samples bucket - all authenticated users
CREATE POLICY "Authenticated users can manage handwriting samples"
ON storage.objects
FOR ALL
TO authenticated
USING (bucket_id = 'handwriting-samples')
WITH CHECK (bucket_id = 'handwriting-samples');

-- Enable realtime for conversations and messages
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'conversations'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE conversations;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE messages;
  END IF;
END $$;