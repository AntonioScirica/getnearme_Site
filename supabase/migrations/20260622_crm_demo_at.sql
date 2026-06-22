-- CRM: data della demo prenotata/fatta per ogni contatto.
ALTER TABLE public.crm_contacts ADD COLUMN IF NOT EXISTS demo_at date;
