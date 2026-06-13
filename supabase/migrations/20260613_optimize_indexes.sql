-- Aggiungiamo user_id a projects se per caso manca (visto che l'API lo usa)
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Creazione di indici B-Tree per velocizzare le query filtrate per utente
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON public.projects(user_id);

-- Assicuriamoci che media abbia l'indice (lo avevamo già messo, ma ribadiamo)
CREATE INDEX IF NOT EXISTS idx_media_user_id ON public.media(user_id);
CREATE INDEX IF NOT EXISTS idx_media_project_id ON public.media(project_id);

-- Ottimizzazione indici per batch_staging (spesso interrogati per status e user_id)
CREATE INDEX IF NOT EXISTS idx_batch_staging_user_status ON public.batch_staging(user_id, status);

-- Ottimizzazione per batch_staging_items (spesso uniti a batch_id e status)
CREATE INDEX IF NOT EXISTS idx_batch_items_batch_status ON public.batch_staging_items(batch_id, status);
