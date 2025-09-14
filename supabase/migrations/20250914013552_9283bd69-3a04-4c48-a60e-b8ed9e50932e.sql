-- Add missing fields to jobs table
ALTER TABLE public.jobs 
ADD COLUMN company TEXT,
ADD COLUMN application_deadline TIMESTAMP WITH TIME ZONE;

-- Update existing jobs to have a default company name
UPDATE public.jobs 
SET company = 'Smart Tech Analytics' 
WHERE company IS NULL;