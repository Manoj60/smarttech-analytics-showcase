-- Add work_status and location fields to job_applications table
ALTER TABLE public.job_applications 
ADD COLUMN preferred_work_status TEXT,
ADD COLUMN preferred_location TEXT;