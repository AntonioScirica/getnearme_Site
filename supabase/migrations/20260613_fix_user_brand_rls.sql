CREATE TABLE IF NOT EXISTS user_brand (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id),
  logo_orientation text DEFAULT 'vertical',
  primary_color text DEFAULT '#3B83F6',
  company_name text,
  company_website text,
  company_email text,
  report_final_title text,
  report_final_desc text,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_brand ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Users can manage their own brand" ON user_brand
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
