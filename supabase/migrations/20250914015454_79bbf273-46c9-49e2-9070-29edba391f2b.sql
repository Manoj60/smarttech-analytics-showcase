-- Rename preferred_work_status to visa_status in job_applications table
ALTER TABLE public.job_applications 
RENAME COLUMN preferred_work_status TO visa_status;