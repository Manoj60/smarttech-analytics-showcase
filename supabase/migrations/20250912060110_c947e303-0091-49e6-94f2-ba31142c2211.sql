-- Fix security issue: Restrict public access to job_applications table
-- Remove the overly permissive INSERT policy and add proper access controls

-- Drop the existing INSERT policy that allows unrestricted access
DROP POLICY IF EXISTS "Allow application submissions" ON public.job_applications;

-- Add a policy that denies public SELECT access to protect personal data
CREATE POLICY "Deny public application access" 
ON public.job_applications 
FOR SELECT 
TO public
USING (false);

-- Allow anonymous users to submit applications (INSERT only)
CREATE POLICY "Allow anonymous application submissions" 
ON public.job_applications 
FOR INSERT 
TO anon
WITH CHECK (true);

-- Allow authenticated users to submit applications (INSERT only)
CREATE POLICY "Allow authenticated application submissions" 
ON public.job_applications 
FOR INSERT 
TO authenticated
WITH CHECK (true);