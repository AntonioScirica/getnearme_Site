-- Create media table for project images
CREATE TABLE IF NOT EXISTS public.media (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE,
    url text NOT NULL,
    type text NOT NULL, -- e.g. 'original', 'staging', 'video'
    created_at timestamptz DEFAULT now()
);

-- RLS policies
ALTER TABLE public.media ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own media" 
ON public.media FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own media" 
ON public.media FOR INSERT 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own media" 
ON public.media FOR UPDATE 
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own media" 
ON public.media FOR DELETE 
USING (user_id = auth.uid());

-- Indexes
CREATE INDEX IF NOT EXISTS idx_media_user ON public.media(user_id);
CREATE INDEX IF NOT EXISTS idx_media_project ON public.media(project_id);
