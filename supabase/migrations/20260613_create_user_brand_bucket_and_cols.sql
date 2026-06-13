ALTER TABLE user_brand
  ADD COLUMN IF NOT EXISTS logo_white_h text,
  ADD COLUMN IF NOT EXISTS logo_white_v text,
  ADD COLUMN IF NOT EXISTS logo_black_h text,
  ADD COLUMN IF NOT EXISTS logo_black_v text,
  ADD COLUMN IF NOT EXISTS logo_colored_h text,
  ADD COLUMN IF NOT EXISTS logo_colored_v text;

-- Create the storage bucket for user brands
INSERT INTO storage.buckets (id, name, public) 
VALUES ('user-brand', 'user-brand', true)
ON CONFLICT (id) DO NOTHING;

-- Policies for the bucket
-- Allow authenticated users to upload and read their own brand logos
CREATE POLICY "Users can upload their own brand logos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'user-brand' AND 
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can update their own brand logos"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'user-brand' AND 
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Anyone can read user brand logos"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'user-brand');
