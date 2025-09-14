-- Add work_status field to jobs table
ALTER TABLE public.jobs 
ADD COLUMN work_status TEXT;