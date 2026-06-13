-- 1. Create projects table
CREATE TABLE IF NOT EXISTS public.projects (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    nome text NOT NULL,
    addr text DEFAULT '',
    prezzo numeric DEFAULT 0,
    mq numeric DEFAULT 0,
    locali integer DEFAULT 0,
    titolo text DEFAULT '',
    cover text DEFAULT '',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 2. Add RLS policies for projects
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view projects of their teams" 
ON public.projects FOR SELECT 
USING (team_id IN (SELECT team_id FROM public.team_members WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert projects to their teams" 
ON public.projects FOR INSERT 
WITH CHECK (team_id IN (SELECT team_id FROM public.team_members WHERE user_id = auth.uid()));

CREATE POLICY "Users can update projects of their teams" 
ON public.projects FOR UPDATE 
USING (team_id IN (SELECT team_id FROM public.team_members WHERE user_id = auth.uid()))
WITH CHECK (team_id IN (SELECT team_id FROM public.team_members WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete projects of their teams" 
ON public.projects FOR DELETE 
USING (team_id IN (SELECT team_id FROM public.team_members WHERE user_id = auth.uid()));

-- 3. Add project_id to batch_staging
ALTER TABLE public.batch_staging 
ADD COLUMN IF NOT EXISTS project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL;

-- 4. Create indexes
CREATE INDEX IF NOT EXISTS idx_projects_team ON public.projects(team_id);
CREATE INDEX IF NOT EXISTS idx_batch_staging_user ON public.batch_staging(user_id);
CREATE INDEX IF NOT EXISTS idx_batch_staging_project ON public.batch_staging(project_id);
